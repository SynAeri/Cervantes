# Integration test fixtures — provides mock auth dependencies and async HTTP client

import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport


@pytest.fixture
def mock_professor_user():
    """Simulates an authenticated professor user."""
    return {"uid": "prof_001", "email": "prof@test.com", "role": "professor"}


@pytest.fixture
def mock_student_user():
    """Simulates an authenticated student user."""
    return {"uid": "stu_001", "email": "student@test.com", "role": "student"}


@pytest.fixture
def override_auth_professor(test_app, mock_professor_user):
    """Override auth dependency to return a professor without Firebase."""
    from app.backend.core.auth import get_current_user, require_professor

    test_app.dependency_overrides[get_current_user] = lambda: mock_professor_user
    test_app.dependency_overrides[require_professor] = lambda: mock_professor_user
    yield
    test_app.dependency_overrides.clear()


@pytest.fixture
def override_auth_student(test_app, mock_student_user):
    """Override auth dependency to return a student without Firebase."""
    from app.backend.core.auth import get_current_user, require_student

    test_app.dependency_overrides[get_current_user] = lambda: mock_student_user
    test_app.dependency_overrides[require_student] = lambda: mock_student_user
    yield
    test_app.dependency_overrides.clear()


@pytest.fixture
def override_firestore(test_app, mock_db):
    """Override Firestore dependency with in-memory mock."""
    from app.backend.core.firebase import get_firestore_db

    test_app.dependency_overrides[get_firestore_db] = lambda: mock_db
    yield mock_db
    test_app.dependency_overrides.clear()


@pytest.fixture
async def async_client(test_app):
    """Async HTTP client for testing async endpoints."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
