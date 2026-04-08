# Student endpoints - fetches student data from Firestore
# Connects to: users, enrollments, reasoning_traces collections

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Optional
from datetime import datetime
from app.backend.core.firebase import get_firestore_db
from app.backend.core.auth import get_current_user

import logging

router = APIRouter(prefix="/api/students", tags=["students"])
logger = logging.getLogger(__name__)

@router.get("")
async def get_all_students(current_user: dict = Depends(get_current_user)):
    """Get all students across all classes"""
    db = get_firestore_db()

    # Get all users with role="student"
    users_ref = db.collection("users")
    students_query = users_ref.where("role", "==", "student")
    students_docs = students_query.stream()

    students = []
    async for doc in students_docs:
        if doc.exists:
            student_data = doc.to_dict()
            # Use uid as the student identifier (matches enrollments.student_id)
            student_uid = student_data.get("uid")

            # Get enrollments for this student
            enrollments_ref = db.collection("enrollments")
            enrollments_query = enrollments_ref.where("student_id", "==", student_uid)
            enrollments_docs = enrollments_query.stream()

            enrollments = []
            async for enr_doc in enrollments_docs:
                if enr_doc.exists:
                    enr_data = enr_doc.to_dict()
                    class_id = enr_data.get("class_id")

                    # Get class name
                    class_doc = await db.collection("classes").document(class_id).get()
                    class_name = class_doc.to_dict().get("name") if class_doc.exists else class_id

                    enrollments.append({
                        "class_id": class_id,
                        "class_name": class_name,
                        "enrolled_at": enr_data.get("enrolled_at")
                    })

            students.append({
                "student_id": student_uid,
                "uid": student_uid,
                "full_name": student_data.get("full_name"),
                "email": student_data.get("email"),
                "enrollments": enrollments
            })

    return students


