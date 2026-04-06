# Integration tests for health and root endpoints

import pytest


@pytest.mark.integration
class TestHealthEndpoints:
    """Tests for public health/root endpoints (no auth required)."""

    def test_root_returns_api_info(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Cervantes API"
        assert data["version"] == "3.0.0"
        assert "features" in data
        assert "arc" in data["features"]
        assert "dialogue" in data["features"]

    def test_root_shows_stack(self, client):
        data = client.get("/").json()
        assert "stack" in data
        assert data["stack"]["llm"] == "Gemini 2.5 Flash (google-genai SDK)"
        assert data["stack"]["database"] == "Firestore"

    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}
