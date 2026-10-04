from sqlalchemy.orm import Session
from app.models.domain import ActivityLog
from app.core.logging import logger

def log_activity(
    db: Session,
    event_type: str,
    title: str,
    description: str,
    entity_type: str = None,
    entity_id: int = None,
    status: str = "COMPLETED"
) -> ActivityLog:
    """
    Logs an emergency operation activity event to the database.
    """
    try:
        activity = ActivityLog(
            event_type=event_type,
            title=title,
            description=description,
            entity_type=entity_type,
            entity_id=entity_id,
            status=status
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)
        return activity
    except Exception as e:
        logger.error(f"Failed to log activity event: {str(e)}")
        db.rollback()
        return None
