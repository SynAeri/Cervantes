# FastAPI orchestrator for Cervantes backend
# Feature-based architecture with Firebase + Gemini + CurricuLLM

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.backend.core.firebase import init_firebase

# Import feature routers
from app.backend.features.auth.routes import router as auth_router
from app.backend.features.classes.routes import router as class_router
from app.backend.features.students.routes import router as students_router
from app.backend.features.arc.routes import router as arc_router
from app.backend.features.dialogue.routes import router as dialogue_router
from app.backend.features.signal_extraction.routes import router as signals_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize Firebase Admin SDK
    init_firebase()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="Cervantes API",
    version="3.0.0",
    description="Backend for narrative formative assessment: CurricuLLM + Gemini + Firebase",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://*.run.app",  # Cloud Run services
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register feature routes
app.include_router(auth_router)
app.include_router(class_router)
app.include_router(students_router)
app.include_router(arc_router)
app.include_router(dialogue_router)
app.include_router(signals_router)


@app.get("/")
async def root():
    return {
        "message": "Cervantes API",
        "status": "running",
        "version": "3.0.0",
        "stack": {
            "llm": "Gemini 2.5 Flash (google-genai SDK)",
            "curriculum": "CurricuLLM-AU (OpenAI-compatible)",
            "auth": "Firebase Auth",
            "database": "Firestore",
        },
        "features": ["auth", "classes", "students", "arc", "dialogue", "signal_extraction"],
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
