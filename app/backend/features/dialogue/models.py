# ReasoningTrace model - stores conversation history and assessment results

from sqlalchemy import Column, String, ForeignKey, Text, DateTime, Enum
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.backend.core.database import Base
import enum

class ReasoningStatus(str, enum.Enum):
    mastery = "mastery"
    revised_with_scaffolding = "revised_with_scaffolding"
    critical_gap = "critical_gap"

class ReasoningTrace(Base):
    __tablename__ = "reasoning_traces"

    trace_id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    scene_id = Column(String, ForeignKey("scenes.scene_id"), nullable=False)
    initial_answer = Column(Text)
    pushback_given = Column(Text)
    revised_answer = Column(Text)
    reflection = Column(Text)
    conversation_history = Column(JSONB, nullable=False)
    status = Column(Enum(ReasoningStatus))
    signal_extraction_result = Column(JSONB)  # Structured output from signal_extraction.md
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
