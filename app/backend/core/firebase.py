# Firebase Admin SDK initialization and Firestore client
# Provides: init_firebase(), get_db() dependency, get_auth()

import firebase_admin
from firebase_admin import credentials, firestore_async, auth
from google.cloud.firestore import AsyncClient
from app.backend.core.config import settings

_db: AsyncClient | None = None


def init_firebase():
    """Initialize Firebase Admin SDK. Call once at app startup."""
    if firebase_admin._apps:
        return  # already initialized

    if settings.GOOGLE_APPLICATION_CREDENTIALS:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app(cred, {
            "projectId": settings.FIREBASE_PROJECT_ID,
        })
    else:
        # Fall back to Application Default Credentials (for GCP-hosted envs)
        firebase_admin.initialize_app(options={
            "projectId": settings.FIREBASE_PROJECT_ID,
        })


def get_firestore_db() -> AsyncClient:
    """FastAPI dependency — returns async Firestore client."""
    global _db
    if _db is None:
        _db = firestore_async.client()
    return _db


def get_auth():
    """Return firebase_admin.auth module for token verification and user management."""
    return auth
