"""Prediction and Recommendation models."""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, Float, Boolean, String, DateTime, ForeignKey, Text, Date
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class PredictionCategory(str, enum.Enum):
    aqi = "aqi"
    energy = "energy"
    weather = "weather"
    city_score = "city_score"


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(SAEnum(PredictionCategory), nullable=False)
    predicted_value = Column(Float, nullable=False)
    prediction_date = Column(Date, nullable=False)           # what date the prediction is for
    model_name = Column(String(100), nullable=True)          # e.g. "LinearRegression"
    mae = Column(Float, nullable=True)                       # Mean Absolute Error
    rmse = Column(Float, nullable=True)                      # Root Mean Squared Error
    confidence = Column(Float, nullable=True)                # 0-1
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City", back_populates="predictions")


class RecommendationPriority(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)           # air_quality, water, etc.
    issue = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=False)
    priority = Column(SAEnum(RecommendationPriority), default=RecommendationPriority.medium)
    data_basis = Column(Text, nullable=True)                 # what data triggered this
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City", back_populates="recommendations")
