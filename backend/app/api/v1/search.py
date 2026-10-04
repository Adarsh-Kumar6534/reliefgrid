from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.domain import Resource, Need, User, VolunteerAvailability
from app.schemas.domain import APIResponse, ResourceResponse, NeedResponse, UserResponse

router = APIRouter()

@router.get("", response_model=APIResponse)
def global_search(
    q: str = Query(..., min_length=1, description="Search query string"),
    db: Session = Depends(get_db)
):
    query_str = f"%{q}%"

    # Search Resources
    matched_resources = db.query(Resource).filter(
        or_(
            Resource.title.ilike(query_str),
            Resource.location.ilike(query_str),
            Resource.type.ilike(query_str),
            Resource.description.ilike(query_str)
        )
    ).limit(10).all()

    # Search Needs
    matched_needs = db.query(Need).filter(
        or_(
            Need.title.ilike(query_str),
            Need.location.ilike(query_str),
            Need.type.ilike(query_str),
            Need.description.ilike(query_str)
        )
    ).limit(10).all()

    # Search Volunteers
    matched_volunteers = db.query(VolunteerAvailability).filter(
        or_(
            VolunteerAvailability.location.ilike(query_str),
            VolunteerAvailability.skills.ilike(query_str)
        )
    ).limit(10).all()

    # Search Organizations/Shelters Users
    matched_users = db.query(User).filter(
        or_(
            User.name.ilike(query_str),
            User.location.ilike(query_str),
            User.role.ilike(query_str)
        )
    ).limit(10).all()

    return APIResponse(
        success=True,
        data={
            "query": q,
            "resources": [ResourceResponse.model_validate(r).model_dump() for r in matched_resources],
            "needs": [NeedResponse.model_validate(n).model_dump() for n in matched_needs],
            "volunteers_count": len(matched_volunteers),
            "organizations_count": len(matched_users)
        }
    )
