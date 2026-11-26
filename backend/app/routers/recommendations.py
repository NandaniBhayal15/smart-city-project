"""
Recommendations router — auto-generate and retrieve data-driven suggestions.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.models.city import City
from app.models.prediction import Recommendation, RecommendationPriority
from app.models.air_quality import AirQuality
from app.models.water import WaterData
from app.models.energy import EnergyData
from app.models.waste import WasteData
from app.models.transportation import TransportationData
from app.schemas.analytics import RecommendationOut

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


def _generate_for_city(db: Session, city: City) -> List[Recommendation]:
    """Generate rule-based recommendations from latest city data."""
    recs = []

    # Air Quality
    latest_aqi = (
        db.query(AirQuality)
        .filter(AirQuality.city_id == city.id)
        .order_by(AirQuality.recorded_at.desc())
        .first()
    )
    if latest_aqi and latest_aqi.aqi is not None:
        if latest_aqi.aqi > 150:
            recs.append(Recommendation(
                city_id=city.id,
                category="air_quality",
                issue=f"Severe Air Pollution: AQI currently at {latest_aqi.aqi:.0f} (Hazardous/Unhealthy)",
                suggestion="Enforce strict odd-even vehicle rotation, deploy mist sprayers at high-traffic corridors, and mandate industrial emission scrubbers.",
                priority=RecommendationPriority.high,
                data_basis=f"OpenAQ recorded AQI {latest_aqi.aqi:.1f} (PM2.5: {latest_aqi.pm25 or 'N/A'} µg/m³)",
            ))
        elif latest_aqi.aqi > 80:
            recs.append(Recommendation(
                city_id=city.id,
                category="air_quality",
                issue=f"Moderate Air Pollution: AQI {latest_aqi.aqi:.0f} exceeds WHO guidelines",
                suggestion="Expand electric feeder bus coverage, develop urban green belts along arterial roads, and incentivize bicycle adoption.",
                priority=RecommendationPriority.medium,
                data_basis=f"Recorded AQI {latest_aqi.aqi:.1f}",
            ))

    # Water
    latest_water = (
        db.query(WaterData)
        .filter(WaterData.city_id == city.id)
        .order_by(WaterData.recorded_at.desc())
        .first()
    )
    if latest_water:
        if latest_water.availability_hrs is not None and latest_water.availability_hrs < 24:
            recs.append(Recommendation(
                city_id=city.id,
                category="water",
                issue=f"Intermittent Water Supply: Municipal water active only {latest_water.availability_hrs:.0f} hrs/day",
                suggestion="Install smart pressure-regulated metering, accelerate pipeline acoustic leak detection, and construct localized storage reservoirs.",
                priority=RecommendationPriority.high,
                data_basis=f"Water availability logged at {latest_water.availability_hrs:.1f} hrs/day",
            ))
        if latest_water.treatment_coverage_pct is not None and latest_water.treatment_coverage_pct < 85:
            recs.append(Recommendation(
                city_id=city.id,
                category="water",
                issue=f"Wastewater Treatment Deficit: Only {latest_water.treatment_coverage_pct:.0f}% sewage treated",
                suggestion="Upgrade decentralized Sewage Treatment Plants (STP) and implement dual-piping for recycled toilet flushing & horticulture.",
                priority=RecommendationPriority.medium,
                data_basis=f"Sewage treatment coverage at {latest_water.treatment_coverage_pct:.1f}%",
            ))

    # Transportation
    latest_transit = (
        db.query(TransportationData)
        .filter(TransportationData.city_id == city.id)
        .order_by(TransportationData.recorded_at.desc())
        .first()
    )
    if latest_transit:
        if latest_transit.traffic_density_index is not None and latest_transit.traffic_density_index > 65:
            recs.append(Recommendation(
                city_id=city.id,
                category="transportation",
                issue=f"Severe Congestion: Peak traffic density index at {latest_transit.traffic_density_index:.0f}/100",
                suggestion="Synchronize traffic signals with AI adaptive timers, introduce congestion pricing in central commercial zones, and enhance dedicated bus lanes.",
                priority=RecommendationPriority.high,
                data_basis=f"Congestion index {latest_transit.traffic_density_index:.1f}, Avg travel time {latest_transit.avg_travel_time_min or 35} mins",
            ))
        elif latest_transit.public_transport_coverage is not None and latest_transit.public_transport_coverage < 75:
            recs.append(Recommendation(
                city_id=city.id,
                category="transportation",
                issue=f"Transit Gap: Public transit covers only {latest_transit.public_transport_coverage:.0f}% of municipal boundary",
                suggestion="Deploy micro-mobility e-rickshaws and expand feeder shuttle frequency to metro/railway transit hubs.",
                priority=RecommendationPriority.medium,
                data_basis=f"Public transit geographic coverage: {latest_transit.public_transport_coverage:.1f}%",
            ))

    # Energy
    latest_energy = (
        db.query(EnergyData)
        .filter(EnergyData.city_id == city.id)
        .order_by(EnergyData.recorded_at.desc())
        .first()
    )
    if latest_energy:
        if latest_energy.renewable_pct is not None and latest_energy.renewable_pct < 40:
            recs.append(Recommendation(
                city_id=city.id,
                category="energy",
                issue=f"Low Renewable Energy Mix: Only {latest_energy.renewable_pct:.0f}% from clean sources",
                suggestion="Mandate rooftop solar panels on all government and commercial buildings with net-metering incentives for residential apartments.",
                priority=RecommendationPriority.medium,
                data_basis=f"Clean energy share currently at {latest_energy.renewable_pct:.1f}%",
            ))

    # Waste
    latest_waste = (
        db.query(WasteData)
        .filter(WasteData.city_id == city.id)
        .order_by(WasteData.recorded_at.desc())
        .first()
    )
    if latest_waste:
        if latest_waste.recycling_rate_pct is not None and latest_waste.recycling_rate_pct < 50:
            recs.append(Recommendation(
                city_id=city.id,
                category="waste",
                issue=f"Low Recycling Yield: Material recovery rate is only {latest_waste.recycling_rate_pct:.0f}%",
                suggestion="Adopt the Indore Model: 100% door-to-door segregated collection with bio-methanation plants for organic wet waste.",
                priority=RecommendationPriority.high if latest_waste.recycling_rate_pct < 35 else RecommendationPriority.medium,
                data_basis=f"Recycling rate {latest_waste.recycling_rate_pct:.1f}%, Landfill dumping {latest_waste.landfill_usage_pct or 30}%",
            ))

    return recs


@router.get("/", response_model=List[RecommendationOut])
def list_recommendations(
    city_id: UUID = Query(None),
    category: str = Query(None),
    priority: str = Query(None),
    db: Session = Depends(get_db),
):
    # If a specific city is requested and has no recommendations, auto-generate them
    if city_id:
        existing = db.query(Recommendation).filter(
            Recommendation.city_id == city_id,
            Recommendation.is_active == True
        ).first()
        if not existing:
            city = db.query(City).filter(City.id == city_id).first()
            if city:
                new_recs = _generate_for_city(db, city)
                db.add_all(new_recs)
                db.commit()

    query = db.query(Recommendation).filter(Recommendation.is_active == True)
    if city_id:
        query = query.filter(Recommendation.city_id == city_id)
    if category:
        query = query.filter(Recommendation.category == category)
    if priority:
        query = query.filter(Recommendation.priority == priority)
    recs = query.order_by(Recommendation.priority.desc(), Recommendation.created_at.desc()).limit(100).all()

    output = []
    for r in recs:
        city = db.query(City).filter(City.id == r.city_id).first()
        output.append(RecommendationOut(
            id=r.id,
            city_id=r.city_id,
            city_name=city.name if city else "Unknown",
            category=r.category,
            issue=r.issue,
            suggestion=r.suggestion,
            priority=r.priority,
            data_basis=r.data_basis,
        ))
    return output


@router.post("/generate/{city_id}")
def generate_recommendations(city_id: UUID, db: Session = Depends(get_db)):
    """Re-generate data-driven recommendations for a city."""
    city = db.query(City).filter(City.id == city_id, City.is_active == True).first()
    if not city:
        raise HTTPException(404, "City not found")

    db.query(Recommendation).filter(Recommendation.city_id == city_id).delete()
    db.commit()

    new_recs = _generate_for_city(db, city)
    db.add_all(new_recs)
    db.commit()
    return {"message": f"Generated {len(new_recs)} recommendations for {city.name}", "count": len(new_recs)}
