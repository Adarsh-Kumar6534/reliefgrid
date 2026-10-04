import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.domain import Match, Need
from app.schemas.domain import MatchResponse, APIResponse, NeedResponse, ResourceResponse
from app.services.matching_engine import MatchingEngine
from app.services.activity_service import log_activity

router = APIRouter()

def format_match_dict(m: Match) -> dict:
    reasons = []
    if m.reason:
        try:
            reasons = json.loads(m.reason)
        except Exception:
            reasons = [m.reason]

    need_dict = NeedResponse.model_validate(m.need).model_dump() if m.need else None
    res_dict = ResourceResponse.model_validate(m.resource).model_dump() if m.resource else None

    return {
        "id": m.id,
        "need_id": m.need_id,
        "resource_id": m.resource_id,
        "match_score": m.match_score,
        "distance": m.distance,
        "status": m.status,
        "reason": reasons,
        "created_at": m.created_at.isoformat(),
        "need": need_dict,
        "resource": res_dict
    }

@router.get("", response_model=APIResponse)
def list_matches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(Match)
    if status_filter:
        query = query.filter(Match.status == status_filter.upper())

    total = query.count()
    offset = (page - 1) * page_size
    matches = query.order_by(Match.match_score.desc()).offset(offset).limit(page_size).all()
    formatted = [format_match_dict(m) for m in matches]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return APIResponse(
        success=True,
        data={
            "items": formatted,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    )

@router.get("/need/{need_id}", response_model=APIResponse)
def get_matches_for_need(need_id: int, db: Session = Depends(get_db)):
    need = db.query(Need).filter(Need.id == need_id).first()
    if not need:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NEED_NOT_FOUND", "message": f"Need with ID {need_id} not found"}
        )
    
    matches = MatchingEngine.find_matches_for_need(db, need_id)
    formatted = [format_match_dict(m) for m in matches]
    return APIResponse(success=True, data=formatted)

@router.post("/{match_id}/accept", response_model=APIResponse)
def accept_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "MATCH_NOT_FOUND", "message": f"Match with ID {match_id} not found"}
        )
    
    updated_match = MatchingEngine.process_match_acceptance(db, match_id)
    return APIResponse(
        success=True,
        data=format_match_dict(updated_match),
        message=f"Match accepted! Need status updated to '{updated_match.need.status}'."
    )

@router.post("/{match_id}/reject", response_model=APIResponse)
def reject_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "MATCH_NOT_FOUND", "message": f"Match with ID {match_id} not found"}
        )
    
    match.status = "REJECTED"
    db.commit()
    db.refresh(match)

    log_activity(
        db,
        event_type="MATCH_REJECTED",
        title=f"Match Rejected (#{match.id})",
        description=f"Resource match candidate #{match.resource_id} rejected for Need #{match.need_id}.",
        entity_type="MATCH",
        entity_id=match.id
    )

    return APIResponse(success=True, data=format_match_dict(match), message="Match rejected successfully")
