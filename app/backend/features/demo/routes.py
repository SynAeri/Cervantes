# Demo mode routes for LinkedIn showcase
# Accepts any visitor name, maps to a pooled mock student, tracks session usage

import hashlib
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.base_query import FieldFilter
from app.backend.core.firebase import get_firestore_db

router = APIRouter(prefix="/api/demo", tags=["demo"])

DEMO_ARC_ID = "ae8b30a5-5d48-41c4-9826-ba62ff348afe"
DEMO_STUDENT_POOL = [f"student_demo_{str(i).zfill(3)}" for i in range(1, 21)]
DIALOGUE_TURN_LIMIT = 15
DEMO_EXPIRES_AT = datetime(2026, 4, 19, 23, 59, 59)  # one week from launch


def _pick_demo_student(visitor_name: str) -> str:
    """Deterministically assign a mock student ID from the pool based on visitor name."""
    index = int(hashlib.md5(visitor_name.lower().strip().encode()).hexdigest(), 16) % len(DEMO_STUDENT_POOL)
    return DEMO_STUDENT_POOL[index]


@router.post("/arc/{arc_id}/access")
async def demo_arc_access(
    arc_id: str,
    request: dict,
    db=Depends(get_firestore_db),
):
    """Demo entry point - accepts any visitor name, returns a session and mock student assignment."""

    if datetime.utcnow() > DEMO_EXPIRES_AT:
        raise HTTPException(status_code=410, detail="demo_expired")

    visitor_name = (request.get("visitor_name") or "").strip()
    if not visitor_name:
        raise HTTPException(status_code=400, detail="visitor_name is required")

    # Validate arc exists and is published
    arc_doc = await db.collection("arcs").document(arc_id).get()
    if not arc_doc.exists:
        raise HTTPException(status_code=404, detail="Arc not found")

    arc_data = arc_doc.to_dict()
    if arc_data.get("status") != "published":
        return {"status": "processing", "message": "Demo arc is not yet published"}

    demo_student_id = _pick_demo_student(visitor_name)

    # Look up or create demo session for this visitor+arc combination
    session_key = f"{visitor_name.lower().strip()}_{arc_id}"
    session_hash = hashlib.md5(session_key.encode()).hexdigest()
    session_doc_ref = db.collection("demo_sessions").document(session_hash)
    session_doc = await session_doc_ref.get()

    if session_doc.exists:
        session = session_doc.to_dict()
        if session.get("dialogue_turns_used", 0) >= DIALOGUE_TURN_LIMIT:
            return {
                "status": "rate_limited",
                "message": "You have used all your demo dialogue turns. Come back tomorrow!",
            }
    else:
        session = {
            "session_id": session_hash,
            "visitor_name": visitor_name,
            "arc_id": arc_id,
            "demo_student_id": demo_student_id,
            "dialogue_turns_used": 0,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7),
        }
        await session_doc_ref.set(session)

    # Get the student's scene assignments for this arc
    assignments_ref = db.collection("student_scene_assignments")
    assignments_query = (
        assignments_ref
        .where(filter=FieldFilter("arc_id", "==", arc_id))
        .where(filter=FieldFilter("student_id", "==", demo_student_id))
    )
    assignments_docs = assignments_query.stream()

    assignments = []
    async for doc in assignments_docs:
        if doc.exists:
            assignments.append(doc.to_dict())

    if not assignments:
        return {"status": "processing", "message": "Demo scenes are still being assigned. Try again shortly."}

    assignments.sort(key=lambda x: x.get("scene_order", 0))

    # Find first incomplete scene
    first_incomplete = next((a for a in assignments if a.get("status") != "completed"), assignments[-1])
    scene_id = first_incomplete.get("scene_id")

    # Extract scene_id from assignment_id if missing
    if not scene_id and "assignment_id" in first_incomplete:
        parts = first_incomplete["assignment_id"].split("_")
        if len(parts) >= 4:
            scene_id = parts[-1]

    return {
        "status": "ready",
        "arc_id": arc_id,
        "student_id": demo_student_id,
        "session_id": session_hash,
        "visitor_name": visitor_name,
        "turns_remaining": DIALOGUE_TURN_LIMIT - session.get("dialogue_turns_used", 0),
        "first_assignment": {**first_incomplete, "scene_id": scene_id},
    }


@router.post("/session/{session_id}/increment-turn")
async def increment_demo_turn(
    session_id: str,
    db=Depends(get_firestore_db),
):
    """Increment dialogue turn counter for a demo session. Returns remaining turns."""
    session_doc_ref = db.collection("demo_sessions").document(session_id)
    session_doc = await session_doc_ref.get()

    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Demo session not found")

    session = session_doc.to_dict()
    used = session.get("dialogue_turns_used", 0)

    if used >= DIALOGUE_TURN_LIMIT:
        raise HTTPException(status_code=429, detail="Demo dialogue limit reached")

    await session_doc_ref.update({"dialogue_turns_used": used + 1})

    remaining = DIALOGUE_TURN_LIMIT - (used + 1)
    return {"turns_remaining": remaining, "turns_used": used + 1}


@router.get("/session/{session_id}")
async def get_demo_session(
    session_id: str,
    db=Depends(get_firestore_db),
):
    """Get demo session state including turns remaining."""
    session_doc = await db.collection("demo_sessions").document(session_id).get()

    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Demo session not found")

    session = session_doc.to_dict()
    used = session.get("dialogue_turns_used", 0)
    return {
        "session_id": session_id,
        "visitor_name": session.get("visitor_name"),
        "demo_student_id": session.get("demo_student_id"),
        "turns_remaining": DIALOGUE_TURN_LIMIT - used,
        "turns_used": used,
    }
