from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.domain import ActivityLog
from app.schemas.domain import APIResponse, ActivityLogResponse, PaginatedData

router = APIRouter()

@router.get("", response_model=APIResponse)
def list_activity(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    event_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ActivityLog)
    if event_type:
        query = query.filter(ActivityLog.event_type == event_type.upper())

    total = query.count()
    offset = (page - 1) * page_size
    activities = query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(page_size).all()

    items = [ActivityLogResponse.model_validate(a).model_dump() for a in activities]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return APIResponse(
        success=True,
        data={
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    )
