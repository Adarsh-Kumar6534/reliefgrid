from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.logging import logger
from app.api.v1.api import api_router
from app.services.seed_service import seed_database

from prometheus_fastapi_instrumentator import Instrumentator

import socket
import time
import os
import math

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# Instrument FastAPI application with Prometheus metrics endpoint
Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    should_instrument_requests_inprogress=True,
    excluded_handlers=["/metrics", "/health", "/ready"]
).instrument(app).expose(app, endpoint="/metrics", tags=["Observability"])


# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instance Identification Middleware for DevOps Load Balancing Verification
@app.middleware("http")
async def add_instance_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-ReliefGrid-Instance"] = socket.gethostname()
    return response


# Global Exception Handler for Standardized Error Format
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        error_code = detail.get("code", "HTTP_ERROR")
        error_msg = detail.get("message", "An unexpected error occurred")
    else:
        error_code = f"HTTP_{exc.status_code}"
        error_msg = str(detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": error_msg
            }
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred"
            }
        }
    )

# Root Health Probes for Kubernetes / System readiness
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "ReliefGrid Backend", "version": settings.VERSION}

@app.get("/ready", tags=["Health"])
def readiness_check():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.error(f"Readiness probe failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "database": "disconnected", "error": str(e)}
        )

# Diagnostic endpoints for DevOps load balancing and HPA verification
@app.get(f"{settings.API_V1_STR}/instance", tags=["Diagnostic"])
def get_instance_info():
    """Returns container pod hostname for load balancing verification."""
    return {
        "pod_name": socket.gethostname(),
        "hostname": socket.gethostname(),
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.get(f"{settings.API_V1_STR}/dev/load", tags=["Diagnostic"])
def generate_cpu_load(seconds: float = 1.0):
    """Controlled CPU computation generator for demonstrating HPA autoscaling under load."""
    duration = min(max(seconds, 0.1), 10.0)
    end_time = time.time() + duration
    iterations = 0
    while time.time() < end_time:
        _ = math.sqrt(12345.6789) * math.sin(iterations)
        iterations += 1
    return {
        "status": "completed",
        "duration_seconds": duration,
        "iterations": iterations,
        "pod_name": socket.gethostname()
    }

# Mount API V1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    logger.info("Initializing ReliefGrid Database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
        
    logger.info("ReliefGrid Backend initialized successfully!")
