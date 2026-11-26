"""
Analytics router — dashboard stats, trends, category history.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.city import City
from app.models.air_quality import AirQuality
from app.models.weather import WeatherData
from app.models.energy import EnergyData
from app.schemas.analytics import DashboardStats, TrendOut, TrendPoint
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def to_uuid(val):
    if isinstance(val, UUID):
        return val
    try:
        return UUID(str(val).strip())
    except Exception:
        return None


@router.get("/dashboard", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    """Summary statistics for the main dashboard."""
    total_cities = db.query(City).filter(City.is_active == True).count()
    total_records = (
        db.query(AirQuality).count() +
        db.query(WeatherData).count() +
        db.query(EnergyData).count()
    )
    avg_aqi = db.query(func.avg(AirQuality.aqi)).scalar()
    avg_score = db.query(func.avg(City.smart_city_score)).filter(City.is_active == True).scalar()

    last_update = db.query(func.max(AirQuality.created_at)).scalar()

    poor_air = db.query(City).filter(
        City.air_quality_score != None,
        City.air_quality_score < 40,
        City.is_active == True,
    ).count()

    top_cities = (
        db.query(City)
        .filter(City.smart_city_score != None, City.is_active == True)
        .order_by(City.smart_city_score.desc())
        .limit(5)
        .all()
    )

    return DashboardStats(
        total_cities=total_cities,
        total_records=total_records,
        avg_aqi=round(avg_aqi, 1) if avg_aqi else None,
        avg_smart_city_score=round(avg_score, 1) if avg_score else None,
        last_data_update=last_update.isoformat() if last_update else None,
        cities_with_poor_air=poor_air,
        top_cities=[
            {"id": str(c.id), "name": c.name, "country": c.country, "score": c.smart_city_score}
            for c in top_cities
        ],
    )


@router.get("/trends/aqi", response_model=list[TrendOut])
def aqi_trends(
    city_ids: str = Query(..., description="Comma-separated city UUIDs"),
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """AQI trend data for one or more cities over the last N days."""
    raw_ids = [uid.strip() for uid in city_ids.split(",") if uid.strip()]
    since = datetime.utcnow() - timedelta(days=days)
    results = []

    for raw_id in raw_ids:
        city_uuid = to_uuid(raw_id)
        if not city_uuid:
            continue
        city = db.query(City).filter(City.id == city_uuid).first()
        if not city:
            continue
        records = (
            db.query(AirQuality)
            .filter(AirQuality.city_id == city_uuid, AirQuality.recorded_at >= since)
            .order_by(AirQuality.recorded_at)
            .all()
        )
        if not records:
            records = (
                db.query(AirQuality)
                .filter(AirQuality.city_id == city_uuid)
                .order_by(AirQuality.recorded_at.desc())
                .limit(days)
                .all()
            )
            records.reverse()

        results.append(TrendOut(
            city_id=city.id,
            city_name=city.name,
            category="air_quality",
            metric="aqi",
            unit="AQI",
            data=[TrendPoint(date=r.recorded_at.date().isoformat(), value=r.aqi) for r in records],
        ))
    return results


@router.get("/trends/weather", response_model=list[TrendOut])
def weather_trends(
    city_ids: str = Query(..., description="Comma-separated city UUIDs"),
    metric: str = Query("temperature_c", description="temperature_c|humidity_pct|rainfall_mm|wind_speed_kmh"),
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
):
    raw_ids = [uid.strip() for uid in city_ids.split(",") if uid.strip()]
    since = datetime.utcnow() - timedelta(days=days)
    valid_metrics = {"temperature_c", "humidity_pct", "rainfall_mm", "wind_speed_kmh"}
    if metric not in valid_metrics:
        from fastapi import HTTPException
        raise HTTPException(400, f"metric must be one of {valid_metrics}")

    units = {"temperature_c": "°C", "humidity_pct": "%", "rainfall_mm": "mm", "wind_speed_kmh": "km/h"}
    results = []

    for raw_id in raw_ids:
        city_uuid = to_uuid(raw_id)
        if not city_uuid:
            continue
        city = db.query(City).filter(City.id == city_uuid).first()
        if not city:
            continue
        records = (
            db.query(WeatherData)
            .filter(WeatherData.city_id == city_uuid, WeatherData.recorded_at >= since)
            .order_by(WeatherData.recorded_at)
            .all()
        )
        if not records:
            records = (
                db.query(WeatherData)
                .filter(WeatherData.city_id == city_uuid)
                .order_by(WeatherData.recorded_at.desc())
                .limit(days)
                .all()
            )
            records.reverse()

        results.append(TrendOut(
            city_id=city.id,
            city_name=city.name,
            category="weather",
            metric=metric,
            unit=units[metric],
            data=[TrendPoint(date=r.recorded_at.date().isoformat(), value=getattr(r, metric)) for r in records],
        ))
    return results
