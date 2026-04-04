# Auth routes - user registration and profile management
# Login happens on the frontend via Firebase Client SDK
# Backend only handles: registration (create user + set role), profile CRUD

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth
from app.backend.core.firebase import get_firestore_db
from app.backend.core.auth import get_current_user
from app.backend.features.auth.schemas import RegisterRequest, RegisterResponse, UserProfile

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse)
async def register_user(request: RegisterRequest, db=Depends(get_firestore_db)):
    """
    Create a new user in Firebase Auth + store profile in Firestore.
    Sets custom claims for role-based access (professor/student).
    """
    if request.role not in ("professor", "student"):
        raise HTTPException(status_code=400, detail="Role must be 'professor' or 'student'")

    try:
        # Create Firebase Auth user
        user = auth.create_user(
            email=request.email,
            password=request.password,
            display_name=request.display_name,
        )

        # Set role as custom claim
        auth.set_custom_user_claims(user.uid, {"role": request.role})

        # Store profile in Firestore
        profile_data = {
            "email": request.email,
            "display_name": request.display_name,
            "role": request.role,
            "institution": request.institution,
        }

        if request.role == "professor":
            await db.collection("professors").document(user.uid).set(profile_data)
        else:
            profile_data["subjects"] = request.subjects or []
            await db.collection("students").document(user.uid).set(profile_data)

        return RegisterResponse(
            uid=user.uid,
            email=request.email,
            role=request.role,
            display_name=request.display_name,
        )

    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Email already registered")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.get("/me", response_model=UserProfile)
async def get_my_profile(
    user: Annotated[dict, Depends(get_current_user)],
    db=Depends(get_firestore_db),
):
    """Get current user's profile from Firestore."""
    uid = user["uid"]
    role = user.get("role", "student")

    collection = "professors" if role == "professor" else "students"
    doc = await db.collection(collection).document(uid).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Profile not found")

    data = doc.to_dict()
    return UserProfile(
        uid=uid,
        email=data.get("email", user.get("email", "")),
        role=role,
        display_name=data.get("display_name", ""),
        institution=data.get("institution"),
        subjects=data.get("subjects"),
    )
