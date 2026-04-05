# API routes for student scene tracking (progress monitoring)

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore
from app.backend.core.firebase import get_firestore_db
from app.backend.core.auth import get_current_user

router = APIRouter(prefix="/api/scenes", tags=["scenes"])


@router.post("/student/{student_id}/arc/{arc_id}/scene/{scene_order}/start")
async def start_scene(
    student_id: str,
    arc_id: str,
    scene_order: int,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Mark scene as started when student clicks it.

    This updates the student_scene_assignments collection with:
    - status: "started"
    - started_at: current timestamp

    Frontend should call this when the student opens a scene.
    """
    try:
        assignment_id = f"{student_id}_{arc_id}_scene{scene_order}"

        # Check if assignment exists
        assignment_doc = await db.collection("student_scene_assignments").document(assignment_id).get()

        if not assignment_doc.exists:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found. Student may need to be assigned to arc first."
            )

        # Update status
        await db.collection("student_scene_assignments").document(assignment_id).update({
            "status": "started",
            "started_at": firestore.SERVER_TIMESTAMP
        })

        return {
            "student_id": student_id,
            "arc_id": arc_id,
            "scene_order": scene_order,
            "status": "started",
            "message": "Scene marked as started"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start scene: {str(e)}")


@router.post("/student/{student_id}/arc/{arc_id}/scene/{scene_order}/complete")
async def complete_scene(
    student_id: str,
    arc_id: str,
    scene_order: int,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Mark scene as completed when student finishes it.

    This updates the student_scene_assignments collection with:
    - status: "completed"
    - completed_at: current timestamp

    Frontend should call this when the student submits their final response.
    """
    try:
        assignment_id = f"{student_id}_{arc_id}_scene{scene_order}"

        # Check if assignment exists
        assignment_doc = await db.collection("student_scene_assignments").document(assignment_id).get()

        if not assignment_doc.exists:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found. Student may need to be assigned to arc first."
            )

        # Update status
        await db.collection("student_scene_assignments").document(assignment_id).update({
            "status": "completed",
            "completed_at": firestore.SERVER_TIMESTAMP
        })

        return {
            "student_id": student_id,
            "arc_id": arc_id,
            "scene_order": scene_order,
            "status": "completed",
            "message": "Scene marked as completed"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete scene: {str(e)}")


@router.get("/student/{student_id}/arc/{arc_id}/progress")
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


@router.get("/class/{class_id}/arc/{arc_id}/progress")
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
