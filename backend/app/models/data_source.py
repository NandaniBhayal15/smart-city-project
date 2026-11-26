"""Data Source and Collection Log models."""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, Boolean, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class CollectionStatus(str, enum.Enum):
    success = "success"
    error = "error"
    partial = "partial"
    running = "running"


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    url = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True)            # air_quality, weather, etc.
    api_key_required = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_fetched_at = Column(DateTime, nullable=True)
    last_status = Column(SAEnum(CollectionStatus), nullable=True)
    last_error = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    logs = relationship("DataCollectionLog", back_populates="source", cascade="all, delete-orphan")


class DataCollectionLog(Base):
    __tablename__ = "data_collection_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="SET NULL"), nullable=True)
    status = Column(SAEnum(CollectionStatus), nullable=False)
    records_fetched = Column(Integer, default=0)
    records_saved = Column(Integer, default=0)
    records_skipped = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    collected_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("DataSource", back_populates="logs")
