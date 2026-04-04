# Arc and Scene models - narrative arc generation feature

from sqlalchemy import Column, String, ForeignKey, DateTime, Enum, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from core.database import Base
import enum

class ArcStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    published = "published"

class Arc(Base):
    __tablename__ = "arcs"

    arc_id = Column(String, primary_key=True)
    class_id = Column(String, ForeignKey("classes.class_id"), nullable=False)
    curriculum_data = Column(JSONB)
    narrative_arc = Column(JSONB)
    rubric_focus = Column(String)
    concept_targets = Column(JSONB)
    misconceptions = Column(JSONB)
    status = Column(Enum(ArcStatus), default=ArcStatus.draft, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Scene(Base):
    __tablename__ = "scenes"

    scene_id = Column(String, primary_key=True)
    arc_id = Column(String, ForeignKey("arcs.arc_id"), nullable=False)
    scene_order = Column(Integer, nullable=False)
    scene_type = Column(String, nullable=False)  # bridge | deep | side_event
    character_id = Column(String, nullable=False)
    concept_target = Column(String, nullable=False)
    misconception_target = Column(String)  # for deep scenes
    setup_narration = Column(Text)
    socratic_angles = Column(JSONB)
    generated_scene_content = Column(Text)  # Full VN scene with formatting tags
