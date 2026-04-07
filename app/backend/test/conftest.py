# Shared test fixtures for the Cervantes backend test suite
# Provides mock Firestore, mock LLM client, sample data factories, and FastAPI TestClient

import os

# Set test environment variables BEFORE any app imports
# This prevents llm_client from failing at module-level client creation
os.environ.setdefault("GEMINI_API_KEY", "test-dummy-key-for-pytest")
os.environ.setdefault("CURRICULLM_API_KEY", "test-dummy-key-for-pytest")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cervantes")

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Sample data factories
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_curriculum_data():
    """Minimal valid CurriculumData dict for testing."""
    return {
        "subject": "Economics",
        "module": "Market Equilibrium",
        "year_level": "Year 11",
        "assessment_type": "formative",
        "learning_outcomes": [
            "Explain how supply and demand determine market price",
            "Identify the effect of price controls on market outcomes",
        ],
        "common_misconceptions": [
            {
                "misconception": "Supply always equals demand",
                "why_students_think_this": "Confusion between equilibrium condition and identity",
                "exposing_scenario": "Show a market with price floor above equilibrium",
            },
            {
                "misconception": "Price ceilings help all consumers",
                "why_students_think_this": "Ignoring shortage and deadweight loss effects",
                "exposing_scenario": "Rent control scenario with waiting lists",
            },
        ],
        "key_concepts": ["supply and demand", "price controls"],
        "prep_window_days": 14,
        "difficulty_level": "intermediate",
    }


@pytest.fixture
def sample_arc():
    """Minimal valid arc dict with 3 scenes."""
    return {
        "arc_name": "The Market Mystery",
        "total_scenes": 3,
        "scenes": [
            {
                "scene_id": "scene_1",
                "scene_order": 1,
                "scene_type": "bridge",
                "concept_target": "supply and demand",
                "misconception_target": None,
                "learning_outcome": "Understand basic market forces",
                "arc_position": "opening",
                "setting": "University cafe",
                "character": {
                    "name": "Elena",
                    "archetype": "frustrated_peer",
                    "role": "economics club president",
                },
                "socratic_angles": [],
            },
            {
                "scene_id": "scene_2",
                "scene_order": 2,
                "scene_type": "deep",
                "concept_target": "market equilibrium",
                "misconception_target": "Supply always equals demand",
                "learning_outcome": "Distinguish equilibrium from identity",
                "arc_position": "mid",
                "setting": "Workshop room",
                "character": {
                    "name": "Marcus",
                    "archetype": "sharp_mentor",
                    "role": "research assistant",
                },
                "socratic_angles": ["What happens when price is above equilibrium?"],
            },
            {
                "scene_id": "scene_3",
                "scene_order": 3,
                "scene_type": "deep",
                "concept_target": "price controls",
                "misconception_target": "Price ceilings help all consumers",
                "learning_outcome": "Analyse price ceiling effects",
                "arc_position": "climax",
                "setting": "Student council office",
                "character": {
                    "name": "Sasha",
                    "archetype": "quiet_analyst",
                    "role": "debate captain",
                },
                "socratic_angles": ["Who wins and who loses under rent control?"],
            },
        ],
    }


@pytest.fixture
def sample_conversation_history():
    """Sample conversation turns for dialogue testing."""
    return [
        {
            "role": "narration",
            "content": "You enter the workshop room where Marcus is reviewing data.",
            "character_id": None,
            "emotion_tag": None,
            "timestamp": "2025-01-01T10:00:00",
        },
        {
            "role": "character",
            "content": "Hey, can you help me understand this chart?",
            "character_id": "marcus_01",
            "emotion_tag": "neutral",
            "timestamp": "2025-01-01T10:00:05",
        },
        {
            "role": "student",
            "content": "Sure, it looks like supply equals demand here.",
            "character_id": None,
            "emotion_tag": None,
            "timestamp": "2025-01-01T10:00:30",
        },
    ]


@pytest.fixture
def sample_signal_extraction_result():
    """Sample signal extraction result."""
    return {
        "scene_id": "scene_2",
        "scene_type": "deep",
        "concept": "market equilibrium",
        "character": "marcus_01",
        "initial_response": {
            "type": "freeform",
            "selected": "Supply equals demand at any price",
            "misconception_exposed": "Supply always equals demand",
        },
        "pushback_sequence": [
            {
                "pushback": "But what if the government sets a minimum wage above equilibrium?",
                "student_response_type": "freeform",
                "student_response": "Then there would be more supply of labor than demand",
            }
        ],
        "revised_understanding": "Equilibrium is a specific price point, not an identity",
        "rubric_alignment": {
            "Explain how supply and demand determine market price": "demonstrated",
        },
        "reflection": "Student initially held common misconception but revised after scaffolding",
        "status": "revised_with_scaffolding",
        "scaffolding_needed": True,
    }


# ---------------------------------------------------------------------------
# Mock Firestore
# ---------------------------------------------------------------------------

class MockDocumentSnapshot:
    """Simulates a Firestore document snapshot."""

    def __init__(self, data: dict | None, exists: bool = True):
        self._data = data
        self.exists = exists

    def to_dict(self):
        return self._data


class MockDocumentReference:
    """Simulates a Firestore document reference."""

    def __init__(self, data: dict | None = None):
        self._data = data

    async def get(self):
        return MockDocumentSnapshot(self._data, exists=self._data is not None)

    async def set(self, data):
        self._data = data

    async def update(self, data):
        if self._data:
            self._data.update(data)


class MockCollectionReference:
    """Simulates a Firestore collection reference."""

    def __init__(self):
        self._documents: dict[str, MockDocumentReference] = {}

    def document(self, doc_id: str) -> MockDocumentReference:
        if doc_id not in self._documents:
            self._documents[doc_id] = MockDocumentReference()
        return self._documents[doc_id]

    def add_document(self, doc_id: str, data: dict):
        self._documents[doc_id] = MockDocumentReference(data)


class MockFirestoreDB:
    """In-memory Firestore mock for integration/dynamic tests."""

    def __init__(self):
        self._collections: dict[str, MockCollectionReference] = {}

    def collection(self, name: str) -> MockCollectionReference:
        if name not in self._collections:
            self._collections[name] = MockCollectionReference()
        return self._collections[name]

    def seed(self, collection: str, doc_id: str, data: dict):
        """Convenience: seed a document into a collection."""
        self.collection(collection).add_document(doc_id, data)


@pytest.fixture
def mock_db():
    """Provides a fresh in-memory Firestore mock."""
    return MockFirestoreDB()


# ---------------------------------------------------------------------------
# Mock LLM client
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_llm_response():
    """Factory fixture: returns a function that patches llm_client to return a given dict."""

    def _mock(return_value: dict | str):
        mock = AsyncMock(return_value=return_value)
        return patch("app.backend.core.llm_client.generate_with_retry", mock)

    return _mock


# ---------------------------------------------------------------------------
# FastAPI TestClient (with mocked Firebase)
# ---------------------------------------------------------------------------

@pytest.fixture
def test_app():
    """FastAPI app with Firebase init patched out."""
    with patch("app.backend.core.firebase.init_firebase"):
        from app.backend.main import app
        return app


@pytest.fixture
def client(test_app):
    """Synchronous TestClient for the FastAPI app."""
    return TestClient(test_app)
