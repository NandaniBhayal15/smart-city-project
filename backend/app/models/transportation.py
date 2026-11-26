"""Transportation Data model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, Float, Boolean, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class TransportationData(Base):
    __tablename__ = "transportation_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_at = Column(DateTime, nullable=False, index=True)

    traffic_density_index = Column(Float, nullable=True)       # 0-100 (100=worst)
    avg_travel_time_min = Column(Float, nullable=True)          # minutes
    public_transport_coverage = Column(Float, nullable=True)    # %
    road_quality_index = Column(Float, nullable=True)           # 0-10
    congestion_level = Column(String(50), nullable=True)        # Low/Medium/High

    source = Column(String(200), nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City", back_populates="transportation_records")
