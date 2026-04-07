# Evaluation: Dialogue Pedagogy Quality
# Measures whether generated dialogue follows Socratic teaching principles
# Criteria: uses questions (not lectures), concrete examples, emotion tags, appropriate length

import pytest
import re
from .helpers import EvalCase, EvalResult, compute_eval_report


def score_dialogue_pedagogy(dialogue: str, emotion_tag: str, expected: dict) -> EvalResult:
    """Score a single dialogue response for pedagogical quality."""
    metrics = {}
    score = 0.0
    total_checks = 0

    # 1. Contains question (Socratic)
    total_checks += 1
    contains_question = "?" in dialogue
    metrics["contains_question"] = contains_question
    expected_question = expected.get("contains_question", True)
    if contains_question == expected_question:
        score += 1.0

    # 2. Avoids lecturing (doesn't just explain the answer)
    total_checks += 1
    lecture_patterns = [
        r"\bactually\b.*\bis\b",
        r"\bin economics\b",
        r"\bis defined as\b",
        r"\bthe answer is\b",
        r"\bthe correct\b.*\bis\b",
    ]
    lecture_count = sum(1 for p in lecture_patterns if re.search(p, dialogue.lower()))
    avoids_lecturing = lecture_count <= 1
    metrics["lecture_pattern_count"] = lecture_count
    metrics["avoids_lecturing"] = avoids_lecturing
    expected_avoids = expected.get("avoids_lecturing", True)
    if avoids_lecturing == expected_avoids:
        score += 1.0

    # 3. Uses concrete example
    total_checks += 1
    example_markers = [
        "for example", "imagine", "suppose", "what if", "consider",
        "let's say", "picture this", "think about", "concert", "rent",
        "minimum wage", "shop", "store", "market",
    ]
    uses_example = any(marker in dialogue.lower() for marker in example_markers)
    metrics["uses_concrete_example"] = uses_example
    if "uses_concrete_example" in expected:
        if uses_example == expected["uses_concrete_example"]:
            score += 1.0
    else:
        score += 0.5  # Neutral if not specified

    # 4. Starts with emotion tag (VN formatting)
    total_checks += 1
    starts_with_emotion = dialogue.strip().startswith("*")
    metrics["starts_with_emotion_tag"] = starts_with_emotion
    if starts_with_emotion:
        score += 1.0

    # 5. Appropriate length (15-150 words)
    total_checks += 1
    word_count = len(dialogue.split())
    appropriate_length = 15 <= word_count <= 150
    metrics["word_count"] = word_count
    metrics["appropriate_length"] = appropriate_length
    if appropriate_length:
        score += 1.0

    # 6. Is overall Socratic?
    is_socratic = contains_question and avoids_lecturing
    metrics["is_socratic"] = is_socratic

    normalized_score = score / total_checks if total_checks > 0 else 0.0
    passed = normalized_score >= 0.6

    return EvalResult(
        case_id="",
        passed=passed,
        score=normalized_score,
        metrics=metrics,
    )


@pytest.mark.evaluation
class TestDialoguePedagogy:
    """Evaluate dialogue responses for Socratic teaching quality."""

    def test_pedagogy_quality_all_cases(self, dialogue_pedagogy_cases):
        """Run all pedagogy cases and report scores."""
        results = []
        for case in dialogue_pedagogy_cases:
            result = score_dialogue_pedagogy(
                dialogue=case.input_data["character_dialogue"],
                emotion_tag=case.input_data["emotion_tag"],
                expected=case.expected,
            )
            result.case_id = case.case_id
            results.append(result)

        report = compute_eval_report("Dialogue Pedagogy", results)
        print(report.summary())
        for r in report.results:
            print(f"  {r.case_id}: {'PASS' if r.passed else 'FAIL'} (score={r.score:.2f}) {r.metrics}")

        # At least the good example should pass
        good_results = [r for r in results if "good" in r.case_id]
        assert all(r.passed for r in good_results), "Good Socratic examples should pass"

    def test_good_pushback_is_socratic(self, dialogue_pedagogy_cases):
        """Good pushback examples should be identified as Socratic."""
        good_cases = [c for c in dialogue_pedagogy_cases if "good" in c.case_id]
        for case in good_cases:
            result = score_dialogue_pedagogy(
                dialogue=case.input_data["character_dialogue"],
                emotion_tag=case.input_data["emotion_tag"],
                expected=case.expected,
            )
            assert result.metrics["is_socratic"], f"Case {case.case_id} should be Socratic"
            assert result.metrics["contains_question"], f"Case {case.case_id} should contain question"

    def test_lecturing_detected(self, dialogue_pedagogy_cases):
        """Lecturing examples should be flagged as non-Socratic."""
        bad_cases = [c for c in dialogue_pedagogy_cases if "bad" in c.case_id]
        for case in bad_cases:
            result = score_dialogue_pedagogy(
                dialogue=case.input_data["character_dialogue"],
                emotion_tag=case.input_data["emotion_tag"],
                expected=case.expected,
            )
            assert not result.metrics["is_socratic"], f"Case {case.case_id} should NOT be Socratic"
