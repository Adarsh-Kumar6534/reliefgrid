from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.domain import Resource, User
from app.schemas.domain import ResourceCreate, ResourceUpdate, ResourceResponse, APIResponse
from app.services.activity_service import log_activity

router = APIRouter()

@router.get("", response_model=APIResponse)
def list_resources(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    type: Optional[str] = Query(None, description="Filter by resource type"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by availability status"),
    owner_id: Optional[int] = Query(None, description="Filter by resource owner ID"),
    search: Optional[str] = Query(None, description="Search keyword"),
    db: Session = Depends(get_db)
):
    query = db.query(Resource)
    if type:
        query = query.filter(Resource.type == type.upper())
    if status_filter:
        query = query.filter(Resource.availability_status == status_filter.upper())
    if owner_id:
        query = query.filter(Resource.owner_id == owner_id)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Resource.title.ilike(search_fmt)) |
            (Resource.location.ilike(search_fmt)) |
            (Resource.description.ilike(search_fmt))
        )
        
    total = query.count()
    offset = (page - 1) * page_size
    resources = query.order_by(Resource.created_at.desc()).offset(offset).limit(page_size).all()
    res_list = [ResourceResponse.model_validate(r).model_dump() for r in resources]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return APIResponse(
        success=True,
        data={
            "items": res_list,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    )

@router.get("/{resource_id}", response_model=APIResponse)
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": f"Resource with ID {resource_id} not found"}
        )
    return APIResponse(success=True, data=ResourceResponse.model_validate(resource).model_dump())

@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_resource(res_in: ResourceCreate, db: Session = Depends(get_db)):
    if res_in.quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_QUANTITY", "message": "Resource quantity cannot be negative"}
        )

    owner = db.query(User).filter(User.id == res_in.owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": f"Owner with User ID {res_in.owner_id} not found"}
        )

    resource = Resource(**res_in.model_dump())
    db.add(resource)
    db.commit()
    db.refresh(resource)

    # Log audit event
    log_activity(
        db,
        event_type="RESOURCE_CREATED",
        title=f"New Resource Registered: {resource.title}",
        description=f"Registered {resource.quantity} {resource.unit} of {resource.type} at {resource.location}.",
        entity_type="RESOURCE",
        entity_id=resource.id
    )

    return APIResponse(success=True, data=ResourceResponse.model_validate(resource).model_dump(), message="Resource created successfully")

@router.put("/{resource_id}", response_model=APIResponse)
def update_resource(resource_id: int, res_update: ResourceUpdate, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": f"Resource with ID {resource_id} not found"}
        )
    
    update_data = res_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            if field == "quantity" and value < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"code": "INVALID_QUANTITY", "message": "Quantity cannot be negative"}
                )
            setattr(resource, field, value)
            
    db.commit()
    db.refresh(resource)

    log_activity(
        db,
        event_type="RESOURCE_UPDATED",
        title=f"Resource Updated: {resource.title}",
        description=f"Updated resource details. Current status: {resource.availability_status}, Qty: {resource.quantity} {resource.unit}.",
        entity_type="RESOURCE",
        entity_id=resource.id
    )

    return APIResponse(success=True, data=ResourceResponse.model_validate(resource).model_dump(), message="Resource updated successfully")

@router.delete("/{resource_id}", response_model=APIResponse)
def delete_resource(resource_id: int, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": f"Resource with ID {resource_id} not found"}
        )
    
    resource.availability_status = "EXHAUSTED"
    db.commit()

    log_activity(
        db,
        event_type="RESOURCE_DEACTIVATED",
        title=f"Resource Deactivated: {resource.title}",
        description=f"Resource #{resource_id} status marked as EXHAUSTED.",
        entity_type="RESOURCE",
        entity_id=resource.id
    )

    return APIResponse(success=True, message=f"Resource {resource_id} deactivated successfully")
