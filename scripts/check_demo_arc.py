#!/usr/bin/env python3
# Quick diagnostic - checks scenes and character pools for demo arc

import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.backend.core.firebase import init_firebase, get_firestore_db

ARC_ID = "2d684a9d-1e50-41e4-9838-82da00338258"

async def check():
    init_firebase()
    db = get_firestore_db()

    print("=== SAMPLE ASSIGNMENT (demo_001) ===")
    q = (
        db.collection("student_scene_assignments")
        .where("student_id", "==", "student_demo_001")
        .where("arc_id", "==", ARC_ID)
    )
    async for doc in q.stream():
        d = doc.to_dict()
        print(f"  scene_id={d.get('scene_id')} order={d.get('scene_order')} pool_id='{d.get('character_pool_id')}' variant={d.get('assigned_variant')}")

asyncio.run(check())
