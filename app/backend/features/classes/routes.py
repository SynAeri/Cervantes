# API routes for class management
# Provides endpoints for listing classes, getting class details, and tracking student progress

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.backend.core.firebase import get_firestore_db
from app.backend.core.auth import get_current_user

router = APIRouter(prefix="/api/class", tags=["classes"])


@router.get("")
async def get_all_classes(
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Get all classes for the current user with enrollment counts"""
    try:
        # Query all classes - in production, filter by professor_id from auth
        classes_ref = db.collection("classes")
        classes_docs = classes_ref.stream()

        classes = []
        async for doc in classes_docs:
            if doc.exists:
                class_data = doc.to_dict()
                # ALWAYS use Firestore document ID as the class_id for consistency
                # Store original class_id if it exists
                if "class_id" in class_data and class_data["class_id"] != doc.id:
                    class_data["original_class_id"] = class_data["class_id"]
                class_data["class_id"] = doc.id

                # Query enrollments for this class to get student IDs
                enrollments_ref = db.collection("enrollments")
                enrollments_query = enrollments_ref.where("class_id", "==", doc.id)
                enrollments_docs = enrollments_query.stream()

                student_ids = []
                async for enrollment_doc in enrollments_docs:
                    if enrollment_doc.exists:
                        enrollment_data = enrollment_doc.to_dict()
                        student_ids.append(enrollment_data.get("student_id"))

                # Add enrollment array to match expected frontend format
                class_data["enrollment"] = student_ids
                classes.append(class_data)

        return classes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch classes: {str(e)}")


@router.get("/{class_id}")
async def get_class(
    class_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Get details for a specific class by Firestore document ID with enrollments"""
    try:
        doc = await db.collection("classes").document(class_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Class not found")

        class_data = doc.to_dict()
        # ALWAYS use Firestore document ID as class_id
        if "class_id" in class_data and class_data["class_id"] != doc.id:
            class_data["original_class_id"] = class_data["class_id"]
        class_data["class_id"] = doc.id

        # Query enrollments for this class to get student IDs
        enrollments_ref = db.collection("enrollments")
        enrollments_query = enrollments_ref.where("class_id", "==", class_id)
        enrollments_docs = enrollments_query.stream()

        student_ids = []
        async for enrollment_doc in enrollments_docs:
            if enrollment_doc.exists:
                enrollment_data = enrollment_doc.to_dict()
                student_ids.append(enrollment_data.get("student_id"))

        # Add enrollment array to match expected frontend format
        class_data["enrollment"] = student_ids

        return class_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch class: {str(e)}")


@router.get("/{class_id}/progress")
async def get_class_progress(
    class_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Get progress statistics for a class (reasoning traces, completion rates, etc.)"""
    try:
        # Verify class exists
        class_doc = await db.collection("classes").document(class_id).get()
        if not class_doc.exists:
            raise HTTPException(status_code=404, detail="Class not found")

        class_data = class_doc.to_dict()
        enrollment = class_data.get("enrollment", [])

        # Get reasoning traces for all students in this class
        traces_ref = db.collection("reasoning_traces")
        traces_query = traces_ref.where("class_id", "==", class_id)
        traces_docs = traces_query.stream()

        traces = []
        async for doc in traces_docs:
            if doc.exists:
                traces.append(doc.to_dict())

        # Calculate progress statistics
        total_students = len(enrollment)
        students_with_traces = len(set(t.get("student_id") for t in traces))

        # Count by status
        mastery_count = sum(1 for t in traces if t.get("status") == "mastery")
        revised_count = sum(1 for t in traces if t.get("status") == "revised_with_scaffolding")
        critical_count = sum(1 for t in traces if t.get("status") == "critical_gap")

        return {
            "class_id": class_id,
            "total_students": total_students,
            "students_with_progress": students_with_traces,
            "total_traces": len(traces),
            "status_breakdown": {
                "mastery": mastery_count,
                "revised_with_scaffolding": revised_count,
                "critical_gap": critical_count,
            },
            "completion_rate": (students_with_traces / total_students * 100) if total_students > 0 else 0,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch progress: {str(e)}")
