# Student model with subjects and extracurriculars

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import JSONB
from core.database import Base

class Student(Base):
    __tablename__ = "students"

    student_id = Column(String, primary_key=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    subjects = Column(JSONB)
    extracurriculars = Column(JSONB)
