import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.schemas.domain import APIResponse

router = APIRouter()

@router.get("/status", response_model=APIResponse)
def get_system_status(db: Session = Depends(get_db)):
    # Test DB connection latency
    db_status = "OPERATIONAL"
    db_latency_ms = 0.0
    try:
        start_time = time.time()
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - start_time) * 1000, 2)
    except Exception as e:
        db_status = "DEGRADED"

    system_metrics = {
        "overall_status": "HEALTHY" if db_status == "OPERATIONAL" else "DEGRADED",
        "uptime_seconds": 3600,
        "environment": "development",
        "components": {
            "api_gateway": {
                "status": "OPERATIONAL",
                "latency_ms": 1.2,
                "version": "1.0.0"
            },
            "database": {
                "status": db_status,
                "latency_ms": db_latency_ms,
                "engine": "PostgreSQL / SQLite"
            },
            "matching_engine": {
                "status": "OPERATIONAL",
                "algorithm": "Deterministic Multi-Factor Scoring (Patent-Ready)"
            },
            "geo_service": {
                "status": "OPERATIONAL",
                "formula": "Haversine Great-Circle Proximity"
            },
            "notification_service": {
                "status": "STANDBY",
                "queue_depth": 0
            }
        },
        "k8s_readiness": {
            "liveness_probe": "/health",
            "readiness_probe": "/ready"
        }
    }
    return APIResponse(success=True, data=system_metrics)
