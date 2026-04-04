# Enrollment model for student-class relationships

from sqlalchemy import Column, String, ForeignKey, UniqueConstraint
from core.database import Base

class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint('student_id', 'class_id', name='_student_class_uc'),)

    enrollment_id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    class_id = Column(String, ForeignKey("classes.class_id"), nullable=False)
