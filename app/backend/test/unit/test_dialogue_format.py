# Unit tests for dialogue formatting and conversation utilities

import pytest
from app.backend.features.dialogue.service import format_conversation
from app.backend.features.dialogue.schemas import ConversationTurn


@pytest.mark.unit
class TestFormatConversation:
    """Tests for format_conversation utility."""

    def test_formats_student_turn(self):
        turns = [ConversationTurn(role="student", content="I think supply equals demand.", timestamp="t1")]
        result = format_conversation(turns)
        assert result == "Student: I think supply equals demand."

    def test_formats_character_turn(self):
        turns = [ConversationTurn(role="character", content="Are you sure?", character_id="marcus_01", timestamp="t1")]
        result = format_conversation(turns)
        assert result == "marcus_01: Are you sure?"

    def test_formats_narration_turn(self):
        turns = [ConversationTurn(role="narration", content="The room falls silent.", timestamp="t1")]
        result = format_conversation(turns)
        assert result == "[Narration] The room falls silent."

    def test_formats_mixed_conversation(self):
        turns = [
            ConversationTurn(role="narration", content="You enter the room.", timestamp="t1"),
            ConversationTurn(role="character", content="Hey!", character_id="elena", timestamp="t2"),
            ConversationTurn(role="student", content="Hello.", timestamp="t3"),
        ]
        result = format_conversation(turns)
        lines = result.split("\n")
        assert lines[0] == "[Narration] You enter the room."
        assert lines[1] == "elena: Hey!"
        assert lines[2] == "Student: Hello."

    def test_empty_history_returns_empty(self):
        assert format_conversation([]) == ""


@pytest.mark.unit
class TestConversationTurnSchema:
    """Tests for ConversationTurn Pydantic model."""

    def test_minimal_turn(self):
        turn = ConversationTurn(role="student", content="Hello", timestamp="2025-01-01T00:00:00")
        assert turn.role == "student"
        assert turn.character_id is None
        assert turn.emotion_tag is None

    def test_character_turn_with_emotion(self):
        turn = ConversationTurn(
            role="character",
            content="Interesting...",
            character_id="marcus_01",
            emotion_tag="challenging",
            timestamp="2025-01-01T00:00:00",
        )
        assert turn.emotion_tag == "challenging"
        assert turn.character_id == "marcus_01"
