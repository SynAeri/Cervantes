# Dialogue routes (Firestore version)

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.backend.core.firebase import get_firestore_db
from app.backend.core.auth import get_current_user
from app.backend.features.dialogue.schemas import DialogueTurnRequest, DialogueTurnResponse
from app.backend.features.dialogue import service

router = APIRouter(prefix="/api/dialogue", tags=["dialogue"])


@router.post("/turn", response_model=DialogueTurnResponse)
async def dialogue_turn(
    request: DialogueTurnRequest,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Real-time Socratic dialogue during a scene"""
    try:
        response = await service.generate_dialogue_turn(
            scene_id=request.scene_id,
            student_id=user["uid"],
            student_response=request.student_response,
            conversation_history=request.conversation_history,
            db=db,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dialogue generation failed: {str(e)}")
