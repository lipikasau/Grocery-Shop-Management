"""
FreshNest — routers/auth.py
User signup, login, and profile endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

import crud, schemas
from database import get_db
from auth_utils import verify_password, create_access_token, decode_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("role") == "admin":
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    user = crud.get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/signup", response_model=schemas.Token, status_code=201)
def signup(data: schemas.UserCreate, db: Session = Depends(get_db)):
    user = crud.create_user(db, data)
    if not user:
        raise HTTPException(status_code=400, detail="Email already registered")
    token = create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=token, user=user)


@router.post("/login", response_model=schemas.Token)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=token, user=user)


@router.get("/me", response_model=schemas.UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user


@router.get("/orders", response_model=list[schemas.OrderOut])
def my_orders(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_user_orders(db, current_user.id)
