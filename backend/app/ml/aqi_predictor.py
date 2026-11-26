"""
AQI Predictor — forecasts future AQI using historical time-series data.
Uses Scikit-Learn LinearRegression or pure-Python OLS regression fallback.
"""
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any

from app.models.air_quality import AirQuality
from app.models.prediction import Prediction, PredictionCategory
from app.utils.logger import logger

MIN_RECORDS = 5  # Lower threshold so even new cities can generate predictions


def _linear_regression_fallback(X, y):
    """Zero-dependency pure Python Ordinary Least Squares regression."""
    n = len(X)
    x_vals = [p[0] for p in X]
    sum_x = sum(x_vals)
    sum_y = sum(y)
    sum_xx = sum(x * x for x in x_vals)
    sum_xy = sum(x * y_val for x, y_val in zip(x_vals, y))
    denom = (n * sum_xx - sum_x * sum_x)
    if denom == 0:
        slope = 0.0
        intercept = sum_y / n
    else:
        slope = (n * sum_xy - sum_x * sum_y) / denom
        intercept = (sum_y - slope * sum_x) / n

    preds = [slope * x + intercept for x in x_vals]
    mae = sum(abs(act - pred) for act, pred in zip(y, preds)) / n

    class SimpleModel:
        def predict(self, future_X):
            return [slope * f[0] + intercept for f in future_X]

    return SimpleModel(), mae


def predict_aqi(db: Session, city_id: UUID) -> Dict[str, Any]:
    records = (
        db.query(AirQuality)
        .filter(AirQuality.city_id == city_id, AirQuality.aqi.isnot(None))
        .order_by(AirQuality.recorded_at)
        .all()
    )

    if len(records) < MIN_RECORDS:
        return {
            "status": "insufficient_data",
            "message": f"Need at least {MIN_RECORDS} historical AQI records, found {len(records)}.",
            "records_available": len(records),
        }

    try:
        base_date = records[0].recorded_at.date()
        X = [[(r.recorded_at.date() - base_date).days] for r in records]
        y = [float(r.aqi) for r in records]

        model_name = "LinearRegression"
        try:
            from sklearn.linear_model import LinearRegression
            from sklearn.metrics import mean_absolute_error
            import numpy as np
            model = LinearRegression()
            model.fit(np.array(X), np.array(y))
            mae = float(mean_absolute_error(y, model.predict(np.array(X))))
        except Exception:
            model, mae = _linear_regression_fallback(X, y)
            model_name = "LinearRegression (Pure-Python Engine)"

        last_day = (records[-1].recorded_at.date() - base_date).days
        predictions = []

        for i in range(1, 8):
            future_day = last_day + i
            pred_value = float(model.predict([[future_day]])[0])
            pred_value = max(10.0, min(500.0, pred_value))
            pred_date = records[-1].recorded_at.date() + timedelta(days=i)

            db.query(Prediction).filter(
                Prediction.city_id == city_id,
                Prediction.category == PredictionCategory.aqi,
                Prediction.prediction_date == pred_date,
            ).delete()

            p = Prediction(
                city_id=city_id,
                category=PredictionCategory.aqi,
                predicted_value=round(pred_value, 1),
                prediction_date=pred_date,
                model_name=model_name,
                mae=round(mae, 2),
                confidence=round(max(0.4, 1.0 - (mae / 150.0)), 2),
                notes=f"7-day AQI trend forecast based on {len(records)} records. MAE={mae:.1f}",
            )
            db.add(p)
            predictions.append({
                "date": pred_date.isoformat(),
                "predicted_aqi": round(pred_value, 1),
                "day_name": pred_date.strftime("%A"),
            })

        db.commit()
        return {
            "status": "success",
            "model": model_name,
            "training_records": len(records),
            "mae": round(mae, 2),
            "confidence": round(max(0.4, 1.0 - (mae / 150.0)), 2),
            "predictions": predictions,
        }
    except Exception as e:
        logger.error(f"AQI prediction failed: {e}")
        return {"status": "error", "message": str(e)}
