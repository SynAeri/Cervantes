# Signal extraction routes (Firestore version)

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.backend.core.firebase import get_firestore_db
from app.backend.core.auth import require_professor
from app.backend.features.signal_extraction.schemas import (
    SignalExtractionRequest, SignalExtractionResponse,
)
from app.backend.features.signal_extraction import service

router = APIRouter(prefix="/api/signals", tags=["signal_extraction"])


@router.post("/extract", response_model=SignalExtractionResponse)
async def extract_signals_endpoint(
    request: SignalExtractionRequest,
    user: Annotated[dict, Depends(require_professor)],
    db=Depends(get_firestore_db),
):
    """
    Extract reasoning signals from completed scene.
    Returns structured JSON for teacher dashboard.
    """
    try:
        result = await service.extract_reasoning_signals(
            trace_id=request.trace_id,
            db=db,
        )
        return SignalExtractionResponse(
            trace_id=request.trace_id,
            extraction_result=result,
            success=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signal extraction failed: {str(e)}")


@router.post("/{trace_id}")
async def extract_signals_by_id(
    trace_id: str,
    db=Depends(get_firestore_db),
):
    """
    Extract reasoning signals from trace ID (student-accessible).
    Used after scene completion for arc ending assessment.
    """
    import traceback
    try:
        result = await service.extract_reasoning_signals(
            trace_id=trace_id,
            db=db,
        )
        return result.model_dump()
    except Exception as e:
        print(f"ERROR in extract_signals_by_id: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Signal extraction failed: {str(e)}")
