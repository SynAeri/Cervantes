# Arc generation service - orchestrates CurricuLLM → Gemini scene generation pipeline
# Properly integrates scene_generation.md system prompt for VN scene generation

import json
import uuid
from sqlalchemy.orm import Session
from app.backend.core import llm_client
from app.backend.core.prompt_loader import load_curricullm_prompt, load_example_prompt, load_system_prompt
from app.backend.features.arc.models import Arc, Scene, ArcStatus
from app.backend.features.arc.schemas import CurriculumData, NarrativeArc

async def generate_arc(
    class_id: str,
    rubric_text: str,
    professor_id: str,
    db: Session,
    student_subjects: list[str] = None,
    student_extracurriculars: list[str] = None
) -> Arc:
    """
    Phase 1: CurricuLLM rubric parsing
    Extracts structured curriculum data from uploaded rubric
    """
    curriculum_prompt = load_curricullm_prompt("curricullm_rubric_parse")

    curriculum_data_dict = await llm_client.generate_with_retry(
        system=curriculum_prompt,
        user=f"Here are the assessment materials for parsing:\n\n---\n{rubric_text}\n---\n\nExtract the structured assessment summary as JSON.",
        response_format="json",
        model="gemini-2.0-flash-exp",
        temperature=0.3
    )

    curriculum_data = CurriculumData(**curriculum_data_dict)

    """
    Phase 2: Narrative arc planning
    Uses scene_generation.md to plan VN scenes with proper formatting
    System prompt handles all instructions - user prompt only provides data
    """
    scene_gen_system = load_system_prompt("scene_generation")
    bridge_example = load_example_prompt("bridge_scene_example")
    deep_example = load_example_prompt("deep_scene_example")

    # Minimal user prompt - let scene_generation.md system prompt do its job
    # Examples provided for STYLE INSPIRATION only, not to be followed exactly
    planning_context = f"""Generate a narrative arc for this assessment.

## Curriculum Data
{json.dumps(curriculum_data.model_dump(), indent=2)}

## Student Context
Student subjects: {json.dumps(student_subjects if student_subjects else [curriculum_data.subject])}
Student extracurriculars: {json.dumps(student_extracurriculars if student_extracurriculars else [])}

Generate character archetypes based on student's subject combination and interests. Do NOT use fixed character names - create characters that fit the student's academic world.

## Style Reference (for inspiration only)
Bridge scene example:
{bridge_example[:800]}

Deep scene example:
{deep_example[:800]}

Return arc as JSON with 3-5 scenes."""

    narrative_arc_dict = await llm_client.generate_with_retry(
        system=scene_gen_system,
        user=planning_context,
        response_format="json",
        model="gemini-2.0-flash-exp",
        temperature=0.8
    )

    narrative_arc = NarrativeArc(**narrative_arc_dict)

    """
    Phase 3: Database persistence
    """
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
            scene_id=str(uuid.uuid4()),
            arc_id=arc_id,
            scene_order=scene_data.scene_order,
            scene_type=scene_data.scene_type,
            character_id=scene_data.character_name,
            concept_target=scene_data.concept_target,
            misconception_target=scene_data.misconception_target,
            setup_narration=scene_data.setup_prompt,
            socratic_angles=scene_data.socratic_angles,
            generated_scene_content=None  # Generated on-demand or during publish
        )
        db.add(scene)

    db.commit()
    db.refresh(arc)

    return arc


async def generate_scene_content(scene_id: str, db: Session) -> str:
    """
    Generates full VN scene content with proper formatting tags
    Uses scene_generation.md system prompt
    Returns formatted scene with [narration], [character:Name], [player_prompt] tags
    """
    scene = db.query(Scene).filter(Scene.scene_id == scene_id).first()
    if not scene:
        raise ValueError(f"Scene not found: {scene_id}")

    arc = db.query(Arc).filter(Arc.arc_id == scene.arc_id).first()
    if not arc:
        raise ValueError(f"Arc not found for scene: {scene_id}")

    scene_gen_system = load_system_prompt("scene_generation")

    # Build runtime context for scene generation
    curriculum_data = arc.curriculum_data

    scene_context = {
        "scene_type": scene.scene_type,
        "concept": scene.concept_target,
        "misconception": scene.misconception_target,
        "learning_outcome": f"Student should understand {scene.concept_target}",
        "exposing_scenario": scene.setup_narration,
        "character": {
            "id": scene.character_id,
            "name": scene.character_id,
            "role": "economics character",
            "personality_prompt": f"{scene.character_id} character",
            "sprite_set": ["neutral", "surprised", "thoughtful", "concerned", "amused", "serious", "encouraging", "challenging", "curious", "relieved"]
        },
        "secondary_character": None,
        "setting": scene.setup_narration,
        "student_subjects": [curriculum_data.get("subject", "Economics")],
        "arc_position": "mid",
        "prior_concepts": curriculum_data.get("key_concepts", [])[:scene.scene_order-1] if scene.scene_order > 1 else [],
        "socratic_angles": scene.socratic_angles
    }

    user_prompt = f"""Generate the complete VN scene content for this scene.

Scene Context:
{json.dumps(scene_context, indent=2)}

Return the full scene with proper formatting tags:
- [narration] for atmosphere and scene description
- [character:{scene.character_id}] for dialogue (start each line with *emotion_tag*)
- [player_prompt] for student response points

Follow the bridge/deep scene rules from your system prompt."""

    scene_content = await llm_client.generate_with_retry(
        system=scene_gen_system,
        user=user_prompt,
        response_format="text",
        model="gemini-2.0-flash-exp",
        temperature=0.85
    )

    # Store generated content
    scene.generated_scene_content = scene_content
    db.commit()

    return scene_content
