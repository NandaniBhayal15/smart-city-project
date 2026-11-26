"""
OpenAQ API collector — fetches real air quality data for cities.
API docs: https://docs.openaq.org
No API key required for public endpoints.
"""
import httpx
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Optional

from app.config import settings
from app.models.air_quality import AirQuality
from app.models.city import City
from app.models.data_source import DataCollectionLog, CollectionStatus
from app.utils.logger import logger

OPENAQ_URL = settings.OPENAQ_API_URL


def _get_source_id(db: Session):
    from app.models.data_source import DataSource
    src = db.query(DataSource).filter(DataSource.name == "OpenAQ").first()
    return src.id if src else None


async def fetch_aqi_for_city(db: Session, city: City) -> dict:
    """
    Fetch latest air quality readings for a city from OpenAQ v2.
    Returns summary of records saved.
    """
    source_id = _get_source_id(db)
    log = DataCollectionLog(
        source_id=source_id,
        city_id=city.id,
        status=CollectionStatus.running,
    )
    db.add(log)
    db.commit()

    fetched = 0; saved = 0

    try:
        params = {
            "city": city.name,
            "country": city.country[:2].upper() if city.country else None,
            "limit": 100,
            "parameter": ["pm25", "pm10", "co", "no2", "so2", "o3"],
        }
        params = {k: v for k, v in params.items() if v is not None}

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{OPENAQ_URL}/measurements", params=params)
            resp.raise_for_status()
            data = resp.json()

        results = data.get("results", [])
        fetched = len(results)

        # Group readings by date
        readings_by_date = {}
        for r in results:
            dt_str = r.get("date", {}).get("utc", "")
            if not dt_str:
                continue
            try:
                dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00")).replace(tzinfo=None)
                date_key = dt.date().isoformat()
                if date_key not in readings_by_date:
                    readings_by_date[date_key] = {"recorded_at": dt}
                param = r.get("parameter", "")
                value = r.get("value")
                param_map = {"pm25": "pm25", "pm10": "pm10", "co": "co",
                             "no2": "no2", "so2": "so2", "o3": "ozone"}
                if param in param_map and value is not None and value >= 0:
                    readings_by_date[date_key][param_map[param]] = value
            except Exception as e:
                logger.warning(f"Skipping malformed OpenAQ record: {e}")
                continue

        for date_key, reading in readings_by_date.items():
            # Check for duplicate
            existing = db.query(AirQuality).filter(
                AirQuality.city_id == city.id,
                AirQuality.recorded_at == reading["recorded_at"],
                AirQuality.source == "OpenAQ",
            ).first()
            if existing:
                continue

            # Compute AQI from pm25 if not provided
            pm25 = reading.get("pm25")
            aqi = _pm25_to_aqi(pm25) if pm25 else None

            record = AirQuality(
                city_id=city.id,
                recorded_at=reading["recorded_at"],
                aqi=aqi,
                pm25=reading.get("pm25"),
                pm10=reading.get("pm10"),
                co=reading.get("co"),
                no2=reading.get("no2"),
                so2=reading.get("so2"),
                ozone=reading.get("ozone"),
                source="OpenAQ",
                is_demo=False,
            )
            db.add(record)
            saved += 1

        db.commit()

        # Update city timestamp
        city.last_data_update = datetime.utcnow()
        db.commit()

        log.status = CollectionStatus.success
        log.records_fetched = fetched
        log.records_saved = saved
        db.commit()

        logger.info(f"OpenAQ: {city.name} — fetched={fetched}, saved={saved}")
        return {"status": "success", "fetched": fetched, "saved": saved}

    except Exception as e:
        logger.error(f"OpenAQ fetch failed for {city.name}: {e}")
        log.status = CollectionStatus.error
        log.error_message = str(e)
        db.commit()
        return {"status": "error", "error": str(e)}


def _pm25_to_aqi(pm25: float) -> float:
    """
    Convert PM2.5 (μg/m³) to US EPA AQI using breakpoints.
    Reference: https://www.airnow.gov/sites/default/files/2020-05/aqi-technical-assistance-document-sept2018.pdf
    """
    breakpoints = [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ]
    for c_lo, c_hi, i_lo, i_hi in breakpoints:
        if c_lo <= pm25 <= c_hi:
            return round(((i_hi - i_lo) / (c_hi - c_lo)) * (pm25 - c_lo) + i_lo, 1)
    return 500.0  # Beyond scale
