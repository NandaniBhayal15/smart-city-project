"""Analytics and comparison schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from uuid import UUID


class CategoryScore(BaseModel):
    category: str
    score: Optional[float]         # 0-100
    data_points: int
    has_sufficient_data: bool
    label: str                     # e.g. "Good", "Poor"


class CityComparisonOut(BaseModel):
    city_a: Dict[str, Any]
    city_b: Dict[str, Any]
    scores: Dict[str, Dict[str, Any]]    # category → {city_a_score, city_b_score, winner}
    overall_winner: Optional[str]        # city name or None if insufficient data
    notes: List[str]                     # data warnings
    ai_summary: Optional[str] = None     # Complete analytical narrative
    analytical_analysis: Optional[Dict[str, str]] = None  # Structured paragraphs


class TrendPoint(BaseModel):
    date: str
    value: Optional[float]


class TrendOut(BaseModel):
    city_id: UUID
    city_name: str
    category: str
    metric: str
    unit: str
    data: List[TrendPoint]


class DashboardStats(BaseModel):
    total_cities: int
    total_records: int
    avg_aqi: Optional[float]
    avg_smart_city_score: Optional[float]
    last_data_update: Optional[str]
    cities_with_poor_air: int
    top_cities: List[Dict[str, Any]]


class PredictionOut(BaseModel):
    id: UUID
    city_id: UUID
    city_name: str
    category: str
    predicted_value: float
    prediction_date: str
    model_name: Optional[str]
    mae: Optional[float]
    confidence: Optional[float]
    notes: Optional[str]

    model_config = {"from_attributes": True}


class RecommendationOut(BaseModel):
    id: UUID
    city_id: UUID
    city_name: str
    category: str
    issue: str
    suggestion: str
    priority: str
    data_basis: Optional[str]

    model_config = {"from_attributes": True}
