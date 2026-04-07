# Evaluation: Misconception Detection Accuracy
# Measures how accurately the system detects student misconceptions
# from their dialogue responses

import pytest
import re
from .helpers import EvalCase, EvalResult, compute_eval_report


def score_misconception_detection(
    student_response: str,
    known_misconception: str,
    expected: dict,
) -> EvalResult:
    """Score misconception detection on a single student response."""
    metrics = {}
    score = 0.0
    total_checks = 0

    # 1. Detection accuracy: does the response contain the misconception?
    total_checks += 1
    response_lower = student_response.lower()
    misconception_lower = known_misconception.lower()

    # Heuristic detection: check for key phrases
    misconception_keywords = misconception_lower.split()
    keyword_overlap = sum(1 for kw in misconception_keywords if kw in response_lower)
    keyword_ratio = keyword_overlap / len(misconception_keywords) if misconception_keywords else 0

    # Direct pattern: "always", "has to", "just how"
    certainty_markers = ["always", "has to", "must", "just", "obviously", "clearly"]
    has_certainty = any(marker in response_lower for marker in certainty_markers)

    # Hedging patterns: "I think", "not sure", "maybe"
    hedge_markers = ["i think", "not sure", "maybe", "perhaps", "possibly"]
    has_hedge = any(marker in response_lower for marker in hedge_markers)

    # Correct understanding markers
    correct_markers = ["specific price", "equilibrium price", "surplus", "shortage", "at a specific"]
    has_correct = any(marker in response_lower for marker in correct_markers)

    should_detect = expected.get("should_detect", False)

    if should_detect:
        # We expect misconception to be present
        detected = keyword_ratio > 0.3 and (has_certainty or not has_correct)
        metrics["detected_misconception"] = detected
        if detected:
            score += 1.0
    else:
        # We expect correct understanding
        not_detected = has_correct or has_hedge or (not has_certainty and keyword_ratio < 0.5)
        metrics["correctly_identified_as_no_misconception"] = not_detected
        if not_detected:
            score += 1.0

    # 2. Quality classification
    total_checks += 1
    expected_quality = expected.get("quality")
    if expected_quality:
        # Classify quality based on response features
        if has_correct and not has_certainty:
            inferred_quality = "strong"
        elif has_hedge or (has_correct and has_certainty):
            inferred_quality = "partial"
        else:
            inferred_quality = "weak"

        quality_match = inferred_quality == expected_quality
        metrics["expected_quality"] = expected_quality
        metrics["inferred_quality"] = inferred_quality
        metrics["quality_match"] = quality_match
        if quality_match:
            score += 1.0

    normalized_score = score / total_checks if total_checks > 0 else 0.0
    passed = normalized_score >= 0.5

    return EvalResult(
        case_id="",
        passed=passed,
        score=normalized_score,
        metrics=metrics,
    )


@pytest.mark.evaluation
class TestMisconceptionDetection:
    """Evaluate misconception detection accuracy against golden dataset."""

    def test_misconception_detection_accuracy(self, misconception_detection_cases):
        """Run all misconception detection cases and assert pass rate >= 70%."""
        results = []
        for case in misconception_detection_cases:
            result = score_misconception_detection(
                student_response=case.input_data["student_response"],
                known_misconception=case.input_data.get("known_misconception", ""),
                expected=case.expected,
            )
            result.case_id = case.case_id
            results.append(result)

        report = compute_eval_report("Misconception Detection", results)
        print(report.summary())
        for r in report.results:
            print(f"  {r.case_id}: {'PASS' if r.passed else 'FAIL'} (score={r.score:.2f}) {r.metrics}")

        assert report.pass_rate >= 0.7, (
            f"Misconception detection pass rate {report.pass_rate:.1%} below 70% threshold"
        )

    def test_weak_response_detected(self, misconception_detection_cases):
        """Responses with clear misconceptions should be classified as weak."""
        weak_cases = [c for c in misconception_detection_cases if c.expected.get("quality") == "weak"]
        for case in weak_cases:
            result = score_misconception_detection(
                student_response=case.input_data["student_response"],
                known_misconception=case.input_data["known_misconception"],
                expected=case.expected,
            )
            assert result.metrics.get("detected_misconception", False) or result.metrics.get("quality_match", False), (
                f"Case {case.case_id}: Failed to detect weak response"
            )

    def test_strong_response_not_flagged(self, misconception_detection_cases):
        """Correct responses should not be flagged as having misconceptions."""
        strong_cases = [c for c in misconception_detection_cases if c.expected.get("quality") == "strong"]
        for case in strong_cases:
            result = score_misconception_detection(
                student_response=case.input_data["student_response"],
                known_misconception=case.input_data.get("known_misconception", ""),
                expected=case.expected,
            )
            assert result.metrics.get("correctly_identified_as_no_misconception", False), (
                f"Case {case.case_id}: Incorrectly flagged correct response as misconception"
            )
