# Pydantic schemas for dialogue turn feature

from pydantic import BaseModel
from typing import List, Dict, Optional

class ConversationTurn(BaseModel):
    role: str  # narration | character | student
    content: str
    character_id: Optional[str] = None
    emotion_tag: Optional[str] = None
    timestamp: str

class DialogueTurnRequest(BaseModel):
    scene_id: str
    student_id: str
    student_response: str
    conversation_history: List[ConversationTurn]

class DialogueTurnResponse(BaseModel):
    character_dialogue: str
    emotion_tag: Optional[str] = None
    should_end_scene: bool
    reasoning_assessment: Dict[str, str]
