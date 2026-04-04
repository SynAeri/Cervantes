# FastAPI orchestrator for La Mancha backend
# Feature-based architecture with proper Gemini system prompt integration

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base

# Import all models to ensure they're registered with SQLAlchemy
from shared.professor import Professor
from shared.student import Student
from shared.class_model import Class
from shared.enrollment import Enrollment
from shared.character import CharacterTemplate
from features.arc.models import Arc, Scene, ArcStatus
from features.dialogue.models import ReasoningTrace, ReasoningStatus

# Import feature routers
from features.arc.routes import router as arc_router
from features.dialogue.routes import router as dialogue_router
from features.signal_extraction.routes import router as signals_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="La Mancha API",
    version="2.0.0",
    description="Backend for Gemini-powered narrative arc generation, Socratic dialogue, and reasoning signal extraction"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register feature routes
app.include_router(arc_router)
app.include_router(dialogue_router)
app.include_router(signals_router)

@app.get("/")
async def root():
    return {
        "message": "La Mancha API",
        "status": "running",
        "version": "2.0.0",
        "architecture": "feature-based",
        "features": ["arc", "dialogue", "signal_extraction"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
