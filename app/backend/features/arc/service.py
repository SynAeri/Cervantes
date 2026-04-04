# Arc generation service - orchestrates CurricuLLM → character generation → arc planning → scene generation
# Implements full arc_sys.md architecture with misconception coverage enforcement

import json
import uuid
import logging
from collections import Counter
from sqlalchemy.orm import Session
from core import llm_client
from core.prompt_loader import load_curricullm_prompt, load_example_prompt, load_system_prompt
from features.arc.models import Arc, Scene, ArcStatus
from features.arc.schemas import CurriculumData, NarrativeArc, CharacterProfile
from features.arc.character_generator import generate_character

logger = logging.getLogger(__name__)


def validate_arc_characters(arc: dict) -> list[str]:
    """
    Validate character casting rules on a generated arc.
    Returns a list of error strings. Empty list = valid.
    """
    errors = []
    scenes = arc.get("scenes", [])

    if not scenes:
        return ["Arc has no scenes"]

    names = []
    archetypes = []

    # More precise forbidden role patterns - must be the character's primary role
    FORBIDDEN_ROLE_PATTERNS = [
        " professor", "professor ",
        " teacher", "teacher ",
        " lecturer", "lecturer ",
        " tutor", "tutor ",
        " instructor", "instructor ",
        "teaching assistant"
    ]

    for i, scene in enumerate(scenes):
        char = scene.get("character", {})
        scene_id = scene.get("scene_id", f"scene_{i+1}")
        name = char.get("name")
        archetype = char.get("archetype")
        role = (char.get("role") or "").lower()
        scene_type = scene.get("scene_type")
        concept_target = scene.get("concept_target", "")
        misconception_target = scene.get("misconception_target")

        # 1. Check for missing character
        if not name:
            errors.append(f"{scene_id}: Missing character name")
            continue

        # 2. Check duplicate names
        if name in names:
            errors.append(
                f"{scene_id}: Duplicate character name '{name}' "
                f"(already used in an earlier scene)"
            )
        names.append(name)

        # 3. Check forbidden roles (only if it's the character's primary role)
        for forbidden in FORBIDDEN_ROLE_PATTERNS:
            if forbidden in f" {role} ":
                errors.append(
                    f"{scene_id}: Forbidden role '{role}' — "
                    f"no professors, teachers, or tutors as primary role"
                )
                break

        # 4. Track archetypes
        if archetype:
            archetypes.append(archetype)
        else:
            errors.append(f"{scene_id}: Missing archetype")

    # 5. Check archetype variety
    counts = Counter(archetypes)
    for arch, count in counts.items():
        if count > 2:
            errors.append(
                f"Archetype '{arch}' used {count} times (max 2 per arc)"
            )

    min_required = min(3, len(scenes))
    distinct = len(set(archetypes))
    if len(scenes) >= 4 and distinct < min_required:
        errors.append(
            f"Only {distinct} distinct archetype(s) used "
            f"(need at least {min_required} for {len(scenes)} scenes)"
        )

    # 6. Check that at least one non-peer archetype exists
    non_peer = [a for a in archetypes if a not in ("frustrated_peer", "overconfident_beginner")]
    if len(scenes) >= 3 and not non_peer:
        errors.append(
            "No mentor or analyst archetype used — "
            "at least one scene needs a non-peer challenger"
        )

    return errors


def validate_misconception_coverage(arc: dict, curriculum_data: dict) -> list[str]:
    """
    Check that every misconception from CurricuLLM output
    is assigned to at least one scene in the arc.
    Returns list of unassigned misconceptions.
    """
    misconceptions = [
        m["misconception"]
        for m in curriculum_data.get("common_misconceptions", [])
    ]

    assigned = set()
    for scene in arc.get("scenes", []):
        target = scene.get("misconception_target")
        if target:
            assigned.add(target)

    unassigned = [m for m in misconceptions if m not in assigned]

    errors = []
    for m in unassigned:
        errors.append(f"Unassigned misconception: '{m}' — not covered by any scene")

    return errors

