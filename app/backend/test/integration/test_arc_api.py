# Integration tests for the arc generation API endpoints

import pytest
from unittest.mock import patch, AsyncMock


@pytest.mark.integration
class TestArcGenerateEndpoint:
    """Tests for POST /api/arc/generate."""

    def test_generate_requires_auth(self, client):
        """Unauthenticated request should be rejected."""
        response = client.post("/api/arc/generate", json={
            "class_id": "ECON101",
            "rubric_text": "Test rubric",
            "professor_id": "prof_001",
        })
        # Without auth token, should get 401 or 403
        assert response.status_code in (401, 403)

    def test_generate_with_auth_and_mocked_service(
        self, client, override_auth_professor, override_firestore
    ):
        """Authenticated professor can call generate (service mocked)."""
        mock_result = {
            "arc_id": "test-arc-id",
            "class_id": "ECON101",
            "curriculum_data": {"subject": "Economics"},
            "narrative_arc": {"arc_name": "Test Arc", "total_scenes": 3, "scenes": []},
            "status": "draft",
        }
        with patch("app.backend.features.arc.service.generate_arc", new_callable=AsyncMock, return_value=mock_result):
            response = client.post("/api/arc/generate", json={
                "class_id": "ECON101",
                "rubric_text": "Year 11 Economics rubric about market equilibrium",
                "professor_id": "prof_001",
            })
            assert response.status_code == 200
            data = response.json()
            assert data["arc_id"] == "test-arc-id"
            assert data["status"] == "draft"

    def test_generate_returns_500_on_service_error(
        self, client, override_auth_professor, override_firestore
    ):
        """Service exception should return 500."""
        with patch(
            "app.backend.features.arc.service.generate_arc",
            new_callable=AsyncMock,
            side_effect=Exception("LLM API down"),
        ):
            response = client.post("/api/arc/generate", json={
                "class_id": "ECON101",
                "rubric_text": "rubric text",
                "professor_id": "prof_001",
            })
            assert response.status_code == 500
            assert "Arc generation failed" in response.json()["detail"]


@pytest.mark.integration
class TestArcListEndpoint:
    """Tests for GET /api/arc/class/{class_id}."""

    def test_get_arcs_requires_auth(self, client):
        response = client.get("/api/arc/class/ECON101")
        assert response.status_code in (401, 403)


@pytest.mark.integration
class TestRubricUploadEndpoint:
    """Tests for POST /api/arc/upload-rubric."""

    def test_upload_txt_file(self, client, override_auth_professor):
        """Upload a .txt rubric file and get text extraction."""
        content = b"This is a test rubric for Year 11 Economics."
        response = client.post(
            "/api/arc/upload-rubric",
            files={"file": ("rubric.txt", content, "text/plain")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "rubric.txt"
        assert "test rubric" in data["text"]
        assert data["char_count"] > 0

    def test_upload_unsupported_type(self, client, override_auth_professor):
        """Uploading an unsupported file type should fail."""
        response = client.post(
            "/api/arc/upload-rubric",
            files={"file": ("malware.exe", b"bad content", "application/octet-stream")},
        )
        assert response.status_code == 400
