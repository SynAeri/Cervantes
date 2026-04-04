# Signal extraction service - post-scene reasoning analysis
# Uses signal_extraction.md system prompt to extract structured reasoning traces

import json
from sqlalchemy.orm import Session
from core import llm_client
from core.prompt_loader import load_system_prompt
from features.dialogue.models import ReasoningTrace, ReasoningStatus
from features.arc.models import Scene, Arc
from features.signal_extraction.schemas import SignalExtractionResult

async def extract_reasoning_signals(trace_id: str, db: Session) -> SignalExtractionResult:
    """
    Run signal extraction AFTER a scene completes
    Analyzes full conversation transcript using signal_extraction.md
    Produces structured JSON reasoning trace for teacher dashboard
    """
    trace = db.query(ReasoningTrace).filter(ReasoningTrace.trace_id == trace_id).first()
    if not trace:
        raise ValueError(f"Reasoning trace not found: {trace_id}")

    scene = db.query(Scene).filter(Scene.scene_id == trace.scene_id).first()
    if not scene:
        raise ValueError(f"Scene not found: {trace.scene_id}")

    arc = db.query(Arc).filter(Arc.arc_id == scene.arc_id).first()
    curriculum_data = arc.curriculum_data if arc else {}

    signal_extraction_prompt = load_system_prompt("signal_extraction")

    # Build runtime input matching signal_extraction.md expected format
    runtime_input = {
        "scene_id": scene.scene_id,
        "scene_type": scene.scene_type,
        "concept": scene.concept_target,
        "misconception_target": scene.misconception_target,
        "correct_understanding": f"Understanding of {scene.concept_target}",
        "rubric_dimensions": curriculum_data.get("learning_outcomes", []),
        "character": scene.character_id,
        "transcript": trace.conversation_history
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
        model="gemini-2.5-flash",
        temperature=0.2  # Lower temp for analytical task
    )

    result = SignalExtractionResult(**extraction_dict)

    # Update trace with extraction results
    trace.signal_extraction_result = result.model_dump()
    trace.status = ReasoningStatus(result.status)
    trace.reflection = result.reflection
    trace.initial_answer = result.initial_response.selected
    trace.revised_answer = result.revised_understanding

    db.commit()

    return result
