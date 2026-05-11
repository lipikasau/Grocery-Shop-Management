"""
FreshNest — schemas.py
Pydantic models for request validation and response serialisation.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── User / Auth ──────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name:     str
    email:    str
    password: str

class UserLogin(BaseModel):
    email:    str
    password: str

class UserOut(BaseModel):
    id:         int
    name:       str
    email:      str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut

class AdminMpinIn(BaseModel):
    mpin: str


# ─── Category ────────────────────────────────────────────────────────────────

class CategoryBase(BaseModel):
    key:   str
    label: str
    emoji: Optional[str] = "🛒"

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    class Config:
        from_attributes = True


# ─── Product ─────────────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    name:        str
    brand:       str        = ""
    category:    str
    unit:        str        = "piece"
    price:       float      = Field(gt=0)
    emoji:       str        = "🛒"
    badge:       Optional[str] = None
    in_stock:    bool       = True
    description: str        = ""

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name:        Optional[str]   = None
    brand:       Optional[str]   = None
    category:    Optional[str]   = None
    unit:        Optional[str]   = None
    price:       Optional[float] = None
    emoji:       Optional[str]   = None
    badge:       Optional[str]   = None
    in_stock:    Optional[bool]  = None
    description: Optional[str]  = None

class ProductOut(ProductBase):
    id:         int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# ─── Order ────────────────────────────────────────────────────────────────────

class OrderItemIn(BaseModel):
    product_id: int
    qty:        int = Field(ge=1)

class OrderCreate(BaseModel):
    customer_name:  str = "Guest"
    customer_email: str = ""
    address:        str = ""
    notes:          str = ""
    items:          List[OrderItemIn]
    user_id:        Optional[int] = None

class OrderItemOut(BaseModel):
    id:         int
    product_id: int
    qty:        int
    unit_price: float
    product:    Optional[ProductOut] = None
    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id:             int
    user_id:        Optional[int] = None
    customer_name:  str
    customer_email: str
    address:        str = ""
    status:         str
    total:          float
    notes:          str
    created_at:     Optional[datetime] = None
    items:          List[OrderItemOut] = []
    class Config:
        from_attributes = True


# ─── Stats ───────────────────────────────────────────────────────────────────

class StatsOut(BaseModel):
    total_products: int
    total_orders:   int
    total_revenue:  float
    pending_orders: int
    low_stock:      int   # products with in_stock=False
