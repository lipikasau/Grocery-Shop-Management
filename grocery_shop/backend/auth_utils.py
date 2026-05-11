"""
FreshNest — auth_utils.py
JWT creation/validation + password hashing + Admin MPIN.
"""

import os
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

# ─── Config ──────────────────────────────────────────────────────────────────
SECRET_KEY  = os.getenv("FRESHNEST_SECRET", "freshnest-super-secret-key-change-in-prod")
ALGORITHM   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7   # 7 days

# ── Admin MPIN (change this to whatever 4-digit PIN you want) ─────────────────
ADMIN_MPIN = "2580"

# ─── Password Hashing ────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ─── JWT ─────────────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ─── Admin MPIN verify ───────────────────────────────────────────────────────
def verify_admin_mpin(mpin: str) -> bool:
    return mpin == ADMIN_MPIN


def create_admin_token() -> str:
    return create_access_token({"sub": "admin", "role": "admin"}, timedelta(hours=8))
