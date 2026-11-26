"""
Predictions router — trigger ML predictions and retrieve stored results.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.models.prediction import Prediction, PredictionCategory
from app.models.city import City
from app.schemas.analytics import PredictionOut
from app.ml.aqi_predictor import predict_aqi
from app.ml.energy_forecaster import predict_energy

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.get("/", response_model=List[PredictionOut])
def list_predictions(
    city_id: UUID = Query(None),
    category: str = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Prediction).join(City, City.id == Prediction.city_id)
    if city_id:
        query = query.filter(Prediction.city_id == city_id)
    if category:
        query = query.filter(Prediction.category == category)
    results = query.order_by(Prediction.prediction_date.asc()).limit(200).all()

    output = []
    for p in results:
        city = db.query(City).filter(City.id == p.city_id).first()
        output.append(PredictionOut(
            id=p.id,
            city_id=p.city_id,
            city_name=city.name if city else "Unknown",
            category=p.category,
            predicted_value=p.predicted_value,
            prediction_date=str(p.prediction_date),
            model_name=p.model_name,
            mae=p.mae,
            confidence=p.confidence,
            notes=p.notes,
        ))
    return output


@router.post("/run/aqi/{city_id}")
def run_aqi_prediction(city_id: UUID, db: Session = Depends(get_db)):
    """Trigger AQI prediction for a city using historical data."""
    city = db.query(City).filter(City.id == city_id, City.is_active == True).first()
    if not city:
        raise HTTPException(404, "City not found")
    result = predict_aqi(db, city_id)
    return result


@router.post("/run/energy/{city_id}")
def run_energy_prediction(city_id: UUID, db: Session = Depends(get_db)):
    """Trigger energy demand prediction for a city."""
    city = db.query(City).filter(City.id == city_id, City.is_active == True).first()
    if not city:
        raise HTTPException(404, "City not found")
    result = predict_energy(db, city_id)
    return result
