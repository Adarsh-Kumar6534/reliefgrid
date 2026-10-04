from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    role = Column(String(30), index=True, nullable=False, default="DONOR")  # DONOR, VOLUNTEER, SHELTER, HOSPITAL, ADMIN
    location = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    resources = relationship("Resource", back_populates="owner", cascade="all, delete-orphan")
    needs = relationship("Need", back_populates="requester", cascade="all, delete-orphan")
    volunteer_profile = relationship("VolunteerAvailability", back_populates="user", uselist=False)

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), index=True, nullable=False)  # FOOD, WATER, MEDICINE, BLOOD, CLOTHING, SHELTER, VOLUNTEER, OTHER
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Float, nullable=False, default=1.0)
    unit = Column(String(30), nullable=False, default="units")
    location = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    availability_status = Column(String(30), index=True, nullable=False, default="AVAILABLE")  # AVAILABLE, RESERVED, EXHAUSTED
    expiry_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="resources")
    matches = relationship("Match", back_populates="resource")

class Need(Base):
    __tablename__ = "needs"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), index=True, nullable=False)  # FOOD, WATER, MEDICINE, BLOOD, CLOTHING, SHELTER, VOLUNTEER, OTHER
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    quantity_required = Column(Float, nullable=False, default=1.0)
    unit = Column(String(30), nullable=False, default="units")
    location = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    priority = Column(String(30), index=True, nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), index=True, nullable=False, default="OPEN")  # OPEN, PARTIALLY_MATCHED, MATCHED, CLOSED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = relationship("User", back_populates="needs")
    matches = relationship("Match", back_populates="need")

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    need_id = Column(Integer, ForeignKey("needs.id"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False, index=True)
    match_score = Column(Float, nullable=False)  # 0 to 100
    distance = Column(Float, nullable=False)  # in km
    status = Column(String(30), index=True, nullable=False, default="PROPOSED")  # PROPOSED, ACCEPTED, REJECTED, COMPLETED
    reason = Column(Text, nullable=True)  # JSON formatted list of strings explaining score
    created_at = Column(DateTime, default=datetime.utcnow)

    need = relationship("Need", back_populates="matches")
    resource = relationship("Resource", back_populates="matches")

class VolunteerAvailability(Base):
    __tablename__ = "volunteer_availability"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    skills = Column(String(255), nullable=False)  # e.g., "First Aid, Search & Rescue, Logistics"
    availability_status = Column(String(30), index=True, nullable=False, default="AVAILABLE")  # AVAILABLE, BUSY, OFFLINE
    location = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="volunteer_profile")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), index=True, nullable=False)  # RESOURCE_CREATED, NEED_CREATED, MATCH_CREATED, MATCH_ACCEPTED, etc.
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    entity_type = Column(String(50), nullable=True)  # RESOURCE, NEED, MATCH, USER, VOLUNTEER
    entity_id = Column(Integer, nullable=True)
    status = Column(String(30), nullable=False, default="COMPLETED")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
