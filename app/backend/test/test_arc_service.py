# Unit tests for arc generation validation logic
# Tests character casting rules, misconception coverage, and arc structure validation

import pytest
from app.backend.features.arc.service import (
    validate_arc_characters,
    validate_misconception_coverage,
)


class TestCharacterValidation:
    """Tests for character casting validation rules"""

    def test_validate_arc_characters_no_duplicates(self):
        """Duplicate character names should be rejected"""
        arc = {
            "scenes": [
                {"scene_id": "scene_1", "character": {"name": "Elena", "archetype": "sharp_mentor", "role": "mentor"}},
                {"scene_id": "scene_2", "character": {"name": "Marcus", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "scene_3", "character": {"name": "Elena", "archetype": "quiet_analyst", "role": "analyst"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert len(errors) > 0
        assert any("Duplicate character name" in e and "Elena" in e for e in errors)

    def test_validate_arc_characters_unique_names_valid(self):
        """All unique character names should pass"""
        arc = {
            "scenes": [
                {"scene_id": "scene_1", "character": {"name": "Elena", "archetype": "sharp_mentor", "role": "mentor"}},
                {"scene_id": "scene_2", "character": {"name": "Marcus", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "scene_3", "character": {"name": "Sasha", "archetype": "quiet_analyst", "role": "analyst"}},
            ]
        }
        errors = validate_arc_characters(arc)
        duplicate_errors = [e for e in errors if "Duplicate" in e]
        assert len(duplicate_errors) == 0

    def test_validate_arc_characters_archetype_variety(self):
        """Same archetype used >2 times should be rejected"""
        arc = {
            "scenes": [
                {"scene_id": "scene_1", "character": {"name": "Alex", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "scene_2", "character": {"name": "Blake", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "scene_3", "character": {"name": "Casey", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "scene_4", "character": {"name": "Dana", "archetype": "sharp_mentor", "role": "mentor"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert len(errors) > 0
        assert any("frustrated_peer" in e and "used 3 times" in e for e in errors)

    def test_validate_arc_characters_archetype_variety_acceptable(self):
        """Using archetype twice is acceptable"""
        arc = {
            "scenes": [
                {"scene_id": "scene_1", "character": {"name": "Alex", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "scene_2", "character": {"name": "Blake", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "scene_3", "character": {"name": "Casey", "archetype": "sharp_mentor", "role": "mentor"}},
                {"scene_id": "scene_4", "character": {"name": "Dana", "archetype": "quiet_analyst", "role": "analyst"}},
            ]
        }
        errors = validate_arc_characters(arc)
        archetype_errors = [e for e in errors if "used 3 times" in e]
        assert len(archetype_errors) == 0

    def test_validate_arc_characters_forbidden_roles(self):
        """Characters with forbidden roles (teacher, professor) should be rejected"""
        forbidden_roles = [
            "professor of economics",
            "teacher",
            "senior lecturer",
            "tutor",
            "instructor",
            "teaching assistant",
        ]

        for forbidden_role in forbidden_roles:
            arc = {
                "scenes": [
                    {"scene_id": "scene_1", "character": {"name": "Dr. Smith", "archetype": "sharp_mentor", "role": forbidden_role}},
                ]
            }
            errors = validate_arc_characters(arc)
            assert len(errors) > 0, f"Role '{forbidden_role}' should be forbidden"
            assert any("Forbidden role" in e for e in errors), f"Role '{forbidden_role}' should trigger forbidden role error"

    def test_validate_arc_characters_allowed_roles(self):
        """Non-teacher roles should pass validation"""
        allowed_roles = [
            "economics club president",
            "student mentor",
            "research assistant",
            "library assistant",
            "debate captain",
        ]

        for allowed_role in allowed_roles:
            arc = {
                "scenes": [
                    {"scene_id": "scene_1", "character": {"name": "Elena", "archetype": "sharp_mentor", "role": allowed_role}},
                    {"scene_id": "scene_2", "character": {"name": "Marcus", "archetype": "frustrated_peer", "role": "peer"}},
                    {"scene_id": "scene_3", "character": {"name": "Sasha", "archetype": "quiet_analyst", "role": "analyst"}},
                ]
            }
            errors = validate_arc_characters(arc)
            forbidden_errors = [e for e in errors if "Forbidden role" in e]
            assert len(forbidden_errors) == 0, f"Role '{allowed_role}' should be allowed"

    def test_validate_arc_characters_minimum_distinct_archetypes(self):
        """Arc with 4+ scenes should have at least 3 distinct archetypes"""
        arc = {
            "scenes": [
                {"scene_id": "scene_1", "character": {"name": "Alex", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "scene_2", "character": {"name": "Blake", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "scene_3", "character": {"name": "Casey", "archetype": "overconfident_beginner", "role": "peer"}},
                {"scene_id": "scene_4", "character": {"name": "Dana", "archetype": "frustrated_peer", "role": "peer"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert len(errors) > 0
        assert any("Only 2 distinct archetype" in e for e in errors)

    def test_validate_arc_characters_requires_non_peer_archetype(self):
        """Arc with 3+ scenes needs at least one mentor or analyst"""
        arc = {
            "scenes": [
                {"scene_id": "scene_1", "character": {"name": "Alex", "archetype": "frustrated_peer", "role": "peer"}},
                {"scene_id": "scene_2", "character": {"name": "Blake", "archetype": "overconfident_beginner", "role": "peer"}},
                {"scene_id": "scene_3", "character": {"name": "Casey", "archetype": "frustrated_peer", "role": "peer"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert len(errors) > 0
        assert any("No mentor or analyst archetype" in e for e in errors)

    def test_validate_arc_characters_empty_arc(self):
        """Arc with no scenes should return error"""
        arc = {"scenes": []}
        errors = validate_arc_characters(arc)
        assert len(errors) > 0
        assert any("Arc has no scenes" in e for e in errors)

    def test_validate_arc_characters_missing_name(self):
        """Scene with missing character name should error"""
        arc = {
            "scenes": [
                {"scene_id": "scene_1", "character": {"archetype": "sharp_mentor", "role": "mentor"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert len(errors) > 0
        assert any("Missing character name" in e for e in errors)

    def test_validate_arc_characters_missing_archetype(self):
        """Scene with missing archetype should error"""
        arc = {
            "scenes": [
                {"scene_id": "scene_1", "character": {"name": "Elena", "role": "mentor"}},
            ]
        }
        errors = validate_arc_characters(arc)
        assert len(errors) > 0
        assert any("Missing archetype" in e for e in errors)


class TestMisconceptionCoverage:
    """Tests for misconception coverage validation"""

    def test_validate_misconception_coverage_all_assigned(self):
        """All misconceptions assigned to scenes should pass"""
        curriculum_data = {
            "common_misconceptions": [
                {"misconception": "Supply equals demand in equilibrium"},
                {"misconception": "Price ceiling causes shortages"},
                {"misconception": "Elasticity is always negative"},
            ]
        }
        arc = {
            "scenes": [
                {"scene_id": "scene_1", "misconception_target": "Supply equals demand in equilibrium"},
                {"scene_id": "scene_2", "misconception_target": "Price ceiling causes shortages"},
                {"scene_id": "scene_3", "misconception_target": "Elasticity is always negative"},
            ]
        }
        errors = validate_misconception_coverage(arc, curriculum_data)
        assert len(errors) == 0

    def test_validate_misconception_coverage_some_unassigned(self):
        """Unassigned misconceptions should be reported"""
        curriculum_data = {
            "common_misconceptions": [
                {"misconception": "Supply equals demand in equilibrium"},
                {"misconception": "Price ceiling causes shortages"},
                {"misconception": "Elasticity is always negative"},
            ]
        }
        arc = {
            "scenes": [
                {"scene_id": "scene_1", "misconception_target": "Supply equals demand in equilibrium"},
            ]
        }
        errors = validate_misconception_coverage(arc, curriculum_data)
        assert len(errors) == 2
        assert any("Price ceiling causes shortages" in e for e in errors)
        assert any("Elasticity is always negative" in e for e in errors)

    def test_validate_misconception_coverage_no_curriculum_data(self):
        """Empty curriculum data should pass (no misconceptions to cover)"""
        curriculum_data = {"common_misconceptions": []}
        arc = {"scenes": []}
        errors = validate_misconception_coverage(arc, curriculum_data)
        assert len(errors) == 0

    def test_validate_misconception_coverage_none_assigned(self):
        """All misconceptions unassigned should report all errors"""
        curriculum_data = {
            "common_misconceptions": [
                {"misconception": "Misconception A"},
                {"misconception": "Misconception B"},
            ]
        }
        arc = {
            "scenes": [
                {"scene_id": "scene_1", "misconception_target": None},
                {"scene_id": "scene_2"},
            ]
        }
        errors = validate_misconception_coverage(arc, curriculum_data)
        assert len(errors) == 2
        assert any("Misconception A" in e for e in errors)
        assert any("Misconception B" in e for e in errors)


class TestCharacterGenerationBySubject:
    """Integration tests for character generation based on student profile"""

    @pytest.mark.integration
    def test_character_generation_includes_subject_context(self):
        """Character generation should incorporate student's subject combination"""
        # This test would call generate_character() with student subjects
        # and verify the character profile includes relevant subject context
        pass

    @pytest.mark.integration
    def test_character_generation_includes_extracurriculars(self):
        """Character generation should incorporate student's extracurriculars"""
        # This test would call generate_character() with student clubs
        # and verify the character profile references clubs naturally
        pass


class TestArcGenerationPipeline:
    """Integration tests for full arc generation pipeline"""

    @pytest.mark.integration
    @pytest.mark.slow
    async def test_generate_arc_pipeline_integration(self):
        """Full arc generation should produce valid arc with all validations passing"""
        # This would test the full generate_arc() function
        # with mocked Firestore and LLM calls
        pass
