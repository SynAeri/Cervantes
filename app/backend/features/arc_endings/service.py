# Arc ending service - generates outcome-based narrative endings after arc completion
# Uses arc_ending.md system prompt to create good/bad/iffy endings based on performance

import json
import re
import uuid
from datetime import datetime
from typing import Optional
from google.cloud.firestore import AsyncClient, FieldFilter
from app.backend.core import llm_client
from app.backend.core.prompt_loader import load_system_prompt
from app.backend.features.arc_endings.schemas import ArcEndingResponse


async def generate_arc_ending(
    student_id: str,
    arc_id: str,
    climax_scene_id: str,
    performance_level: str,
    db: AsyncClient,
) -> ArcEndingResponse:
    """
    Generate narrative ending for completed arc based on climax scene performance.

    Args:
        student_id: Student who completed the arc
        arc_id: The completed arc
        climax_scene_id: The final synthesis scene
        performance_level: "mastery" or "needs_improvement"
        db: Firestore client

    Returns:
        ArcEndingResponse with narrative ending
    """
    # Fetch arc data
    arc_doc = await db.collection("arcs").document(arc_id).get()
    if not arc_doc.exists:
        raise ValueError(f"Arc not found: {arc_id}")
    arc = arc_doc.to_dict()

    # Fetch climax scene data
    # climax_scene_id has format "scene4" -> extract scene_order and query by arc_id + scene_order
    scene_order_match = re.match(r"scene(\d+)", climax_scene_id)
    if not scene_order_match:
        raise ValueError(f"Invalid climax_scene_id format: {climax_scene_id}")
    climax_scene_order = int(scene_order_match.group(1))

    # Query for climax scene by arc_id, then filter by scene_order in Python
    # (Workaround for composite index requirement)
    climax_scenes_query = db.collection("scenes")\
        .where(filter=FieldFilter("arc_id", "==", arc_id))
    climax_scenes_docs = climax_scenes_query.stream()

    climax_scene = None
    async for doc in climax_scenes_docs:
        if doc.exists:
            scene_data = doc.to_dict()
            if scene_data.get("scene_order") == climax_scene_order:
                climax_scene = scene_data
                break

    if not climax_scene:
        raise ValueError(f"Climax scene not found: {climax_scene_id}")

    # Fetch all scenes in arc to get scene 1 character
    scenes_query = db.collection("scenes").where(filter=FieldFilter("arc_id", "==", arc_id))
    scenes_docs = scenes_query.stream()
    scenes = [doc.to_dict() async for doc in scenes_docs if doc.exists]
    # Sort in Python instead of Firestore
    scenes.sort(key=lambda s: s.get("scene_order", 0))
    scene_1_character = scenes[0].get("character_id") if scenes else "Unknown"

    # Fetch reasoning traces for this student on the climax scene
    # Query by student_id first, filter scene_id in Python
    traces_query = db.collection("reasoning_traces")\
        .where(filter=FieldFilter("student_id", "==", student_id))\
        .limit(10)

    traces_docs = traces_query.stream()
    traces = []
    async for doc in traces_docs:
        if doc.exists:
            trace_data = doc.to_dict()
            if trace_data.get("scene_id") == climax_scene_id:
                traces.append(trace_data)

    # Sort by created_at descending in Python
    # Handle both datetime objects and ISO strings
    def get_sort_key(trace):
        created_at = trace.get("created_at")
        if created_at is None:
            return ""
        # If it's a Firestore datetime, convert to ISO string
        if hasattr(created_at, 'isoformat'):
            return created_at.isoformat()
        # If it's already a string, return as is
        return str(created_at)

    traces.sort(key=get_sort_key, reverse=True)

    # Build reasoning trace summary
    reasoning_summary = {
        "misconceptions_encountered": [],
        "revised_understanding": False,
        "strong_dimensions": [],
        "weak_dimensions": []
    }

    if traces:
        trace = traces[0]  # Already a dict
        if trace.get("rubric_alignment"):
            # Extract dimensions from signal extraction
            for dimension, data in trace["rubric_alignment"].items():
                if data.get("performance") == "strong":
                    reasoning_summary["strong_dimensions"].append(dimension)
                elif data.get("performance") == "weak":
                    reasoning_summary["weak_dimensions"].append(dimension)

        # Check for misconceptions
        conversation_history = trace.get("conversation_history", [])
        for turn in conversation_history:
            if turn.get("role") == "character":
                content = turn.get("content", "")
                if "misconception" in content.lower() or "but" in content.lower():
                    reasoning_summary["misconceptions_encountered"].append("detected in dialogue")
                    break

        # Check if student revised their answer
        if trace.get("revised_answer") and trace.get("revised_answer") != trace.get("initial_answer"):
            reasoning_summary["revised_understanding"] = True

    # Load ending generation prompt
    ending_prompt = load_system_prompt("arc_ending")

    # Build runtime context
    runtime_context = {
        "arc_context": {
            "title": arc.get("title", "Unnamed Arc"),
            "concepts_covered": arc.get("concept_targets", []),
            "character_from_scene_1": scene_1_character,
            "climax_scene_data": {
                "scene_id": climax_scene_id,
                "concept_target": climax_scene.get("concept_target"),
                "student_performance": performance_level
            }
        },
        "reasoning_trace_summary": reasoning_summary,
        "student_id": student_id
    }

    user_prompt = f"""Generate arc ending for completed arc.

Runtime context:
{json.dumps(runtime_context, indent=2)}

Generate the ending narrative based on the student's performance. Follow the ending type decision logic from your system prompt.

Return JSON with:
{{
  "ending_type": "good_end | bad_end | iffy_end",
  "narrative_text": "VN-formatted narrative with [character:Name] and emotion tags",
  "character_callback": "Brief callback to {scene_1_character}",
  "reflection_prompt": "Journal-style reflection question",
  "ending_title": "Short title for this ending"
}}"""

    response_dict = await llm_client.generate_with_retry(
        system=ending_prompt,
        user=user_prompt,
        response_format="json",
        temperature=0.9,  # Higher temperature for more creative narrative endings
    )

    ending_id = str(uuid.uuid4())

    # Store ending in Firestore
    ending_doc = {
        "ending_id": ending_id,
        "arc_id": arc_id,
        "student_id": student_id,
        "climax_scene_id": climax_scene_id,
        "ending_type": response_dict["ending_type"],
        "narrative_text": response_dict["narrative_text"],
        "character_callback": response_dict.get("character_callback"),
        "reflection_prompt": response_dict["reflection_prompt"],
        "ending_title": response_dict.get("ending_title", "Arc Complete"),
        "performance_level": performance_level,
        "created_at": datetime.utcnow().isoformat(),
        "status": "generated"
    }

    await db.collection("arc_endings").document(ending_id).set(ending_doc)

    return ArcEndingResponse(
        ending_id=ending_id,
        arc_id=arc_id,
        student_id=student_id,
        ending_type=response_dict["ending_type"],
        narrative_text=response_dict["narrative_text"],
        character_callback=response_dict.get("character_callback"),
        reflection_prompt=response_dict["reflection_prompt"],
        status="generated"
    )
