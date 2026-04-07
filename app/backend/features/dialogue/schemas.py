# Pydantic schemas for dialogue turn feature
# Supports both simple freeform and multi-part structured responses

from pydantic import BaseModel
from typing import List, Dict, Optional


class ConversationTurn(BaseModel):
    role: str  # narration | character | student
    content: str
    character_id: Optional[str] = None
    emotion_tag: Optional[str] = None
    timestamp: str


class SubQuestionResponse(BaseModel):
    """Individual sub-question response in multi-part freeform"""
    part_number: int
    sub_question_text: str
    student_answer: str
    rubric_dimension: Optional[str] = None


class DialogueTurnRequest(BaseModel):
    scene_id: str  # Format: "scene3" - will be parsed to extract scene_order
    arc_id: str  # UUID of the arc
    student_id: str
    student_response: Optional[str] = None  # For simple freeform (backward compatible)
    student_multipart_response: Optional[List[SubQuestionResponse]] = None  # NEW: For structured responses
    conversation_history: List[ConversationTurn]


class DialogueTurnResponse(BaseModel):
    character_dialogue: str
    emotion_tag: Optional[str] = None
    should_end_scene: bool
    reasoning_assessment: Dict[str, Optional[str]]  # Values can be None (e.g., misconception_detected can be null)
