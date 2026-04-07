# Arc journal API routes
# Endpoints for persistent conversation history across scenes

from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore import AsyncClient
from app.backend.core.firebase import get_firestore_db
from app.backend.features.arc_journal.schemas import (
    AppendJournalRequest,
    JournalResponse
)
from app.backend.features.arc_journal import service
import logging

router = APIRouter(prefix="/api/arc-journal", tags=["arc-journal"])
logger = logging.getLogger(__name__)


@router.get("/{student_id}/{arc_id}")
async def get_arc_journal(
    student_id: str,
    arc_id: str,
    db: AsyncClient = Depends(get_firestore_db)
):
    """Get complete arc journal for a student.

    Returns all conversation entries across all scenes in the arc.
    Used by journal UI to display persistent history.
    """
    try:
        journal_data = await service.get_or_create_arc_journal(
            student_id=student_id,
            arc_id=arc_id,
            db=db
        )

        return journal_data

    except Exception as e:
        logger.error(f"Failed to get arc journal: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get arc journal: {str(e)}"
        )


@router.post("/append", response_model=JournalResponse)
async def append_to_journal(
    request: AppendJournalRequest,
    db: AsyncClient = Depends(get_firestore_db)
):
    """Append new conversation entries to arc journal.

    Called after each scene or dialogue turn to incrementally build history.
    """
    try:
        journal_data = await service.append_to_arc_journal(
            student_id=request.student_id,
            arc_id=request.arc_id,
            scene_id=request.scene_id,
            scene_order=request.scene_order,
            new_entries=request.new_entries,
            db=db
        )

        logger.info(f"Appended {len(request.new_entries)} entries to journal {request.student_id}_{request.arc_id}")

        return JournalResponse(
            journal_id=journal_data["journal_id"],
            student_id=journal_data["student_id"],
            arc_id=journal_data["arc_id"],
            total_entries=len(journal_data["entries"]),
            status=journal_data["status"]
        )

    except Exception as e:
        logger.error(f"Failed to append to arc journal: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to append to arc journal: {str(e)}"
        )


@router.post("/{student_id}/{arc_id}/complete")
async def mark_journal_complete(
    student_id: str,
    arc_id: str,
    db: AsyncClient = Depends(get_firestore_db)
):
    """Mark arc journal as complete when arc is finished.

    Called when student completes the final scene/arc ending.
    """
    try:
        journal_data = await service.mark_journal_complete(
            student_id=student_id,
            arc_id=arc_id,
            db=db
        )

        logger.info(f"Marked journal {student_id}_{arc_id} as complete")

        return {
            "journal_id": journal_data["journal_id"],
            "status": journal_data["status"],
            "total_entries": len(journal_data["entries"])
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to mark journal complete: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark journal complete: {str(e)}"
        )
