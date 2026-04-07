# Unit tests for arc generation validation logic
# Tests character casting rules, misconception coverage, and arc structure validation

import pytest
from app.backend.features.arc.service import (
    validate_arc_characters,
    validate_misconception_coverage,
)


@pytest.mark.unit
class TestCharacterValidation:
    """Tests for character casting validation rules."""

    def test_unique_names_pass(self, sample_arc):
        errors = validate_arc_characters(sample_arc)
        duplicate_errors = [e for e in errors if "Duplicate" in e]
        assert len(duplicate_errors) == 0

    def test_duplicate_names_rejected(self):
        arc = {
            "scenes": [
                {"scene_id": "s1", "character": {"name": "Elena", "archetype": "sharp_mentor", "role": "mentor"}},
                {"scene_id": "s2", "character": {"name": "Marcus", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "s3", "character": {"name": "Elena", "archetype": "quiet_analyst", "role": "analyst"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert any("Duplicate character name" in e and "Elena" in e for e in errors)

    def test_archetype_overuse_rejected(self):
        arc = {
            "scenes": [
                {"scene_id": "s1", "character": {"name": "A", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "s2", "character": {"name": "B", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "s3", "character": {"name": "C", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "s4", "character": {"name": "D", "archetype": "sharp_mentor", "role": "mentor"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert any("frustrated_peer" in e and "used 3 times" in e for e in errors)

    def test_archetype_used_twice_acceptable(self):
        arc = {
            "scenes": [
                {"scene_id": "s1", "character": {"name": "A", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "s2", "character": {"name": "B", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "s3", "character": {"name": "C", "archetype": "sharp_mentor", "role": "mentor"}},
                {"scene_id": "s4", "character": {"name": "D", "archetype": "quiet_analyst", "role": "analyst"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert not any("used 3 times" in e for e in errors)

    @pytest.mark.parametrize("forbidden_role", [
        "professor of economics",
        "teacher",
        "senior lecturer",
        "tutor",
        "instructor",
        "teaching assistant",
    ])
    def test_forbidden_roles_rejected(self, forbidden_role):
        arc = {
            "scenes": [
                {"scene_id": "s1", "character": {"name": "Dr. Smith", "archetype": "sharp_mentor", "role": forbidden_role}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert any("Forbidden role" in e for e in errors), f"Role '{forbidden_role}' should be forbidden"

    @pytest.mark.parametrize("allowed_role", [
        "economics club president",
        "student mentor",
        "research assistant",
        "library assistant",
        "debate captain",
    ])
    def test_allowed_roles_pass(self, allowed_role):
        arc = {
            "scenes": [
                {"scene_id": "s1", "character": {"name": "Elena", "archetype": "sharp_mentor", "role": allowed_role}},
                {"scene_id": "s2", "character": {"name": "Marcus", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "s3", "character": {"name": "Sasha", "archetype": "quiet_analyst", "role": "analyst"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert not any("Forbidden role" in e for e in errors)

    def test_minimum_distinct_archetypes(self):
        arc = {
            "scenes": [
                {"scene_id": "s1", "character": {"name": "A", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "s2", "character": {"name": "B", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "s3", "character": {"name": "C", "archetype": "overconfident_beginner", "role": "peer"}},
                {"scene_id": "s4", "character": {"name": "D", "archetype": "frustrated_peer", "role": "peer"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert any("Only 2 distinct archetype" in e for e in errors)

    def test_requires_non_peer_archetype(self):
        arc = {
            "scenes": [
                {"scene_id": "s1", "character": {"name": "A", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "s2", "character": {"name": "B", "archetype": "overconfident_beginner", "role": "peer"}},
                {"scene_id": "s3", "character": {"name": "C", "archetype": "frustrated_peer", "role": "peer"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert any("No mentor or analyst archetype" in e for e in errors)

    def test_empty_arc_returns_error(self):
        errors = validate_arc_characters({"scenes": []})
        assert any("Arc has no scenes" in e for e in errors)

    def test_missing_name_returns_error(self):
        arc = {"scenes": [{"scene_id": "s1", "character": {"archetype": "sharp_mentor", "role": "mentor"}}]}
        errors = validate_arc_characters(arc)
        assert any("Missing character name" in e for e in errors)

    def test_missing_archetype_returns_error(self):
        arc = {"scenes": [{"scene_id": "s1", "character": {"name": "Elena", "role": "mentor"}}]}
        errors = validate_arc_characters(arc)
        assert any("Missing archetype" in e for e in errors)


@pytest.mark.unit
class TestMisconceptionCoverage:
    """Tests for misconception coverage validation."""

    def test_all_assigned_passes(self, sample_arc, sample_curriculum_data):
        errors = validate_misconception_coverage(sample_arc, sample_curriculum_data)
        assert len(errors) == 0

    def test_unassigned_reported(self, sample_curriculum_data):
        arc = {"scenes": [{"scene_id": "s1", "misconception_target": "Supply always equals demand"}]}
        errors = validate_misconception_coverage(arc, sample_curriculum_data)
        assert len(errors) == 1
        assert any("Price ceilings help all consumers" in e for e in errors)

    def test_empty_curriculum_passes(self):
        errors = validate_misconception_coverage({"scenes": []}, {"common_misconceptions": []})
        assert len(errors) == 0

    def test_none_assigned_reports_all(self):
        curriculum = {
            "common_misconceptions": [
                {"misconception": "Misconception A"},
                {"misconception": "Misconception B"},
            ]
        }
        arc = {"scenes": [{"scene_id": "s1", "misconception_target": None}, {"scene_id": "s2"}]}
        errors = validate_misconception_coverage(arc, curriculum)
        assert len(errors) == 2
