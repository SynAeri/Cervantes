# Reasoning trace API routes
# Endpoint for storing student reasoning traces per scene completion

from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore import AsyncClient
from app.backend.core.firebase import get_firestore_db
from app.backend.features.reasoning_trace.schemas import (
    ReasoningTraceRequest,
    ReasoningTraceResponse
)
from datetime import datetime
import uuid
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=ReasoningTraceResponse)
async def save_reasoning_trace(
    request: ReasoningTraceRequest,
    db: AsyncClient = Depends(get_firestore_db)
):
    """
    Save reasoning trace for student scene completion.
    Per-student, per-class storage for audit and signal extraction.
    """
    try:
        trace_id = str(uuid.uuid4())

        trace_doc = {
            "trace_id": trace_id,
            "student_id": request.student_id,
            "scene_id": request.scene_id,
            "conversation_history": request.conversation_history,
            "initial_answer": request.initial_answer,
            "revised_answer": request.revised_answer,
            "multipart_responses": request.multipart_responses,
            "created_at": datetime.utcnow(),
            "status": None,  # Set by signal extraction later
            "rubric_alignment": None,  # Set by signal extraction later
        }

        await db.collection("reasoning_traces").document(trace_id).set(trace_doc)

        logger.info(f"Saved reasoning trace {trace_id} for student {request.student_id}, scene {request.scene_id}")

        return ReasoningTraceResponse(
            trace_id=trace_id,
            status="saved",
            message="Reasoning trace saved successfully"
        )

    except Exception as e:
        logger.error(f"Failed to save reasoning trace: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save reasoning trace: {str(e)}"
        )


@router.get("/{trace_id}")
async def get_reasoning_trace(
    trace_id: str,
    db: AsyncClient = Depends(get_firestore_db)
):
    """Get reasoning trace by ID"""
    try:
        trace_doc = await db.collection("reasoning_traces").document(trace_id).get()

        if not trace_doc.exists:
            raise HTTPException(status_code=404, detail="Reasoning trace not found")

        return trace_doc.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get reasoning trace: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get reasoning trace: {str(e)}"
        )


@router.get("/student/{student_id}/scene/{scene_id}")
async def get_traces_by_student_scene(
    student_id: str,
    scene_id: str,
    db: AsyncClient = Depends(get_firestore_db)
):
    """Get all reasoning traces for a student's scene attempts"""
    try:
        traces_query = db.collection("reasoning_traces")\
            .where("student_id", "==", student_id)\
            .where("scene_id", "==", scene_id)\
            .order_by("created_at", direction="DESCENDING")

        traces = await traces_query.get()

        return [trace.to_dict() for trace in traces]

    except Exception as e:
        logger.error(f"Failed to get reasoning traces: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get reasoning traces: {str(e)}"
        )
