# API routes for narrative arc generation and management (Firestore version)

from typing import Annotated
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from google.cloud.firestore_v1.base_query import FieldFilter
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
    """Get all arcs for a specific class with scene counts"""
    try:
        arcs_ref = db.collection("arcs")
        query = arcs_ref.where("class_id", "==", class_id)
        arcs_docs = query.stream()

        arcs = []
        async for doc in arcs_docs:
            if doc.exists:
                arc_data = doc.to_dict()
                arc_id = arc_data.get("arc_id")

                # Get scene count for this arc
                scenes_ref = db.collection("scenes")
                scenes_query = scenes_ref.where("arc_id", "==", arc_id)
                scenes_docs = [s async for s in scenes_query.stream()]
                arc_data["scenes"] = [{"scene_id": s.to_dict().get("scene_id")} for s in scenes_docs if s.exists]

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
    """Get arc details with scenes"""
    doc = await db.collection("arcs").document(arc_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Arc not found")

    arc_data = doc.to_dict()

    # Fetch scenes for this arc
    scenes_ref = db.collection("scenes")
    scenes_query = scenes_ref.where("arc_id", "==", arc_id)
    scenes_docs = scenes_query.stream()

    scenes = []
    async for scene_doc in scenes_docs:
        if scene_doc.exists:
            scene_data = scene_doc.to_dict()
            scenes.append({
                "scene_id": scene_data.get("scene_id"),
                "title": scene_data.get("title", "Untitled Scene"),
                "concept_target": scene_data.get("concept_target"),
                "misconception_target": scene_data.get("misconception_target"),
                "learning_objective": scene_data.get("learning_objective"),
                "description": scene_data.get("description"),
                "setup_narration": scene_data.get("setup_narration"),
                "socratic_angles": scene_data.get("socratic_angles", []),
                "scene_type": scene_data.get("scene_type"),
                "character": scene_data.get("character"),
                "scene_order": scene_data.get("scene_order", 0),
                "generated": scene_data.get("generated", False),
                "generated_scene_content": scene_data.get("generated_scene_content"),
            })

    # Sort scenes by scene_order
    scenes.sort(key=lambda x: x.get("scene_order", 0))
    arc_data["scenes"] = scenes

    return arc_data


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
    """Publish arc to students - generates scenes, character pools, and assigns to all students"""
    from app.backend.features.character_pools import service as pool_service

    doc = await db.collection("arcs").document(arc_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Arc not found")

    arc_data = doc.to_dict()
    class_id = arc_data.get("class_id")

    # Step 1: Generate full VN scene content for all scenes
    scenes_ref = db.collection("scenes")
    scenes_query = scenes_ref.where("arc_id", "==", arc_id)
    scenes_docs = scenes_query.stream()

    generated_scenes = []
    async for scene_doc in scenes_docs:
        if scene_doc.exists:
            scene_data = scene_doc.to_dict()
            scene_id = scene_data["scene_id"]

            # Generate content for this scene
            scene_content = await service.generate_scene_content(
                scene_id=scene_id,
                db=db,
            )

            # Mark as generated (content already saved by service)
            await db.collection("scenes").document(scene_id).update({
                "generated": True
            })

            generated_scenes.append({
                "scene_id": scene_id,
                "success": True
            })

    # Step 2: Generate character name variant pools (3 variants per scene)
    character_pools = await pool_service.generate_character_pools_for_arc(
        arc_id=arc_id,
        class_id=class_id,
        db=db,
        num_variants=3
    )

    # Step 3: Get all enrolled students and assign character variants
    enrollments_ref = db.collection("enrollments")
    enrollments_query = enrollments_ref.where("class_id", "==", class_id)
    enrollments_docs = enrollments_query.stream()

    student_assignments = []
    async for enrollment_doc in enrollments_docs:
        if enrollment_doc.exists:
            enrollment_data = enrollment_doc.to_dict()
            student_id = enrollment_data.get("student_id")

            # Assign random character variants to this student
            assignments = await pool_service.assign_characters_to_student(
                student_id=student_id,
                arc_id=arc_id,
                class_id=class_id,
                db=db
            )

            student_assignments.append({
                "student_id": student_id,
                "assignments": len(assignments)
            })

    # Step 4: Mark arc as published
    await db.collection("arcs").document(arc_id).update({"status": "published"})

    return {
        "status": "published",
        "arc_id": arc_id,
        "scenes_generated": len(generated_scenes),
        "character_pools_created": len(character_pools),
        "students_assigned": len(student_assignments),
        "message": f"Arc published successfully! {len(generated_scenes)} scenes generated, {len(character_pools)} character pools created, and assigned to {len(student_assignments)} students."
    }


@router.post("/{arc_id}/check-student-access")
async def check_student_access(
    arc_id: str,
    request: dict,
    db=Depends(get_firestore_db),
):
    """Check if a student can access an arc and get their first scene assignment.

    This endpoint is called when a student enters their student ID on the arc landing page.
    It validates:
    1. Arc exists and is published
    2. Student is enrolled in the class
    3. Student has scene assignments

    Returns the status and first scene details if valid.
    """
    try:
        # Extract student_id from request body
        student_id = request.get("student_id")
        if not student_id:
            raise HTTPException(status_code=400, detail="student_id is required")

        # Step 1: Check if arc exists
        arc_doc = await db.collection("arcs").document(arc_id).get()
        if not arc_doc.exists:
            return {
                "status": "not_found",
                "message": "Arc not found"
            }

        arc_data = arc_doc.to_dict()
        arc_status = arc_data.get("status")
        class_id = arc_data.get("class_id")

        # Step 2: Check if arc is published (or still processing)
        if arc_status != "published":
            return {
                "status": "processing",
                "message": "Arc is still being generated by your professor"
            }

        # Step 3: Normalize student ID (add prefix if needed)
        normalized_student_id = student_id if student_id.startswith("student_") else f"student_{student_id}"

        # Step 4: Check if student is enrolled in this class
        enrollment_id = f"{class_id}_{normalized_student_id}"
        enrollment_doc = await db.collection("enrollments").document(enrollment_id).get()

        if not enrollment_doc.exists:
            return {
                "status": "student_not_found",
                "message": "You are not enrolled in this class"
            }

        # Step 5: Get student's scene assignments for this arc
        # Note: We query without order_by and sort in Python to avoid needing a composite index
        assignments_ref = db.collection("student_scene_assignments")
        assignments_query = assignments_ref.where(filter=FieldFilter("arc_id", "==", arc_id)).where(filter=FieldFilter("student_id", "==", normalized_student_id))
        assignments_docs = assignments_query.stream()

        assignments = []
        async for assignment_doc in assignments_docs:
            if assignment_doc.exists:
                assignments.append(assignment_doc.to_dict())

        # Debug logging
        print(f"DEBUG: Looking for assignments with arc_id={arc_id}, student_id={normalized_student_id}")
        print(f"DEBUG: Found {len(assignments)} assignments")
        if len(assignments) > 0:
            print(f"DEBUG: First assignment: {assignments[0]}")

        # Sort by scene_order in Python (avoids needing Firestore composite index)
        assignments.sort(key=lambda x: x.get("scene_order", 0))

        if not assignments:
            return {
                "status": "processing",
                "message": "Your scenes are still being assigned"
            }

        # Step 6: Get the first scene (or continue from last incomplete scene)
        first_incomplete = None
        for assignment in assignments:
            if assignment.get("status") != "completed":
                first_incomplete = assignment
                break

        if not first_incomplete:
            # All scenes completed
            first_incomplete = assignments[-1]  # Show last scene

        # Step 7: Get the scene content
        scene_id = first_incomplete.get("scene_id")

        print(f"DEBUG: first_incomplete keys: {first_incomplete.keys()}")
        print(f"DEBUG: scene_id from assignment: {scene_id}")

        # If scene_id is missing, try to extract it from assignment_id
        if not scene_id and "assignment_id" in first_incomplete:
            # assignment_id format: "student_10234567_78b92de0-f599-4d47-8d04-005c48c2e823_scene1"
            assignment_id = first_incomplete["assignment_id"]
            parts = assignment_id.split("_")
            if len(parts) >= 4:
                # Last part should be the scene_id (e.g., "scene1")
                scene_id = parts[-1]
                print(f"DEBUG: Extracted scene_id from assignment_id: {scene_id}")

        scene_data = None
        if scene_id:
            scene_doc = await db.collection("scenes").document(scene_id).get()
            if scene_doc.exists:
                scene_data = scene_doc.to_dict()
                print(f"DEBUG: Found scene data for {scene_id}")
            else:
                print(f"DEBUG: Scene document {scene_id} not found")

        return {
            "status": "ready",
            "arc_id": arc_id,
            "class_id": class_id,
            "student_id": normalized_student_id,
            "first_assignment": {**first_incomplete, "scene_id": scene_id},  # Ensure scene_id is included
            "scene_data": scene_data,
            "total_scenes": len(assignments)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check student access: {str(e)}")


@router.delete("/{arc_id}")
async def delete_arc(
    arc_id: str,
    user: Annotated[dict, Depends(require_professor)],
    db=Depends(get_firestore_db),
):
    """Delete an arc completely with cascade delete of all related data

    This cascading delete removes:
    - All scenes associated with the arc
    - All character pools for the arc
    - All student scene assignments
    - All character mappings (student character assignments)
    - All arc journals (student conversation history)
    - All arc endings (student arc completion records)
    - The arc document itself
    """
    doc = await db.collection("arcs").document(arc_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Arc not found")

    # Step 1: Delete all scenes
    scenes_ref = db.collection("scenes")
    scenes_query = scenes_ref.where("arc_id", "==", arc_id)
    scenes_docs = scenes_query.stream()

    deleted_scenes = 0
    async for scene_doc in scenes_docs:
        if scene_doc.exists:
            await db.collection("scenes").document(scene_doc.id).delete()
            deleted_scenes += 1

    # Step 2: Delete all character pools
    pools_ref = db.collection("character_pools")
    pools_query = pools_ref.where("arc_id", "==", arc_id)
    pools_docs = pools_query.stream()

    deleted_pools = 0
    async for pool_doc in pools_docs:
        if pool_doc.exists:
            await db.collection("character_pools").document(pool_doc.id).delete()
            deleted_pools += 1

    # Step 3: Delete all student scene assignments
    assignments_ref = db.collection("student_scene_assignments")
    assignments_query = assignments_ref.where("arc_id", "==", arc_id)
    assignments_docs = assignments_query.stream()

    deleted_assignments = 0
    async for assignment_doc in assignments_docs:
        if assignment_doc.exists:
            await db.collection("student_scene_assignments").document(assignment_doc.id).delete()
            deleted_assignments += 1

    # Step 4: Delete all character mappings (student character assignments)
    mappings_ref = db.collection("student_character_mappings")
    mappings_query = mappings_ref.where("arc_id", "==", arc_id)
    mappings_docs = mappings_query.stream()

    deleted_mappings = 0
    async for mapping_doc in mappings_docs:
        if mapping_doc.exists:
            await db.collection("student_character_mappings").document(mapping_doc.id).delete()
            deleted_mappings += 1

    # Step 5: Delete all arc journals (student conversation history)
    journals_ref = db.collection("arc_journals")
    journals_query = journals_ref.where("arc_id", "==", arc_id)
    journals_docs = journals_query.stream()

    deleted_journals = 0
    async for journal_doc in journals_docs:
        if journal_doc.exists:
            await db.collection("arc_journals").document(journal_doc.id).delete()
            deleted_journals += 1

    # Step 6: Delete all arc endings (student arc completion records)
    endings_ref = db.collection("arc_endings")
    endings_query = endings_ref.where("arc_id", "==", arc_id)
    endings_docs = endings_query.stream()

    deleted_endings = 0
    async for ending_doc in endings_docs:
        if ending_doc.exists:
            await db.collection("arc_endings").document(ending_doc.id).delete()
            deleted_endings += 1

    # Step 7: Delete reasoning traces for this arc (optional - may want to keep for analytics)
    # Reasoning traces don't have arc_id directly, so we'd need to query by scene_id
    # For now, we'll skip this to preserve student learning data

    # Step 8: Delete the arc itself
    await db.collection("arcs").document(arc_id).delete()

    return {
        "message": "Arc and all related data deleted successfully",
        "arc_id": arc_id,
        "deleted_scenes": deleted_scenes,
        "deleted_character_pools": deleted_pools,
        "deleted_student_assignments": deleted_assignments,
        "deleted_character_mappings": deleted_mappings,
        "deleted_arc_journals": deleted_journals,
        "deleted_arc_endings": deleted_endings,
        "note": "Reasoning traces preserved for learning analytics"
    }


@router.patch("/{arc_id}")
async def update_arc(
    arc_id: str,
    request: dict,
    user: Annotated[dict, Depends(require_professor)],
    db=Depends(get_firestore_db),
):
    """Update arc metadata, scenes, or assessed understandings"""
    doc = await db.collection("arcs").document(arc_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Arc not found")

    # Only update fields that are provided
    update_data = {}
    if "title" in request:
        update_data["title"] = request["title"]
    if "description" in request:
        update_data["description"] = request["description"]
    if "assessed_understandings" in request:
        update_data["assessed_understandings"] = request["assessed_understandings"]
    if "scenes" in request:
        update_data["scenes"] = request["scenes"]

    if update_data:
        await db.collection("arcs").document(arc_id).update(update_data)

    updated_doc = await db.collection("arcs").document(arc_id).get()
    return updated_doc.to_dict()


@router.post("/{arc_id}/generate-scenes")
async def generate_all_scenes_for_arc(
    arc_id: str,
    user: Annotated[dict, Depends(require_professor)],
    db=Depends(get_firestore_db),
):
    """Generate full VN scene content for all scenes in an arc"""
    try:
        # Get arc to find all scenes
        arc_doc = await db.collection("arcs").document(arc_id).get()
        if not arc_doc.exists:
            raise HTTPException(status_code=404, detail="Arc not found")

        arc_data = arc_doc.to_dict()

        # Get all scenes for this arc
        scenes_ref = db.collection("scenes")
        scenes_query = scenes_ref.where("arc_id", "==", arc_id)
        scenes_docs = scenes_query.stream()

        generated_scenes = []
        async for scene_doc in scenes_docs:
            if scene_doc.exists:
                scene_data = scene_doc.to_dict()
                scene_id = scene_data["scene_id"]

                # Generate content for this scene
                # Note: generate_scene_content already updates the scene document with generated_scene_content
                scene_content = await service.generate_scene_content(
                    scene_id=scene_id,
                    db=db,
                )

                # Mark as generated (content already saved by service)
                await db.collection("scenes").document(scene_id).update({
                    "generated": True
                })

                generated_scenes.append({
                    "scene_id": scene_id,
                    "success": True
                })

        return {
            "arc_id": arc_id,
            "generated_count": len(generated_scenes),
            "scenes": generated_scenes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scene generation failed: {str(e)}")


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
