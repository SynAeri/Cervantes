# Dynamic tests — validate structural constraints on generated arcs
# These test the business rules that go beyond simple schema validation

import pytest
from collections import Counter
from app.backend.features.arc.service import validate_arc_characters, validate_misconception_coverage


@pytest.mark.dynamic
class TestArcStructuralConstraints:
    """Validate business rules on arc structure using golden outputs."""

    def test_character_casting_passes_validation(self, golden_arc_output, sample_arc):
        """The sample arc (with characters) should pass validation."""
        errors = validate_arc_characters(sample_arc)
        assert len(errors) == 0, f"Validation errors: {errors}"

    def test_misconception_coverage_complete(self, sample_arc, sample_curriculum_data):
        """All curriculum misconceptions should be covered by arc scenes."""
        errors = validate_misconception_coverage(sample_arc, sample_curriculum_data)
        assert len(errors) == 0, f"Uncovered misconceptions: {errors}"

    def test_scene_count_within_bounds(self, golden_arc_output):
        """Arc should have between 3 and 6 scenes."""
        total = golden_arc_output["total_scenes"]
        actual = len(golden_arc_output["scenes"])
        assert total == actual, "total_scenes must match actual scene count"
        assert 3 <= total <= 6, f"Arc has {total} scenes, expected 3-6"

    def test_first_scene_is_bridge(self, golden_arc_output):
        """First scene should always be a bridge scene."""
        first = golden_arc_output["scenes"][0]
        assert first["scene_type"] == "bridge"
        assert first["arc_position"] == "opening"

    def test_deep_scenes_have_socratic_angles(self, golden_arc_output):
        """Deep scenes should have at least one Socratic angle."""
        for scene in golden_arc_output["scenes"]:
            if scene["scene_type"] == "deep":
                assert len(scene.get("socratic_angles", [])) > 0, (
                    f"Deep scene {scene['scene_id']} has no socratic_angles"
                )

    def test_unique_settings(self, golden_arc_output):
        """Scenes should ideally have varied settings (warn if all same)."""
        settings = [s["setting"] for s in golden_arc_output["scenes"]]
        unique_settings = set(settings)
        # Not a hard fail, but a quality signal
        assert len(unique_settings) >= 2, (
            f"All {len(settings)} scenes share the same setting: {settings[0]}"
        )

    def test_arc_position_progression(self, golden_arc_output):
        """Arc positions should follow a logical progression."""
        positions = [s["arc_position"] for s in golden_arc_output["scenes"]]
        assert positions[0] == "opening", "First scene must be 'opening'"
        # Last should be either 'climax' or 'resolution'
        assert positions[-1] in ("climax", "resolution"), (
            f"Last scene should be 'climax' or 'resolution', got '{positions[-1]}'"
        )


@pytest.mark.dynamic
class TestDialogueStructuralConstraints:
    """Validate structural rules on dialogue responses."""

    def test_dialogue_not_too_long(self, golden_dialogue_output):
        """Character dialogue should not exceed reasonable length."""
        dialogue = golden_dialogue_output["character_dialogue"]
        word_count = len(dialogue.split())
        assert word_count <= 200, f"Dialogue too long: {word_count} words (max 200)"

    def test_dialogue_not_too_short(self, golden_dialogue_output):
        """Character dialogue should be substantive."""
        dialogue = golden_dialogue_output["character_dialogue"]
        word_count = len(dialogue.split())
        assert word_count >= 10, f"Dialogue too short: {word_count} words (min 10)"

    def test_reasoning_quality_is_valid(self, golden_dialogue_output):
        """Reasoning assessment quality must be strong/partial/weak."""
        quality = golden_dialogue_output["reasoning_assessment"]["quality"]
        assert quality in ("strong", "partial", "weak")
