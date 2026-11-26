from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.cities import router as cities_router
from app.routers.analytics import router as analytics_router
from app.routers.comparison import router as comparison_router
from app.routers.predictions import router as predictions_router
from app.routers.recommendations import router as recommendations_router
from app.routers.reports import router as reports_router
from app.routers.uploads import router as uploads_router

__all__ = [
    "auth_router", "users_router", "cities_router", "analytics_router",
    "comparison_router", "predictions_router", "recommendations_router",
    "reports_router", "uploads_router",
]