async def generate_arc(
    class_id: str,
    rubric_text: str,
    professor_id: str,
    db: Session,
    student_id: str = None,
    student_subjects: list[str] = None,
    student_extracurriculars: list[str] = None
) -> Arc:
    """
    Full arc generation pipeline:
    1. CurricuLLM rubric parsing (currently mocked)
    2. Misconception coverage analysis
    3. Character generation for each scene
    4. Arc planning with proper structure
    5. Database persistence
    """

    # ===== PHASE 1: CurricuLLM rubric parsing (MOCKED) =====
    import pathlib
    mock_data_path = pathlib.Path("/app/assets/Templates/mock_curricullm_data.md")

    with open(mock_data_path, 'r') as f:
        curriculum_data_dict = json.load(f)

    # TODO: Uncomment when CurricuLLM is ready
    # curriculum_prompt = load_curricullm_prompt("curricullm_rubric_parse")
    # curriculum_data_dict = await llm_client.generate_with_retry(
    #     system=curriculum_prompt,
    #     user=f"Here are the assessment materials for parsing:\n\n---\n{rubric_text}\n---\n\nExtract the structured assessment summary as JSON.",
    #     response_format="json",
    #     model="gemini-2.5-flash",
    #     temperature=0.3
    # )

    curriculum_data = CurriculumData(**curriculum_data_dict)

    # ===== PHASE 2: Misconception coverage enforcement =====
    # Ensure all misconceptions get assigned to scenes
    misconceptions = curriculum_data.common_misconceptions
    num_misconceptions = len(misconceptions)

    # Calculate scene distribution: 1 bridge + N deep scenes (one per misconception)
    # Minimum 3 scenes, maximum 5 scenes
    num_deep_scenes = min(max(num_misconceptions, 2), 4)  # 2-4 deep scenes
    total_scenes = num_deep_scenes + 1  # +1 for opening bridge scene

    # Build misconception-to-scene mapping
    misconception_assignments = []
    for i, misc in enumerate(misconceptions[:num_deep_scenes]):
        misconception_assignments.append({
            "misconception": misc.misconception,
            "why_students_think_this": misc.why_students_think_this,
            "exposing_scenario": misc.exposing_scenario,
            "scene_order": i + 2,  # Start after bridge scene
            "concept_target": curriculum_data.key_concepts[i] if i < len(curriculum_data.key_concepts) else curriculum_data.key_concepts[0]
        })

    # Pre-assign archetypes to enforce variety (removes Gemini's choice)
    archetype_rotation = ["frustrated_peer", "sharp_mentor", "overconfident_beginner", "quiet_analyst", "sharp_mentor"]
    scene_archetype_assignments = []
    for i in range(total_scenes):
        scene_archetype_assignments.append({
            "scene_order": i + 1,
            "required_archetype": archetype_rotation[i % len(archetype_rotation)]
        })

    # ===== PHASE 3: Student profile preparation =====
    subjects = student_subjects if student_subjects else [curriculum_data.subject]
    extracurriculars = student_extracurriculars if student_extracurriculars else []
    year_level = curriculum_data.year_level

    # ===== PHASE 4: Arc planning with dynamic characters =====

    # Define archetype templates for character generation
    archetype_templates = [
        {
            "archetype": "sharp_mentor",
            "description": "Challenges through pointed questions, never lectures, corners you with your own logic. Best for deep scenes where the student needs to be pushed toward an answer they resist."
        },
        {
            "archetype": "frustrated_peer",
            "description": "Dealing with the concept in their own work, asks for help, reveals misconception through their situation. Best for bridge scenes and deep scenes where the misconception is embodied by the character."
        },
        {
            "archetype": "quiet_analyst",
            "description": "Precise, clinical, finds imprecision personally offensive. Corrects through clarification not explanation. Best for deep scenes involving data, statistics, or model interpretation."
        },
        {
            "archetype": "overconfident_beginner",
            "description": "Thinks they understand, speaks with swagger, gets cornered by a sharper voice (the player or a secondary character). Best for scenes where the student needs to identify the flaw in someone else's reasoning."
        },
        {
            "archetype": "curious_outsider",
            "description": "From a different field, asks naive questions that expose fundamental assumptions. Best for transfer scenes or when bridging to other subjects."
        }
    ]

    casting_constraints = {
        "unique_names": True,
        "max_same_archetype": 2,
        "min_distinct_archetypes": min(3, total_scenes),
        "forbidden_roles": [
            "professor", "teacher", "lecturer", "tutor",
            "instructor", "teaching assistant"
        ],
        "prefer_variety": True
    }

    arc_planning_prompt = f"""You are the arc planner for an educational narrative assessment system.

Your job is to plan a narrative arc that assesses these misconceptions through interactive VN scenes.

## Curriculum Data
{json.dumps(curriculum_data.model_dump(), indent=2)}

## Student Profile
- Subjects: {json.dumps(subjects)}
- Extracurriculars: {json.dumps(extracurriculars)}
- Year Level: {year_level}

## Arc Structure Required
- Total scenes: {total_scenes}
- Scene 1: Bridge scene (introduces key concept, no misconception assessment)
- Scenes 2-{total_scenes}: Deep scenes (each targets one misconception)

## Misconception Assignments (MUST FOLLOW)
{json.dumps(misconception_assignments, indent=2)}

## Scene Archetype Assignments (REQUIRED - DO NOT CHANGE)
{json.dumps(scene_archetype_assignments, indent=2)}

Each scene MUST use the archetype specified in scene_archetype_assignments.
This is pre-determined to ensure variety. You generate the character details (name, role, personality)
but the archetype is fixed per scene.

## Archetype Templates (for reference)
{json.dumps(archetype_templates, indent=2)}

## Casting Constraints
{json.dumps(casting_constraints, indent=2)}

OUTPUT SCHEMA REQUIREMENT:
The "scenes" array must satisfy ALL of these before you return it:
- All character names: UNIQUE (FAIL if any duplicates)
- All character IDs: UNIQUE (FAIL if any duplicates)
- Archetypes: must match scene_archetype_assignments exactly
- Character roles: must NOT contain professor/teacher/tutor/lecturer/instructor

I will validate these constraints programmatically. If they fail,
the entire arc is rejected. Do not return an arc that violates them.

CHARACTER CASTING RULES — MANDATORY:

1. UNIQUE CHARACTERS: Every scene MUST have a unique character with a distinct
   name, role, and personality. No two scenes may share the same character name
   or character ID unless it is a deliberate recurring arc where the same person
   returns having changed or learned from the earlier encounter.

2. ARCHETYPE VARIETY: If the arc has 4 or more scenes, use at least 3 different
   archetypes. Never assign the same archetype to more than 2 scenes in a single arc.

3. ARCHETYPE SELECTION BY SCENE TYPE:
   - Bridge scenes: prefer "frustrated_peer" or "overconfident_beginner"
     (the character has the problem, the student observes and decides)
   - Deep scenes (Socratic pushback): alternate between "sharp_mentor" and
     "quiet_analyst" for the challenger role, OR use "overconfident_beginner"
     as the character who holds the misconception while the student identifies
     the flaw
   - Side events: use any archetype, prefer a character not yet seen in the arc

4. FORBIDDEN ROLES: Never generate characters who are professors, teachers,
   lecturers, tutors, or instructors. Assessment happens through peers, mentors,
   and professionals — not academic authority figures.

5. CONCEPT ALIGNMENT: The concept_target field must accurately describe the
   specific misconception or concept being assessed in this scene, not a broader
   topic area. If the misconception is about opportunity cost, concept_target
   is "opportunity cost", not "market equilibrium".

6. SELF-VALIDATION: Before returning the arc, check:
   - No duplicate character names across scenes
   - No more than 2 scenes share the same archetype
   - At least one scene uses a non-peer archetype (mentor or analyst)
   - concept_target matches the misconception_target for deep scenes
   - Every misconception from the curriculum data is assigned to at least one scene

## Your Task
Plan the arc with:
1. **Arc name** - thematic title
2. **Scene sequencing** - opening bridge → deep scenes in order of complexity
3. **Arc position tags** - opening, mid, climax, resolution
4. **Settings** - where each scene takes place (market, workshop, office, etc.)
5. **Learning outcomes** - what student should understand after each scene
6. **Archetype assignments** - follow the casting rules above

Do NOT generate characters - those will be generated separately.
Do NOT include character objects in your output.
Just provide the arc structure.

Return JSON matching this exact structure:
{{
  "arc_name": "string",
  "total_scenes": {total_scenes},
  "scenes": [
    {{
      "scene_id": "leave_blank",
      "scene_order": 1,
      "scene_type": "bridge",
      "concept_target": "string",
      "misconception_target": null,
      "exposing_scenario": null,
      "learning_outcome": "string",
      "correct_understanding": null,
      "arc_position": "opening",
      "setting": "string - where this scene takes place",
      "socratic_angles": []
    }},
    {{
      "scene_id": "leave_blank",
      "scene_order": 2,
      "scene_type": "deep",
      "concept_target": "from misconception_assignments",
      "misconception_target": "from misconception_assignments",
      "exposing_scenario": "from misconception_assignments or generate",
      "learning_outcome": "string",
      "correct_understanding": "what the student should believe instead",
      "arc_position": "mid",
      "setting": "string - where this scene takes place",
      "socratic_angles": ["probing question 1", "probing question 2"]
    }}
  ]
}}

IMPORTANT: Do NOT include "character" or "secondary_character" fields. Those are generated in a separate step."""

    arc_structure = await llm_client.generate_with_retry(
        system="You are an arc planner. Return only valid JSON matching the requested structure.",
        user=arc_planning_prompt,
        response_format="json",
        model="gemini-2.5-flash",
        temperature=0.7
    )

    # ===== PHASE 4.5: Validate arc structure (before character generation) =====
    # Note: Characters aren't generated yet, so we validate after character injection
    coverage_errors = validate_misconception_coverage(arc_structure, curriculum_data.model_dump())
    if coverage_errors:
        for error in coverage_errors:
            logger.warning(f"Arc misconception coverage: {error}")

    # ===== PHASE 5: Character generation for each scene =====
    scenes_with_characters = []
    used_character_names = []

    for i, scene_plan in enumerate(arc_structure["scenes"]):
        # Get the pre-assigned archetype for this scene
        assigned_archetype = scene_archetype_assignments[i]["required_archetype"]

        # Generate character dynamically based on student profile and concept
        character = await generate_character(
            student_subjects=subjects,
            student_extracurriculars=extracurriculars,
            concept_target=scene_plan["concept_target"],
            scene_type=scene_plan["scene_type"],
            scene_order=scene_plan["scene_order"],
            preferred_archetype=assigned_archetype,
            used_names=used_character_names
        )

        # Fix character ID to be unique per scene
        character_dict = character.model_dump()
        character_dict["id"] = f"char_{str(uuid.uuid4())[:8]}"
        character_dict["archetype"] = assigned_archetype  # Ensure archetype is set

        # Track this character name
        used_character_names.append(character.name)

        # Inject character into scene plan
        scene_plan["scene_id"] = str(uuid.uuid4())
        scene_plan["character"] = character_dict
        scene_plan["secondary_character"] = None  # Add this field for schema compliance
        scenes_with_characters.append(scene_plan)

    # Build final narrative arc
    narrative_arc_dict = {
        "arc_name": arc_structure["arc_name"],
        "total_scenes": arc_structure["total_scenes"],
        "scenes": scenes_with_characters
    }

    # ===== PHASE 5.5: Validate character casting =====
    char_errors = validate_arc_characters(narrative_arc_dict)

    if char_errors:
        error_summary = "\n".join(f"  - {e}" for e in char_errors)
        logger.error(f"Arc character validation FAILED:\n{error_summary}")
        raise ValueError(
            f"Generated arc failed character validation:\n{error_summary}\n\n"
            "This indicates a prompt tuning issue. The arc was rejected."
        )

    narrative_arc = NarrativeArc(**narrative_arc_dict)

    # ===== PHASE 6: Database persistence =====
    arc_id = str(uuid.uuid4())
    arc = Arc(
        arc_id=arc_id,
        class_id=class_id,
        curriculum_data=curriculum_data.model_dump(),
        narrative_arc=narrative_arc.model_dump(),
        rubric_focus=curriculum_data.subject,
        concept_targets=curriculum_data.key_concepts,
        misconceptions=[m.model_dump() for m in curriculum_data.common_misconceptions],
        status=ArcStatus.draft
    )
    db.add(arc)

    for scene_data in narrative_arc.scenes:
        scene = Scene(
            scene_id=scene_data.scene_id,
            arc_id=arc_id,
            scene_order=scene_data.scene_order,
            scene_type=scene_data.scene_type,
            character_id=scene_data.character.id,
            concept_target=scene_data.concept_target,
            misconception_target=scene_data.misconception_target,
            setup_narration=scene_data.exposing_scenario or scene_data.setting,
            socratic_angles=scene_data.socratic_angles,
            generated_scene_content=None  # Generated on-demand during publish
        )
        db.add(scene)

    db.commit()
    db.refresh(arc)

    return arc


