# Pydantic schemas for auth feature

from pydantic import BaseModel
from typing import Optional, List


class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str
    role: str  # "professor" or "student"
    institution: Optional[str] = None
    subjects: Optional[List[str]] = None


class RegisterResponse(BaseModel):
    uid: str
    email: str
    role: str
    display_name: str


class UserProfile(BaseModel):
    uid: str
    email: str
    role: str
    display_name: str
    institution: Optional[str] = None
    subjects: Optional[List[str]] = None