@router.get("/{student_id}")
async def get_student_detail(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed information for a specific student"""
    db = get_firestore_db()

    # Get student from users collection
    users_ref = db.collection("users")
    students_query = users_ref.where("student_id", "==", student_id).limit(1)
    students_docs = students_query.stream()

    student_data = None
    async for doc in students_docs:
        if doc.exists:
            student_data = doc.to_dict()
            break

    if not student_data:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get enrollments
    enrollments_ref = db.collection("enrollments")
    enrollments_query = enrollments_ref.where("student_id", "==", student_id)
    enrollments_docs = enrollments_query.stream()

    enrollments = []
    async for enr_doc in enrollments_docs:
        if enr_doc.exists:
            enr_data = enr_doc.to_dict()
            class_id = enr_data.get("class_id")

            # Get class details
            class_doc = await db.collection("classes").document(class_id).get()
            class_name = class_doc.to_dict().get("name") if class_doc.exists else class_id

            enrollments.append({
                "class_id": class_id,
                "class_name": class_name,
                "enrolled_at": enr_data.get("enrolled_at"),
                "extracurriculars": enr_data.get("extracurriculars", []),
                "subjects": enr_data.get("subjects", [])
            })

    return {
        "student_id": student_id,
        "uid": student_data.get("uid"),
        "full_name": student_data.get("full_name"),
        "email": student_data.get("email"),
        "enrollments": enrollments
    }


@router.get("/class/{class_id}")
async def get_class_students(class_id: str, current_user: dict = Depends(get_current_user)):
    """Get all students enrolled in a specific class with progress data"""
    db = get_firestore_db()

    # Verify class exists
    class_doc = await db.collection("classes").document(class_id).get()
    if not class_doc.exists:
        raise HTTPException(status_code=404, detail="Class not found")

    # Get enrollments for this class
    enrollments_ref = db.collection("enrollments")
    enrollments_query = enrollments_ref.where("class_id", "==", class_id)
    enrollments_docs = enrollments_query.stream()

    students = []
    async for enr_doc in enrollments_docs:
        if enr_doc.exists:
            enr_data = enr_doc.to_dict()
            student_id = enr_data.get("student_id")

            # Get student details from users collection
            # Note: student_id from enrollments matches uid in users collection
            student_doc = await db.collection("users").document(student_id).get()

            if not student_doc.exists:
                continue

            student_data = student_doc.to_dict()

            # Get reasoning traces for this student and class to calculate progress
            # Note: reasoning_traces collection is currently empty
            traces_ref = db.collection("reasoning_traces")
            traces_query = traces_ref.where("student_id", "==", student_id).where("class_id", "==", class_id)
            traces_docs = traces_query.stream()

            total_traces = 0
            mastery_count = 0
            misconception_count = 0
            critical_count = 0
            dimensions_scores = {}
            last_active = None
            scenes_completed = 0

            async for trace_doc in traces_docs:
                if trace_doc.exists:
                    trace_data = trace_doc.to_dict()
                    total_traces += 1

                    # Track status
                    status = trace_data.get("status")
                    if status == "mastery":
                        mastery_count += 1
                    elif status == "misconception":
                        misconception_count += 1
                    elif status == "critical":
                        critical_count += 1

                    # Track dimension scores
                    dimension = trace_data.get("rubric_dimension")
                    score = trace_data.get("score", 0)
                    if dimension:
                        if dimension not in dimensions_scores:
                            dimensions_scores[dimension] = []
                        dimensions_scores[dimension].append(score)

                    # Track last active
                    timestamp = trace_data.get("timestamp")
                    if timestamp and (not last_active or timestamp > last_active):
                        last_active = timestamp

                    scenes_completed += 1

            # Calculate average dimension scores
            dimensions = {}
            for dim, scores in dimensions_scores.items():
                dimensions[dim] = round(sum(scores) / len(scores)) if scores else 0

            # Calculate overall progress (0-100)
            if total_traces > 0:
                progress = round((mastery_count * 100 + misconception_count * 50) / total_traces)
            else:
                progress = 0

            # Determine arc status
            if critical_count > 0:
                arc_status = "flagged"
            elif total_traces == 0:
                arc_status = "not_started"
            elif progress >= 80:
                arc_status = "complete"
            else:
                arc_status = "in_progress"

            # Format last active
            if last_active:
                now = datetime.now()
                diff = now - last_active
                if diff.seconds < 3600:
                    last_active_str = f"{diff.seconds // 60}m ago"
                elif diff.seconds < 86400:
                    last_active_str = f"{diff.seconds // 3600}h ago"
                else:
                    last_active_str = f"{diff.days}d ago"
            else:
                last_active_str = "Never"

            students.append({
                "student_id": student_id,
                "student_name": student_data.get("full_name"),
                "email": student_data.get("email"),
                "progress": progress,
                "dimensions": dimensions,
                "arc_status": arc_status,
                "scenes_completed": scenes_completed,
                "total_scenes": 5,  # Default, should come from arc configuration
                "last_active": last_active_str,
                "enrollment": {
                    "enrolled_at": enr_data.get("enrolled_at"),
                    "extracurriculars": enr_data.get("extracurriculars", []),
                    "subjects": enr_data.get("subjects", [])
                }
            })

    return students


@router.get("/{student_id}/reasoning-traces")
async def get_student_reasoning_traces(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get all reasoning traces for a student across all scenes (compatibility endpoint)"""
    db = get_firestore_db()

    try:
        traces_ref = db.collection("reasoning_traces")
        traces_query = traces_ref.where("student_id", "==", student_id).order_by("created_at", direction="DESCENDING")
        traces_docs = traces_query.stream()

        traces = []
        async for doc in traces_docs:
            if doc.exists:
                traces.append(doc.to_dict())

        return traces

    except Exception as e:
        logger.error(f"Failed to get reasoning traces for student {student_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get reasoning traces: {str(e)}"
        )


@router.get("/{student_id}/arc-journals")
async def get_student_arc_journals(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get all arc journal entries for a student"""
    db = get_firestore_db()

    try:
        journals_ref = db.collection("arc_journals")
        journals_query = journals_ref.where("student_id", "==", student_id)
        journals_docs = journals_query.stream()

        journals = []
        async for doc in journals_docs:
            if doc.exists:
                journals.append(doc.to_dict())

        return journals

    except Exception as e:
        logger.error(f"Failed to get arc journals for student {student_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get arc journals: {str(e)}"
        )


@router.get("/recent-activity")
async def get_recent_activity(current_user: dict = Depends(get_current_user), limit: int = 10):
    """Get recent student activity across all professor's classes"""
    db = get_firestore_db()
    professor_id = current_user.get("uid")

    try:
        from google.cloud.firestore import FieldFilter

        # Get all classes for this professor
        classes_ref = db.collection("classes")
        classes_query = classes_ref.where(filter=FieldFilter("professor_id", "==", professor_id))
        classes_docs = classes_query.stream()

        class_ids = []
        async for doc in classes_docs:
            if doc.exists:
                class_ids.append(doc.id)

        if not class_ids:
            return []

        # Collect recent completions from student_scene_assignments
        activities = []

        for class_id in class_ids:
            # Get enrollments for this class
            enrollments_ref = db.collection("enrollments")
            enrollments_query = enrollments_ref.where(filter=FieldFilter("class_id", "==", class_id))
            enrollments_docs = enrollments_query.stream()

            student_ids = []
            async for doc in enrollments_docs:
                if doc.exists:
                    student_ids.append(doc.to_dict().get("student_id"))

            # Get recent scene completions for each student
            for student_id in student_ids:
                assignments_ref = db.collection("student_scene_assignments")
                assignments_query = (
                    assignments_ref
                    .where(filter=FieldFilter("student_id", "==", student_id))
                    .where(filter=FieldFilter("status", "==", "completed"))
                    .order_by("completed_at", direction="DESCENDING")
                    .limit(5)
                )
                assignments_docs = assignments_query.stream()

                async for doc in assignments_docs:
                    if doc.exists:
                        assignment_data = doc.to_dict()
                        completed_at = assignment_data.get("completed_at")

                        # Get student name
                        student_doc = await db.collection("users").document(student_id).get()
                        student_name = student_doc.to_dict().get("full_name", "Unknown") if student_doc.exists else "Unknown"

                        activities.append({
                            "type": "scene_completed",
                            "student_id": student_id,
                            "student_name": student_name,
                            "class_id": class_id,
                            "scene_order": assignment_data.get("scene_order"),
                            "arc_id": assignment_data.get("arc_id"),
                            "timestamp": completed_at,
                        })

        # Sort by timestamp descending and limit
        activities.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
        return activities[:limit]

    except Exception as e:
        logger.error(f"Failed to get recent activity: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recent activity: {str(e)}"
        )
