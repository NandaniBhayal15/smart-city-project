"""Schemas for air quality, weather, transportation, water, energy, waste."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


# ─── Air Quality ──────────────────────────────────────────────────────────────
class AirQualityCreate(BaseModel):
    city_id: UUID
    recorded_at: datetime
    aqi: Optional[float] = None
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    co: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    ozone: Optional[float] = None
    source: Optional[str] = None
    is_demo: bool = False


class AirQualityOut(AirQualityCreate):
    id: UUID
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Weather ──────────────────────────────────────────────────────────────────
class WeatherCreate(BaseModel):
    city_id: UUID
    recorded_at: datetime
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    rainfall_mm: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    condition: Optional[str] = None
    uv_index: Optional[float] = None
    pressure_hpa: Optional[float] = None
    source: Optional[str] = None
    is_demo: bool = False


class WeatherOut(WeatherCreate):
    id: UUID
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Transportation ───────────────────────────────────────────────────────────
class TransportationCreate(BaseModel):
    city_id: UUID
    recorded_at: datetime
    traffic_density_index: Optional[float] = None
    avg_travel_time_min: Optional[float] = None
    public_transport_coverage: Optional[float] = None
    road_quality_index: Optional[float] = None
    congestion_level: Optional[str] = None
    source: Optional[str] = None
    is_demo: bool = False


class TransportationOut(TransportationCreate):
    id: UUID
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Water ────────────────────────────────────────────────────────────────────
class WaterCreate(BaseModel):
    city_id: UUID
    recorded_at: datetime
    quality_index: Optional[float] = None
    availability_hrs: Optional[float] = None
    consumption_liters_per_capita: Optional[float] = None
    supply_coverage_pct: Optional[float] = None
    treatment_coverage_pct: Optional[float] = None
    source: Optional[str] = None
    is_demo: bool = False


class WaterOut(WaterCreate):
    id: UUID
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Energy ───────────────────────────────────────────────────────────────────
class EnergyCreate(BaseModel):
    city_id: UUID
    recorded_at: datetime
    consumption_kwh_per_capita: Optional[float] = None
    demand_mw: Optional[float] = None
    renewable_pct: Optional[float] = None
    availability_hrs: Optional[float] = None
    power_outages_per_month: Optional[float] = None
    source: Optional[str] = None
    is_demo: bool = False


class EnergyOut(EnergyCreate):
    id: UUID
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Waste ────────────────────────────────────────────────────────────────────
class WasteCreate(BaseModel):
    city_id: UUID
    recorded_at: datetime
    generation_kg_per_capita: Optional[float] = None
    collection_coverage_pct: Optional[float] = None
    recycling_rate_pct: Optional[float] = None
    processing_efficiency_pct: Optional[float] = None
    landfill_usage_pct: Optional[float] = None
    source: Optional[str] = None
    is_demo: bool = False


class WasteOut(WasteCreate):
    id: UUID
    created_at: datetime
    model_config = {"from_attributes": True}
