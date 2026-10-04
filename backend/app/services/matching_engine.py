import math
import json
from typing import List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models.domain import Resource, Need, Match
from app.services.activity_service import log_activity
from app.core.logging import logger

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) in kilometers.
    """
    R = 6371.0  # Earth's radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return round(distance, 2)

class MatchingEngine:
    """
    Deterministic Multi-Factor Disaster Matching Engine.
    Scoring Formula (Total: 100 points):
      1. Type Compatibility (40 pts)
      2. Geographic Proximity (20 pts)
      3. Quantity Satisfaction (20 pts)
      4. Availability Status (10 pts)
      5. Emergency Priority Boost (10 pts)
    """

    @staticmethod
    def calculate_match_score(need: Need, resource: Resource) -> Tuple[float, float, List[str]]:
        reasons = []

        # 1. Type Compatibility Check (40 Points max)
        if need.type.upper() != resource.type.upper():
            return 0.0, 0.0, ["Resource category does not match requirement"]

        reasons.append(f"Category matched: {resource.type.upper()} (+40 pts)")

        # 2. Availability Check (10 Points max)
        if resource.availability_status.upper() not in ["AVAILABLE", "RESERVED"]:
            return 0.0, 0.0, ["Resource is currently exhausted or offline"]

        reasons.append("Resource actively available (+10 pts)")

        # 3. Geographic Proximity Score (20 Points max)
        distance_km = haversine_distance(need.latitude, need.longitude, resource.latitude, resource.longitude)
        
        if distance_km <= 5.0:
            proximity_score = 20.0
            reasons.append(f"Immediate proximity: {distance_km} km away (+20 pts)")
        elif distance_km <= 15.0:
            proximity_score = 15.0
            reasons.append(f"Nearby location: {distance_km} km away (+15 pts)")
        elif distance_km <= 50.0:
            proximity_score = 10.0
            reasons.append(f"Regional proximity: {distance_km} km away (+10 pts)")
        else:
            proximity_score = 5.0
            reasons.append(f"Distant location: {distance_km} km away (+5 pts)")

        # 4. Quantity Satisfaction Score (20 Points max)
        if resource.quantity >= need.quantity_required:
            quantity_score = 20.0
            reasons.append(f"Sufficient quantity: {resource.quantity} {resource.unit} available for {need.quantity_required} required (+20 pts)")
        elif resource.quantity > 0:
            ratio = resource.quantity / max(need.quantity_required, 1.0)
            quantity_score = round(ratio * 20.0, 1)
            reasons.append(f"Partial quantity: {resource.quantity} of {need.quantity_required} {need.unit} (+{quantity_score} pts)")
        else:
            quantity_score = 0.0
            reasons.append("Resource quantity exhausted")

        # 5. Need Priority Score (10 Points max)
        priority_upper = need.priority.upper()
        if priority_upper == "CRITICAL":
            priority_score = 10.0
            reasons.append("Critical priority requirement allocation boost (+10 pts)")
        elif priority_upper == "HIGH":
            priority_score = 7.5
            reasons.append("High priority requirement boost (+7.5 pts)")
        elif priority_upper == "MEDIUM":
            priority_score = 5.0
            reasons.append("Medium priority request (+5.0 pts)")
        else:
            priority_score = 2.5
            reasons.append("Standard priority request (+2.5 pts)")

        total_score = round(min(100.0, 40.0 + 10.0 + proximity_score + quantity_score + priority_score), 1)

        return total_score, distance_km, reasons

    @classmethod
    def find_matches_for_need(cls, db: Session, need_id: int, top_n: int = 5) -> List[Match]:
        need = db.query(Need).filter(Need.id == need_id).first()
        if not need:
            return []

        candidate_resources = db.query(Resource).filter(
            Resource.type == need.type,
            Resource.availability_status.in_(["AVAILABLE", "RESERVED"])
        ).all()

        matches = []
        for resource in candidate_resources:
            score, distance, reasons = cls.calculate_match_score(need, resource)
            if score > 0:
                existing = db.query(Match).filter(
                    Match.need_id == need.id,
                    Match.resource_id == resource.id
                ).first()

                reason_json_str = json.dumps(reasons)

                if existing:
                    existing.match_score = score
                    existing.distance = distance
                    existing.reason = reason_json_str
                    matches.append(existing)
                else:
                    new_match = Match(
                        need_id=need.id,
                        resource_id=resource.id,
                        match_score=score,
                        distance=distance,
                        status="PROPOSED",
                        reason=reason_json_str
                    )
                    db.add(new_match)
                    matches.append(new_match)

        db.commit()

        matches.sort(key=lambda m: m.match_score, reverse=True)
        return matches[:top_n]

    @classmethod
    def process_match_acceptance(cls, db: Session, match_id: int) -> Match:
        """
        Processes match acceptance with quantity deduction and partial matching updates.
        """
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            return None

        match.status = "ACCEPTED"
        need = match.need
        resource = match.resource

        if need and resource:
            # Deduct quantity
            allocated_qty = min(resource.quantity, need.quantity_required)
            need.quantity_required -= allocated_qty
            resource.quantity -= allocated_qty

            if need.quantity_required <= 0:
                need.quantity_required = 0.0
                need.status = "MATCHED"
            else:
                need.status = "PARTIALLY_MATCHED"

            if resource.quantity <= 0:
                resource.quantity = 0.0
                resource.availability_status = "EXHAUSTED"
            else:
                resource.availability_status = "RESERVED"

            # Log audit activity
            log_activity(
                db,
                event_type="MATCH_ACCEPTED",
                title=f"Match Accepted ({match.match_score}% Score)",
                description=f"Allocated {allocated_qty} {resource.unit} of '{resource.title}' to Need '{need.title}'. Remaining needed: {need.quantity_required} {need.unit}.",
                entity_type="MATCH",
                entity_id=match.id,
                status="SUCCESS"
            )

        db.commit()
        db.refresh(match)
        return match
