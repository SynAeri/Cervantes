#!/usr/bin/env python3
# Seeds 20 mock demo student accounts and enrolls them in the demo arc
# Connects to Firestore via Firebase Admin SDK - run from repo root with nix-shell

import sys
import os
import asyncio
import uuid
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.backend.core.firebase import init_firebase, get_firestore_db

DEMO_ARC_ID = "ae8b30a5-5d48-41c4-9826-ba62ff348afe"
DEMO_STUDENT_COUNT = 20


async def seed():
    init_firebase()
    db = get_firestore_db()

    # Fetch the arc to get class_id
    arc_doc = await db.collection("arcs").document(DEMO_ARC_ID).get()
    if not arc_doc.exists:
        print(f"ERROR: Arc {DEMO_ARC_ID} not found in Firestore")
        return

    arc_data = arc_doc.to_dict()
    class_id = arc_data.get("class_id")
    print(f"Arc found: class_id={class_id}, status={arc_data.get('status')}")

    # Fetch scene list for this arc
    scenes_query = db.collection("scenes").where("arc_id", "==", DEMO_ARC_ID)
    scene_docs = scenes_query.stream()
    scenes = []
    async for doc in scene_docs:
        if doc.exists:
            scenes.append(doc.to_dict())
    scenes.sort(key=lambda s: s.get("scene_order", 0))

    if not scenes:
        print("WARNING: No scenes found for this arc. Assignments will be empty.")
    else:
        print(f"Found {len(scenes)} scenes for arc")

    # Fetch character pools for this arc - keyed by scene_order (pools don't store scene_id)
    pools_query = db.collection("character_pools").where("arc_id", "==", DEMO_ARC_ID)
    pool_docs = pools_query.stream()
    pools_by_order = {}
    async for doc in pool_docs:
        if doc.exists:
            pool = doc.to_dict()
            pools_by_order[pool.get("scene_order")] = pool
    print(f"Found character pools for {len(pools_by_order)} scenes")

    for i in range(1, DEMO_STUDENT_COUNT + 1):
        student_uid = f"student_demo_{str(i).zfill(3)}"
        student_name = f"Demo Visitor {i}"
        student_email = f"demo{str(i).zfill(3)}@cervantes-demo.edu"

        # Create user document
        user_doc = {
            "uid": student_uid,
            "full_name": student_name,
            "email": student_email,
            "role": "student",
            "student_id": f"demo{str(i).zfill(3)}",
            "is_demo": True,
        }
        await db.collection("users").document(student_uid).set(user_doc)

        # Create enrollment
        if class_id:
            enrollment_id = f"{class_id}_{student_uid}"
            enrollment_doc = {
                "class_id": class_id,
                "student_id": student_uid,
                "extracurriculars": [],
                "subjects": [],
                "enrolled_at": datetime.utcnow().isoformat(),
                "is_demo": True,
            }
            await db.collection("enrollments").document(enrollment_id).set(enrollment_doc)

        # Create scene assignments
        for scene in scenes:
            scene_id = scene.get("scene_id")
            scene_order = scene.get("scene_order", 0)
            pool = pools_by_order.get(scene_order, {})
            pool_id = pool.get("pool_id", "")

            # Assign variant A for all demo students (simplest approach)
            assignment_id = f"{student_uid}_{DEMO_ARC_ID}_{scene_id}"
            assignment_doc = {
                "assignment_id": assignment_id,
                "student_id": student_uid,
                "arc_id": DEMO_ARC_ID,
                "scene_id": scene_id,
                "scene_order": scene_order,
                "character_pool_id": pool_id,
                "assigned_variant": "A",
                "status": "not_started",
                "started_at": None,
                "completed_at": None,
            }
            await db.collection("student_scene_assignments").document(assignment_id).set(assignment_doc)

        print(f"Seeded {student_uid} with {len(scenes)} scene assignments")

    print(f"\nDone. Seeded {DEMO_STUDENT_COUNT} demo students for arc {DEMO_ARC_ID}")


if __name__ == "__main__":
    asyncio.run(seed())
