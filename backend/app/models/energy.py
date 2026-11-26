"""Energy and Electricity Data model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, Float, Boolean, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class EnergyData(Base):
    __tablename__ = "energy_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_at = Column(DateTime, nullable=False, index=True)

    consumption_kwh_per_capita = Column(Float, nullable=True)   # kWh/person
    demand_mw = Column(Float, nullable=True)                    # Total demand MW
    renewable_pct = Column(Float, nullable=True)                # % from renewables
    availability_hrs = Column(Float, nullable=True)             # hrs/day power available
    power_outages_per_month = Column(Float, nullable=True)

    source = Column(String(200), nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City", back_populates="energy_records")
