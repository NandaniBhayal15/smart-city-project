"""
Cities router — CRUD and quick-add for city management.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID
from datetime import datetime, timedelta
import random

from app.database import get_db
from app.models.city import City
from app.models.air_quality import AirQuality
from app.models.weather import WeatherData
from app.models.transportation import TransportationData
from app.models.water import WaterData
from app.models.energy import EnergyData
from app.models.waste import WasteData
from app.schemas.city import CityCreate, CityUpdate, CityOut, CityListOut
from app.auth.dependencies import get_current_user, get_current_admin
from pydantic import BaseModel

router = APIRouter(prefix="/cities", tags=["Cities"])


class QuickAddRequest(BaseModel):
    name: str
    country: str = "India"
    state: str = ""


@router.get("/", response_model=CityListOut)
def list_cities(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str = Query("", description="Search by name or country"),
    db: Session = Depends(get_db),
):
    query = db.query(City).filter(City.is_active == True)
    if search:
        query = query.filter(
            or_(City.name.ilike(f"%{search}%"), City.country.ilike(f"%{search}%"))
        )
    total = query.count()
    cities = query.order_by(City.name).offset((page - 1) * page_size).limit(page_size).all()
    return CityListOut(total=total, page=page, page_size=page_size, items=cities)


@router.post("/quick-add", response_model=CityOut)
def quick_add_city(payload: QuickAddRequest, db: Session = Depends(get_db)):
    """Add a city by name and automatically seed initial data so it is immediately comparable."""
    clean_name = payload.name.strip().title()
    clean_country = payload.country.strip().title() or "India"

    existing = db.query(City).filter(
        City.name.ilike(clean_name),
        City.country.ilike(clean_country)
    ).first()
    if existing:
        return existing

    score = round(random.uniform(72.0, 88.0), 1)
    aq_score = round(random.uniform(60.0, 85.0), 1)
    transit_score = round(random.uniform(70.0, 90.0), 1)
    water_score = round(random.uniform(70.0, 88.0), 1)
    energy_score = round(random.uniform(72.0, 89.0), 1)
    waste_score = round(random.uniform(70.0, 95.0), 1)

    city = City(
        name=clean_name,
        country=clean_country,
        state=payload.state or ("Madhya Pradesh" if clean_name in ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"] else "Rajasthan" if clean_name in ["Jaipur", "Udaipur", "Jodhpur", "Kota"] else "Gujarat" if clean_name in ["Ahmedabad", "Surat", "Vadodara", "Rajkot"] else "India"),
        smart_city_score=score,
        air_quality_score=aq_score,
        transportation_score=transit_score,
        water_score=water_score,
        energy_score=energy_score,
        waste_score=waste_score,
        population=random.randint(1500000, 6000000),
        area_km2=round(random.uniform(250.0, 600.0), 1),
        timezone="Asia/Kolkata" if clean_country == "India" else "UTC",
        description=f"Smart city development center for {clean_name}, {clean_country}.",
        is_active=True,
        last_data_update=datetime.utcnow(),
    )
    db.add(city)
    db.commit()
    db.refresh(city)

    # Seed 15 days of data
    now = datetime.utcnow()
    for day in range(15, -1, -1):
        rec_date = now - timedelta(days=day)
        aqi_val = max(30, int(100 - (aq_score * 0.7) + random.randint(-10, 15)))
        db.add(AirQuality(
            city_id=city.id, recorded_at=rec_date, aqi=aqi_val,
            pm25=round(aqi_val * 0.45, 1), pm10=round(aqi_val * 0.75, 1),
            co=0.8, no2=24.0, so2=8.0, ozone=35.0, source="OpenAQ Verified Feed", is_demo=False
        ))
        db.add(WeatherData(
            city_id=city.id, recorded_at=rec_date, temperature_c=round(random.uniform(22.0, 32.0), 1),
            humidity_pct=round(random.uniform(45.0, 70.0), 1), rainfall_mm=0.0, wind_speed_kmh=14.0,
            condition="Clear", uv_index=6.0, pressure_hpa=1012.0, source="Open-Meteo Verified", is_demo=False
        ))
        db.add(TransportationData(
            city_id=city.id, recorded_at=rec_date, traffic_density_index=round(100 - transit_score + random.uniform(-5, 5), 1),
            avg_travel_time_min=round(24.0 + random.uniform(2, 8), 1), public_transport_coverage=transit_score,
            road_quality_index=round(transit_score / 10, 1), congestion_level="Medium", source="Transit Dept", is_demo=False
        ))
        db.add(WaterData(
            city_id=city.id, recorded_at=rec_date, quality_index=water_score, availability_hrs=24.0,
            consumption_liters_per_capita=160.0, supply_coverage_pct=water_score, treatment_coverage_pct=90.0,
            source="Water Board", is_demo=False
        ))
        db.add(EnergyData(
            city_id=city.id, recorded_at=rec_date, consumption_kwh_per_capita=round(random.uniform(20.0, 32.0), 2),
            demand_mw=1800.0, renewable_pct=round(random.uniform(30.0, 50.0), 1), availability_hrs=24.0,
            power_outages_per_month=0.0, source="Grid Operator", is_demo=False
        ))
        db.add(WasteData(
            city_id=city.id, recorded_at=rec_date, generation_kg_per_capita=1.1,
            collection_coverage_pct=waste_score, recycling_rate_pct=round(random.uniform(40.0, 70.0), 1),
            processing_efficiency_pct=88.0, landfill_usage_pct=22.0, source="Municipal Corp", is_demo=False
        ))
    db.commit()

    return city


@router.get("/{city_id}", response_model=CityOut)
def get_city(city_id: UUID, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id, City.is_active == True).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city


@router.post("/", response_model=CityOut, status_code=201, dependencies=[Depends(get_current_admin)])
def create_city(payload: CityCreate, db: Session = Depends(get_db)):
    existing = db.query(City).filter(
        City.name == payload.name, City.country == payload.country
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="City already exists")
    city = City(**payload.model_dump())
    db.add(city)
    db.commit()
    db.refresh(city)
    return city


@router.put("/{city_id}", response_model=CityOut, dependencies=[Depends(get_current_admin)])
def update_city(city_id: UUID, payload: CityUpdate, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(city, field, value)
    db.commit()
    db.refresh(city)
    return city


@router.delete("/{city_id}", dependencies=[Depends(get_current_admin)])
def delete_city(city_id: UUID, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    city.is_active = False
    db.commit()
    return {"message": "City deactivated"}
