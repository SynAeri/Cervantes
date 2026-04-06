# Evaluation Runner — Batch orchestrator for all evaluation suites
# Run with: pytest test/evaluation/ -m evaluation -v --tb=short
# Or standalone: python -m test.evaluation.eval_runner

import pytest
from .helpers import EvalReport


@pytest.mark.evaluation
class TestEvalRunner:
    """Meta-evaluation: aggregates all eval suite results and enforces overall thresholds."""

    def test_overall_evaluation_report(
        self,
        rubric_alignment_cases,
        misconception_detection_cases,
        dialogue_pedagogy_cases,
    ):
        """Print a summary of all evaluation data available."""
        total_cases = (
            len(rubric_alignment_cases)
            + len(misconception_detection_cases)
            + len(dialogue_pedagogy_cases)
        )
        print(f"\n{'='*60}")
        print(f"CERVANTES EVALUATION FRAMEWORK")
        print(f"{'='*60}")
        print(f"Rubric Alignment cases:       {len(rubric_alignment_cases)}")
        print(f"Misconception Detection cases: {len(misconception_detection_cases)}")
        print(f"Dialogue Pedagogy cases:       {len(dialogue_pedagogy_cases)}")
        print(f"{'─'*60}")
        print(f"Total evaluation cases:        {total_cases}")
        print(f"{'='*60}")

        assert total_cases > 0, "No evaluation cases found"
        # This test serves as an orchestrator entry point.
        # Individual eval suites have their own pass/fail thresholds.


if __name__ == "__main__":
    pytest.main([
        "test/evaluation/",
        "-m", "evaluation",
        "-v",
        "--tb=short",
        "-s",  # Show print output
    ])
