# Class model for professor courses

from sqlalchemy import Column, String, ForeignKey
from app.backend.core.database import Base

class Class(Base):
    __tablename__ = "classes"

    class_id = Column(String, primary_key=True)
    professor_id = Column(String, ForeignKey("professors.professor_id"), nullable=False)
    subject = Column(String, nullable=False)
    module = Column(String)
    name = Column(String, nullable=False)
