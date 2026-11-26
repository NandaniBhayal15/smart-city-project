from app.schemas.auth import (
    SignupRequest, LoginRequest, TokenResponse,
    RefreshRequest, ForgotPasswordRequest, ResetPasswordRequest,
)
from app.schemas.user import UserOut, UserUpdate, UserAdminUpdate, ChangePasswordRequest, PaginatedUsers
from app.schemas.city import CityCreate, CityUpdate, CityOut, CityListOut
from app.schemas.indicators import (
    AirQualityCreate, AirQualityOut,
    WeatherCreate, WeatherOut,
    TransportationCreate, TransportationOut,
    WaterCreate, WaterOut,
    EnergyCreate, EnergyOut,
    WasteCreate, WasteOut,
)
from app.schemas.analytics import (
    CategoryScore, CityComparisonOut, TrendOut, DashboardStats,
    PredictionOut, RecommendationOut,
)
