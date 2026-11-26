"""
FastAPI dependencies for authentication and authorization.
Injects current user from Bearer token into route handlers.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt_handler import decode_token
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer()


def _get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    import uuid
    try:
        user_uuid = uuid.UUID(str(user_id).strip())
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(
        User.id == user_uuid,
        User.is_active == True
    ).first()
    if user is None:
        raise credentials_exception

    return user


def get_current_user(user: User = Depends(_get_current_user)) -> User:
    """Return currently authenticated user (any role)."""
    return user


def get_current_admin(user: User = Depends(_get_current_user)) -> User:
    """Return currently authenticated user only if they are an admin."""
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
