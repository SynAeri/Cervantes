# Pydantic schemas for character pooling system
# Name/gender variant approach: Keep personality/archetype/role constant, randomize superficial details
# This maintains narrative coherence while giving each student unique character names

from typing import Optional, List, Any
from pydantic import BaseModel, Field


class CharacterNameVariant(BaseModel):
    """A single name/gender variant for a character"""
    variant_id: str = Field(..., description="A, B, C, or D")
    name: str = Field(..., description="Character name for this variant")
    gender: str = Field(..., description="male, female, or neutral")


class CharacterPool(BaseModel):
    """Character template with name variants for a specific scene

    The personality, role, archetype, and voice are CONSTANT across all students.
    Only the name and gender vary per student to create uniqueness without breaking narrative coherence.
    """
    pool_id: str = Field(..., description="Format: pool_scene{order}_arc_{arc_id}")
    arc_id: str
    scene_order: int
    class_id: str = Field(..., description="Class this pool belongs to")

    # Base character data (CONSTANT for all students)
    base_character_id: str = Field(..., description="Base character ID")
    role: str = Field(..., description="Character's profession/role - constant")
    personality_prompt: str = Field(..., description="Character personality - constant")
    voice_register: str = Field(..., description="How character speaks - constant")
    archetype: str = Field(..., description="sharp_mentor, gentle_guide, peer_challenger, etc - constant")
    subject_connection: str = Field(..., description="Why this character knows the subject - constant")
    sprite_set: List[str] = Field(..., description="Emotion sprites - constant")

    # Name variants (DIFFERENT per student)
    name_variants: List[CharacterNameVariant] = Field(..., min_length=2, max_length=4)


class StudentSceneAssignment(BaseModel):
    """Tracks which character variant a student was assigned and their progress"""
    assignment_id: str = Field(..., description="Format: {student_id}_{arc_id}_scene{scene_order}")
    student_id: str
    arc_id: str
    scene_order: int
    assigned_variant: str = Field(..., description="A or B")
    character_pool_id: str
    status: str = Field(default="not_started", description="not_started | started | completed")
    started_at: Optional[Any] = None  # Firestore timestamp
    completed_at: Optional[Any] = None  # Firestore timestamp


class PoolGenerationRequest(BaseModel):
    """Request to generate character pools for an arc"""
    arc_id: str
    num_variants: int = Field(default=2, ge=2, le=4, description="Number of variants per scene (default 2)")
