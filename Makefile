# Cervantes Test & Evaluation Runner
# Usage: make <target> from project root

BACKEND_DIR = app/backend
PYTEST = cd $(BACKEND_DIR) && python -m pytest
PLAYWRIGHT_STUDENT = cd student-dashboard && npx playwright test
PLAYWRIGHT_TEACHER = cd teacher-dashboard && npx playwright test

# ─── Quick Commands ───────────────────────────────────────────────────────────

.PHONY: test test-all test-unit test-integration test-dynamic test-eval test-e2e
.PHONY: test-e2e-student test-e2e-teacher test-coverage lint

## Run unit tests only (fast, no external dependencies)
test-unit:
	$(PYTEST) -m unit -v

## Run integration tests (mocked Firebase + FastAPI TestClient)
test-integration:
	$(PYTEST) -m integration -v

## Run dynamic tests (LLM output schema validation)
test-dynamic:
	$(PYTEST) -m dynamic -v

## Run evaluation suite (pedagogical quality metrics)
test-eval:
	$(PYTEST) -m evaluation -v -s

## Run all backend tests (unit + integration + dynamic + evaluation)
test:
	$(PYTEST) -v

## Run E2E tests for student dashboard (requires dev server)
test-e2e-student:
	$(PLAYWRIGHT_STUDENT)

## Run E2E tests for teacher dashboard (requires dev server)
test-e2e-teacher:
	$(PLAYWRIGHT_TEACHER)

## Run all E2E tests
test-e2e: test-e2e-student test-e2e-teacher

## Run everything: backend + E2E
test-all: test test-e2e

## Run backend tests with coverage report
test-coverage:
	$(PYTEST) --cov=app.backend --cov-report=term-missing --cov-report=html:htmlcov -v

## Run only tests that require a live LLM API key
test-llm:
	$(PYTEST) -m requires_llm -v -s

## Run slow tests
test-slow:
	$(PYTEST) -m slow -v -s

# ─── CI Targets ───────────────────────────────────────────────────────────────

## CI: Run fast tests only (unit + integration + dynamic)
ci-fast:
	$(PYTEST) -m "unit or integration or dynamic" -v --tb=short

## CI: Run full suite with coverage
ci-full:
	$(PYTEST) --cov=app.backend --cov-report=xml:coverage.xml -v --tb=short

# ─── Development ──────────────────────────────────────────────────────────────

## Install test dependencies
install-test-deps:
	pip install -r $(BACKEND_DIR)/requirements.txt
	cd student-dashboard && npm install
	cd teacher-dashboard && npm install
	cd student-dashboard && npx playwright install
	cd teacher-dashboard && npx playwright install

## Show available test markers
markers:
	$(PYTEST) --markers

help:
	@echo "Cervantes Test Framework"
	@echo "========================"
	@echo ""
	@echo "Backend Tests (pytest):"
	@echo "  make test-unit          Unit tests (fast, no deps)"
	@echo "  make test-integration   Integration tests (mocked Firebase)"
	@echo "  make test-dynamic       Dynamic tests (LLM output validation)"
	@echo "  make test-eval          Evaluation suite (pedagogy metrics)"
	@echo "  make test               All backend tests"
	@echo "  make test-coverage      Backend with coverage report"
	@echo ""
	@echo "E2E Tests (Playwright):"
	@echo "  make test-e2e-student   Student dashboard E2E"
	@echo "  make test-e2e-teacher   Teacher dashboard E2E"
	@echo "  make test-e2e           All E2E tests"
	@echo ""
	@echo "Full Suite:"
	@echo "  make test-all           Backend + E2E"
	@echo "  make ci-fast            CI: unit + integration + dynamic"
	@echo "  make ci-full            CI: full suite with coverage"
	@echo ""
	@echo "Setup:"
	@echo "  make install-test-deps  Install all test dependencies"
