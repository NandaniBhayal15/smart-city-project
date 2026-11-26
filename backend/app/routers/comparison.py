"""
City Comparison router — side-by-side scoring using the Smart City formula.

Score weights:
  Air Quality:       20%
  Transportation:    20%
  Water:             20%
  Energy:            15%
  Waste:             15%
  Weather/Climate:   10%

Each sub-score is 0–100. Raw metrics are normalised against ideal/worst benchmarks.
If data is missing, we report it and exclude that category from the overall score
rather than declare a false winner.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.models.city import City
from app.models.air_quality import AirQuality
from app.models.weather import WeatherData
from app.models.transportation import TransportationData
from app.models.water import WaterData
from app.models.energy import EnergyData
from app.models.waste import WasteData
from app.schemas.analytics import CityComparisonOut, CategoryScore
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/comparison", tags=["City Comparison"])

WEIGHTS = {
    "air_quality": 0.20,
    "transportation": 0.20,
    "water": 0.20,
    "energy": 0.15,
    "waste": 0.15,
    "weather": 0.10,
}

MIN_DATA_POINTS = 3   # minimum records required to trust a score


def _clamp(v: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, v))


def _aqi_to_score(aqi: Optional[float]) -> Optional[float]:
    """Lower AQI → better score. AQI 0→score 100, AQI 300+→score 0."""
    if aqi is None:
        return None
    return _clamp(100 - (aqi / 3))


def _compute_category_score(db: Session, city_id, category: str):
    """Return (score 0-100, data_point_count, has_sufficient_data)."""
    if category == "air_quality":
        rows = db.query(AirQuality).filter(AirQuality.city_id == city_id).all()
        if not rows:
            return None, 0, False
        avg_aqi = sum(r.aqi for r in rows if r.aqi is not None) / max(1, sum(1 for r in rows if r.aqi is not None))
        score = _aqi_to_score(avg_aqi)
        return score, len(rows), len(rows) >= MIN_DATA_POINTS

    elif category == "water":
        rows = db.query(WaterData).filter(WaterData.city_id == city_id).all()
        if not rows:
            return None, 0, False
        scores = []
        for r in rows:
            s = 0; count = 0
            if r.quality_index is not None:
                s += r.quality_index; count += 1
            if r.supply_coverage_pct is not None:
                s += r.supply_coverage_pct; count += 1
            if r.availability_hrs is not None:
                s += _clamp((r.availability_hrs / 24) * 100); count += 1
            if count:
                scores.append(s / count)
        score = sum(scores) / len(scores) if scores else None
        return score, len(rows), len(rows) >= MIN_DATA_POINTS

    elif category == "energy":
        rows = db.query(EnergyData).filter(EnergyData.city_id == city_id).all()
        if not rows:
            return None, 0, False
        scores = []
        for r in rows:
            s = 0; count = 0
            if r.availability_hrs is not None:
                s += _clamp((r.availability_hrs / 24) * 100); count += 1
            if r.renewable_pct is not None:
                s += r.renewable_pct; count += 1
            if count:
                scores.append(s / count)
        score = sum(scores) / len(scores) if scores else None
        return score, len(rows), len(rows) >= MIN_DATA_POINTS

    elif category == "transportation":
        rows = db.query(TransportationData).filter(TransportationData.city_id == city_id).all()
        if not rows:
            return None, 0, False
        scores = []
        for r in rows:
            s = 0; count = 0
            if r.traffic_density_index is not None:
                # Lower density = better
                s += _clamp(100 - r.traffic_density_index); count += 1
            if r.public_transport_coverage is not None:
                s += r.public_transport_coverage; count += 1
            if r.road_quality_index is not None:
                s += _clamp(r.road_quality_index * 10); count += 1
            if count:
                scores.append(s / count)
        score = sum(scores) / len(scores) if scores else None
        return score, len(rows), len(rows) >= MIN_DATA_POINTS

    elif category == "waste":
        rows = db.query(WasteData).filter(WasteData.city_id == city_id).all()
        if not rows:
            return None, 0, False
        scores = []
        for r in rows:
            s = 0; count = 0
            if r.collection_coverage_pct is not None:
                s += r.collection_coverage_pct; count += 1
            if r.recycling_rate_pct is not None:
                s += r.recycling_rate_pct; count += 1
            if r.processing_efficiency_pct is not None:
                s += r.processing_efficiency_pct; count += 1
            if count:
                scores.append(s / count)
        score = sum(scores) / len(scores) if scores else None
        return score, len(rows), len(rows) >= MIN_DATA_POINTS

    elif category == "weather":
        rows = db.query(WeatherData).filter(WeatherData.city_id == city_id).all()
        if not rows:
            return None, 0, False
        # Weather score based on comfortable temperature & low humidity
        scores = []
        for r in rows:
            s = 0; count = 0
            if r.temperature_c is not None:
                # Ideal 18-25°C
                diff = abs(r.temperature_c - 21.5)
                s += _clamp(100 - diff * 3); count += 1
            if r.humidity_pct is not None:
                # Ideal 40-60%
                diff = abs(r.humidity_pct - 50)
                s += _clamp(100 - diff * 1.5); count += 1
            if count:
                scores.append(s / count)
        score = sum(scores) / len(scores) if scores else None
        return score, len(rows), len(rows) >= MIN_DATA_POINTS

    return None, 0, False


def _score_label(score: Optional[float]) -> str:
    if score is None:
        return "No Data"
    if score >= 80:
        return "Excellent"
    if score >= 60:
        return "Good"
    if score >= 40:
        return "Average"
    if score >= 20:
        return "Poor"
    return "Critical"


@router.get("/", response_model=CityComparisonOut)
def compare_cities(
    city_a_id: UUID = Query(...),
    city_b_id: UUID = Query(...),
    db: Session = Depends(get_db),
):
    if city_a_id == city_b_id:
        raise HTTPException(400, "Select two different cities")

    city_a = db.query(City).filter(City.id == city_a_id, City.is_active == True).first()
    city_b = db.query(City).filter(City.id == city_b_id, City.is_active == True).first()

    if not city_a or not city_b:
        raise HTTPException(404, "One or both cities not found")

    categories = list(WEIGHTS.keys())
    scores = {}
    notes = []

    for cat in categories:
        score_a, dp_a, ok_a = _compute_category_score(db, city_a_id, cat)
        score_b, dp_b, ok_b = _compute_category_score(db, city_b_id, cat)

        if not ok_a:
            notes.append(f"Insufficient {cat} data for {city_a.name} ({dp_a} records, need {MIN_DATA_POINTS}+).")
        if not ok_b:
            notes.append(f"Insufficient {cat} data for {city_b.name} ({dp_b} records, need {MIN_DATA_POINTS}+).")

        winner = None
        if ok_a and ok_b and score_a is not None and score_b is not None:
            if abs(score_a - score_b) < 2:
                winner = "tie"
            elif score_a > score_b:
                winner = city_a.name
            else:
                winner = city_b.name

        scores[cat] = {
            "city_a_score": round(score_a, 1) if score_a is not None else None,
            "city_b_score": round(score_b, 1) if score_b is not None else None,
            "city_a_label": _score_label(score_a),
            "city_b_label": _score_label(score_b),
            "city_a_data_points": dp_a,
            "city_b_data_points": dp_b,
            "winner": winner,
            "weight_pct": int(WEIGHTS[cat] * 100),
        }

    # Overall weighted score
    def _weighted(city_scores):
        total_w = 0; total_s = 0
        for cat in categories:
            s = city_scores.get(cat)
            if s is not None:
                total_s += s * WEIGHTS[cat]
                total_w += WEIGHTS[cat]
        return round(total_s / total_w, 1) if total_w else None

    overall_a = _weighted({cat: scores[cat]["city_a_score"] for cat in categories})
    overall_b = _weighted({cat: scores[cat]["city_b_score"] for cat in categories})

    if overall_a is not None and overall_b is not None:
        if abs(overall_a - overall_b) < 2:
            overall_winner = "tie"
        elif overall_a > overall_b:
            overall_winner = city_a.name
        else:
            overall_winner = city_b.name
    else:
        overall_winner = None
        notes.append("Overall winner cannot be determined — insufficient data in one or more cities.")

    # Generate concise analytical analysis (4-5 lines total)
    analytical_analysis = _generate_professional_analysis(
        city_a.name, city_b.name, overall_a, overall_b, overall_winner, scores
    )
    ai_summary = analytical_analysis.get("concise_summary", " ".join(analytical_analysis.values()))

    return CityComparisonOut(
        city_a={"id": str(city_a.id), "name": city_a.name, "country": city_a.country, "overall_score": overall_a},
        city_b={"id": str(city_b.id), "name": city_b.name, "country": city_b.country, "overall_score": overall_b},
        scores=scores,
        overall_winner=overall_winner,
        notes=notes,
        ai_summary=ai_summary,
        analytical_analysis=analytical_analysis,
    )


def _generate_professional_analysis(city_a_name, city_b_name, overall_a, overall_b, overall_winner, scores):
    """
    Generate a concise, 4-5 line data-grounded comparative urban analysis.
    """
    short_domain_names = {
        "air_quality": "Air Quality",
        "transportation": "Urban Mobility",
        "water": "Water Resilience",
        "energy": "Clean Energy",
        "waste": "Waste Management",
        "weather": "Climate Resilience",
    }

    leads_a = []
    leads_b = []
    domain_list = []

    for cat, short_name in short_domain_names.items():
        cat_data = scores.get(cat, {})
        sa = cat_data.get("city_a_score")
        sb = cat_data.get("city_b_score")
        w = cat_data.get("winner")

        if sa is not None and sb is not None:
            domain_list.append({"name": short_name, "sa": sa, "sb": sb, "winner": w})
            if w == city_a_name:
                leads_a.append((short_name, sa, sb))
            elif w == city_b_name:
                leads_b.append((short_name, sb, sa))

    # Line 1: Overall Performance
    if overall_a is not None and overall_b is not None:
        diff = round(abs(overall_a - overall_b), 1)
        if overall_winner == "tie" or diff < 2.0:
            p1 = f"{city_a_name} and {city_b_name} show comparable overall performance with composite scores of {overall_a} and {overall_b} out of 100 ({diff}-point variance)."
        elif overall_winner:
            w_score = overall_a if overall_winner == city_a_name else overall_b
            l_city = city_b_name if overall_winner == city_a_name else city_a_name
            l_score = overall_b if overall_winner == city_a_name else overall_a
            p1 = f"{overall_winner} outperforms {l_city} with a composite Smart City Index score of {w_score} vs {l_score} out of 100 ({diff}-point lead)."
        else:
            p1 = f"{city_a_name} ({overall_a}/100) and {city_b_name} ({overall_b}/100) have closely matched scores."
    else:
        p1 = f"Data coverage across evaluated indicators is currently insufficient to determine an overall winner between {city_a_name} and {city_b_name}."

    # Lines 2-3: Key Strengths
    p2 = ""
    primary_leader = city_a_name if (overall_winner == city_a_name or len(leads_a) >= len(leads_b)) else city_b_name
    primary_leads = leads_a if primary_leader == city_a_name else leads_b
    secondary_leader = city_b_name if primary_leader == city_a_name else city_a_name
    secondary_leads = leads_b if primary_leader == city_a_name else leads_a

    if primary_leads:
        top_str = " and ".join([f"{item[0]} ({item[1]} vs {item[2]})" for item in primary_leads[:2]])
        p2 = f"{primary_leader} holds key advantages in {top_str}."
        if secondary_leads:
            sec_str = " and ".join([f"{item[0]} ({item[1]} vs {item[2]})" for item in secondary_leads[:2]])
            p2 += f" Conversely, {secondary_leader} performs better in {sec_str}."
    else:
        p2 = "Both cities maintain balanced standards across evaluated environmental and utility domains."

    # Lines 4-5: Areas for Improvement
    lagging_city = city_b_name if overall_winner == city_a_name else city_a_name if overall_winner == city_b_name else None
    if lagging_city:
        deficits = [d for d in domain_list if d["winner"] != lagging_city and d["winner"] is not None]
        deficits.sort(key=lambda d: d["sb"] if lagging_city == city_b_name else d["sa"])
        target_names = [d["name"] for d in deficits[:2]]
        if target_names:
            p3 = f"To close the performance gap, {lagging_city} should prioritize infrastructure improvements in {' and '.join(target_names)}."
        else:
            p3 = f"To close the performance gap, {lagging_city} should focus on targeted municipal service upgrades."
    else:
        lower_domains = [d["name"] for d in domain_list if (d["sa"] < 75 or d["sb"] < 75)]
        if lower_domains:
            p3 = f"Both cities should focus on modernizing {' and '.join(lower_domains[:2])} to enhance long-term livability."
        else:
            p3 = "Both cities maintain strong operational standards across core urban benchmarks."

    concise_summary = f"{p1} {p2} {p3}"

    return {
        "overall_performance": p1,
        "key_strengths": p2,
        "areas_for_improvement": p3,
        "concise_summary": concise_summary,
    }
