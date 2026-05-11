"""
FreshNest — routers/admin_auth.py
Admin MPIN verification endpoint.
"""

from fastapi import APIRouter, HTTPException
import schemas
from auth_utils import verify_admin_mpin, create_admin_token

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/verify-mpin")
def verify_mpin(data: schemas.AdminMpinIn):
    if not verify_admin_mpin(data.mpin):
        raise HTTPException(status_code=403, detail="Invalid MPIN")
    token = create_admin_token()
    return {"access_token": token, "token_type": "bearer"}
