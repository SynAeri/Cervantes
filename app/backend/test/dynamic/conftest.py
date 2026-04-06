# Dynamic test fixtures — provides golden LLM outputs and validation helpers

import pytest
from pydantic import BaseModel


@pytest.fixture
def golden_arc_output():
    """A known-good arc generation output (simulates what Gemini should return)."""
    return {
        "arc_name": "The Equilibrium Enigma",
        "total_scenes": 3,
        "scenes": [
            {
                "scene_id": "scene_001",
                "scene_order": 1,
                "scene_type": "bridge",
                "concept_target": "supply and demand basics",
                "misconception_target": None,
                "exposing_scenario": None,
                "learning_outcome": "Understand how supply and demand curves interact",
                "correct_understanding": None,
                "arc_position": "opening",
                "setting": "University campus cafe during lunch rush",
                "socratic_angles": [],
                "character": {
                    "id": "char_a1b2c3d4",
                    "name": "Kai",
                    "role": "economics club treasurer",
                    "personality_prompt": "Energetic, asks for help with club budget",
                    "voice_register": "casual",
                    "archetype": "frustrated_peer",
                    "sprite_set": ["neutral", "confused", "hopeful"],
                },
            },
            {
                "scene_id": "scene_002",
                "scene_order": 2,
                "scene_type": "deep",
                "concept_target": "market equilibrium",
                "misconception_target": "Supply always equals demand",
                "exposing_scenario": "A market with a price floor above equilibrium",
                "learning_outcome": "Distinguish equilibrium from identity",
                "correct_understanding": "Equilibrium is a specific price-quantity pair, not an identity",
                "arc_position": "mid",
                "setting": "Student workshop room with whiteboard",
                "socratic_angles": [
                    "What happens when the government sets a minimum price above equilibrium?",
                    "If supply always equalled demand, could shortages ever exist?",
                ],
                "character": {
                    "id": "char_e5f6g7h8",
                    "name": "Marcus",
                    "role": "research assistant",
                    "personality_prompt": "Sharp, analytical, corners you with logic",
                    "voice_register": "formal_casual",
                    "archetype": "sharp_mentor",
                    "sprite_set": ["neutral", "challenging", "encouraging"],
                },
            },
            {
                "scene_id": "scene_003",
                "scene_order": 3,
                "scene_type": "deep",
                "concept_target": "price controls",
                "misconception_target": "Price ceilings help all consumers",
                "exposing_scenario": "Rent control in a housing market",
                "learning_outcome": "Analyse winners and losers of price ceilings",
                "correct_understanding": "Price ceilings create shortages and deadweight loss",
                "arc_position": "climax",
                "setting": "Student council meeting room",
                "socratic_angles": [
                    "Who benefits and who loses under rent control?",
                    "What happens to the total number of apartments available?",
                ],
                "character": {
                    "id": "char_i9j0k1l2",
                    "name": "Sasha",
                    "role": "debate captain",
                    "personality_prompt": "Precise, clinical, finds imprecision offensive",
                    "voice_register": "formal",
                    "archetype": "quiet_analyst",
                    "sprite_set": ["neutral", "concerned", "surprised"],
                },
            },
        ],
    }


@pytest.fixture
def golden_dialogue_output():
    """A known-good dialogue turn response."""
    return {
        "character_dialogue": "*challenging* Hmm, so you're saying supply always equals demand? "
        "Let me ask you this — if the government sets a minimum wage of $25/hour, "
        "and the equilibrium wage is $15, what happens to the number of jobs available?",
        "emotion_tag": "challenging",
        "should_end_scene": False,
        "reasoning_assessment": {
            "quality": "partial",
            "misconception_detected": "Confuses equilibrium condition with identity",
        },
    }


@pytest.fixture
def golden_signal_extraction_output():
    """A known-good signal extraction result."""
    return {
        "scene_id": "scene_002",
        "scene_type": "deep",
        "concept": "market equilibrium",
        "character": "marcus_01",
        "initial_response": {
            "type": "freeform",
            "selected": "Supply always equals demand at any price",
            "misconception_exposed": "Confuses equilibrium with identity",
        },
        "pushback_sequence": [
            {
                "pushback": "What happens when there's a price floor above equilibrium?",
                "student_response_type": "freeform",
                "student_response": "Then there would be excess supply... so supply doesn't always equal demand",
            }
        ],
        "revised_understanding": "Equilibrium is a specific price where quantity supplied equals quantity demanded",
        "rubric_alignment": {
            "Explain how supply and demand determine market price": "demonstrated",
        },
        "reflection": "Student held common identity misconception, revised with one pushback prompt",
        "status": "revised_with_scaffolding",
        "scaffolding_needed": True,
    }
