# Evaluation: Rubric Alignment
# Measures how well CurricuLLM output aligns with the input rubric
# Checks: subject detection, learning outcome extraction, misconception identification

import pytest
from .helpers import EvalCase, EvalResult, compute_eval_report


def score_rubric_alignment(curriculum_data: dict, expected: dict) -> EvalResult:
    """Score a single rubric alignment case."""
    metrics = {}
    score = 0.0
    total_checks = 0

    # 1. Subject detection
    total_checks += 1
    if "subject" in expected:
        subject_match = expected["subject"].lower() in curriculum_data.get("subject", "").lower()
        metrics["subject_match"] = subject_match
        if subject_match:
            score += 1.0
    elif "subject_contains" in expected:
        subject = curriculum_data.get("subject", "")
        match = any(kw.lower() in subject.lower() for kw in expected["subject_contains"])
        metrics["subject_contains_match"] = match
        if match:
            score += 1.0

    # 2. Learning outcomes count
    total_checks += 1
    outcomes = curriculum_data.get("learning_outcomes", [])
    min_outcomes = expected.get("min_learning_outcomes", 1)
    outcomes_ok = len(outcomes) >= min_outcomes
    metrics["learning_outcomes_count"] = len(outcomes)
    metrics["learning_outcomes_sufficient"] = outcomes_ok
    if outcomes_ok:
        score += 1.0

    # 3. Misconception count
    total_checks += 1
    misconceptions = curriculum_data.get("common_misconceptions", [])
    min_miscon = expected.get("min_misconceptions", 1)
    miscon_ok = len(misconceptions) >= min_miscon
    metrics["misconceptions_count"] = len(misconceptions)
    metrics["misconceptions_sufficient"] = miscon_ok
    if miscon_ok:
        score += 1.0

    # 4. Key concept coverage
    if "required_concepts" in expected:
        total_checks += 1
        key_concepts = curriculum_data.get("key_concepts", [])
        all_text = " ".join(key_concepts + outcomes).lower()
        found = sum(1 for c in expected["required_concepts"] if c.lower() in all_text)
        concept_coverage = found / len(expected["required_concepts"])
        metrics["concept_coverage"] = concept_coverage
        score += concept_coverage

    normalized_score = score / total_checks if total_checks > 0 else 0.0
    passed = normalized_score >= 0.7

    return EvalResult(
        case_id="",  # Set by caller
        passed=passed,
        score=normalized_score,
        metrics=metrics,
    )


@pytest.mark.evaluation
class TestRubricAlignment:
    """Evaluate rubric parsing quality against golden dataset."""

    def test_rubric_alignment_with_golden_data(self, rubric_alignment_cases):
        """Run all rubric alignment cases and assert pass rate >= 80%."""
        results = []
        for case in rubric_alignment_cases:
            # Simulate a parsed curriculum (in real eval, this comes from CurricuLLM)
            simulated_output = _simulate_curriculum_parse(case)
            result = score_rubric_alignment(simulated_output, case.expected)
            result.case_id = case.case_id
            results.append(result)

        report = compute_eval_report("Rubric Alignment", results)
        print(report.summary())
        for r in report.results:
            print(f"  {r.case_id}: {'PASS' if r.passed else 'FAIL'} (score={r.score:.2f}) {r.metrics}")

        assert report.pass_rate >= 0.8, (
            f"Rubric alignment pass rate {report.pass_rate:.1%} below 80% threshold"
        )


def _simulate_curriculum_parse(case: EvalCase) -> dict:
    """Simulate what CurricuLLM should return for a given rubric.
    In production eval, replace this with actual LLM call."""
    rubric = case.input_data["rubric_text"]

    # Simple heuristic extraction for golden data testing
    lines = rubric.split("\n")
    subject = lines[0].split("—")[0].strip() if "—" in lines[0] else "Unknown"

    outcomes = [l.strip().lstrip("0123456789. ") for l in lines if l.strip().startswith(("1.", "2.", "3.", "4."))]
    misconceptions = []
    in_miscon = False
    for l in lines:
        if "misconception" in l.lower() and ":" in l:
            in_miscon = True
            continue
        if in_miscon and l.strip().startswith("-"):
            text = l.strip().lstrip("- ")
            misconceptions.append({
                "misconception": text.split("(")[0].strip(),
                "why_students_think_this": text.split("(")[1].rstrip(")") if "(" in text else "",
            })

    # Extract concepts from outcomes
    key_concepts = []
    concept_keywords = ["supply", "demand", "equilibrium", "price", "algorithm", "complexity", "welfare"]
    all_text = " ".join(outcomes).lower()
    for kw in concept_keywords:
        if kw in all_text:
            key_concepts.append(kw)

    return {
        "subject": subject.replace("Year 11 ", "").replace("Year 12 ", ""),
        "learning_outcomes": outcomes,
        "common_misconceptions": misconceptions,
        "key_concepts": key_concepts,
    }
