"""City-related Pydantic schemas."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class CityCreate(BaseModel):
    name: str
    country: str
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    population: Optional[int] = None
    area_km2: Optional[float] = None
    timezone: Optional[str] = None
    description: Optional[str] = None


class CityUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    population: Optional[int] = None
    area_km2: Optional[float] = None
    timezone: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CityOut(BaseModel):
    id: UUID
    name: str
    country: str
    state: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    population: Optional[int]
    area_km2: Optional[float]
    timezone: Optional[str]
    description: Optional[str]
    smart_city_score: Optional[float]
    air_quality_score: Optional[float]
    transportation_score: Optional[float]
    water_score: Optional[float]
    energy_score: Optional[float]
    waste_score: Optional[float]
    is_active: bool
    last_data_update: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class CityListOut(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[CityOut]
