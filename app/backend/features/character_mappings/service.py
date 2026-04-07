# Character mapping service - assigns and maintains consistent character names per student
# Handles both VN tags ([character:name]) and in-dialogue text references

import re
import random
from typing import Dict, List, Optional
from google.cloud.firestore import AsyncClient
from app.backend.features.character_mappings.schemas import CharacterMapping, StudentCharacterMappings

# Name pools by gender (same as character_pools service)
MALE_NAMES = ["Marcus", "Jin", "Amir", "Carlos", "Liam", "Raj", "Kenji", "Diego", "Ethan", "Hassan"]
FEMALE_NAMES = ["Elena", "Maya", "Priya", "Sofia", "Aisha", "Yuki", "Camila", "Zara", "Mei", "Fatima"]
NEUTRAL_NAMES = ["Alex", "Jordan", "Taylor", "Casey", "River", "Sage", "Quinn", "Avery", "Morgan", "Kai"]


def extract_character_ids_from_scene(scene_content: str) -> List[str]:
    """Extract all unique character IDs from scene content.

    Looks for [character:X] tags and returns list of unique character IDs.
    """
    char_ids = re.findall(r'\[character:([^\]]+)\]', scene_content)
    return list(set(char_ids))


def assign_random_name(used_names: List[str], used_sprite_indices: Dict[str, List[int]], gender: Optional[str] = None) -> tuple[str, str, int]:
    """Assign a random name and sprite from pool, avoiding already-used names.

    Returns:
        tuple: (name, gender, sprite_index)
    """
    if gender is None:
        gender = random.choice(["male", "female", "neutral"])

    # Determine sprite pool size based on gender
    if gender == "male":
        available_names = [n for n in MALE_NAMES if n not in used_names]
        pool = MALE_NAMES
        sprite_pool_size = 5  # 5 male sprite sheets
    elif gender == "female":
        available_names = [n for n in FEMALE_NAMES if n not in used_names]
        pool = FEMALE_NAMES
        sprite_pool_size = 7  # 7 female sprite sheets
    else:
        available_names = [n for n in NEUTRAL_NAMES if n not in used_names]
        pool = NEUTRAL_NAMES
        sprite_pool_size = 7  # Use female sprites for neutral (more variety)

    # Fallback if we run out of names
    if not available_names:
        available_names = pool

    name = random.choice(available_names)

    # Assign sprite index (avoid already used sprites for this gender)
    used_sprites = used_sprite_indices.get(gender, [])
    available_sprites = [i for i in range(1, sprite_pool_size + 1) if i not in used_sprites]

    # Fallback if all sprites used - reuse from pool
    if not available_sprites:
        available_sprites = list(range(1, sprite_pool_size + 1))

    sprite_index = random.choice(available_sprites)

    return name, gender, sprite_index


