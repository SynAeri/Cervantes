# Dialogue service - generates real-time Socratic pushback during scenes
# Uses pushback_dialogue.md system prompt (Firestore version)

import json
import uuid
from datetime import datetime
from google.cloud.firestore import AsyncClient
from app.backend.core import llm_client
from app.backend.core.prompt_loader import load_system_prompt, load_annotation
from app.backend.features.dialogue.schemas import ConversationTurn, DialogueTurnResponse


def format_conversation(history: list[ConversationTurn]) -> str:
    """Format conversation history for prompt context"""
    formatted = []
    for turn in history:
        if turn.role == "student":
            formatted.append(f"Student: {turn.content}")
        elif turn.role == "character":
            formatted.append(f"{turn.character_id}: {turn.content}")
        elif turn.role == "narration":
            formatted.append(f"[Narration] {turn.content}")
    return "\n".join(formatted)


async def generate_dialogue_turn(
    scene_id: str,
    student_id: str,
    student_response: str,
    conversation_history: list[ConversationTurn],
    db: AsyncClient,
) -> DialogueTurnResponse:
    """
    Generate character's next dialogue response using pushback_dialogue.md
    Runs DURING a scene - real-time Socratic conversation
    """
    scene_doc = await db.collection("scenes").document(scene_id).get()
    if not scene_doc.exists:
        raise ValueError(f"Scene not found: {scene_id}")
    scene = scene_doc.to_dict()

    character_personality = f"{scene['character_id']} (character)"

    dialogue_prompt = load_system_prompt("pushback_dialogue")
    emotion_tags = load_annotation("emotion_tags")

    student_turns = len([t for t in conversation_history if t.role == "student"])
    max_prompts_remaining = max(0, 3 - student_turns)

    runtime_context = {
        "character": {
            "name": scene["character_id"],
            "personality_prompt": character_personality,
            "sprite_set": ["neutral", "surprised", "thoughtful", "concerned", "amused",
                          "serious", "encouraging", "challenging", "curious", "relieved"],
        },
        "scene_context": {
            "setting": scene.get("setup_narration"),
            "concept": scene["concept_target"],
            "misconception": scene.get("misconception_target"),
            "correct_understanding": f"Understanding of {scene['concept_target']}",
            "exposing_scenario": scene.get("setup_narration"),
        },
        "conversation_history": [
            {"role": turn.role, "content": turn.content, "emotion": turn.emotion_tag}
            for turn in conversation_history
        ],
        "student_response": {"type": "freeform", "content": student_response},
        "prompt_number": student_turns + 1,
        "max_prompts_remaining": max_prompts_remaining,
        "scene_type": scene.get("scene_type"),
    }

    user_prompt = f"""Runtime context for this dialogue turn:

{json.dumps(runtime_context, indent=2)}

Student just responded: "{student_response}"

Available emotion tags:
{emotion_tags}

Generate the character's next response following the pushback logic in your system prompt.
Return JSON with:
{{
  "character_dialogue": "the dialogue with VN formatting and emotion tags",
  "emotion_tag": "primary emotion",
  "should_end_scene": true/false,
  "reasoning_assessment": {{
    "quality": "strong/partial/weak",
    "misconception_detected": "description or null"
  }}
}}"""

    response_dict = await llm_client.generate_with_retry(
        system=dialogue_prompt,
        user=user_prompt,
        response_format="json",
        temperature=0.85,
    )

    response = DialogueTurnResponse(**response_dict)

    # Update conversation history
    conversation_history.append(ConversationTurn(
        role="student",
        content=student_response,
        timestamp=datetime.utcnow().isoformat(),
    ))
    conversation_history.append(ConversationTurn(
        role="character",
        content=response.character_dialogue,
        character_id=scene["character_id"],
        emotion_tag=response.emotion_tag,
        timestamp=datetime.utcnow().isoformat(),
    ))

    # Persist reasoning trace to Firestore
    trace_id = str(uuid.uuid4())
    trace_data = {
        "trace_id": trace_id,
        "student_id": student_id,
        "scene_id": scene_id,
        "conversation_history": [turn.model_dump() for turn in conversation_history],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.collection("reasoning_traces").document(trace_id).set(trace_data)

    return response
