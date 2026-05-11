"""
FreshNest — routers/products.py
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import crud, schemas
from database import get_db

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=List[schemas.ProductOut])
def list_products(
    category: Optional[str] = Query(None),
    search:   Optional[str] = Query(None),
    sort:     str            = Query("default"),
    skip:     int            = Query(0, ge=0),
    limit:    int            = Query(200, le=500),
    db: Session = Depends(get_db),
):
    return crud.get_products(db, category=category, search=search, sort=sort, skip=skip, limit=limit)


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=schemas.ProductOut, status_code=201)
def create_product(data: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, data)


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, data: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = crud.update_product(db, product_id, data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.delete_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted", "id": product_id}
