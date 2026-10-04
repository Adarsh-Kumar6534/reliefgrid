from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.domain import APIResponse
from app.services.dashboard_service import get_dashboard_summary

router = APIRouter()

@router.get("/summary", response_model=APIResponse)
def get_summary(db: Session = Depends(get_db)):
    summary_data = get_dashboard_summary(db)
    return APIResponse(success=True, data=summary_data)
