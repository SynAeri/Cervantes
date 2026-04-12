# API routes for student scene tracking (progress monitoring)

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from app.backend.core.firebase import get_firestore_db
from app.backend.core.auth import get_current_user
from app.backend.features.character_mappings import service as character_mapping_service

router = APIRouter(prefix="/api/scene", tags=["scenes"])


@router.get("/{arc_id}/{scene_order}")
async def get_scene_by_order(
    arc_id: str,
    scene_order: int,
    student_id: str = None,
    db=Depends(get_firestore_db),
):
    """Get scene data by arc_id and scene_order.

    If student_id is provided, also fetches the student's assignment data
    including their assigned character variant.

    Returns the scene document with character pool information.
    Used by student dashboard to display scene content.
    """
    try:
        # Query scenes by arc_id and scene_order
        scenes_ref = db.collection("scenes")
        scenes_query = scenes_ref.where(filter=FieldFilter("arc_id", "==", arc_id)).where(filter=FieldFilter("scene_order", "==", scene_order))
        scenes_docs = scenes_query.stream()

        scene_data = None
        scene_id = None
        async for doc in scenes_docs:
            if doc.exists:
                scene_id = doc.id
                scene_data = doc.to_dict()
                break

        if not scene_data:
            raise HTTPException(
                status_code=404,
                detail=f"Scene not found for arc {arc_id}, scene_order {scene_order}"
            )

        # Fetch arc document to get location from scenes array
        print(f"DEBUG: Fetching arc document with ID: {arc_id}")
        arc_doc = await db.collection("arcs").document(arc_id).get()
        print(f"DEBUG: Arc document exists: {arc_doc.exists}")

        if arc_doc.exists:
            arc_data = arc_doc.to_dict()
            print(f"DEBUG: Arc data keys: {list(arc_data.keys())}")

            # Check if scenes is in narrative_arc instead of root level
            narrative_arc = arc_data.get("narrative_arc", {})
            print(f"DEBUG: narrative_arc keys: {list(narrative_arc.keys()) if isinstance(narrative_arc, dict) else 'not a dict'}")

            # Try to get scenes from narrative_arc first, fallback to root level
            scenes_array = narrative_arc.get("scenes", []) if isinstance(narrative_arc, dict) else arc_data.get("scenes", [])
            print(f"DEBUG: Type of scenes field: {type(scenes_array)}")
            print(f"DEBUG: Arc has {len(scenes_array)} scenes in array")
            print(f"DEBUG: Looking for scene_order={scene_order}")

            # Show all scene orders in the array
            for idx, s in enumerate(scenes_array):
                print(f"DEBUG: Scene[{idx}] - order={s.get('scene_order')}, location={s.get('location')}, scene_id={s.get('scene_id')}")

            # Find the scene in the array by scene_order
            matching_scene = next(
                (s for s in scenes_array if s.get("scene_order") == scene_order),
                None
            )

            print(f"DEBUG: Matching scene found: {matching_scene is not None}")
            if matching_scene:
                print(f"DEBUG: Matching scene location: {matching_scene.get('location')}")

            # Add location from arc's scenes array to scene_data
            if matching_scene and "location" in matching_scene:
                scene_data["location"] = matching_scene["location"]
                print(f"DEBUG: Added location to scene_data: {scene_data['location']}")
        else:
            print(f"DEBUG: Arc document {arc_id} not found")

        # If student_id provided, get their assignment and character variant
        if student_id:
            # Normalize student_id
            normalized_student_id = student_id if student_id.startswith("student_") else f"student_{student_id}"

            # Get student's assignment
            assignments_ref = db.collection("student_scene_assignments")
            assignments_query = assignments_ref.where(filter=FieldFilter("arc_id", "==", arc_id)).where(filter=FieldFilter("student_id", "==", normalized_student_id)).where(filter=FieldFilter("scene_order", "==", scene_order))
            assignments_docs = assignments_query.stream()

            assignment_data = None
            async for doc in assignments_docs:
                if doc.exists:
                    assignment_data = doc.to_dict()
                    break

            if assignment_data:
                # Get character pool for this assignment
                character_pool_id = assignment_data.get("character_pool_id")
                assigned_variant = assignment_data.get("assigned_variant")

                if character_pool_id:
                    pool_doc = await db.collection("character_pools").document(character_pool_id).get()
                    if pool_doc.exists:
                        pool_data = pool_doc.to_dict()

                        # Find the name variant that matches the assigned variant
                        name_variants = pool_data.get("name_variants", [])
                        selected_variant = next((v for v in name_variants if v.get("variant_id") == assigned_variant), None)

                        # Add character pool info to scene data
                        scene_data["assigned_character"] = {
                            "name": selected_variant.get("name") if selected_variant else pool_data.get("name_variants", [{}])[0].get("name"),
                            "gender": selected_variant.get("gender") if selected_variant else pool_data.get("name_variants", [{}])[0].get("gender"),
                            "role": pool_data.get("role"),
                            "archetype": pool_data.get("archetype"),
                            "personality_prompt": pool_data.get("personality_prompt"),
                            "voice_register": pool_data.get("voice_register"),
                            "sprite_set": pool_data.get("sprite_set", []),
                            "assigned_variant": assigned_variant
                        }

            # Apply character mapping to scene content (handles multiple characters + returning characters)
            if scene_data.get("generated_scene_content"):
                print(f"DEBUG: Applying character mapping for student {normalized_student_id}, arc {arc_id}, scene {scene_order}")

                original_content = scene_data["generated_scene_content"]

                # Show first 500 chars of original content
                print(f"DEBUG: Original scene content (first 500 chars):")
                print(original_content[:500])

                # Find and show the "Indeed" line specifically
                for line in original_content.split('\n'):
                    if 'Indeed' in line or 'quarterly' in line:
                        print(f"DEBUG: Line with 'Indeed/quarterly': {line}")

                # Get or create character mappings for this student+arc
                mappings = await character_mapping_service.get_or_create_character_mapping(
                    student_id=normalized_student_id,
                    arc_id=arc_id,
                    scene_content=original_content,
                    current_scene_order=scene_order,
                    db=db
                )

                # Apply character name replacements to scene content
                modified_content = character_mapping_service.apply_character_mapping(
                    original_content,
                    mappings
                )
                scene_data["generated_scene_content"] = modified_content

                print(f"DEBUG: Character mapping applied. {len(mappings)} characters mapped.")
                print(f"DEBUG: Modified scene content (first 500 chars):")
                print(modified_content[:500])

        return {
            "scene_id": scene_id,
            "arc_id": arc_id,
            "scene_order": scene_order,
            **scene_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch scene: {str(e)}")


@router.post("/progress/student/{student_id}/arc/{arc_id}/scene/{scene_order}/start")
async def start_scene(
    student_id: str,
    arc_id: str,
    scene_order: int,
    db=Depends(get_firestore_db),
):
    """Mark scene as started when student clicks it.

    This updates the student_scene_assignments collection with:
    - status: "started"
    - started_at: current timestamp

    Frontend should call this when the student opens a scene.
    """
    try:
        normalized_student_id = student_id if student_id.startswith("student_") else f"student_{student_id}"

        # Query by fields instead of constructed doc ID (supports both UUID and legacy scene IDs)
        q = (
            db.collection("student_scene_assignments")
            .where(filter=FieldFilter("student_id", "==", normalized_student_id))
            .where(filter=FieldFilter("arc_id", "==", arc_id))
            .where(filter=FieldFilter("scene_order", "==", scene_order))
        )
        assignment_doc_ref = None
        async for doc in q.stream():
            if doc.exists:
                assignment_doc_ref = doc.reference
                break

        if not assignment_doc_ref:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found. Student may need to be assigned to arc first."
            )

        await assignment_doc_ref.update({
            "status": "started",
            "started_at": firestore.SERVER_TIMESTAMP
        })

        return {
            "student_id": normalized_student_id,
            "arc_id": arc_id,
            "scene_order": scene_order,
            "status": "started",
            "message": "Scene marked as started"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start scene: {str(e)}")


@router.post("/progress/student/{student_id}/arc/{arc_id}/scene/{scene_order}/complete")
async def complete_scene(
    student_id: str,
    arc_id: str,
    scene_order: int,
    db=Depends(get_firestore_db),
):
    """Mark scene as completed when student finishes it.

    This updates the student_scene_assignments collection with:
    - status: "completed"
    - completed_at: current timestamp

    Frontend should call this when the student submits their final response.
    """
    try:
        normalized_student_id = student_id if student_id.startswith("student_") else f"student_{student_id}"

        # Query by fields instead of constructed doc ID (supports both UUID and legacy scene IDs)
        q = (
            db.collection("student_scene_assignments")
            .where(filter=FieldFilter("student_id", "==", normalized_student_id))
            .where(filter=FieldFilter("arc_id", "==", arc_id))
            .where(filter=FieldFilter("scene_order", "==", scene_order))
        )
        assignment_doc_ref = None
        async for doc in q.stream():
            if doc.exists:
                assignment_doc_ref = doc.reference
                break

        if not assignment_doc_ref:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found. Student may need to be assigned to arc first."
            )

        await assignment_doc_ref.update({
            "status": "completed",
            "completed_at": firestore.SERVER_TIMESTAMP
        })

        return {
            "student_id": normalized_student_id,
            "arc_id": arc_id,
            "scene_order": scene_order,
            "status": "completed",
            "message": "Scene marked as completed"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete scene: {str(e)}")


@router.get("/progress/student/{student_id}/arc/{arc_id}")
async def get_student_arc_progress(
    student_id: str,
    arc_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Get all scene progress for a student in an arc.

    Returns all assignments with their status (not_started, started, completed).
    Used by teacher dashboard to display student progress.
    """
    try:
        assignments_ref = db.collection("student_scene_assignments")
        query = assignments_ref.where("student_id", "==", student_id).where("arc_id", "==", arc_id)
        assignments_docs = query.stream()

        assignments = []
        async for doc in assignments_docs:
            if doc.exists:
                data = doc.to_dict()
                assignments.append({
                    "scene_order": data.get("scene_order"),
                    "status": data.get("status"),
                    "started_at": data.get("started_at"),
                    "completed_at": data.get("completed_at"),
                    "assigned_variant": data.get("assigned_variant"),
                })

        # Sort by scene_order
        assignments.sort(key=lambda a: a.get("scene_order", 0))

        return {
            "student_id": student_id,
            "arc_id": arc_id,
            "total_scenes": len(assignments),
            "assignments": assignments
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")


@router.get("/progress/class/{class_id}/arc/{arc_id}")
async def get_class_arc_progress(
    class_id: str,
    arc_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Get arc progress for all students in a class.

    Returns progress data for every student enrolled in the class.
    Used by teacher dashboard to see class-wide progress.
    """
    try:
        # Get all students in class
        enrollments_ref = db.collection("enrollments")
        enrollments_query = enrollments_ref.where("class_id", "==", class_id)
        enrollments_docs = enrollments_query.stream()

        student_ids = []
        async for doc in enrollments_docs:
            if doc.exists:
                student_ids.append(doc.to_dict().get("student_id"))

        # Get assignments for each student
        progress_data = []
        for student_id in student_ids:
            assignments_ref = db.collection("student_scene_assignments")
            query = assignments_ref.where("student_id", "==", student_id).where("arc_id", "==", arc_id)
            assignments_docs = query.stream()

            assignments = []
            async for doc in assignments_docs:
                if doc.exists:
                    data = doc.to_dict()
                    assignments.append({
                        "scene_order": data.get("scene_order"),
                        "status": data.get("status"),
                        "started_at": data.get("started_at"),
                        "completed_at": data.get("completed_at"),
                    })

            # Sort by scene_order
            assignments.sort(key=lambda a: a.get("scene_order", 0))

            progress_data.append({
                "student_id": student_id,
                "assignments": assignments
            })

        return {
            "class_id": class_id,
            "arc_id": arc_id,
            "total_students": len(progress_data),
            "students": progress_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get class progress: {str(e)}")
