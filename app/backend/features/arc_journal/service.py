# Arc journal service - manages persistent conversation history across scenes
# Stores all dialogue, choices, and interactions for later signal extraction

from datetime import datetime
from typing import List, Dict, Any
from google.cloud.firestore import AsyncClient
from app.backend.features.arc_journal.schemas import ArcJournal, JournalEntry


async def get_or_create_arc_journal(
    student_id: str,
    arc_id: str,
    db: AsyncClient
) -> Dict[str, Any]:
    """Get existing arc journal or create new one.

    Args:
        student_id: Student ID
        arc_id: Arc UUID
        db: Firestore client

    Returns:
        Journal dict with entries list
    """
    journal_id = f"{student_id}_{arc_id}"
    journal_doc = await db.collection("arc_journals").document(journal_id).get()

    if journal_doc.exists:
        return journal_doc.to_dict()

    # Create new journal
    new_journal = {
        "journal_id": journal_id,
        "student_id": student_id,
        "arc_id": arc_id,
        "entries": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "status": "in_progress"
    }

    await db.collection("arc_journals").document(journal_id).set(new_journal)
    print(f"DEBUG: Created new arc journal: {journal_id}")

    return new_journal


async def append_to_arc_journal(
    student_id: str,
    arc_id: str,
    scene_id: str,
    scene_order: int,
    new_entries: List[Dict[str, Any]],
    db: AsyncClient
) -> Dict[str, Any]:
    """Append new conversation entries to arc journal.

    This is called after each scene or dialogue turn to incrementally build the journal.

    Args:
        student_id: Student ID
        arc_id: Arc UUID
        scene_id: Scene ID (e.g., "scene3")
        scene_order: Scene number
        new_entries: List of conversation turns to append
        db: Firestore client

    Returns:
        Updated journal dict
    """
    journal_id = f"{student_id}_{arc_id}"
    journal_doc = await db.collection("arc_journals").document(journal_id).get()

    if journal_doc.exists:
        journal_data = journal_doc.to_dict()
        existing_entries = journal_data.get("entries", [])
    else:
        journal_data = await get_or_create_arc_journal(student_id, arc_id, db)
        existing_entries = []

    # Add scene_id and scene_order to each entry
    formatted_entries = []
    for entry in new_entries:
        formatted_entry = {
            "scene_id": scene_id,
            "scene_order": scene_order,
            "role": entry.get("role"),
            "content": entry.get("content"),
            "character_id": entry.get("character_id"),
            "emotion_tag": entry.get("emotion_tag"),
            "timestamp": entry.get("timestamp", datetime.utcnow().isoformat()),
            "multipart": entry.get("multipart")
        }
        formatted_entries.append(formatted_entry)

    # Append new entries
    updated_entries = existing_entries + formatted_entries

    # Update journal
    journal_data["entries"] = updated_entries
    journal_data["updated_at"] = datetime.utcnow().isoformat()

    await db.collection("arc_journals").document(journal_id).set(journal_data)

    print(f"DEBUG: Appended {len(formatted_entries)} entries to journal {journal_id}. Total entries: {len(updated_entries)}")

    return journal_data


async def mark_journal_complete(
    student_id: str,
    arc_id: str,
    db: AsyncClient
) -> Dict[str, Any]:
    """Mark arc journal as complete when arc is finished.

    Args:
        student_id: Student ID
        arc_id: Arc UUID
        db: Firestore client

    Returns:
        Updated journal dict
    """
    journal_id = f"{student_id}_{arc_id}"
    journal_doc = await db.collection("arc_journals").document(journal_id).get()

    if not journal_doc.exists:
        raise ValueError(f"Journal not found: {journal_id}")

    journal_data = journal_doc.to_dict()
    journal_data["status"] = "completed"
    journal_data["updated_at"] = datetime.utcnow().isoformat()

    await db.collection("arc_journals").document(journal_id).set(journal_data)

    print(f"DEBUG: Marked journal {journal_id} as complete. Total entries: {len(journal_data.get('entries', []))}")

    return journal_data
