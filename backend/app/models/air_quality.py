"""Air Quality model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, Float, Boolean, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class AirQuality(Base):
    __tablename__ = "air_quality"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_at = Column(DateTime, nullable=False, index=True)

    # Measurements
    aqi = Column(Float, nullable=True)           # Air Quality Index
    pm25 = Column(Float, nullable=True)          # μg/m³
    pm10 = Column(Float, nullable=True)          # μg/m³
    co = Column(Float, nullable=True)            # ppm
    no2 = Column(Float, nullable=True)           # μg/m³
    so2 = Column(Float, nullable=True)           # μg/m³
    ozone = Column(Float, nullable=True)         # μg/m³

    # Metadata
    source = Column(String(200), nullable=True)  # "OpenAQ", "WAQI", "Manual", etc.
    is_demo = Column(Boolean, default=False)     # True = sample/demo data
    created_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City", back_populates="air_quality_records")
