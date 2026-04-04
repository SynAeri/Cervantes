# API routes for narrative arc generation and management (Firestore version)

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.backend.core.firebase import get_firestore_db
from app.backend.core.auth import get_current_user, require_professor
from app.backend.features.arc.schemas import ArcCreateRequest, SceneGenerationRequest, SceneGenerationResponse
from app.backend.features.arc import service

router = APIRouter(prefix="/api/arc", tags=["arcs"])


@router.post("/generate")
async def generate_arc_endpoint(
    request: ArcCreateRequest,
    user: Annotated[dict, Depends(require_professor)],
    db=Depends(get_firestore_db),
):
    """Phase 1 & 2: CurricuLLM rubric parse → Gemini narrative arc planning"""
    try:
        arc = await service.generate_arc(
            class_id=request.class_id,
            rubric_text=request.rubric_text,
            professor_id=user["uid"],
            db=db,
            student_subjects=request.student_subjects,
            student_extracurriculars=request.student_extracurriculars,
        )
        return arc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Arc generation failed: {str(e)}")


@router.get("/{arc_id}")
async def get_arc(
    arc_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Get arc details"""
    doc = await db.collection("arcs").document(arc_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Arc not found")
    return doc.to_dict()


@router.post("/{arc_id}/approve")
async def approve_arc(
    arc_id: str,
    user: Annotated[dict, Depends(require_professor)],
    db=Depends(get_firestore_db),
):
    """Approve draft arc (professor review)"""
    doc = await db.collection("arcs").document(arc_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Arc not found")
    await db.collection("arcs").document(arc_id).update({"status": "approved"})
    return {"status": "approved", "arc_id": arc_id}


@router.post("/{arc_id}/publish")
async def publish_arc(
    arc_id: str,
    user: Annotated[dict, Depends(require_professor)],
    db=Depends(get_firestore_db),
):
    """Publish arc to students"""
    doc = await db.collection("arcs").document(arc_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Arc not found")
    await db.collection("arcs").document(arc_id).update({"status": "published"})
    return {"status": "published", "arc_id": arc_id}


@router.post("/scene/generate", response_model=SceneGenerationResponse)
async def generate_scene_content_endpoint(
    request: SceneGenerationRequest,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Generate full VN scene content with formatting tags"""
    try:
        scene_content = await service.generate_scene_content(
            scene_id=request.scene_id,
            db=db,
        )
        return SceneGenerationResponse(
            scene_id=request.scene_id,
            scene_content=scene_content,
            success=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scene generation failed: {str(e)}")
