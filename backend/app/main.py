from fastapi import FastAPI
from app.routes import prediction, inspections, qdn, dashboard
from app.db.database import create_db_and_tables

app = FastAPI(
    title="AI Factory Defect Detection API",
    version="1.0.0"
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


app.include_router(prediction.router)
app.include_router(inspections.router)
app.include_router(qdn.router)
app.include_router(dashboard.router)


@app.get("/")
def home():
    return {
        "message": "AI Factory Defect Detection API is running"
    }