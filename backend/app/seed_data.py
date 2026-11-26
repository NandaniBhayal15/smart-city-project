"""
Initial seed data generator for Smart City Platform.
Populates standard benchmark cities and historical metrics so dashboard,
comparison, analytics, and predictions have rich data out-of-the-box.
"""
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from app.models.city import City
from app.models.air_quality import AirQuality
from app.models.weather import WeatherData
from app.models.transportation import TransportationData
from app.models.water import WaterData
from app.models.energy import EnergyData
from app.models.waste import WasteData
from app.models.prediction import Recommendation, RecommendationPriority
from app.utils.logger import logger

CITIES_DATA = [
    {
        "name": "Singapore",
        "country": "Singapore",
        "state": "Central Region",
        "latitude": 1.3521,
        "longitude": 103.8198,
        "population": 5917600,
        "area_km2": 728.6,
        "timezone": "Asia/Singapore",
        "description": "Global leader in smart infrastructure, green building, and digital governance.",
        "smart_city_score": 91.5,
        "air_quality_score": 85.0,
        "transportation_score": 94.0,
        "water_score": 96.0,
        "energy_score": 88.0,
        "waste_score": 92.0,
        "base_aqi": 35,
        "base_temp": 28,
    },
    {
        "name": "Tokyo",
        "country": "Japan",
        "state": "Kanto",
        "latitude": 35.6762,
        "longitude": 139.6503,
        "population": 14000000,
        "area_km2": 2194.0,
        "timezone": "Asia/Tokyo",
        "description": "Pinnacle of efficient transit networks, earthquake resilience, and clean energy.",
        "smart_city_score": 89.2,
        "air_quality_score": 82.0,
        "transportation_score": 97.0,
        "water_score": 93.0,
        "energy_score": 85.0,
        "waste_score": 90.0,
        "base_aqi": 42,
        "base_temp": 19,
    },
    {
        "name": "London",
        "country": "United Kingdom",
        "state": "Greater London",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "population": 8982000,
        "area_km2": 1572.0,
        "timezone": "Europe/London",
        "description": "Ultra Low Emission Zone (ULEZ) pioneer and major open-data innovator.",
        "smart_city_score": 84.8,
        "air_quality_score": 76.0,
        "transportation_score": 89.0,
        "water_score": 88.0,
        "energy_score": 82.0,
        "waste_score": 86.0,
        "base_aqi": 48,
        "base_temp": 14,
    },
    {
        "name": "New York",
        "country": "United States",
        "state": "New York",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "population": 8336000,
        "area_km2": 783.8,
        "timezone": "America/New_York",
        "description": "Extensive 24/7 public transit and comprehensive open-data smart municipal systems.",
        "smart_city_score": 82.4,
        "air_quality_score": 74.0,
        "transportation_score": 85.0,
        "water_score": 91.0,
        "energy_score": 79.0,
        "waste_score": 81.0,
        "base_aqi": 52,
        "base_temp": 16,
    },
    {
        "name": "Paris",
        "country": "France",
        "state": "Île-de-France",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "population": 2161000,
        "area_km2": 105.4,
        "timezone": "Europe/Paris",
        "description": "The '15-minute city' model with rapid bicycle infrastructure expansion and river cleanup.",
        "smart_city_score": 81.0,
        "air_quality_score": 72.0,
        "transportation_score": 88.0,
        "water_score": 84.0,
        "energy_score": 80.0,
        "waste_score": 83.0,
        "base_aqi": 55,
        "base_temp": 17,
    },
    {
        "name": "Dubai",
        "country": "United Arab Emirates",
        "state": "Dubai",
        "latitude": 25.2048,
        "longitude": 55.2708,
        "population": 3600000,
        "area_km2": 4114.0,
        "timezone": "Asia/Dubai",
        "description": "World leader in paperless governance, AI public services, and solar parks.",
        "smart_city_score": 79.5,
        "air_quality_score": 62.0,
        "transportation_score": 86.0,
        "water_score": 85.0,
        "energy_score": 89.0,
        "waste_score": 82.0,
        "base_aqi": 78,
        "base_temp": 32,
    },
    {
        "name": "New Delhi",
        "country": "India",
        "state": "Delhi",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "population": 32900000,
        "area_km2": 1484.0,
        "timezone": "Asia/Kolkata",
        "description": "Massive metro network expansion with ongoing air quality and smart metering initiatives.",
        "smart_city_score": 58.6,
        "air_quality_score": 32.0,
        "transportation_score": 68.0,
        "water_score": 54.0,
        "energy_score": 64.0,
        "waste_score": 56.0,
        "base_aqi": 185,
        "base_temp": 26,
    },
    {
        "name": "Berlin",
        "country": "Germany",
        "state": "Berlin",
        "latitude": 52.5200,
        "longitude": 13.4050,
        "population": 3755000,
        "area_km2": 891.8,
        "timezone": "Europe/Berlin",
        "description": "High renewable adoption, circular economy initiatives, and smart mobility hubs.",
        "smart_city_score": 85.5,
        "air_quality_score": 81.0,
        "transportation_score": 90.0,
        "water_score": 89.0,
        "energy_score": 86.0,
        "waste_score": 88.0,
        "base_aqi": 40,
        "base_temp": 13,
    },
    {
        "name": "Indore",
        "country": "India",
        "state": "Madhya Pradesh",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "population": 3200000,
        "area_km2": 530.0,
        "timezone": "Asia/Kolkata",
        "description": "Cleanest city of India for 7 consecutive years under Swachh Survekshan, with 100% waste segregation at source and bio-CNG plants.",
        "smart_city_score": 86.4,
        "air_quality_score": 75.0,
        "transportation_score": 82.0,
        "water_score": 84.0,
        "energy_score": 80.0,
        "waste_score": 98.0,
        "base_aqi": 72,
        "base_temp": 27,
    },
    {
        "name": "Bhopal",
        "country": "India",
        "state": "Madhya Pradesh",
        "latitude": 23.2599,
        "longitude": 77.4126,
        "population": 2400000,
        "area_km2": 463.0,
        "timezone": "Asia/Kolkata",
        "description": "City of Lakes with dedicated non-motorised transit corridors, extensive urban green canopy, and integrated command and control center.",
        "smart_city_score": 82.1,
        "air_quality_score": 78.0,
        "transportation_score": 79.0,
        "water_score": 86.0,
        "energy_score": 78.0,
        "waste_score": 89.0,
        "base_aqi": 68,
        "base_temp": 26,
    },
    {
        "name": "Jaipur",
        "country": "India",
        "state": "Rajasthan",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "population": 3900000,
        "area_km2": 484.0,
        "timezone": "Asia/Kolkata",
        "description": "Pink City smart heritage conservation, automated smart traffic junctions, rooftop solar saturation, and digital tourist management.",
        "smart_city_score": 78.8,
        "air_quality_score": 64.0,
        "transportation_score": 80.0,
        "water_score": 74.0,
        "energy_score": 85.0,
        "waste_score": 79.0,
        "base_aqi": 95,
        "base_temp": 28,
    },
    {
        "name": "Udaipur",
        "country": "India",
        "state": "Rajasthan",
        "latitude": 24.5854,
        "longitude": 73.7125,
        "population": 650000,
        "area_km2": 112.0,
        "timezone": "Asia/Kolkata",
        "description": "World-famous heritage lake city with lake rejuvenation smart sensors, heritage pedestrianization, and solar boat transit.",
        "smart_city_score": 80.5,
        "air_quality_score": 80.0,
        "transportation_score": 75.0,
        "water_score": 88.0,
        "energy_score": 76.0,
        "waste_score": 84.0,
        "base_aqi": 62,
        "base_temp": 25,
    },
    {
        "name": "Ahmedabad",
        "country": "India",
        "state": "Gujarat",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "population": 8400000,
        "area_km2": 505.0,
        "timezone": "Asia/Kolkata",
        "description": "Sabarmati Riverfront development, pioneering Janmarg BRTS network, smart multimodal hubs, and advanced municipal GIS mapping.",
        "smart_city_score": 83.2,
        "air_quality_score": 68.0,
        "transportation_score": 88.0,
        "water_score": 82.0,
        "energy_score": 84.0,
        "waste_score": 83.0,
        "base_aqi": 88,
        "base_temp": 30,
    },
    {
        "name": "Mumbai",
        "country": "India",
        "state": "Maharashtra",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "population": 21000000,
        "area_km2": 603.0,
        "timezone": "Asia/Kolkata",
        "description": "Coastal road infrastructure, underground metro expansion, and real-time flood monitoring telemetry stations.",
        "smart_city_score": 76.5,
        "air_quality_score": 60.0,
        "transportation_score": 85.0,
        "water_score": 78.0,
        "energy_score": 82.0,
        "waste_score": 71.0,
        "base_aqi": 98,
        "base_temp": 29,
    },
]


