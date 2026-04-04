# Pydantic schemas for arc generation feature

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class Misconception(BaseModel):
    misconception: str
    why_students_think_this: str
    exposing_scenario: Optional[str] = None

class CurriculumData(BaseModel):
    subject: str
    module: str
    year_level: str
    assessment_type: str
    learning_outcomes: List[str]
    common_misconceptions: List[Misconception]
    key_concepts: List[str]
    prep_window_days: Optional[int] = None
    difficulty_level: str

class SceneData(BaseModel):
    scene_order: int
    scene_type: str  # bridge | deep | side_event
    character_name: str
    concept_target: str
    misconception_target: Optional[str] = None  # for deep scenes
    setup_prompt: str
    socratic_angles: List[str]

class NarrativeArc(BaseModel):
    arc_name: str
    scenes: List[SceneData]

class ArcCreateRequest(BaseModel):
    class_id: str
    rubric_text: str
    professor_id: str
    student_subjects: Optional[List[str]] = None  # For character archetype generation
    student_extracurriculars: Optional[List[str]] = None  # For character flavor

class ArcResponse(BaseModel):
    arc_id: str
    class_id: str
    curriculum_data: Optional[Dict[str, Any]]
    narrative_arc: Optional[Dict[str, Any]]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class RubricUploadResponse(BaseModel):
    filename: str
    text: str
    char_count: int


class SceneGenerationRequest(BaseModel):
    scene_id: str
    generate_full_content: bool = True  # Generate full VN scene with formatting

class SceneGenerationResponse(BaseModel):
    scene_id: str
    scene_content: str  # Full VN scene with [narration], [character:Name], [player_prompt] tags
    success: bool
