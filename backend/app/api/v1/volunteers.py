from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.domain import VolunteerAvailability, User
from app.schemas.domain import VolunteerCreate, VolunteerResponse, APIResponse, UserResponse

router = APIRouter()

def format_volunteer(vol: VolunteerAvailability) -> dict:
    user_dict = UserResponse.model_validate(vol.user).model_dump() if vol.user else None
    return {
        "id": vol.id,
        "user_id": vol.user_id,
        "skills": vol.skills,
        "availability_status": vol.availability_status,
        "location": vol.location,
        "latitude": vol.latitude,
        "longitude": vol.longitude,
        "updated_at": vol.updated_at.isoformat(),
        "user": user_dict
    }

@router.get("", response_model=APIResponse)
def list_volunteers(db: Session = Depends(get_db)):
    volunteers = db.query(VolunteerAvailability).all()
    formatted = [format_volunteer(v) for v in volunteers]
    return APIResponse(success=True, data=formatted)

@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def register_volunteer(vol_in: VolunteerCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == vol_in.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": f"User with ID {vol_in.user_id} not found"}
        )
    
    existing = db.query(VolunteerAvailability).filter(VolunteerAvailability.user_id == vol_in.user_id).first()
    if existing:
        existing.skills = vol_in.skills
        existing.availability_status = vol_in.availability_status
        existing.location = vol_in.location
        existing.latitude = vol_in.latitude
        existing.longitude = vol_in.longitude
        db.commit()
        db.refresh(existing)
        return APIResponse(success=True, data=format_volunteer(existing), message="Volunteer profile updated")
    else:
        vol = VolunteerAvailability(**vol_in.model_dump())
        db.add(vol)
        db.commit()
        db.refresh(vol)
        return APIResponse(success=True, data=format_volunteer(vol), message="Volunteer registered successfully")
