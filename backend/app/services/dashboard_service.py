from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.domain import User, Resource, Need, Match, VolunteerAvailability

def get_dashboard_summary(db: Session) -> dict:
    total_resources = db.query(Resource).count()
    active_resources = db.query(Resource).filter(Resource.availability_status == "AVAILABLE").count()
    
    total_needs = db.query(Need).count()
    open_needs = db.query(Need).filter(Need.status == "OPEN").count()
    critical_needs = db.query(Need).filter(Need.priority == "CRITICAL", Need.status == "OPEN").count()
    
    successful_matches = db.query(Match).filter(Match.status.in_(["ACCEPTED", "COMPLETED"])).count()
    active_volunteers = db.query(VolunteerAvailability).filter(VolunteerAvailability.availability_status == "AVAILABLE").count()
    
    # Available shelter capacity (sum of quantity of SHELTER resources)
    shelter_query = db.query(func.sum(Resource.quantity)).filter(
        Resource.type == "SHELTER",
        Resource.availability_status == "AVAILABLE"
    ).scalar()
    available_shelter_capacity = float(shelter_query or 0.0)

    # Resources grouped by type
    res_type_rows = db.query(Resource.type, func.count(Resource.id)).group_by(Resource.type).all()
    resources_by_type = {r_type: count for r_type, count in res_type_rows}

    # Needs grouped by priority
    need_prio_rows = db.query(Need.priority, func.count(Need.id)).group_by(Need.priority).all()
    needs_by_priority = {prio: count for prio, count in need_prio_rows}

    # Recent activity logs
    recent_matches = db.query(Match).order_by(Match.created_at.desc()).limit(5).all()
    recent_activity = []
    for m in recent_matches:
        need = m.need
        res = m.resource
        recent_activity.append({
            "id": m.id,
            "type": "MATCH",
            "title": f"Match generated ({int(m.match_score)}% score)",
            "description": f"Resource '{res.title if res else 'Item'}' matched to Need '{need.title if need else 'Requirement'}'",
            "timestamp": m.created_at.isoformat(),
            "status": m.status
        })

    return {
        "total_resources": total_resources,
        "active_resources": active_resources,
        "total_needs": total_needs,
        "open_needs": open_needs,
        "critical_needs": critical_needs,
        "successful_matches": successful_matches,
        "active_volunteers": active_volunteers,
        "available_shelter_capacity": available_shelter_capacity,
        "resources_by_type": resources_by_type,
        "needs_by_priority": needs_by_priority,
        "recent_activity": recent_activity
    }
