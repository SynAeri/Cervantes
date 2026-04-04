# Dynamic character generation based on student profile and concept
# Generates characters that fit the student's academic world

import json
from app.backend.core import llm_client
from app.backend.features.arc.schemas import CharacterProfile

ARCHETYPE_TEMPLATES = [
    {
        "archetype": "sharp_mentor",
        "description": "Challenges through pointed questions, never lectures, corners you with your own logic"
    },
    {
        "archetype": "frustrated_peer",
        "description": "Dealing with the concept in their own work, asks for help, reveals misconception through their situation"
    },
    {
        "archetype": "quiet_analyst",
        "description": "Precise, clinical, finds imprecision offensive, corrects through clarification not explanation"
    },
    {
        "archetype": "overconfident_beginner",
        "description": "Thinks they understand, speaks with swagger, gets cornered by a sharper character"
    },
    {
        "archetype": "curious_outsider",
        "description": "From a different field, asks naive questions that expose fundamental assumptions"
    }
]

async def generate_character(
    student_subjects: list[str],
    student_extracurriculars: list[str],
    concept_target: str,
    scene_type: str,
    scene_order: int,
    preferred_archetype: str = None,
    used_names: list[str] = None
) -> CharacterProfile:
    """
    Generates a character that fits the student's world and the concept being assessed.
    Returns a CharacterProfile with role, personality, and voice emerging from student context.
    """

    system_prompt = f"""You are a character designer for an educational narrative system.

Generate a character that naturally fits this student's world and can surface the target concept through their role.

**Key principles:**
- Characters come from the student's academic/extracurricular world
- Their role should create natural situations where the concept matters
- No lecturing professors - use peers, mentors, professionals the student would actually encounter
- The concept should surface through the character's work/situation, not exposition

**Available archetypes:**
{json.dumps(ARCHETYPE_TEMPLATES, indent=2)}

Return a character as JSON with this structure:
{{
  "id": "generated_char_XXX",
  "name": "First name only, culturally diverse",
  "role": "Specific role that intersects with student's subjects (e.g., 'Economics student managing campus cafe finances')",
  "personality_prompt": "How they speak and think - specific behavioral traits, not generic adjectives",
  "voice_register": "How they sound - e.g., 'clipped and precise', 'relaxed but sharp', 'uncertain but curious'",
  "archetype": "One of the archetypes from the list",
  "subject_connection": "How their role naturally connects to the student's subjects and the concept",
  "sprite_set": ["neutral", "surprised", "thoughtful", "concerned", "amused", "serious", "encouraging", "challenging", "curious", "relieved"]
}}"""

    archetype_instruction = f"\n**Required archetype:** {preferred_archetype}" if preferred_archetype else ""

    used_names = used_names or []
    names_instruction = f"\n**FORBIDDEN NAMES (already used in this arc):** {', '.join(used_names)}\nYou MUST use a different name." if used_names else ""

    user_prompt = f"""Generate a character for this context:

**Student Profile:**
- Subjects: {json.dumps(student_subjects)}
- Extracurriculars: {json.dumps(student_extracurriculars)}

**Concept to assess:** {concept_target}
**Scene type:** {scene_type}
**Scene position:** {"opening" if scene_order == 1 else "mid" if scene_order <= 3 else "climax"}{archetype_instruction}{names_instruction}

Create a character whose role naturally involves this concept in their work or situation.

CRITICAL: The character name must be unique and NOT in the forbidden names list."""

    char_data = await llm_client.generate_with_retry(
        system=system_prompt,
        user=user_prompt,
        response_format="json",
        model="gemini-2.5-flash",
        temperature=0.9
    )

    return CharacterProfile(**char_data)
