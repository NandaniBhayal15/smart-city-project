"""
Models package — import all models here so Alembic can auto-detect them.
"""
from app.models.user import User, UserRole
from app.models.city import City
from app.models.air_quality import AirQuality
from app.models.weather import WeatherData
from app.models.transportation import TransportationData
from app.models.water import WaterData
from app.models.energy import EnergyData
from app.models.waste import WasteData
from app.models.prediction import Prediction, Recommendation, PredictionCategory, RecommendationPriority
from app.models.data_source import DataSource, DataCollectionLog, CollectionStatus

__all__ = [
    "User", "UserRole",
    "City",
    "AirQuality",
    "WeatherData",
    "TransportationData",
    "WaterData",
    "EnergyData",
    "WasteData",
    "Prediction", "Recommendation", "PredictionCategory", "RecommendationPriority",
    "DataSource", "DataCollectionLog", "CollectionStatus",
]
