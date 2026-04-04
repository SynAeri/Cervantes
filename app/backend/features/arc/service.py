# Arc generation service - orchestrates CurricuLLM → Gemini scene generation pipeline
# Phase 1: CurricuLLM (real API) for rubric parsing
# Phase 2: Gemini for narrative arc planning
# Phase 3: Database persistence (Firestore)

import json
import uuid
from google.cloud.firestore import AsyncClient
from app.backend.core import llm_client
from app.backend.core import curricullm_client
from app.backend.core.config import settings
from app.backend.core.prompt_loader import load_curricullm_prompt, load_example_prompt, load_system_prompt
from app.backend.features.arc.schemas import CurriculumData, NarrativeArc


async def generate_arc(
    class_id: str,
    rubric_text: str,
    professor_id: str,
    db: AsyncClient,
    student_subjects: list[str] | None = None,
    student_extracurriculars: list[str] | None = None,
) -> dict:
    """
    Phase 1: CurricuLLM rubric parsing
    Extracts structured curriculum data from uploaded rubric via real CurricuLLM API.
    Falls back to Gemini if CurricuLLM key is not set or API fails.
    """
    curriculum_prompt = load_curricullm_prompt("curricullm_rubric_parse")

    user_msg = (
        f"Here are the assessment materials for parsing:\n\n---\n{rubric_text}\n---\n\n"
        "Extract the structured assessment summary as JSON."
    )

    if settings.CURRICULLM_API_KEY:
        # Use real CurricuLLM API
        try:
            curriculum_data_dict = await curricullm_client.generate_curriculum_analysis(
                system=curriculum_prompt,
                user=user_msg,
                temperature=0.3,
                response_format="json",
            )
        except Exception:
            # Fallback to Gemini if CurricuLLM fails
            curriculum_data_dict = await llm_client.generate_with_retry(
                system=curriculum_prompt,
                user=user_msg,
                response_format="json",
                temperature=0.3,
            )
    else:
        # No CurricuLLM key — use Gemini directly
        curriculum_data_dict = await llm_client.generate_with_retry(
            system=curriculum_prompt,
            user=user_msg,
            response_format="json",
            temperature=0.3,
        )

    curriculum_data = CurriculumData(**curriculum_data_dict)

    """
    Phase 2: Narrative arc planning via Gemini
    Uses scene_generation.md to plan VN scenes with proper formatting
    """
    scene_gen_system = load_system_prompt("scene_generation")
    bridge_example = load_example_prompt("bridge_scene_example")
    deep_example = load_example_prompt("deep_scene_example")

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
        temperature=0.8,
    )

    narrative_arc = NarrativeArc(**narrative_arc_dict)

    """
    Phase 3: Firestore persistence
    """
    arc_id = str(uuid.uuid4())
    arc_data = {
        "arc_id": arc_id,
        "class_id": class_id,
        "professor_id": professor_id,
        "curriculum_data": curriculum_data.model_dump(),
        "narrative_arc": narrative_arc.model_dump(),
        "rubric_focus": curriculum_data.subject,
        "concept_targets": curriculum_data.key_concepts,
        "misconceptions": [m.model_dump() for m in curriculum_data.common_misconceptions],
        "status": "draft",
    }

    # Write arc document
    await db.collection("arcs").document(arc_id).set(arc_data)

    # Write scenes as subcollection
    for scene_data in narrative_arc.scenes:
        scene_id = str(uuid.uuid4())
        scene_doc = {
            "scene_id": scene_id,
            "arc_id": arc_id,
            "scene_order": scene_data.scene_order,
            "scene_type": scene_data.scene_type,
            "character_id": scene_data.character_name,
            "concept_target": scene_data.concept_target,
            "misconception_target": scene_data.misconception_target,
            "setup_narration": scene_data.setup_prompt,
            "socratic_angles": scene_data.socratic_angles,
            "generated_scene_content": None,
        }
        await db.collection("scenes").document(scene_id).set(scene_doc)

    return arc_data


async def generate_scene_content(scene_id: str, db: AsyncClient) -> str:
    """
    Generates full VN scene content with proper formatting tags.
    Uses scene_generation.md system prompt.
    """
    scene_doc = await db.collection("scenes").document(scene_id).get()
    if not scene_doc.exists:
        raise ValueError(f"Scene not found: {scene_id}")
    scene = scene_doc.to_dict()

    arc_doc = await db.collection("arcs").document(scene["arc_id"]).get()
    if not arc_doc.exists:
        raise ValueError(f"Arc not found for scene: {scene_id}")
    arc = arc_doc.to_dict()

    scene_gen_system = load_system_prompt("scene_generation")
    curriculum_data = arc.get("curriculum_data", {})

    scene_context = {
        "scene_type": scene["scene_type"],
        "concept": scene["concept_target"],
        "misconception": scene.get("misconception_target"),
        "learning_outcome": f"Student should understand {scene['concept_target']}",
        "exposing_scenario": scene.get("setup_narration"),
        "character": {
            "id": scene["character_id"],
            "name": scene["character_id"],
            "role": "character",
            "personality_prompt": f"{scene['character_id']} character",
            "sprite_set": ["neutral", "surprised", "thoughtful", "concerned", "amused",
                          "serious", "encouraging", "challenging", "curious", "relieved"],
        },
        "secondary_character": None,
        "setting": scene.get("setup_narration"),
        "student_subjects": [curriculum_data.get("subject", "General")],
        "arc_position": "mid",
        "prior_concepts": curriculum_data.get("key_concepts", [])[:scene["scene_order"] - 1]
        if scene["scene_order"] > 1 else [],
        "socratic_angles": scene.get("socratic_angles", []),
    }

    user_prompt = f"""Generate the complete VN scene content for this scene.

Scene Context:
{json.dumps(scene_context, indent=2)}

Return the full scene with proper formatting tags:
- [narration] for atmosphere and scene description
- [character:{scene['character_id']}] for dialogue (start each line with *emotion_tag*)
- [player_prompt] for student response points

Follow the bridge/deep scene rules from your system prompt."""

    scene_content = await llm_client.generate_with_retry(
        system=scene_gen_system,
        user=user_prompt,
        response_format="text",
        temperature=0.85,
    )

    # Update scene with generated content
    await db.collection("scenes").document(scene_id).update({
        "generated_scene_content": scene_content,
    })

    return scene_content
