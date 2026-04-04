# CharacterTemplate model with personality_prompt and subject_affinity

from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from app.backend.core.database import Base

class CharacterTemplate(Base):
    __tablename__ = "character_templates"

    template_id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False)
    personality_prompt = Column(Text, nullable=False)
    sprite_set = Column(String)
    subject_affinity = Column(JSONB)
