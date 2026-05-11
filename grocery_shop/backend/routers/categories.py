"""
FreshNest — routers/categories.py
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud, schemas
from database import get_db

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=List[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)


@router.post("", response_model=schemas.CategoryOut, status_code=201)
def create_category(data: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db, data)


@router.delete("/{key}")
def delete_category(key: str, db: Session = Depends(get_db)):
    cat = crud.delete_category(db, key)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted", "key": key}