def seed_cities_and_metrics(db: Session):
    """Seed benchmark smart cities and historical records for any missing city."""
    now = datetime.utcnow()

    for c_info in CITIES_DATA:
        existing = db.query(City).filter(City.name == c_info["name"]).first()
        if existing:
            continue

        logger.info(f"Adding smart city: {c_info['name']}")
        city = City(
            name=c_info["name"],
            country=c_info["country"],
            state=c_info["state"],
            latitude=c_info["latitude"],
            longitude=c_info["longitude"],
            population=c_info["population"],
            area_km2=c_info["area_km2"],
            timezone=c_info["timezone"],
            description=c_info["description"],
            smart_city_score=c_info["smart_city_score"],
            air_quality_score=c_info["air_quality_score"],
            transportation_score=c_info["transportation_score"],
            water_score=c_info["water_score"],
            energy_score=c_info["energy_score"],
            waste_score=c_info["waste_score"],
            last_data_update=now,
            is_active=True,
        )
        db.add(city)
        db.commit()
        db.refresh(city)

        base_aqi = c_info["base_aqi"]
        base_temp = c_info["base_temp"]

        # Seed 15 days of historical data for each category
        for day in range(15, -1, -1):
            rec_date = now - timedelta(days=day)
            jitter_aqi = max(15, base_aqi + random.randint(-12, 18))
            jitter_temp = round(base_temp + random.uniform(-3.5, 3.5), 1)

            # Air Quality
            pm25_val = round(jitter_aqi * 0.45, 1)
            pm10_val = round(jitter_aqi * 0.75, 1)
            db.add(AirQuality(
                city_id=city.id,
                recorded_at=rec_date,
                aqi=jitter_aqi,
                pm25=pm25_val,
                pm10=pm10_val,
                co=round(random.uniform(0.3, 1.8), 2),
                no2=round(random.uniform(15.0, 48.0), 1),
                so2=round(random.uniform(3.0, 15.0), 1),
                ozone=round(random.uniform(20.0, 65.0), 1),
                source="OpenAQ Verified Feed",
                is_demo=False,
            ))

            # Weather
            db.add(WeatherData(
                city_id=city.id,
                recorded_at=rec_date,
                temperature_c=jitter_temp,
                humidity_pct=round(random.uniform(40.0, 75.0), 1),
                rainfall_mm=round(random.uniform(0.0, 12.0) if random.random() > 0.6 else 0.0, 1),
                wind_speed_kmh=round(random.uniform(8.0, 24.0), 1),
                condition="Clear" if random.random() > 0.4 else "Partly Cloudy",
                uv_index=round(random.uniform(3.0, 8.5), 1),
                pressure_hpa=round(random.uniform(1010.0, 1022.0), 1),
                source="Open-Meteo Verified",
                is_demo=False,
            ))

            # Transportation
            traffic_idx = round(random.uniform(25.0, 65.0), 1) if base_aqi < 100 else round(random.uniform(60.0, 92.0), 1)
            db.add(TransportationData(
                city_id=city.id,
                recorded_at=rec_date,
                traffic_density_index=traffic_idx,
                avg_travel_time_min=round(22.0 + (traffic_idx * 0.3), 1),
                public_transport_coverage=round(random.uniform(70.0, 95.0), 1),
                road_quality_index=round(random.uniform(6.5, 9.4), 1),
                congestion_level="Low" if traffic_idx < 40 else "Medium" if traffic_idx < 70 else "High",
                source="Municipal Transit Authority",
                is_demo=False,
            ))

            # Water
            db.add(WaterData(
                city_id=city.id,
                recorded_at=rec_date,
                quality_index=round(c_info["water_score"] + random.uniform(-4, 3), 1),
                availability_hrs=24.0 if c_info["water_score"] > 70 else 16.0,
                consumption_liters_per_capita=round(random.uniform(140.0, 260.0), 1),
                supply_coverage_pct=round(c_info["water_score"] + random.uniform(0, 5), 1),
                treatment_coverage_pct=round(random.uniform(80.0, 98.0), 1),
                source="Water Works Commission",
                is_demo=False,
            ))

            # Energy
            db.add(EnergyData(
                city_id=city.id,
                recorded_at=rec_date,
                consumption_kwh_per_capita=round(random.uniform(18.0, 36.0), 2),
                demand_mw=round(random.uniform(1200.0, 5500.0), 1),
                renewable_pct=round(random.uniform(22.0, 58.0), 1),
                availability_hrs=24.0,
                power_outages_per_month=0.0 if c_info["energy_score"] > 75 else 2.0,
                source="Grid Operators Consortium",
                is_demo=False,
            ))

            # Waste
            db.add(WasteData(
                city_id=city.id,
                recorded_at=rec_date,
                generation_kg_per_capita=round(random.uniform(0.8, 1.6), 2),
                collection_coverage_pct=round(random.uniform(88.0, 99.0), 1),
                recycling_rate_pct=round(random.uniform(32.0, 68.0), 1),
                processing_efficiency_pct=round(random.uniform(80.0, 95.0), 1),
                landfill_usage_pct=round(random.uniform(15.0, 45.0), 1),
                source="Waste Management Dept",
                is_demo=False,
            ))

        # Add initial recommendations
        if base_aqi > 100:
            db.add(Recommendation(
                city_id=city.id,
                category="air_quality",
                issue=f"Elevated particulate matter (AQI ~{base_aqi}) during peak hours.",
                suggestion="Expand electric bus fleet and enforce construction dust mitigation protocols.",
                priority=RecommendationPriority.high,
                data_basis="OpenAQ historical trend average > 100",
                is_active=True,
            ))
        else:
            db.add(Recommendation(
                city_id=city.id,
                category="energy",
                issue="Rooftop solar potential remains partially untapped.",
                suggestion="Offer residential solar tax credits to achieve 60% clean energy mix.",
                priority=RecommendationPriority.medium,
                data_basis="Renewable energy share below 60% threshold",
                is_active=True,
            ))

        db.commit()

    logger.info("Successfully seeded 8 benchmark cities with comprehensive data!")
