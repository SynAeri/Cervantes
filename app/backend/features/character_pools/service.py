# Character pooling service - name/gender variant approach
# Keeps personality/archetype/role constant, randomizes only name/gender per student
# This maintains narrative coherence while providing unique experiences

import random
from typing import List, Optional
from google.cloud.firestore import AsyncClient
from app.backend.features.character_pools.schemas import CharacterNameVariant, CharacterPool

# Predefined name pools by gender
MALE_NAMES = ["Marcus", "Jin", "Amir", "Carlos", "Liam", "Raj", "Kenji", "Diego", "Ethan", "Hassan"]
FEMALE_NAMES = ["Elena", "Maya", "Priya", "Sofia", "Aisha", "Yuki", "Camila", "Zara", "Mei", "Fatima"]
NEUTRAL_NAMES = ["Alex", "Jordan", "Taylor", "Casey", "River", "Sage", "Quinn", "Avery", "Morgan", "Kai"]


async def generate_character_pools_for_arc(
    arc_id: str,
    class_id: str,
    db: AsyncClient,
    num_variants: int = 3
) -> List[CharacterPool]:
    """Generate character name variant pools for an arc.

    This creates name/gender variants while keeping personality/archetype/role constant.
    Maintains narrative coherence while giving each student unique character names.

    Args:
        arc_id: The arc to generate pools for
        class_id: The class this arc belongs to
        db: Firestore database client
        num_variants: Number of name variants per scene (default 3, max 4)

    Returns:
        List of CharacterPool objects created
    """
    # Get arc document
    arc_doc = await db.collection("arcs").document(arc_id).get()
    if not arc_doc.exists:
        raise ValueError(f"Arc not found: {arc_id}")

    arc_data = arc_doc.to_dict()
    narrative_arc = arc_data.get("narrative_arc", {})
    scenes = narrative_arc.get("scenes", [])

    created_pools = []
    used_names_global = []  # Track across all scenes to avoid duplicates

    for scene in scenes:
        base_character = scene.get("character", {})
        if not base_character:
            continue  # Skip if no character (shouldn't happen)

        pool_id = f"pool_scene{scene['scene_order']}_arc_{arc_id}"

        # Generate N name variants (different names for the same personality)
        name_variants = []
        variant_labels = ["A", "B", "C", "D"][:num_variants]

        for variant_label in variant_labels:
            # Pick a name that hasn't been used yet
            gender = random.choice(["male", "female", "neutral"])

            if gender == "male":
                available_names = [n for n in MALE_NAMES if n not in used_names_global]
            elif gender == "female":
                available_names = [n for n in FEMALE_NAMES if n not in used_names_global]
            else:
                available_names = [n for n in NEUTRAL_NAMES if n not in used_names_global]

            if not available_names:
                # Fallback if we run out of names
                available_names = MALE_NAMES + FEMALE_NAMES + NEUTRAL_NAMES

            name = random.choice(available_names)
            used_names_global.append(name)

            name_variants.append(CharacterNameVariant(
                variant_id=variant_label,
                name=name,
                gender=gender
            ))

        # Create pool with base character data + name variants
        pool = CharacterPool(
            pool_id=pool_id,
            arc_id=arc_id,
            scene_order=scene["scene_order"],
            class_id=class_id,
            base_character_id=base_character.get("id"),
            role=base_character.get("role"),
            personality_prompt=base_character.get("personality_prompt"),
            voice_register=base_character.get("voice_register"),
            archetype=base_character.get("archetype"),
            subject_connection=base_character.get("subject_connection", ""),
            sprite_set=base_character.get("sprite_set", []),
            name_variants=name_variants
        )

        # Store in Firestore
        await db.collection("character_pools").document(pool_id).set(pool.model_dump())

        created_pools.append(pool)

    return created_pools


async def assign_characters_to_student(
    student_id: str,
    arc_id: str,
    class_id: str,
    db: AsyncClient
) -> List[dict]:
    """Randomly assign character variants when student accesses an arc.

    This creates student_scene_assignments with random variant selection.
    Called when student first accesses an arc.

    Args:
        student_id: Student to assign characters to
        arc_id: Arc containing the character pools
        class_id: Class the student is in
        db: Firestore database client

    Returns:
        List of assignment documents created
    """
    # Get all character pools for this arc
    pools_ref = db.collection("character_pools")
    pools_query = pools_ref.where("arc_id", "==", arc_id).where("class_id", "==", class_id)
    pools_docs = pools_query.stream()

    assignments = []

    async for pool_doc in pools_docs:
        if not pool_doc.exists:
            continue

        pool_data = pool_doc.to_dict()
        pool_id = pool_data["pool_id"]
        scene_order = pool_data["scene_order"]

        # Check if assignment already exists
        assignment_id = f"{student_id}_{arc_id}_scene{scene_order}"
        existing = await db.collection("student_scene_assignments").document(assignment_id).get()

        if existing.exists:
            # Already assigned - skip
            assignments.append(existing.to_dict())
            continue

        # Random variant selection
        variants = pool_data["name_variants"]
        assigned_variant = random.choice([v["variant_id"] for v in variants])

        # Create assignment
        assignment = {
            "assignment_id": assignment_id,
            "student_id": student_id,
            "arc_id": arc_id,
            "scene_order": scene_order,
            "assigned_variant": assigned_variant,
            "character_pool_id": pool_id,
            "status": "not_started",
            "started_at": None,
            "completed_at": None
        }

        await db.collection("student_scene_assignments").document(assignment_id).set(assignment)
        assignments.append(assignment)

    return assignments


async def get_student_character_for_scene(
    student_id: str,
    arc_id: str,
    scene_order: int,
    db: AsyncClient
) -> Optional[dict]:
    """Get the assigned character for a specific student's scene.

    This looks up the assignment and returns the full character with the assigned name variant.

    Args:
        student_id: Student ID
        arc_id: Arc ID
        scene_order: Scene number
        db: Firestore database client

    Returns:
        Character dict with assigned name/gender or None if not assigned
    """
    assignment_id = f"{student_id}_{arc_id}_scene{scene_order}"
    assignment_doc = await db.collection("student_scene_assignments").document(assignment_id).get()

    if not assignment_doc.exists:
        return None

    assignment = assignment_doc.to_dict()
    pool_id = assignment["character_pool_id"]
    variant_id = assignment["assigned_variant"]

    # Get pool
    pool_doc = await db.collection("character_pools").document(pool_id).get()
    if not pool_doc.exists:
        return None

    pool_data = pool_doc.to_dict()

    # Find the name variant
    assigned_name_variant = None
    for variant in pool_data["name_variants"]:
        if variant["variant_id"] == variant_id:
            assigned_name_variant = variant
            break

    if not assigned_name_variant:
        return None

    # Build full character with assigned name
    character = {
        "id": f"{pool_data['base_character_id']}_student_{student_id[:8]}_variant_{variant_id}",
        "name": assigned_name_variant["name"],
        "gender": assigned_name_variant["gender"],
        "role": pool_data["role"],
        "personality_prompt": pool_data["personality_prompt"],
        "voice_register": pool_data["voice_register"],
        "archetype": pool_data["archetype"],
        "subject_connection": pool_data["subject_connection"],
        "sprite_set": pool_data["sprite_set"]
    }

    return character
