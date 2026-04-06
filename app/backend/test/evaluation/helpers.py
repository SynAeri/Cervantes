# Evaluation helpers — shared data classes and scoring utilities

from dataclasses import dataclass, field


@dataclass
class EvalCase:
    """A single evaluation test case with input, expected output, and metadata."""
    case_id: str
    description: str
    input_data: dict
    expected: dict
    tags: list[str] = field(default_factory=list)


@dataclass
class EvalResult:
    """Result of evaluating a single case."""
    case_id: str
    passed: bool
    score: float  # 0.0 to 1.0
    metrics: dict
    notes: str = ""


@dataclass
class EvalReport:
    """Aggregated evaluation report."""
    suite_name: str
    total_cases: int
    passed: int
    failed: int
    avg_score: float
    results: list[EvalResult]

    @property
    def pass_rate(self) -> float:
        return self.passed / self.total_cases if self.total_cases > 0 else 0.0

    def summary(self) -> str:
        return (
            f"=== {self.suite_name} ===\n"
            f"Cases: {self.total_cases} | Passed: {self.passed} | Failed: {self.failed}\n"
            f"Pass Rate: {self.pass_rate:.1%} | Avg Score: {self.avg_score:.2f}\n"
        )


def compute_eval_report(suite_name: str, results: list[EvalResult]) -> EvalReport:
    """Aggregate individual eval results into a report."""
    passed = sum(1 for r in results if r.passed)
    failed = len(results) - passed
    avg_score = sum(r.score for r in results) / len(results) if results else 0.0
    return EvalReport(
        suite_name=suite_name,
        total_cases=len(results),
        passed=passed,
        failed=failed,
        avg_score=avg_score,
        results=results,
    )
