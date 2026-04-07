# API routes for character mapping system
# Handles fetching student-specific character name and sprite assignments

from fastapi import APIRouter, Depends, HTTPException
from app.backend.features.character_mappings.service import get_or_create_character_mapping
from app.backend.features.character_mappings.schemas import CharacterMappingResponse
from app.backend.core.firebase import get_firestore_db
from google.cloud.firestore import AsyncClient

router = APIRouter(prefix="/api/character-mappings", tags=["character_mappings"])


@router.get("/{student_id}/{arc_id}")
async def get_character_mappings(
    student_id: str,
    arc_id: str,
    db: AsyncClient = Depends(get_firestore_db)
):
    """
    Get character mappings for a specific student and arc.
    Returns the complete mapping of character IDs to assigned names and sprites.
    """
    mapping_id = f"{student_id}_{arc_id}"
    print(f"DEBUG: Fetching character mappings for {mapping_id}")

    mapping_doc = await db.collection("student_character_mappings").document(mapping_id).get()

    if not mapping_doc.exists:
        print(f"DEBUG: No character mappings found for {mapping_id}")
        raise HTTPException(
            status_code=404,
            detail=f"No character mappings found for student {student_id} in arc {arc_id}"
        )

    data = mapping_doc.to_dict()
    print(f"DEBUG: Found character mappings: {len(data.get('character_mappings', {}))} characters")
    print(f"DEBUG: Character mappings data: {data.get('character_mappings', {})}")

    return {
        "mapping_id": data.get("mapping_id"),
        "student_id": data.get("student_id"),
        "arc_id": data.get("arc_id"),
        "character_mappings": data.get("character_mappings", {}),
        "status": "success"
    }
