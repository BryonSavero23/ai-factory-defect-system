from fastapi import FastAPI
from app.api.v1 import prediction, inspections, qdn, dashboard
from app.db.database import create_db_and_tables

app = FastAPI(
    title="AI Factory Defect Detection API",
    version="1.0.0"
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