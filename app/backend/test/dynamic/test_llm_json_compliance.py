# Dynamic tests — validate that LLM outputs conform to expected Pydantic schemas
# These tests use golden outputs (simulated LLM responses) to verify schema compliance.
# When run with @requires_llm marker, they can also test against a live LLM.

import pytest
from pydantic import ValidationError
from app.backend.features.arc.schemas import NarrativeArc, CurriculumData, SceneData
from app.backend.features.dialogue.schemas import DialogueTurnResponse
from app.backend.features.signal_extraction.schemas import SignalExtractionResult


@pytest.mark.dynamic
class TestArcOutputSchemaCompliance:
    """Verify arc generation output matches NarrativeArc schema."""

    def test_golden_arc_parses_to_schema(self, golden_arc_output):
        arc = NarrativeArc(**golden_arc_output)
        assert arc.arc_name == "The Equilibrium Enigma"
        assert arc.total_scenes == 3
        assert len(arc.scenes) == 3

    def test_golden_arc_scene_types(self, golden_arc_output):
        arc = NarrativeArc(**golden_arc_output)
        assert arc.scenes[0].scene_type == "bridge"
        assert arc.scenes[1].scene_type == "deep"
        assert arc.scenes[2].scene_type == "deep"

    def test_golden_arc_scene_ordering(self, golden_arc_output):
        arc = NarrativeArc(**golden_arc_output)
        orders = [s.scene_order for s in arc.scenes]
        assert orders == sorted(orders), "Scenes must be in ascending order"

    def test_golden_arc_deep_scenes_have_misconceptions(self, golden_arc_output):
        arc = NarrativeArc(**golden_arc_output)
        for scene in arc.scenes:
            if scene.scene_type == "deep":
                assert scene.misconception_target is not None, (
                    f"Deep scene {scene.scene_id} missing misconception_target"
                )

    def test_golden_arc_bridge_scenes_no_misconceptions(self, golden_arc_output):
        arc = NarrativeArc(**golden_arc_output)
        for scene in arc.scenes:
            if scene.scene_type == "bridge":
                assert scene.misconception_target is None, (
                    f"Bridge scene {scene.scene_id} should not have misconception_target"
                )

    def test_golden_arc_positions_valid(self, golden_arc_output):
        arc = NarrativeArc(**golden_arc_output)
        valid_positions = {"opening", "mid", "climax", "resolution"}
        for scene in arc.scenes:
            assert scene.arc_position in valid_positions, (
                f"Invalid arc_position '{scene.arc_position}' in {scene.scene_id}"
            )

    def test_arc_missing_required_field_fails(self, golden_arc_output):
        del golden_arc_output["arc_name"]
        with pytest.raises(ValidationError):
            NarrativeArc(**golden_arc_output)

    def test_scene_missing_concept_target_fails(self, golden_arc_output):
        del golden_arc_output["scenes"][0]["concept_target"]
        with pytest.raises(ValidationError):
            NarrativeArc(**golden_arc_output)


@pytest.mark.dynamic
class TestDialogueOutputSchemaCompliance:
    """Verify dialogue turn output matches DialogueTurnResponse schema."""

    def test_golden_dialogue_parses(self, golden_dialogue_output):
        resp = DialogueTurnResponse(**golden_dialogue_output)
        assert resp.emotion_tag == "challenging"
        assert resp.should_end_scene is False

    def test_dialogue_has_reasoning_assessment(self, golden_dialogue_output):
        resp = DialogueTurnResponse(**golden_dialogue_output)
        assert "quality" in resp.reasoning_assessment
        assert resp.reasoning_assessment["quality"] in ("strong", "partial", "weak")

    def test_dialogue_character_dialogue_not_empty(self, golden_dialogue_output):
        resp = DialogueTurnResponse(**golden_dialogue_output)
        assert len(resp.character_dialogue) > 0

    def test_dialogue_contains_emotion_tag_in_text(self, golden_dialogue_output):
        """Character dialogue should start with *emotion_tag* formatting."""
        resp = DialogueTurnResponse(**golden_dialogue_output)
        assert resp.character_dialogue.startswith("*"), (
            "Dialogue should start with *emotion_tag* VN formatting"
        )


@pytest.mark.dynamic
class TestSignalExtractionSchemaCompliance:
    """Verify signal extraction output matches SignalExtractionResult schema."""

    def test_golden_extraction_parses(self, golden_signal_extraction_output):
        result = SignalExtractionResult(**golden_signal_extraction_output)
        assert result.status == "revised_with_scaffolding"

    def test_extraction_status_values(self, golden_signal_extraction_output):
        result = SignalExtractionResult(**golden_signal_extraction_output)
        valid_statuses = {"mastery", "revised_with_scaffolding", "critical_gap"}
        assert result.status in valid_statuses

    def test_extraction_has_initial_response(self, golden_signal_extraction_output):
        result = SignalExtractionResult(**golden_signal_extraction_output)
        assert result.initial_response.type in ("freeform", "multi_choice")
        assert len(result.initial_response.selected) > 0

    def test_extraction_pushback_sequence_not_empty(self, golden_signal_extraction_output):
        result = SignalExtractionResult(**golden_signal_extraction_output)
        assert len(result.pushback_sequence) > 0

    def test_extraction_reflection_not_empty(self, golden_signal_extraction_output):
        result = SignalExtractionResult(**golden_signal_extraction_output)
        assert len(result.reflection) > 10, "Reflection should be a meaningful sentence"
