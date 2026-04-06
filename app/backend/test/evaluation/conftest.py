# Evaluation framework fixtures — provides golden evaluation datasets
# Shared types (EvalCase, EvalResult, etc.) are in helpers.py

import pytest
from .helpers import EvalCase


# ─── Golden Evaluation Datasets ──────────────────────────────────────────────

@pytest.fixture
def rubric_alignment_cases() -> list[EvalCase]:
    """Golden dataset for rubric alignment evaluation."""
    return [
        EvalCase(
            case_id="rubric_econ_01",
            description="Year 11 Economics market equilibrium rubric",
            input_data={
                "rubric_text": (
                    "Year 11 Economics — Market Equilibrium Assessment\n"
                    "Learning Outcomes:\n"
                    "1. Explain how supply and demand determine market price\n"
                    "2. Analyse the effect of price controls on market outcomes\n"
                    "3. Evaluate the welfare implications of government intervention\n"
                    "Common Misconceptions:\n"
                    "- Supply always equals demand (confuses equilibrium with identity)\n"
                    "- Price ceilings benefit all consumers (ignores shortage effects)\n"
                ),
            },
            expected={
                "subject": "Economics",
                "min_learning_outcomes": 2,
                "min_misconceptions": 2,
                "required_concepts": ["supply", "demand", "equilibrium", "price"],
            },
            tags=["economics", "year11"],
        ),
        EvalCase(
            case_id="rubric_cs_01",
            description="Year 12 Software Development algorithms rubric",
            input_data={
                "rubric_text": (
                    "Year 12 Software Development — Algorithm Design\n"
                    "Learning Outcomes:\n"
                    "1. Design algorithms using pseudocode and flowcharts\n"
                    "2. Analyse time complexity using Big-O notation\n"
                    "Common Misconceptions:\n"
                    "- O(n) is always faster than O(n log n)\n"
                    "- Recursion is always slower than iteration\n"
                ),
            },
            expected={
                "subject_contains": ["Software", "Computer", "Algorithm"],
                "min_learning_outcomes": 2,
                "min_misconceptions": 2,
                "required_concepts": ["algorithm", "complexity"],
            },
            tags=["cs", "year12"],
        ),
    ]


@pytest.fixture
def misconception_detection_cases() -> list[EvalCase]:
    """Golden dataset for misconception detection accuracy."""
    return [
        EvalCase(
            case_id="miscon_econ_supply_demand",
            description="Student response containing supply=demand misconception",
            input_data={
                "student_response": "Well, supply always has to equal demand, right? That's just how markets work.",
                "concept_target": "market equilibrium",
                "known_misconception": "Supply always equals demand",
            },
            expected={
                "should_detect": True,
                "misconception_keyword": "equilibrium",
                "quality": "weak",
            },
            tags=["economics", "detection"],
        ),
        EvalCase(
            case_id="miscon_econ_correct",
            description="Student response showing correct understanding",
            input_data={
                "student_response": (
                    "At equilibrium, the quantity supplied equals quantity demanded at a specific price. "
                    "But if the price is set above equilibrium, there would be a surplus."
                ),
                "concept_target": "market equilibrium",
                "known_misconception": "Supply always equals demand",
            },
            expected={
                "should_detect": False,
                "quality": "strong",
            },
            tags=["economics", "correct"],
        ),
        EvalCase(
            case_id="miscon_econ_partial",
            description="Student response with partial understanding",
            input_data={
                "student_response": "I think supply equals demand at the equilibrium price, but I'm not sure what happens otherwise.",
                "concept_target": "market equilibrium",
                "known_misconception": "Supply always equals demand",
            },
            expected={
                "should_detect": False,
                "quality": "partial",
            },
            tags=["economics", "partial"],
        ),
    ]


@pytest.fixture
def dialogue_pedagogy_cases() -> list[EvalCase]:
    """Golden dataset for Socratic dialogue pedagogy quality."""
    return [
        EvalCase(
            case_id="pedagogy_good_pushback",
            description="Good Socratic pushback — questions, doesn't lecture",
            input_data={
                "character_dialogue": (
                    "*challenging* Interesting take. But let me push you on something — "
                    "if supply always equals demand, how do you explain the long queues "
                    "for concert tickets? Those tickets have a fixed price set by the venue."
                ),
                "emotion_tag": "challenging",
            },
            expected={
                "is_socratic": True,
                "contains_question": True,
                "avoids_lecturing": True,
                "uses_concrete_example": True,
                "min_quality_score": 0.7,
            },
            tags=["pushback", "good"],
        ),
        EvalCase(
            case_id="pedagogy_bad_lecturing",
            description="Bad response — lectures instead of questioning",
            input_data={
                "character_dialogue": (
                    "*neutral* Actually, supply doesn't always equal demand. "
                    "In economics, equilibrium is defined as the price at which "
                    "quantity supplied equals quantity demanded. When prices deviate "
                    "from equilibrium, surpluses or shortages occur."
                ),
                "emotion_tag": "neutral",
            },
            expected={
                "is_socratic": False,
                "contains_question": False,
                "avoids_lecturing": False,
                "max_quality_score": 0.4,
            },
            tags=["lecturing", "bad"],
        ),
    ]
