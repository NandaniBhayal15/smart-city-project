"""
JWT token creation and verification.
Uses PyJWT / python-jose if available, or zero-dependency standard library fallback.
"""
from datetime import datetime, timedelta
import json
import base64
import hmac
import hashlib
from typing import Optional, Dict, Any
from app.config import settings

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _b64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def _fallback_encode(payload: dict, secret: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    h_bytes = _b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    p_bytes = _b64url_encode(json.dumps(payload, separators=(',', ':'), default=str).encode('utf-8'))
    signing_input = f"{h_bytes}.{p_bytes}"
    sig = hmac.new(secret.encode('utf-8'), signing_input.encode('utf-8'), hashlib.sha256).digest()
    sig_b64 = _b64url_encode(sig)
    return f"{signing_input}.{sig_b64}"

def _fallback_decode(token: str, secret: str) -> Optional[dict]:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        signing_input = f"{parts[0]}.{parts[1]}"
        expected_sig = hmac.new(secret.encode('utf-8'), signing_input.encode('utf-8'), hashlib.sha256).digest()
        actual_sig = _b64url_decode(parts[2])
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload_bytes = _b64url_decode(parts[1])
        payload = json.loads(payload_bytes.decode('utf-8'))
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            return None
        return payload
    except Exception:
        return None

# Try importing standard libraries first
_jwt_lib = None
try:
    import jwt as _pyjwt
    _jwt_lib = _pyjwt
except ImportError:
    try:
        from jose import jwt as _josejwt
        _jwt_lib = _josejwt
    except ImportError:
        _jwt_lib = None


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": int(expire.timestamp()), "type": "access"})
    if _jwt_lib is not None:
        try:
            return _jwt_lib.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        except Exception:
            pass
    return _fallback_encode(to_encode, settings.SECRET_KEY)


def create_refresh_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": int(expire.timestamp()), "type": "refresh"})
    if _jwt_lib is not None:
        try:
            return _jwt_lib.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        except Exception:
            pass
    return _fallback_encode(to_encode, settings.SECRET_KEY)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode token; return payload dict or None on failure."""
    if _jwt_lib is not None:
        try:
            return _jwt_lib.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except Exception:
            pass
    return _fallback_decode(token, settings.SECRET_KEY)


def get_user_id_from_token(token: str) -> Optional[str]:
    payload = decode_token(token)
    if payload is None:
        return None
    return payload.get("sub")
