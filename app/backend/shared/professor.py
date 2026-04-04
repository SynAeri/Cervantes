# Professor model for authentication and profile

from sqlalchemy import Column, String
from core.database import Base

class Professor(Base):
    __tablename__ = "professors"

    professor_id = Column(String, primary_key=True)
    institution = Column(String)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