async def get_or_create_character_mapping(
    student_id: str,
    arc_id: str,
    scene_content: str,
    current_scene_order: int,
    db: AsyncClient
) -> Dict[str, CharacterMapping]:
    """Get existing character mapping or create new mappings for unassigned characters.

    This function:
    1. Fetches existing mappings for this student+arc
    2. Detects all characters in the scene content
    3. Creates new mappings for any unmapped characters
    4. Saves and returns complete mapping

    Args:
        student_id: Student ID (e.g., "student_10234567")
        arc_id: Arc UUID
        scene_content: Raw VN scene content with [character:X] tags
        current_scene_order: Current scene number
        db: Firestore client

    Returns:
        Dict mapping character_id -> CharacterMapping
    """
    mapping_id = f"{student_id}_{arc_id}"
    mapping_doc = await db.collection("student_character_mappings").document(mapping_id).get()

    if mapping_doc.exists:
        mappings_data = mapping_doc.to_dict()["character_mappings"]
        # Convert dict to CharacterMapping objects
        mappings = {
            char_id: CharacterMapping(**mapping_dict)
            for char_id, mapping_dict in mappings_data.items()
        }
    else:
        mappings = {}

    # Extract character IDs from scene content
    char_ids = extract_character_ids_from_scene(scene_content)
    print(f"DEBUG: Extracted character IDs from scene: {char_ids}")

    # Track which names and sprites are already used
    used_names = [m.assigned_name for m in mappings.values()]
    used_sprite_indices = {}  # Track used sprites per gender
    for m in mappings.values():
        if m.gender not in used_sprite_indices:
            used_sprite_indices[m.gender] = []
        used_sprite_indices[m.gender].append(m.sprite_index)

    # Assign names to new characters
    new_mappings_created = False
    for char_id in char_ids:
        if char_id not in mappings:
            # Infer original name from character_id
            # Handles formats like:
            # - "char_aisha" -> "Aisha"
            # - "char_de77cb9c" -> "Character" (fallback for generated IDs)
            # - "Aisha" -> "Aisha" (if already a name)

            if char_id.startswith("char_"):
                name_part = char_id.replace("char_", "")
                # Check if it's a hex ID (generated) or a name
                if len(name_part) == 8 and all(c in "0123456789abcdef" for c in name_part):
                    # It's a generated ID, use generic fallback
                    original_name = "Character"
                else:
                    # It's a name encoded in the ID
                    original_name = name_part.capitalize()
            else:
                # Character ID is already a name
                original_name = char_id

            # Assign random name and sprite
            assigned_name, gender, sprite_index = assign_random_name(used_names, used_sprite_indices)
            used_names.append(assigned_name)

            # Track this sprite as used
            if gender not in used_sprite_indices:
                used_sprite_indices[gender] = []
            used_sprite_indices[gender].append(sprite_index)

            mappings[char_id] = CharacterMapping(
                original_name=original_name,
                assigned_name=assigned_name,
                gender=gender,
                first_seen_scene=current_scene_order,
                sprite_index=sprite_index
            )

            new_mappings_created = True
            print(f"DEBUG: Created mapping for {char_id}: {original_name} -> {assigned_name} ({gender})")

    # Save to Firestore if new mappings were created
    if new_mappings_created or not mapping_doc.exists:
        mappings_dict = {
            char_id: mapping.model_dump()
            for char_id, mapping in mappings.items()
        }

        await db.collection("student_character_mappings").document(mapping_id).set({
            "mapping_id": mapping_id,
            "student_id": student_id,
            "arc_id": arc_id,
            "character_mappings": mappings_dict
        })

        print(f"DEBUG: Saved character mappings for {mapping_id}: {len(mappings)} characters")

    return mappings


def apply_character_mapping(scene_content: str, mappings: Dict[str, CharacterMapping]) -> str:
    """Apply character name replacements to scene content.

    Replaces both:
    1. VN tags: [character:char_aisha] -> [character:Maya]
    2. In-text references: "Indeed, Aisha." -> "Indeed, Maya."

    Args:
        scene_content: Raw VN scene content
        mappings: Dict of character_id -> CharacterMapping

    Returns:
        Modified scene content with replaced names
    """
    modified_content = scene_content

    print(f"DEBUG: apply_character_mapping called with {len(mappings)} mappings")
    for char_id, mapping in mappings.items():
        print(f"  - {char_id}: {mapping.original_name} -> {mapping.assigned_name}")

    for char_id, mapping in mappings.items():
        original_name = mapping.original_name
        assigned_name = mapping.assigned_name

        # 1. Replace VN tags: [character:char_aisha] -> [character:Maya]
        before_tag_replacement = modified_content
        modified_content = re.sub(
            rf'\[character:{re.escape(char_id)}\]',
            f'[character:{assigned_name}]',
            modified_content
        )
        tag_replacements = len(re.findall(rf'\[character:{re.escape(char_id)}\]', before_tag_replacement))
        if tag_replacements > 0:
            print(f"DEBUG: Replaced {tag_replacements} instances of [character:{char_id}] with [character:{assigned_name}]")

        # 2. Replace in-text references with word boundaries
        # This handles: "Aisha", "Aisha.", "Aisha,", "Indeed, Aisha."
        # But not: "Aishat" (different name that starts with Aisha)

        # Handle possessive forms: "Aisha's" -> "Maya's"
        modified_content = re.sub(
            rf'\b{re.escape(original_name)}\'s\b',
            f"{assigned_name}'s",
            modified_content
        )

        # Handle regular word boundaries: "Aisha" -> "Maya"
        modified_content = re.sub(
            rf'\b{re.escape(original_name)}\b',
            assigned_name,
            modified_content
        )

    return modified_content
