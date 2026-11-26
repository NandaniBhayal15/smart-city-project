"""
Open-Meteo API collector — fetches real weather data.
API: https://open-meteo.com/en/docs
Completely free, no API key required.
"""
import httpx
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.config import settings
from app.models.weather import WeatherData
from app.models.city import City
from app.models.data_source import DataCollectionLog, CollectionStatus
from app.utils.logger import logger

METEO_URL = settings.OPEN_METEO_API_URL

WMO_CONDITIONS = {
    0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing Rime Fog",
    51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
    61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
    71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
    80: "Slight Showers", 81: "Moderate Showers", 82: "Violent Showers",
    95: "Thunderstorm", 96: "Thunderstorm with Hail",
}


async def fetch_weather_for_city(db: Session, city: City, days: int = 7) -> dict:
    """
    Fetch hourly weather data from Open-Meteo for the last N days.
    """
    if city.latitude is None or city.longitude is None:
        return {"status": "error", "error": "City has no coordinates"}

    fetched = 0; saved = 0
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    try:
        params = {
            "latitude": city.latitude,
            "longitude": city.longitude,
            "hourly": "temperature_2m,relativehumidity_2m,precipitation,windspeed_10m,weathercode,surface_pressure,uv_index",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "timezone": city.timezone or "auto",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(f"{METEO_URL}/forecast", params=params)
            resp.raise_for_status()
            data = resp.json()

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        humidity = hourly.get("relativehumidity_2m", [])
        rainfall = hourly.get("precipitation", [])
        wind = hourly.get("windspeed_10m", [])
        codes = hourly.get("weathercode", [])
        pressure = hourly.get("surface_pressure", [])
        uv = hourly.get("uv_index", [])

        fetched = len(times)

        for i, time_str in enumerate(times):
            try:
                recorded_at = datetime.fromisoformat(time_str)
            except ValueError:
                continue

            # Check for duplicate
            existing = db.query(WeatherData).filter(
                WeatherData.city_id == city.id,
                WeatherData.recorded_at == recorded_at,
                WeatherData.source == "Open-Meteo",
            ).first()
            if existing:
                continue

            def _safe(lst, idx):
                try:
                    v = lst[idx]
                    return None if v is None else float(v)
                except (IndexError, TypeError):
                    return None

            code = int(codes[i]) if i < len(codes) and codes[i] is not None else None
            condition = WMO_CONDITIONS.get(code, "Unknown") if code is not None else None

            record = WeatherData(
                city_id=city.id,
                recorded_at=recorded_at,
                temperature_c=_safe(temps, i),
                humidity_pct=_safe(humidity, i),
                rainfall_mm=_safe(rainfall, i),
                wind_speed_kmh=_safe(wind, i),
                condition=condition,
                pressure_hpa=_safe(pressure, i),
                uv_index=_safe(uv, i),
                source="Open-Meteo",
                is_demo=False,
            )
            db.add(record)
            saved += 1

        db.commit()
        city.last_data_update = datetime.utcnow()
        db.commit()

        logger.info(f"Open-Meteo: {city.name} — fetched={fetched}, saved={saved}")
        return {"status": "success", "fetched": fetched, "saved": saved}

    except Exception as e:
        logger.error(f"Open-Meteo fetch failed for {city.name}: {e}")
        return {"status": "error", "error": str(e)}
