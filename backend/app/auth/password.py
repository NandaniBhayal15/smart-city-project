"""
Password hashing utilities with Python 3.14 support.
Uses hashlib.pbkdf2_hmac or passlib/bcrypt.
"""
import hashlib
import os
import hmac

def hash_password(plain_password: str) -> str:
    """Return secure salted hash of the given password."""
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac(
        'sha256',
        plain_password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return f"{salt}${key}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored salt$hash."""
    try:
        if '$' in hashed_password:
            salt, stored_key = hashed_password.split('$', 1)
            key = hashlib.pbkdf2_hmac(
                'sha256',
                plain_password.encode('utf-8'),
                salt.encode('utf-8'),
                100000
            ).hex()
            return hmac.compare_digest(key, stored_key)
        # Fallback for plain bcrypt if old hash
        import bcrypt
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False
