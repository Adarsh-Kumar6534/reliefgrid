from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.domain import User
from app.schemas.domain import UserCreate, UserResponse, APIResponse

router = APIRouter()

@router.get("", response_model=APIResponse)
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    user_responses = [UserResponse.model_validate(u) for u in users]
    return APIResponse(success=True, data=[u.model_dump() for u in user_responses])

@router.get("/{user_id}", response_model=APIResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": f"User with ID {user_id} not found"}
        )
    return APIResponse(success=True, data=UserResponse.model_validate(user).model_dump())

@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMAIL_ALREADY_EXISTS", "message": "User with this email already exists"}
        )
    user = User(**user_in.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return APIResponse(success=True, data=UserResponse.model_validate(user).model_dump(), message="User created successfully")
