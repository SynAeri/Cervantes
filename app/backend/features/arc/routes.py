# API routes for narrative arc generation and management

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.backend.core.database import get_db
from app.backend.features.arc.schemas import ArcCreateRequest, ArcResponse, SceneGenerationRequest, SceneGenerationResponse
from app.backend.features.arc import service
from app.backend.features.arc.models import Arc, ArcStatus

router = APIRouter(prefix="/api/arc", tags=["arcs"])

@router.post("/generate", response_model=ArcResponse)
async def generate_arc_endpoint(
    request: ArcCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Phase 1 & 2: CurricuLLM rubric parse → Gemini narrative arc planning
    Returns arc structure with scene metadata (not full VN content yet)
    """
    try:
        arc = await service.generate_arc(
            class_id=request.class_id,
            rubric_text=request.rubric_text,
            professor_id=request.professor_id,
            db=db,
            student_subjects=request.student_subjects,
            student_extracurriculars=request.student_extracurriculars
        )
        return arc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Arc generation failed: {str(e)}")

@router.get("/{arc_id}", response_model=ArcResponse)
async def get_arc(arc_id: str, db: Session = Depends(get_db)):
    """Get arc details"""
    arc = db.query(Arc).filter(Arc.arc_id == arc_id).first()
    if not arc:
        raise HTTPException(status_code=404, detail="Arc not found")
    return arc

@router.post("/{arc_id}/approve")
async def approve_arc(arc_id: str, db: Session = Depends(get_db)):
    """Approve draft arc (professor review)"""
    arc = db.query(Arc).filter(Arc.arc_id == arc_id).first()
    if not arc:
        raise HTTPException(status_code=404, detail="Arc not found")
    arc.status = ArcStatus.approved
    db.commit()
    return {"status": "approved", "arc_id": arc_id}

@router.post("/{arc_id}/publish")
async def publish_arc(arc_id: str, db: Session = Depends(get_db)):
    """Publish arc to students (generates full VN scenes)"""
    arc = db.query(Arc).filter(Arc.arc_id == arc_id).first()
    if not arc:
        raise HTTPException(status_code=404, detail="Arc not found")
    arc.status = ArcStatus.published
    db.commit()
    return {"status": "published", "arc_id": arc_id}

@router.post("/scene/generate", response_model=SceneGenerationResponse)
async def generate_scene_content_endpoint(
    request: SceneGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    Generate full VN scene content with formatting tags
    Uses scene_generation.md system prompt
    """
    try:
        scene_content = await service.generate_scene_content(
            scene_id=request.scene_id,
            db=db
        )
        return SceneGenerationResponse(
            scene_id=request.scene_id,
            scene_content=scene_content,
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scene generation failed: {str(e)}")
