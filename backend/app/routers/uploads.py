"""
Uploads router — CSV/Excel dataset upload and import into the database.
Supports: air_quality, weather, transportation, water, energy, waste
"""
import io
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.air_quality import AirQuality
from app.models.weather import WeatherData
from app.models.transportation import TransportationData
from app.models.water import WaterData
from app.models.energy import EnergyData
from app.models.waste import WasteData
from app.models.city import City
from app.auth.dependencies import get_current_admin
from app.utils.logger import logger

router = APIRouter(prefix="/uploads", tags=["Dataset Uploads"])

MODEL_MAP = {
    "air_quality": AirQuality,
    "weather": WeatherData,
    "transportation": TransportationData,
    "water": WaterData,
    "energy": EnergyData,
    "waste": WasteData,
}

REQUIRED_COLUMNS = {
    "air_quality":     ["recorded_at"],
    "weather":         ["recorded_at"],
    "transportation":  ["recorded_at"],
    "water":           ["recorded_at"],
    "energy":          ["recorded_at"],
    "waste":           ["recorded_at"],
}

# Check if python-multipart is available before declaring Form / File routes
try:
    import multipart
    from fastapi import UploadFile, File, Form
    has_multipart = True
except ImportError:
    has_multipart = False

if has_multipart:
    @router.post("/dataset")
    async def upload_dataset(
        city_id: UUID = Form(...),
        category: str = Form(..., description="air_quality|weather|transportation|water|energy|waste"),
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
        _=Depends(get_current_admin),
    ):
        """Upload a CSV or Excel file to import city data."""
        if category not in MODEL_MAP:
            raise HTTPException(400, f"Invalid category. Choose from: {list(MODEL_MAP.keys())}")

        city = db.query(City).filter(City.id == city_id, City.is_active == True).first()
        if not city:
            raise HTTPException(404, "City not found")

        content = await file.read()
        try:
            import pandas as pd
            if file.filename.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(content))
            elif file.filename.endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(content))
            else:
                raise HTTPException(400, "Only CSV and Excel files are supported")
        except Exception as e:
            raise HTTPException(400, f"Could not parse file: {e}")

        missing = [c for c in REQUIRED_COLUMNS[category] if c not in df.columns]
        if missing:
            raise HTTPException(400, f"Missing required columns: {missing}")

        ModelClass = MODEL_MAP[category]
        inserted = 0; skipped = 0

        for _, row in df.iterrows():
            try:
                row_dict = {k: (None if pd.isna(v) else v) for k, v in row.items()}
                recorded_at = pd.to_datetime(row_dict.pop("recorded_at"))
                valid_cols = {c.name for c in ModelClass.__table__.columns}
                row_dict = {k: v for k, v in row_dict.items() if k in valid_cols}

                record = ModelClass(
                    city_id=city_id,
                    recorded_at=recorded_at,
                    source=f"CSV Upload: {file.filename}",
                    is_demo=False,
                    **row_dict,
                )
                db.add(record)
                inserted += 1
            except Exception as e:
                logger.warning(f"Skipping row: {e}")
                skipped += 1

        db.commit()
        city.last_data_update = datetime.utcnow()
        db.commit()

        return {
            "message": "Upload complete",
            "city": city.name,
            "category": category,
            "records_inserted": inserted,
            "records_skipped": skipped,
        }
else:
    @router.post("/dataset")
    def upload_dataset_fallback():
        raise HTTPException(
            status_code=501,
            detail="File upload requires python-multipart. Install via 'pip install python-multipart'."
        )
