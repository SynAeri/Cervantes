# Reasoning trace schemas for storing student scene completion data
# Stores conversation history with structured multi-part responses

from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime


class SubQuestionResponse(BaseModel):
    """Individual sub-question response in multi-part freeform"""
    part_number: int
    sub_question_text: str
    student_answer: str
    rubric_dimension: Optional[str] = None


class ReasoningTraceRequest(BaseModel):
    """Request to save reasoning trace after scene completion"""
    student_id: str
    scene_id: str
    arc_id: Optional[str] = None
    scene_order: Optional[int] = None
    conversation_history: List[Dict]
    initial_answer: str
    revised_answer: str
    multipart_responses: Optional[List[Dict]] = None  # Structured multi-part data


class ReasoningTraceResponse(BaseModel):
    """Response after saving reasoning trace"""
    trace_id: str
    status: str
    message: Optional[str] = None
