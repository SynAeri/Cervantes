# Arc ending API routes
# Endpoint for generating outcome-based narrative endings after arc completion

from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore import AsyncClient
from app.backend.core.firebase import get_firestore_db
from app.backend.features.arc_endings.schemas import (
    ArcEndingRequest,
    ArcEndingResponse
)
from app.backend.features.arc_endings import service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=ArcEndingResponse)
async def generate_arc_ending(
    request: ArcEndingRequest,
    db: AsyncClient = Depends(get_firestore_db)
):
    """
    Generate narrative ending for completed arc.
    Called after student completes climax scene.
    """
    try:
        ending = await service.generate_arc_ending(
            student_id=request.student_id,
            arc_id=request.arc_id,
            climax_scene_id=request.climax_scene_id,
            performance_level=request.performance_level,
            db=db
        )

        logger.info(f"Generated {ending.ending_type} ending for student {request.student_id}, arc {request.arc_id}")

        return ending

    except ValueError as e:
        logger.error(f"Invalid arc ending request: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to generate arc ending: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate arc ending: {str(e)}"
        )


@router.get("/{ending_id}")
async def get_arc_ending(
    ending_id: str,
    db: AsyncClient = Depends(get_firestore_db)
):
    """Get arc ending by ID"""
    try:
        ending_doc = await db.collection("arc_endings").document(ending_id).get()

        if not ending_doc.exists:
            raise HTTPException(status_code=404, detail="Arc ending not found")

        return ending_doc.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get arc ending: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get arc ending: {str(e)}"
        )


@router.get("/student/{student_id}/arc/{arc_id}")
async def get_ending_by_student_arc(
    student_id: str,
    arc_id: str,
    db: AsyncClient = Depends(get_firestore_db)
):
    """Get arc ending for a specific student and arc"""
    try:
        endings_query = db.collection("arc_endings")\
            .where("student_id", "==", student_id)\
            .where("arc_id", "==", arc_id)\
            .order_by("created_at", direction="DESCENDING")\
            .limit(1)

        endings = await endings_query.get()

        if not endings:
            raise HTTPException(
                status_code=404,
                detail="No ending found for this student and arc"
            )

        return endings[0].to_dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get arc ending: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get arc ending: {str(e)}"
        )
