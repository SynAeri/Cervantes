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
    trace_doc = await db.collection("reasoning_traces").document(trace_id).get()
    if not trace_doc.exists:
        raise ValueError(f"Reasoning trace not found: {trace_id}")
    trace = trace_doc.to_dict()

    scene_doc = await db.collection("scenes").document(trace["scene_id"]).get()
    if not scene_doc.exists:
        raise ValueError(f"Scene not found: {trace['scene_id']}")
    scene = scene_doc.to_dict()

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
        "character": scene["character_id"],
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

    extraction_dict = await llm_client.generate_with_retry(
        system=signal_extraction_prompt,
        user=user_prompt,
        response_format="json",
        temperature=0.2,
    )

    result = SignalExtractionResult(**extraction_dict)

    # Update trace with extraction results
    await db.collection("reasoning_traces").document(trace_id).update({
        "signal_extraction_result": result.model_dump(),
        "status": result.status,
        "reflection": result.reflection,
        "initial_answer": result.initial_response.selected,
        "revised_answer": result.revised_understanding,
    })

    return result
