"""
FreshNest — routers/orders.py
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud, schemas
from database import get_db

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=schemas.OrderOut, status_code=201)
def place_order(data: schemas.OrderCreate, db: Session = Depends(get_db)):
    if not data.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")
    return crud.create_order(db, data)


@router.get("", response_model=List[schemas.OrderOut])
def list_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_orders(db, skip=skip, limit=limit)


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status")
def update_status(order_id: int, status: str, db: Session = Depends(get_db)):
    allowed = {"pending", "confirmed", "preparing", "delivered", "cancelled"}
    if status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")
    order = crud.update_order_status(db, order_id, status)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Status updated", "order_id": order_id, "status": status}
