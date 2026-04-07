# Dialogue routes (Firestore version)

import traceback
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
    db=Depends(get_firestore_db),
):
    """Real-time Socratic dialogue during a scene"""
    try:
        response = await service.generate_dialogue_turn(
            scene_id=request.scene_id,
            arc_id=request.arc_id,
            student_id=request.student_id,
            conversation_history=request.conversation_history,
            db=db,
            student_response=request.student_response,
            student_multipart_response=request.student_multipart_response,
        )
        return response
    except Exception as e:
        # Print full traceback to console for debugging
        print(f"ERROR in dialogue_turn: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Dialogue generation failed: {str(e)}")
