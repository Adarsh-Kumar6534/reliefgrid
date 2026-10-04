from datetime import datetime
from typing import List, Optional, Any, Generic, TypeVar
from pydantic import BaseModel, EmailStr, ConfigDict

T = TypeVar("T")

# Base API Response Envelopes
class APIResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[dict] = None

class PaginatedData(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str = "DONOR"  # DONOR, VOLUNTEER, SHELTER, HOSPITAL, ADMIN
    location: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Resource Schemas
class ResourceBase(BaseModel):
    type: str  # FOOD, WATER, MEDICINE, BLOOD, CLOTHING, SHELTER, VOLUNTEER, OTHER
    title: str
    description: Optional[str] = None
    quantity: float = 1.0
    unit: str = "units"
    location: str
    latitude: float
    longitude: float
    availability_status: str = "AVAILABLE"  # AVAILABLE, RESERVED, EXHAUSTED
    expiry_date: Optional[str] = None

class ResourceCreate(ResourceBase):
    owner_id: int

class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability_status: Optional[str] = None

class ResourceResponse(ResourceBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Need Schemas
class NeedBase(BaseModel):
    type: str  # FOOD, WATER, MEDICINE, BLOOD, CLOTHING, SHELTER, VOLUNTEER, OTHER
    title: str
    description: Optional[str] = None
    quantity_required: float = 1.0
    unit: str = "units"
    location: str
    latitude: float
    longitude: float
    priority: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    status: str = "OPEN"  # OPEN, PARTIALLY_MATCHED, MATCHED, CLOSED

class NeedCreate(NeedBase):
    requester_id: int

class NeedUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    quantity_required: Optional[float] = None
    unit: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class NeedResponse(NeedBase):
    id: int
    requester_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Match Schemas
class MatchBase(BaseModel):
    need_id: int
    resource_id: int
    match_score: float
    distance: float
    status: str = "PROPOSED"  # PROPOSED, ACCEPTED, REJECTED, COMPLETED
    reason: Optional[List[str]] = []

class MatchCreate(MatchBase):
    pass

class MatchResponse(BaseModel):
    id: int
    need_id: int
    resource_id: int
    match_score: float
    distance: float
    status: str
    reason: List[str]
    created_at: datetime
    need: Optional[NeedResponse] = None
    resource: Optional[ResourceResponse] = None
    model_config = ConfigDict(from_attributes=True)

# Volunteer Availability Schemas
class VolunteerBase(BaseModel):
    skills: str
    availability_status: str = "AVAILABLE"  # AVAILABLE, BUSY, OFFLINE
    location: str
    latitude: float
    longitude: float

class VolunteerCreate(VolunteerBase):
    user_id: int

class VolunteerResponse(VolunteerBase):
    id: int
    user_id: int
    updated_at: datetime
    user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)

# Activity Log Schema
class ActivityLogResponse(BaseModel):
    id: int
    event_type: str
    title: str
    description: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Dashboard Summary Schema
class DashboardSummary(BaseModel):
    total_resources: int
    active_resources: int
    total_needs: int
    open_needs: int
    critical_needs: int
    successful_matches: int
    active_volunteers: int
    available_shelter_capacity: float
    resources_by_type: dict
    needs_by_priority: dict
    recent_activity: List[dict]
