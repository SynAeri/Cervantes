# Dialogue service - generates real-time Socratic pushback during scenes
# Uses pushback_dialogue.md system prompt (Firestore version)

import json
import uuid
import re
from datetime import datetime
from typing import Optional
from google.cloud.firestore import AsyncClient, FieldFilter
from app.backend.core import llm_client
from app.backend.core.prompt_loader import load_system_prompt, load_annotation
from app.backend.features.dialogue.schemas import ConversationTurn, DialogueTurnResponse, SubQuestionResponse


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
    arc_id: str,
    student_id: str,
    conversation_history: list[ConversationTurn],
    db: AsyncClient,
    student_response: Optional[str] = None,
    student_multipart_response: Optional[list[SubQuestionResponse]] = None,
) -> DialogueTurnResponse:
    """
    Generate character's next dialogue response using pushback_dialogue.md
    Runs DURING a scene - real-time Socratic conversation
    """
    print(f"DEBUG: Starting dialogue turn for scene_id={scene_id}, arc_id={arc_id}, student_id={student_id}")
    print(f"DEBUG: student_response={student_response}")
    print(f"DEBUG: conversation_history length={len(conversation_history)}")

    # Resolve scene: support both legacy "sceneN" IDs and UUID scene IDs
    scene_order_match = re.match(r"scene(\d+)", scene_id)

    scenes_ref = db.collection("scenes")
    if scene_order_match:
        # Legacy format: extract order and query by arc+order
        scene_order = int(scene_order_match.group(1))
        print(f"DEBUG: Extracted scene_order={scene_order} from legacy ID")
        scenes_query = scenes_ref.where(filter=FieldFilter("arc_id", "==", arc_id)).where(filter=FieldFilter("scene_order", "==", scene_order))
    else:
        # UUID format: fetch document directly by ID, then get scene_order from it
        print(f"DEBUG: UUID scene_id={scene_id}, fetching directly")
        scene_doc = await scenes_ref.document(scene_id).get()
        if not scene_doc.exists:
            raise ValueError(f"Scene not found: {scene_id}")
        scene_order = scene_doc.to_dict().get("scene_order")
        print(f"DEBUG: Resolved scene_order={scene_order} from UUID scene")
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
        raise ValueError(f"Scene not found for arc_id={arc_id}, scene_order={scene_order}")

    print(f"DEBUG: Found scene with actual_scene_id={actual_scene_id}")
    print(f"DEBUG: Scene data keys: {list(scene.keys())}")
    print(f"DEBUG: character_id: {scene.get('character_id')}")
    print(f"DEBUG: concept_target: {scene.get('concept_target')}")

    if 'character_id' not in scene:
        raise ValueError(f"Scene {actual_scene_id} missing required field: character_id")
    if 'concept_target' not in scene:
        raise ValueError(f"Scene {actual_scene_id} missing required field: concept_target")

    # Fetch the assigned character from character pool (same logic as scenes/routes.py)
    normalized_student_id = student_id if student_id.startswith("student_") else f"student_{student_id}"
    assignments_ref = db.collection("student_scene_assignments")
    assignments_query = assignments_ref.where(filter=FieldFilter("arc_id", "==", arc_id)).where(filter=FieldFilter("student_id", "==", normalized_student_id)).where(filter=FieldFilter("scene_order", "==", scene_order))
    assignments_docs = assignments_query.stream()

    assignment_data = None
    async for doc in assignments_docs:
        if doc.exists:
            assignment_data = doc.to_dict()
            break

    # Get character name from character pool if available
    assigned_character_name = None
    if assignment_data:
        character_pool_id = assignment_data.get("character_pool_id")
        assigned_variant = assignment_data.get("assigned_variant")

        if character_pool_id:
            pool_doc = await db.collection("character_pools").document(character_pool_id).get()
            if pool_doc.exists:
                pool_data = pool_doc.to_dict()
                name_variants = pool_data.get("name_variants", [])
                selected_variant = next((v for v in name_variants if v.get("variant_id") == assigned_variant), None)

                if selected_variant:
                    assigned_character_name = selected_variant.get("name")
                    print(f"DEBUG: Found assigned character from pool: {assigned_character_name} (variant {assigned_variant})")

    # Get character name: priority order
    # 1. From conversation history (already mapped character names)
    # 2. From assigned_character (character pool assignment)
    # 3. Fallback to character_id
    character_name = None

    # Check conversation history first
    for turn in conversation_history:
        if turn.role == "character" and turn.character_id:
            character_name = turn.character_id
            print(f"DEBUG: Using character name from conversation history: {character_name}")
            break

    # If no history, use assigned character from character pool
    if not character_name and assigned_character_name:
        character_name = assigned_character_name
        print(f"DEBUG: Using character name from character pool: {character_name}")

    # Final fallback to raw character_id
    if not character_name:
        character_name = scene['character_id']
        print(f"DEBUG: Fallback to scene character_id: {character_name}")

    character_personality = f"{character_name} (character)"

    dialogue_prompt = load_system_prompt("pushback_dialogue")
    emotion_tags = load_annotation("emotion_tags")

    student_turns = len([t for t in conversation_history if t.role == "student"])

    # Simple 5-turn system:
    # - Turns 1-4: Socratic dialogue continues
    # - Turn 5: Final turn - character wraps up and scene ends
    ABSOLUTE_MAX_TURNS = 5

    max_prompts_remaining = max(0, ABSOLUTE_MAX_TURNS - student_turns)
    is_final_turn = (student_turns >= ABSOLUTE_MAX_TURNS)

    print(f"DEBUG: Counting turns in conversation_history:")
    for i, turn in enumerate(conversation_history):
        print(f"  {i+1}. role={turn.role}, content_preview={turn.content[:50] if len(turn.content) > 50 else turn.content}")
    print(f"DEBUG: Total student_turns={student_turns}/{ABSOLUTE_MAX_TURNS}, max_prompts_remaining={max_prompts_remaining}")
    print(f"DEBUG: is_final_turn={is_final_turn}")

    # Format student response for context
    if student_multipart_response:
        # Multi-part freeform: structure the response with sub-questions
        formatted_response = "Multi-part response:\n"
        for part in student_multipart_response:
            formatted_response += f"{part.part_number}) {part.sub_question_text}\n"
            formatted_response += f"   Student answer: {part.student_answer}\n"
            if part.rubric_dimension:
                formatted_response += f"   Rubric dimension: {part.rubric_dimension}\n"
        response_type = "multipart_freeform"
        response_content = formatted_response
    else:
        # Simple freeform: single response
        response_type = "freeform"
        response_content = student_response or ""

    # character_name already extracted above from conversation history

    runtime_context = {
        "character": {
            "name": character_name,
            "personality_prompt": character_personality,
            "sprite_set": ["neutral", "encouraging", "concerned", "challenging", "surprised"],
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
        "student_response": {"type": response_type, "content": response_content},
        "prompt_number": student_turns + 1,
        "max_prompts_remaining": max_prompts_remaining,
        "scene_type": scene.get("scene_type"),
    }

    user_prompt = f"""Runtime context for this dialogue turn:

{json.dumps(runtime_context, indent=2)}

Student just responded:
{response_content}

Available emotion tags:
{emotion_tags}

Generate the character's next response following the pushback logic in your system prompt.
{"For multi-part responses, assess each sub-question and provide targeted pushback if needed." if student_multipart_response else ""}

**FORMATTING RULES - CRITICAL:**
- Character dialogue MUST use the format: [character:{character_name}] *emotion* Dialogue text
  Example: [character:char_38dd763a] *thoughtful* This is what the character says.
- Do NOT use shortcuts like [char_38dd763a]: or {character_name}:
- Use *asterisks* around key economic terms (e.g., *unemployment rate*, *GDP*, *inflation*)
- Use **double asterisks** for critical terms (e.g., **economic indicators**, **cost-benefit analysis**)

Character name for this scene: {character_name}

CRITICAL RULES - 5 TURN SYSTEM:

Current turn: {student_turns + 1}/{ABSOLUTE_MAX_TURNS}
Max prompts remaining: {max_prompts_remaining}
{'[FINAL TURN - MUST END]' if is_final_turn else '[CONTINUING]'}

**ABSOLUTE RULE: CONVERSATION ENDS AT TURN 5. NO EXCEPTIONS.**

**Turn Logic:**

1. **Turns 1-4**: Continue Socratic dialogue
   - Probe student understanding with questions
   - Provide scaffolding if needed
   - MUST include [player_prompt] at the end
   - Set should_end_scene to false

2. **Turn 5 (FINAL TURN - MUST END)**:
   - Acknowledge student's final response
   - If student still struggling: briefly explain the concept with specific examples (GDP, inflation, unemployment related to {scene['concept_target']})
   - If student showed understanding: affirm and add nuance
   - Character gives natural sign-off: "I need to get back now" or similar
   - End with [narration] reflecting on the learning moment
   - MUST set should_end_scene to true
   - DO NOT include [player_prompt]

**Formatting:**
- Turns 1-4: Character dialogue + [player_prompt]
- Turn 5: Character dialogue → character sign-off → [narration]

**Set should_end_scene:**
- Turns 1-4: false (must include [player_prompt])
- Turn 5: true (must include [narration], no [player_prompt])

Return JSON with:
{{
  "character_dialogue": "the dialogue with VN formatting and emotion tags - MUST include [player_prompt] if max_prompts_remaining > 0. Use \\n for newlines.",
  "emotion_tag": "primary emotion",
  "should_end_scene": true/false,
  "reasoning_assessment": {{
    "quality": "strong/partial/weak",
    "misconception_detected": "description or null"
  }}
}}

CRITICAL: In the JSON response, use \\n (escaped newline) between dialogue lines, NOT actual line breaks.
Example: "character_dialogue": "[character:name] *emotion* Text\\n[character:name] *emotion* More text\\n[player_prompt]"
"""

    response_dict = await llm_client.generate_with_retry(
        system=dialogue_prompt,
        user=user_prompt,
        response_format="json",
        temperature=0.85,
    )

    response = DialogueTurnResponse(**response_dict)

    # Fix malformed character tags (common LLM mistakes)
    # character_name already defined above

    # Remove any HTML tags that might have leaked in
    response.character_dialogue = re.sub(r'<[^>]+>', '', response.character_dialogue)

    # Fix [char_38dd763a] -> [character:char_38dd763a]
    # Matches [char_id] followed by optional : or space
    response.character_dialogue = re.sub(
        r'\[' + re.escape(character_name) + r'\][\s:]*',
        f'[character:{character_name}] ',
        response.character_dialogue
    )

    # Fix {character_name} -> [character:character_name]
    response.character_dialogue = re.sub(
        r'\{' + re.escape(character_name) + r'\}[\s:]*',
        f'[character:{character_name}] ',
        response.character_dialogue
    )

    print(f"DEBUG: LLM returned should_end_scene={response.should_end_scene}")
    print(f"DEBUG: Full dialogue output:\n{response.character_dialogue}")

    # STRICT ENFORCEMENT: Only force hard stop if we somehow exceed turn 5
    if student_turns > ABSOLUTE_MAX_TURNS:
        print(f"DEBUG: ENFORCING HARD STOP - Turn {student_turns} > {ABSOLUTE_MAX_TURNS}")
        # Remove any player_prompt, ensure narration ending
        if "[player_prompt]" in response.character_dialogue.lower():
            response.character_dialogue = response.character_dialogue.replace("[player_prompt]", "").replace("[PLAYER_PROMPT]", "")
            print(f"DEBUG: Removed [player_prompt] to force ending")

        # If no narration, add it
        if "[narration]" not in response.character_dialogue.lower():
            response.character_dialogue += f"\n[narration] The conversation comes to a close. You reflect on the discussion about {scene['concept_target']}."

        response.should_end_scene = True
        print(f"DEBUG: Forced should_end_scene=True at turn {student_turns}")
        return response

    # Turn 5 handling: must end gracefully with LLM's response
    if student_turns == ABSOLUTE_MAX_TURNS:
        print(f"DEBUG: Turn 5 (final turn) - ensuring proper ending")
        # Remove any player_prompt that LLM might have added
        if "[player_prompt]" in response.character_dialogue.lower():
            response.character_dialogue = response.character_dialogue.replace("[player_prompt]", "").replace("[PLAYER_PROMPT]", "")
            print(f"DEBUG: Removed [player_prompt] from turn 5")

        # Ensure narration is present
        if "[narration]" not in response.character_dialogue.lower():
            print(f"DEBUG: No narration found, adding one")
            character_name = scene["character_id"]
            response.character_dialogue += f"\n[character:{character_name}] *neutral* I need to get back to work now, but keep thinking about what we discussed."
            response.character_dialogue += f"\n[narration] The conversation ends. You reflect on {scene['concept_target']} and the complexities discussed."

        response.should_end_scene = True
        print(f"DEBUG: Turn 5 properly formatted with narration, should_end_scene=True")
        # Don't return yet - let it display the full response

    # Override should_end_scene logic for turns 1-4
    if student_turns < ABSOLUTE_MAX_TURNS:
        has_player_prompt = "[player_prompt]" in response.character_dialogue.lower()

        if has_player_prompt:
            print(f"DEBUG: Found [player_prompt] in dialogue, forcing should_end_scene=False")
            response.should_end_scene = False
        elif max_prompts_remaining > 0:
            # Check if this is turn 4 and LLM provided substantial explanation
            # Allow ending at turn 4 if the dialogue has good pedagogical content
            if student_turns == 4:
                dialogue_lower = response.character_dialogue.lower()
                # Check if character provided specific indicators or explanations
                has_explanation = any(term in dialogue_lower for term in [
                    "unemployment rate", "gdp", "inflation rate", "cpi", "consumer price",
                    "gross domestic product", "economic indicator", "measure"
                ])

                if has_explanation and "[narration]" in dialogue_lower:
                    print(f"DEBUG: Turn 4 with substantial explanation and narration - allowing natural ending")
                    response.should_end_scene = True
                    return response

            # For turns 1-3, or turn 4 without good explanation: must continue
            print(f"DEBUG: Turn {student_turns}, must continue - injecting [player_prompt]")

            # Remove [narration] and sign-off lines
            dialogue_lines = response.character_dialogue.split("\n")
            cleaned_lines = []
            # character_name already correctly set at top of function

            for line in dialogue_lines:
                line_lower = line.lower()
                if "[narration]" in line_lower:
                    continue
                if any(phrase in line_lower for phrase in ["need to get back", "should get back", "have to go", "need to go", "gotta run", "see you later", "another meeting"]):
                    print(f"DEBUG: Removing sign-off line: {line[:80]}")
                    continue
                cleaned_lines.append(line)

            # Add follow-up probing question
            followup = f"[character:{character_name}] *thoughtful* Can you elaborate on that? What specific indicators or examples come to mind?"
            cleaned_lines.append(followup)
            cleaned_lines.append("[player_prompt]")

            response.character_dialogue = "\n".join(cleaned_lines)
            print(f"DEBUG: Modified dialogue to continue conversation")
            response.should_end_scene = False

    # Update conversation history
    # Store formatted response in conversation history
    student_content = response_content if student_multipart_response else student_response
    conversation_history.append(ConversationTurn(
        role="student",
        content=student_content,
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
        "arc_id": arc_id,
        "scene_order": scene_order,
        "conversation_history": [turn.model_dump() for turn in conversation_history],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.collection("reasoning_traces").document(trace_id).set(trace_data)

    # Character name is already correct (from conversation history or character pool)
    # No need to apply character mapping again - it would create duplicate mappings
    print(f"DEBUG: Dialogue response using character: {character_name}")

    return response
