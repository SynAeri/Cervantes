# Pydantic schemas for character mapping system
# Maps original character IDs to student-specific assigned names

from pydantic import BaseModel
from typing import Dict, Optional


class CharacterMapping(BaseModel):
    """Individual character mapping for a student"""
    original_name: str  # Original name from scene content (e.g., "Aisha")
    assigned_name: str  # Randomly assigned name for this student (e.g., "Maya")
    gender: str  # "male" | "female" | "neutral"
    first_seen_scene: int  # Scene order where character first appeared
    sprite_index: int  # Which sprite sheet to use (1-7 for female, 1-5 for male)


class StudentCharacterMappings(BaseModel):
    """Complete character mapping for a student's arc"""
    mapping_id: str  # Format: {student_id}_{arc_id}
    student_id: str
    arc_id: str
    character_mappings: Dict[str, CharacterMapping]  # Key: character_id (e.g., "char_aisha")


class CharacterMappingResponse(BaseModel):
    """Response after creating/fetching character mapping"""
    mapping_id: str
    student_id: str
    arc_id: str
    character_count: int
    status: str
