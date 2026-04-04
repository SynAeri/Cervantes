# API routes for real-time Socratic dialogue

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from features.dialogue.schemas import DialogueTurnRequest, DialogueTurnResponse
from features.dialogue import service

router = APIRouter(prefix="/api/dialogue", tags=["dialogue"])

@router.post("/turn", response_model=DialogueTurnResponse)
async def generate_dialogue_turn_endpoint(
    request: DialogueTurnRequest,
    db: Session = Depends(get_db)
):
    """
    Generate next Socratic dialogue turn using pushback_dialogue.md
    Runs during scene - real-time character response to student input
    """
    try:
        response = await service.generate_dialogue_turn(
            scene_id=request.scene_id,
            student_id=request.student_id,
            student_response=request.student_response,
            conversation_history=request.conversation_history,
            db=db
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dialogue generation failed: {str(e)}")
