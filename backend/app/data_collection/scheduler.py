"""
APScheduler-based data collection scheduler.
Runs background jobs to periodically collect data for all active cities.
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.city import City
from app.data_collection.openaq import fetch_aqi_for_city
from app.data_collection.open_meteo import fetch_weather_for_city
from app.utils.logger import logger
from app.config import settings

scheduler = AsyncIOScheduler()


async def _collect_all():
    """Collect air quality and weather data for all active cities."""
    db: Session = SessionLocal()
    try:
        cities = db.query(City).filter(City.is_active == True).all()
        logger.info(f"Scheduler: starting collection for {len(cities)} cities")

        for city in cities:
            try:
                await fetch_aqi_for_city(db, city)
            except Exception as e:
                logger.error(f"AQI collection failed for {city.name}: {e}")

            try:
                await fetch_weather_for_city(db, city, days=1)
            except Exception as e:
                logger.error(f"Weather collection failed for {city.name}: {e}")

        logger.info("Scheduler: collection cycle complete")
    finally:
        db.close()


def start_scheduler():
    """Register and start the background scheduler."""
    scheduler.add_job(
        _collect_all,
        trigger=IntervalTrigger(hours=settings.DATA_COLLECT_INTERVAL_HOURS),
        id="data_collection",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(f"Scheduler started — collecting every {settings.DATA_COLLECT_INTERVAL_HOURS}h")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
