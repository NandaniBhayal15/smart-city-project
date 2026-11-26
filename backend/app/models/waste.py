"""Waste Management Data model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, Float, Boolean, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class WasteData(Base):
    __tablename__ = "waste_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_at = Column(DateTime, nullable=False, index=True)

    generation_kg_per_capita = Column(Float, nullable=True)     # kg/person/day
    collection_coverage_pct = Column(Float, nullable=True)      # % collected
    recycling_rate_pct = Column(Float, nullable=True)           # % recycled
    processing_efficiency_pct = Column(Float, nullable=True)    # % properly processed
    landfill_usage_pct = Column(Float, nullable=True)           # % going to landfill

    source = Column(String(200), nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City", back_populates="waste_records")
