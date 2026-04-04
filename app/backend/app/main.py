from fastapi import FastAPI
from app.init_db import init_db

app = FastAPI()

@app.on_event("startup")
def startup():
    init_db()

@app.get("/api/health")
def health():
    return {"status": "ok"}
