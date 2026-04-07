# Pydantic schemas for arc ending generation
# Generates outcome-based narrative endings after arc completion

from pydantic import BaseModel
from typing import Optional


class ArcEndingRequest(BaseModel):
    """Request to generate arc ending after completion"""
    student_id: str
    arc_id: str
    climax_scene_id: str
    performance_level: str  # "mastery" | "needs_improvement"


class ArcEndingResponse(BaseModel):
    """Generated arc ending with narrative outcome"""
    ending_id: str
    arc_id: str
    student_id: str
    ending_type: str  # "good_end" | "bad_end" | "iffy_end"
    narrative_text: str
    character_callback: Optional[str] = None
    reflection_prompt: str
    status: str
