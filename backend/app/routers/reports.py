"""
Reports router — generate PDF and CSV reports for cities.
"""
import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.city import City
from app.models.air_quality import AirQuality
from app.models.weather import WeatherData
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/city/{city_id}/csv")
def city_report_csv(
    city_id: UUID,
    category: str = Query("air_quality", description="air_quality|weather"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    city = db.query(City).filter(City.id == city_id, City.is_active == True).first()
    if not city:
        raise HTTPException(404, "City not found")

    output = io.StringIO()
    writer = csv.writer(output)

    if category == "air_quality":
        records = db.query(AirQuality).filter(AirQuality.city_id == city_id).order_by(AirQuality.recorded_at).all()
        writer.writerow(["City", "Date", "AQI", "PM2.5", "PM10", "CO", "NO2", "SO2", "Ozone", "Source", "Demo"])
        for r in records:
            writer.writerow([city.name, r.recorded_at, r.aqi, r.pm25, r.pm10, r.co, r.no2, r.so2, r.ozone, r.source, r.is_demo])

    elif category == "weather":
        records = db.query(WeatherData).filter(WeatherData.city_id == city_id).order_by(WeatherData.recorded_at).all()
        writer.writerow(["City", "Date", "Temp(°C)", "Humidity(%)", "Rainfall(mm)", "Wind(km/h)", "Condition", "Source"])
        for r in records:
            writer.writerow([city.name, r.recorded_at, r.temperature_c, r.humidity_pct, r.rainfall_mm, r.wind_speed_kmh, r.condition, r.source])

    output.seek(0)
    filename = f"{city.name.replace(' ', '_')}_{category}_report.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
