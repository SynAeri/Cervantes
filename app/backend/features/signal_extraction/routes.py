# API routes for post-scene signal extraction

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.backend.core.database import get_db
from app.backend.features.signal_extraction.schemas import SignalExtractionRequest, SignalExtractionResponse
from app.backend.features.signal_extraction import service

router = APIRouter(prefix="/api/signals", tags=["signal_extraction"])

@router.post("/extract", response_model=SignalExtractionResponse)
async def extract_signals_endpoint(
    request: SignalExtractionRequest,
    db: Session = Depends(get_db)
):
    """
    Extract reasoning signals from completed scene using signal_extraction.md
    Runs AFTER scene completes - analytical mode, not narrative
    Returns structured JSON for teacher dashboard
    """
    try:
        result = await service.extract_reasoning_signals(
            trace_id=request.trace_id,
            db=db
        )
        return SignalExtractionResponse(
            trace_id=request.trace_id,
            extraction_result=result,
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signal extraction failed: {str(e)}")
