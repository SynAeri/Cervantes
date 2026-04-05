# API routes for character pool management

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.backend.core.firebase import get_firestore_db
from app.backend.core.auth import get_current_user, require_professor
from app.backend.features.character_pools.schemas import PoolGenerationRequest
from app.backend.features.character_pools import service

router = APIRouter(prefix="/api/character-pools", tags=["character_pools"])


@router.post("/generate")
async def generate_pools_for_arc(
    request: PoolGenerationRequest,
    user: Annotated[dict, Depends(require_professor)],
    db=Depends(get_firestore_db),
):
    """Generate character pools for an arc (2 variants per scene).

    This is the new cost-efficient approach that generates 2 character variants
    per scene instead of per-student characters.

    Cost reduction: 10 students × 4 scenes = 40 API calls → 2 variants × 4 scenes = 8 API calls
    """
    try:
        # Get arc to find class_id
        arc_doc = await db.collection("arcs").document(request.arc_id).get()
        if not arc_doc.exists:
            raise HTTPException(status_code=404, detail="Arc not found")

        arc_data = arc_doc.to_dict()
        class_id = arc_data.get("class_id")

        pools = await service.generate_character_pools_for_arc(
            arc_id=request.arc_id,
            class_id=class_id,
            db=db,
            num_variants=request.num_variants
        )

        return {
            "arc_id": request.arc_id,
            "class_id": class_id,
            "pools_created": len(pools),
            "variants_per_pool": request.num_variants,
            "total_api_calls": len(pools) * request.num_variants,
            "pools": [p.model_dump() for p in pools]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pool generation failed: {str(e)}")


@router.post("/assign/{arc_id}/student/{student_id}")
async def assign_student_to_arc(
    arc_id: str,
    student_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Assign random character variants to a student for all scenes in an arc.

    This is called when a student first accesses an arc. It randomly assigns
    variant A or B for each scene and creates tracking records.
    """
    try:
        # Get arc to find class_id
        arc_doc = await db.collection("arcs").document(arc_id).get()
        if not arc_doc.exists:
            raise HTTPException(status_code=404, detail="Arc not found")

        arc_data = arc_doc.to_dict()
        class_id = arc_data.get("class_id")

        assignments = await service.assign_characters_to_student(
            student_id=student_id,
            arc_id=arc_id,
            class_id=class_id,
            db=db
        )

        return {
            "student_id": student_id,
            "arc_id": arc_id,
            "assignments_created": len(assignments),
            "assignments": assignments
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assignment failed: {str(e)}")


@router.get("/student/{student_id}/arc/{arc_id}/scene/{scene_order}/character")
async def get_student_character(
    student_id: str,
    arc_id: str,
    scene_order: int,
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Get the assigned character for a student's specific scene.

    This returns the character from the pool that was randomly assigned to this student.
    """
    try:
        character = await service.get_student_character_for_scene(
            student_id=student_id,
            arc_id=arc_id,
            scene_order=scene_order,
            db=db
        )

        if not character:
            raise HTTPException(
                status_code=404,
                detail="No character assignment found. Student may need to be assigned to arc first."
            )

        return {
            "student_id": student_id,
            "arc_id": arc_id,
            "scene_order": scene_order,
            "character": character
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get character: {str(e)}")


@router.get("/arc/{arc_id}")
async def get_arc_pools(
    arc_id: str,
    user: Annotated[dict, Depends(require_professor)],
    db=Depends(get_firestore_db),
):
    """Get all character pools for an arc (professor view)"""
    try:
        pools_ref = db.collection("character_pools")
        pools_query = pools_ref.where("arc_id", "==", arc_id)
        pools_docs = pools_query.stream()

        pools = []
        async for doc in pools_docs:
            if doc.exists:
                pools.append(doc.to_dict())

        # Sort by scene_order
        pools.sort(key=lambda p: p.get("scene_order", 0))

        return {
            "arc_id": arc_id,
            "total_pools": len(pools),
            "pools": pools
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get pools: {str(e)}")
