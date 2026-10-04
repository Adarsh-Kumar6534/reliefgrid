from fastapi import APIRouter
from app.api.v1.users import router as users_router
from app.api.v1.resources import router as resources_router
from app.api.v1.needs import router as needs_router
from app.api.v1.matches import router as matches_router
from app.api.v1.volunteers import router as volunteers_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.system import router as system_router
from app.api.v1.activity import router as activity_router
from app.api.v1.search import router as search_router

api_router = APIRouter()

api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(resources_router, prefix="/resources", tags=["Resources"])
api_router.include_router(needs_router, prefix="/needs", tags=["Needs"])
api_router.include_router(matches_router, prefix="/matches", tags=["Matches"])
api_router.include_router(volunteers_router, prefix="/volunteers", tags=["Volunteers"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(system_router, prefix="/system", tags=["System"])
api_router.include_router(activity_router, prefix="/activity", tags=["Activity"])
api_router.include_router(search_router, prefix="/search", tags=["Search"])
