# Unit tests for Pydantic schema validation across all features

import pytest
from pydantic import ValidationError
from app.backend.features.arc.schemas import (
    CurriculumData,
    CharacterProfile,
    SceneData,
    NarrativeArc,
    ArcCreateRequest,
    Misconception,
)
from app.backend.features.dialogue.schemas import (
    ConversationTurn,
    DialogueTurnRequest,
    DialogueTurnResponse,
)
from app.backend.features.signal_extraction.schemas import (
    InitialResponse,
    PushbackExchange,
    SignalExtractionResult,
)


@pytest.mark.unit
class TestCurriculumDataSchema:
    """Tests for CurriculumData Pydantic model."""

    def test_valid_curriculum(self, sample_curriculum_data):
        data = CurriculumData(**sample_curriculum_data)
        assert data.subject == "Economics"
        assert len(data.common_misconceptions) == 2

    def test_missing_required_field(self, sample_curriculum_data):
        del sample_curriculum_data["subject"]
        with pytest.raises(ValidationError):
            CurriculumData(**sample_curriculum_data)

    def test_empty_misconceptions_default(self):
        data = CurriculumData(
            subject="Math",
            module="Algebra",
            year_level="Year 10",
            assessment_type="formative",
            learning_outcomes=["Solve linear equations"],
            key_concepts=["variables"],
            difficulty_level="intermediate",
        )
        assert data.common_misconceptions == []

    def test_optional_prep_window(self, sample_curriculum_data):
        del sample_curriculum_data["prep_window_days"]
        data = CurriculumData(**sample_curriculum_data)
        assert data.prep_window_days is None


@pytest.mark.unit
class TestCharacterProfileSchema:

    def test_valid_character(self):
        char = CharacterProfile(
            id="char_001",
            name="Elena",
            role="economics club president",
            personality_prompt="Sharp, analytical, direct",
            voice_register="formal_casual",
            archetype="sharp_mentor",
            sprite_set=["neutral", "encouraging", "challenging"],
        )
        assert char.name == "Elena"
        assert len(char.sprite_set) == 3

    def test_missing_required_field(self):
        with pytest.raises(ValidationError):
            CharacterProfile(id="char_001", name="Elena")  # missing role, personality_prompt, etc.


@pytest.mark.unit
class TestDialogueTurnResponseSchema:

    def test_valid_response(self):
        resp = DialogueTurnResponse(
            character_dialogue="*challenging* Really? What about opportunity cost?",
            emotion_tag="challenging",
            should_end_scene=False,
            reasoning_assessment={"quality": "partial", "misconception_detected": "confuses cost with price"},
        )
        assert resp.should_end_scene is False
        assert resp.reasoning_assessment["quality"] == "partial"

    def test_end_scene_response(self):
        resp = DialogueTurnResponse(
            character_dialogue="*encouraging* That's exactly right!",
            emotion_tag="encouraging",
            should_end_scene=True,
            reasoning_assessment={"quality": "strong", "misconception_detected": "null"},
        )
        assert resp.should_end_scene is True


@pytest.mark.unit
class TestSignalExtractionResultSchema:

    def test_valid_result(self, sample_signal_extraction_result):
        result = SignalExtractionResult(**sample_signal_extraction_result)
        assert result.status == "revised_with_scaffolding"
        assert result.scaffolding_needed is True
        assert len(result.pushback_sequence) == 1

    def test_invalid_status_allowed(self):
        """Status is a plain str, not an enum — any string is accepted."""
        data = {
            "scene_id": "s1",
            "scene_type": "deep",
            "concept": "test",
            "character": "c1",
            "initial_response": {"type": "freeform", "selected": "answer"},
            "pushback_sequence": [],
            "revised_understanding": None,
            "rubric_alignment": {},
            "reflection": "none",
            "status": "unknown_status",
            "scaffolding_needed": False,
        }
        result = SignalExtractionResult(**data)
        assert result.status == "unknown_status"


@pytest.mark.unit
class TestArcCreateRequestSchema:

    def test_minimal_request(self):
        req = ArcCreateRequest(
            class_id="ECON101",
            rubric_text="Assessment rubric content here",
            professor_id="prof_001",
        )
        assert req.student_id is None
        assert req.student_subjects is None

    def test_full_request(self):
        req = ArcCreateRequest(
            class_id="ECON101",
            rubric_text="Assessment rubric content here",
            professor_id="prof_001",
            student_id="stu_001",
            student_subjects=["Economics", "Mathematics"],
            student_extracurriculars=["Debate Club"],
        )
        assert len(req.student_subjects) == 2
