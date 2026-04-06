# Integration tests for the dialogue turn API

import pytest
from unittest.mock import patch, AsyncMock
from app.backend.features.dialogue.schemas import DialogueTurnResponse


@pytest.mark.integration
class TestDialogueTurnEndpoint:
    """Tests for POST /api/dialogue/turn."""

    def test_dialogue_requires_auth(self, client):
        response = client.post("/api/dialogue/turn", json={
            "scene_id": "scene_1",
            "student_id": "stu_001",
            "student_response": "I think supply equals demand.",
            "conversation_history": [],
        })
        assert response.status_code in (401, 403)

    def test_dialogue_with_mocked_service(
        self, client, override_auth_student, override_firestore, mock_db
    ):
        """Authenticated student can submit a dialogue turn."""
        # Seed mock Firestore with a scene document
        mock_db.seed("scenes", "scene_1", {
            "scene_id": "scene_1",
            "character_id": "elena_01",
            "concept_target": "supply and demand",
            "misconception_target": "Supply always equals demand",
            "setup_narration": "You enter the economics workshop.",
            "scene_type": "deep",
        })

        mock_response = DialogueTurnResponse(
            character_dialogue="*challenging* Really? What happens when there's a price floor?",
            emotion_tag="challenging",
            should_end_scene=False,
            reasoning_assessment={"quality": "partial", "misconception_detected": "equilibrium identity confusion"},
        )

        with patch(
            "app.backend.features.dialogue.service.generate_dialogue_turn",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            response = client.post("/api/dialogue/turn", json={
                "scene_id": "scene_1",
                "student_id": "stu_001",
                "student_response": "Supply always equals demand at any price.",
                "conversation_history": [
                    {
                        "role": "narration",
                        "content": "You enter the workshop.",
                        "timestamp": "2025-01-01T10:00:00",
                    }
                ],
            })
            assert response.status_code == 200
            data = response.json()
            assert "character_dialogue" in data
            assert data["should_end_scene"] is False
