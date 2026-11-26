"""
Energy Demand Forecaster — forecasts electricity demand (kWh/capita) for next 7 days.
Uses Scikit-Learn or pure-Python regression fallback.
"""
from datetime import timedelta
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any

from app.models.energy import EnergyData
from app.models.prediction import Prediction, PredictionCategory
from app.utils.logger import logger

MIN_RECORDS = 5


def _linear_regression_fallback(X, y):
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


def predict_energy(db: Session, city_id: UUID) -> Dict[str, Any]:
    records = (
        db.query(EnergyData)
        .filter(EnergyData.city_id == city_id, EnergyData.consumption_kwh_per_capita.isnot(None))
        .order_by(EnergyData.recorded_at)
        .all()
    )

    if len(records) < MIN_RECORDS:
        return {
            "status": "insufficient_data",
            "message": f"Need at least {MIN_RECORDS} energy records, found {len(records)}.",
            "records_available": len(records),
        }

    try:
        base_date = records[0].recorded_at.date()
        X = [[(r.recorded_at.date() - base_date).days] for r in records]
        y = [float(r.consumption_kwh_per_capita) for r in records]

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
            pred_date = records[-1].recorded_at.date() + timedelta(days=i)
            pred_value = float(model.predict([[future_day]])[0])
            pred_value = max(5.0, pred_value)

            db.query(Prediction).filter(
                Prediction.city_id == city_id,
                Prediction.category == PredictionCategory.energy,
                Prediction.prediction_date == pred_date,
            ).delete()

            p = Prediction(
                city_id=city_id,
                category=PredictionCategory.energy,
                predicted_value=round(pred_value, 2),
                prediction_date=pred_date,
                model_name=model_name,
                mae=round(mae, 2),
                confidence=round(max(0.4, 1.0 - (mae / 40.0)), 2),
                notes=f"Energy demand forecast. MAE={mae:.2f}",
            )
            db.add(p)
            predictions.append({
                "date": pred_date.isoformat(),
                "predicted_kwh_per_capita": round(pred_value, 2),
                "day_name": pred_date.strftime("%A"),
            })

        db.commit()
        return {
            "status": "success",
            "model": model_name,
            "training_records": len(records),
            "mae": round(mae, 2),
            "confidence": round(max(0.4, 1.0 - (mae / 40.0)), 2),
            "predictions": predictions,
        }
    except Exception as e:
        logger.error(f"Energy prediction failed: {e}")
        return {"status": "error", "message": str(e)}