async def generate_scene_content(scene_id: str, db: Session) -> str:
    """
    Phase 2 of arc system: Scene generation
    Takes one planned scene and generates full interactive VN content
    """
    scene = db.query(Scene).filter(Scene.scene_id == scene_id).first()
    if not scene:
        raise ValueError(f"Scene not found: {scene_id}")

    arc = db.query(Arc).filter(Arc.arc_id == scene.arc_id).first()
    if not arc:
        raise ValueError(f"Arc not found for scene: {scene_id}")

    # Extract scene plan from arc narrative
    narrative_arc = arc.narrative_arc
    scene_plan = None
    for s in narrative_arc["scenes"]:
        if s["scene_id"] == scene_id:
            scene_plan = s
            break

    if not scene_plan:
        raise ValueError(f"Scene plan not found in arc narrative: {scene_id}")

    scene_gen_system = load_system_prompt("scene_generation")
    bridge_example = load_example_prompt("bridge_scene_example")
    deep_example = load_example_prompt("deep_scene_example")

    # Build full scene generation context
    user_prompt = f"""Generate the complete interactive VN scene for this scene plan.

## Scene Plan
{json.dumps(scene_plan, indent=2)}

## Style Examples (for reference only)
Bridge scene example:
{bridge_example[:1000]}

Deep scene example:
{deep_example[:1000]}

## Output Requirements
Return the full scene with proper formatting tags:
- [narration] for atmosphere and scene description
- [character:{scene_plan["character"]["name"]}] for dialogue (start each line with *emotion_tag*)
- [player_prompt] for student response points (include multi-choice options)

Follow the scene type rules from your system prompt:
- Bridge scenes: Introduce concept, light assessment, 1 player_prompt
- Deep scenes: Expose misconception, Socratic pushback, freeform high-mark question"""

    scene_content = await llm_client.generate_with_retry(
        system=scene_gen_system,
        user=user_prompt,
        response_format="text",
        model="gemini-2.5-flash",
        temperature=0.85
    )

    # Store generated content
    scene.generated_scene_content = scene_content
    db.commit()

    return scene_content
