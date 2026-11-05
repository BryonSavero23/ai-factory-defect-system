import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import prediction, inspections, qdn, dashboard
from app.db.database import create_db_and_tables

app = FastAPI(
    title="AI Factory Defect Detection API",
    version="1.0.0"
)

frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


app.include_router(prediction.router, prefix="/api/v1")
app.include_router(inspections.router, prefix="/api/v1")
app.include_router(qdn.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


@app.get("/")
def home():
    return {
        "message": "AI Factory Defect Detection API is running",
        "docs": "/docs",
        "api_version": "v1"
    }