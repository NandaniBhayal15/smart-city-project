"""
City model — core entity that all data tables reference.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, BigInteger, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class City(Base):
    __tablename__ = "cities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(200), nullable=False, index=True)
    country = Column(String(100), nullable=False)
    state = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    population = Column(BigInteger, nullable=True)
    area_km2 = Column(Float, nullable=True)
    timezone = Column(String(60), nullable=True)
    description = Column(Text, nullable=True)

    # Computed smart city score (updated by processing jobs)
    smart_city_score = Column(Float, nullable=True)
    air_quality_score = Column(Float, nullable=True)
    transportation_score = Column(Float, nullable=True)
    water_score = Column(Float, nullable=True)
    energy_score = Column(Float, nullable=True)
    waste_score = Column(Float, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_data_update = Column(DateTime, nullable=True)

    # Relationships
    air_quality_records = relationship("AirQuality", back_populates="city", cascade="all, delete-orphan")
    weather_records = relationship("WeatherData", back_populates="city", cascade="all, delete-orphan")
    transportation_records = relationship("TransportationData", back_populates="city", cascade="all, delete-orphan")
    water_records = relationship("WaterData", back_populates="city", cascade="all, delete-orphan")
    energy_records = relationship("EnergyData", back_populates="city", cascade="all, delete-orphan")
    waste_records = relationship("WasteData", back_populates="city", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="city", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="city", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<City {self.name}, {self.country}>"
