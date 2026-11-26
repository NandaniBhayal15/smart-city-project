"""
FastAPI application entry point.

Startup sequence:
1. Create all DB tables (if not using Alembic yet)
2. Seed admin user and default data sources
3. Start background scheduler
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.utils.logger import logger

# Import all models so Base knows about them
from app.models import *  # noqa: F401, F403

# Routers
from app.routers import auth, users, cities, analytics, comparison
from app.routers import predictions, recommendations, reports, uploads


# ─── Startup / Shutdown ───────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Smart City Platform...")

    # Create tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified")

    # Seed admin user
    _seed_admin()

    # Seed default data sources
    _seed_data_sources()

    # Seed benchmark cities and initial data
    try:
        from app.seed_data import seed_cities_and_metrics
        db = SessionLocal()
        seed_cities_and_metrics(db)
        db.close()
    except Exception as e:
        logger.warning(f"City seed skipped or error: {e}")

    # Start scheduler
    from app.data_collection.scheduler import start_scheduler
    start_scheduler()

    yield

    # Shutdown
    from app.data_collection.scheduler import stop_scheduler
    stop_scheduler()
    logger.info("Smart City Platform shut down")


def _seed_admin():
    """Create the default admin user if it doesn't exist."""
    from app.models.user import User, UserRole
    from app.auth.password import hash_password

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not existing:
            admin = User(
                email=settings.ADMIN_EMAIL,
                username=settings.ADMIN_USERNAME,
                full_name="System Administrator",
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role=UserRole.admin,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
            logger.info(f"Admin user created: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


def _seed_data_sources():
    """Register default data sources."""
    from app.models.data_source import DataSource

    sources = [
        {"name": "OpenAQ", "url": "https://api.openaq.org/v2", "category": "air_quality", "api_key_required": False},
        {"name": "Open-Meteo", "url": "https://api.open-meteo.com/v1", "category": "weather", "api_key_required": False},
        {"name": "WAQI", "url": "https://api.waqi.info", "category": "air_quality", "api_key_required": True},
        {"name": "OpenWeatherMap", "url": "https://api.openweathermap.org/data/2.5", "category": "weather", "api_key_required": True},
        {"name": "World Bank Open Data", "url": "https://api.worldbank.org/v2", "category": "socioeconomic", "api_key_required": False},
    ]

    db = SessionLocal()
    try:
        for s in sources:
            existing = db.query(DataSource).filter(DataSource.name == s["name"]).first()
            if not existing:
                db.add(DataSource(**s))
        db.commit()
        logger.info("Default data sources seeded")
    finally:
        db.close()


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Smart City Intelligence & Analytics Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router,            prefix=API_PREFIX)
app.include_router(users.router,           prefix=API_PREFIX)
app.include_router(cities.router,          prefix=API_PREFIX)
app.include_router(analytics.router,       prefix=API_PREFIX)
app.include_router(comparison.router,      prefix=API_PREFIX)
app.include_router(predictions.router,     prefix=API_PREFIX)
app.include_router(recommendations.router, prefix=API_PREFIX)
app.include_router(reports.router,         prefix=API_PREFIX)
app.include_router(uploads.router,         prefix=API_PREFIX)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


# Serve uploaded files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
