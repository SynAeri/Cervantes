# API routes for narrative arc generation and management (Firestore version)

from typing import Annotated
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.backend.core.firebase import get_firestore_db
from app.backend.core.auth import get_current_user, require_professor
from app.backend.core.file_parser import extract_text_from_upload
from app.backend.features.arc.schemas import (
    ArcCreateRequest,
    RubricUploadResponse,
    SceneGenerationRequest,
    SceneGenerationResponse,
)
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


@router.post("/upload-rubric", response_model=RubricUploadResponse)
async def upload_rubric(
    user: Annotated[dict, Depends(require_professor)],
    file: UploadFile = File(..., description="Rubric file (PDF, DOCX, or TXT)"),
):
    """Upload a rubric document and extract its text content.

    The extracted text can then be passed to POST /api/arc/generate as rubric_text.
    Supported formats: PDF, DOCX, TXT (max 10 MB).
    """
    extracted_text = await extract_text_from_upload(file)
    return RubricUploadResponse(
        filename=file.filename or "unknown",
        text=extracted_text,
        char_count=len(extracted_text),
    )


@router.get("/class/{class_id}")
async def get_arcs_by_class(
    class_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Get all arcs for a specific class"""
    try:
        arcs_ref = db.collection("arcs")
        query = arcs_ref.where("class_id", "==", class_id)
        arcs_docs = query.stream()

        arcs = []
        async for doc in arcs_docs:
            if doc.exists:
                arc_data = doc.to_dict()
                arcs.append(arc_data)

        return arcs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch arcs: {str(e)}")


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
