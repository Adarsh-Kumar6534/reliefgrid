from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.domain import Need, User
from app.schemas.domain import NeedCreate, NeedUpdate, NeedResponse, APIResponse
from app.services.matching_engine import MatchingEngine
from app.services.activity_service import log_activity

router = APIRouter()

@router.get("", response_model=APIResponse)
def list_needs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    type: Optional[str] = Query(None, description="Filter by type"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(None, description="Search keyword"),
    db: Session = Depends(get_db)
):
    query = db.query(Need)
    if priority:
        query = query.filter(Need.priority == priority.upper())
    if type:
        query = query.filter(Need.type == type.upper())
    if status_filter:
        query = query.filter(Need.status == status_filter.upper())
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Need.title.ilike(search_fmt)) |
            (Need.location.ilike(search_fmt)) |
            (Need.description.ilike(search_fmt))
        )
        
    total = query.count()
    offset = (page - 1) * page_size
    needs = query.order_by(Need.created_at.desc()).offset(offset).limit(page_size).all()
    need_list = [NeedResponse.model_validate(n).model_dump() for n in needs]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return APIResponse(
        success=True,
        data={
            "items": need_list,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    )

@router.get("/{need_id}", response_model=APIResponse)
def get_need(need_id: int, db: Session = Depends(get_db)):
    need = db.query(Need).filter(Need.id == need_id).first()
    if not need:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NEED_NOT_FOUND", "message": f"Need with ID {need_id} not found"}
        )
    return APIResponse(success=True, data=NeedResponse.model_validate(need).model_dump())

@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_need(need_in: NeedCreate, db: Session = Depends(get_db)):
    if need_in.quantity_required <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_QUANTITY", "message": "Required quantity must be positive"}
        )

    requester = db.query(User).filter(User.id == need_in.requester_id).first()
    if not requester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": f"Requester User ID {need_in.requester_id} not found"}
        )

    need = Need(**need_in.model_dump())
    db.add(need)
    db.commit()
    db.refresh(need)

    # Log audit event
    log_activity(
        db,
        event_type="NEED_CREATED",
        title=f"Emergency Requirement Posted: {need.title}",
        description=f"Posted {need.priority} priority request for {need.quantity_required} {need.unit} at {need.location}.",
        entity_type="NEED",
        entity_id=need.id
    )

    # Automatically trigger matching engine for newly created need!
    MatchingEngine.find_matches_for_need(db, need.id)

    return APIResponse(success=True, data=NeedResponse.model_validate(need).model_dump(), message="Emergency need created and matching engine executed")

@router.put("/{need_id}", response_model=APIResponse)
def update_need(need_id: int, need_update: NeedUpdate, db: Session = Depends(get_db)):
    need = db.query(Need).filter(Need.id == need_id).first()
    if not need:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NEED_NOT_FOUND", "message": f"Need with ID {need_id} not found"}
        )
    
    update_data = need_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(need, field, value)
            
    db.commit()
    db.refresh(need)

    log_activity(
        db,
        event_type="NEED_UPDATED",
        title=f"Need Updated: {need.title}",
        description=f"Updated requirement details. Current status: {need.status}, Priority: {need.priority}.",
        entity_type="NEED",
        entity_id=need.id
    )

    return APIResponse(success=True, data=NeedResponse.model_validate(need).model_dump(), message="Need updated successfully")
