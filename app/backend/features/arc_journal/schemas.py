# Pydantic schemas for arc-wide journal system
# Stores persistent conversation history across all scenes

from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class JournalEntry(BaseModel):
    """Single conversation turn in the journal"""
    scene_id: str  # e.g., "scene3"
    scene_order: int
    role: str  # "student" | "character" | "narration"
    content: str
    character_id: Optional[str] = None  # Character name (after mapping)
    emotion_tag: Optional[str] = None
    timestamp: str  # ISO format
    multipart: Optional[bool] = None  # True if multi-part freeform response


class ArcJournal(BaseModel):
    """Complete journal for a student's arc playthrough"""
    journal_id: str  # Format: {student_id}_{arc_id}
    student_id: str
    arc_id: str
    entries: List[JournalEntry]
    created_at: str
    updated_at: str
    status: str  # "in_progress" | "completed"


class AppendJournalRequest(BaseModel):
    """Request to add entries to journal"""
    student_id: str
    arc_id: str
    scene_id: str
    scene_order: int
    new_entries: List[Dict[str, Any]]  # Raw conversation turns to append


class JournalResponse(BaseModel):
    """Response after journal operation"""
    journal_id: str
    student_id: str
    arc_id: str
    total_entries: int
    status: str
