"""Water Management Data model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, Float, Boolean, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class WaterData(Base):
    __tablename__ = "water_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_at = Column(DateTime, nullable=False, index=True)

    quality_index = Column(Float, nullable=True)                    # 0-100
    availability_hrs = Column(Float, nullable=True)                 # hours/day
    consumption_liters_per_capita = Column(Float, nullable=True)    # liters/person/day
    supply_coverage_pct = Column(Float, nullable=True)              # % of population
    treatment_coverage_pct = Column(Float, nullable=True)           # % treated

    source = Column(String(200), nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City", back_populates="water_records")
