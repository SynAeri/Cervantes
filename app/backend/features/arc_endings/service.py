# Arc ending service - generates outcome-based narrative endings after arc completion
# Uses arc_ending.md system prompt to create good/bad/iffy endings based on performance

import json
import re
import uuid
from datetime import datetime
from typing import Optional
from google.cloud.firestore import AsyncClient
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

    # Query for climax scene by arc_id and scene_order
    climax_scenes_query = db.collection("scenes")\
        .where("arc_id", "==", arc_id)\
        .where("scene_order", "==", climax_scene_order)
    climax_scenes_docs = await climax_scenes_query.get()

    climax_scene = None
    async for doc in climax_scenes_docs:
        if doc.exists:
            climax_scene = doc.to_dict()
            break

    if not climax_scene:
        raise ValueError(f"Climax scene not found: {climax_scene_id}")

    # Fetch all scenes in arc to get scene 1 character
    scenes_query = db.collection("scenes").where("arc_id", "==", arc_id).order_by("scene_order")
    scenes_docs = await scenes_query.get()
    scenes = [doc.to_dict() async for doc in scenes_docs if doc.exists]
    scene_1_character = scenes[0].get("character_id") if scenes else "Unknown"

    # Fetch reasoning traces for this student on the climax scene
    traces_query = db.collection("reasoning_traces")\
        .where("student_id", "==", student_id)\
        .where("scene_id", "==", climax_scene_id)\
        .order_by("created_at", direction="DESCENDING")\
        .limit(1)

    traces = await traces_query.get()

    # Build reasoning trace summary
    reasoning_summary = {
        "misconceptions_encountered": [],
        "revised_understanding": False,
        "strong_dimensions": [],
        "weak_dimensions": []
    }

    if traces:
        trace = traces[0].to_dict()
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
