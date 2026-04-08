# Signal extraction service - post-scene reasoning analysis (Firestore version)
# Uses signal_extraction.md system prompt

import json
from google.cloud.firestore import AsyncClient
from app.backend.core import llm_client
from app.backend.core.prompt_loader import load_system_prompt
from app.backend.features.signal_extraction.schemas import SignalExtractionResult


async def extract_reasoning_signals(trace_id: str, db: AsyncClient) -> SignalExtractionResult:
    """
    Run signal extraction AFTER a scene completes.
    Analyzes full conversation transcript using signal_extraction.md.
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        trace_doc = await db.collection("reasoning_traces").document(trace_id).get()
        if not trace_doc.exists:
            raise ValueError(f"Reasoning trace not found: {trace_id}")
        trace = trace_doc.to_dict()
    except Exception as e:
        logger.error(f"Failed to fetch trace {trace_id}: {str(e)}")
        raise

    # Get scene document - try by UUID first, fallback to arc_id + scene_order query
    scene_id = trace["scene_id"]
    scene_doc = await db.collection("scenes").document(scene_id).get()

    if scene_doc.exists:
        scene = scene_doc.to_dict()
        actual_scene_id = scene_doc.id
    else:
        # Fallback: scene_id is in format "scene2", query by arc_id + scene_order
        arc_id = trace.get("arc_id")
        scene_order = trace.get("scene_order")

        if not arc_id or scene_order is None:
            raise ValueError(f"Scene not found by ID {scene_id}, and missing arc_id/scene_order for fallback query")

        from google.cloud.firestore import FieldFilter
        scenes_ref = db.collection("scenes")
        scenes_query = scenes_ref.where(filter=FieldFilter("arc_id", "==", arc_id)).where(filter=FieldFilter("scene_order", "==", scene_order))
        scenes_docs = scenes_query.stream()

        scene = None
        actual_scene_id = None
        async for doc in scenes_docs:
            if doc.exists:
                actual_scene_id = doc.id
                scene = doc.to_dict()
                break

        if not scene:
            raise ValueError(f"Scene not found: {scene_id} (also tried arc_id={arc_id}, scene_order={scene_order})")

    arc_doc = await db.collection("arcs").document(scene["arc_id"]).get()
    curriculum_data = arc_doc.to_dict().get("curriculum_data", {}) if arc_doc.exists else {}

    signal_extraction_prompt = load_system_prompt("signal_extraction")

    runtime_input = {
        "scene_id": scene["scene_id"],
        "scene_type": scene.get("scene_type"),
        "concept": scene["concept_target"],
        "misconception_target": scene.get("misconception_target"),
        "correct_understanding": f"Understanding of {scene['concept_target']}",
        "rubric_dimensions": curriculum_data.get("learning_outcomes", []),
        "character": scene.get("character_id", "Unknown"),
        "transcript": trace["conversation_history"],
    }

    user_prompt = f"""Analyze this completed scene and extract reasoning signals.

Input data:
{json.dumps(runtime_input, indent=2)}

Return structured JSON matching the schema in your system prompt.
Focus on:
- What misconception was exposed in the initial response?
- How did the pushback sequence unfold?
- Did the student reach revised understanding?
- What rubric dimensions were demonstrated?
- Assign status: mastery | revised_with_scaffolding | critical_gap"""

    try:
        extraction_dict = await llm_client.generate_with_retry(
            system=signal_extraction_prompt,
            user=user_prompt,
            response_format="json",
            temperature=0.2,
        )
        logger.info(f"LLM extraction result: {extraction_dict}")
    except Exception as e:
        logger.error(f"LLM generation failed for trace {trace_id}: {str(e)}")
        raise

    try:
        result = SignalExtractionResult(**extraction_dict)
    except Exception as e:
        logger.error(f"Failed to parse SignalExtractionResult from {extraction_dict}: {str(e)}")
        raise

    try:
        # Update trace with extraction results
        await db.collection("reasoning_traces").document(trace_id).update({
            "signal_extraction_result": result.model_dump(),
            "status": result.status,
            "reflection": result.reflection,
            "initial_answer": result.initial_response.selected,
            "revised_answer": result.revised_understanding,
        })
    except Exception as e:
        logger.error(f"Failed to update trace {trace_id}: {str(e)}")
        raise

    return result
