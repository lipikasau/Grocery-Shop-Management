"""
FreshNest — models.py
SQLAlchemy ORM table definitions.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ─── User ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(150), nullable=False)
    email           = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    orders = relationship("Order", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id    = Column(Integer, primary_key=True, index=True)
    key   = Column(String(50), unique=True, index=True, nullable=False)   # e.g. "fruits"
    label = Column(String(100), nullable=False)                            # e.g. "Fruits & Vegetables"
    emoji = Column(String(10), default="🛒")

    products = relationship("Product", back_populates="category_rel")


class Product(Base):
    __tablename__ = "products"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(150), nullable=False, index=True)
    brand        = Column(String(100), nullable=False, default="")
    category     = Column(String(50), ForeignKey("categories.key"), nullable=False, index=True)
    unit         = Column(String(50), nullable=False, default="piece")
    price        = Column(Float, nullable=False)
    emoji        = Column(String(10), default="🛒")
    badge        = Column(String(20), nullable=True)    # "organic" | "sale" | null
    in_stock     = Column(Boolean, default=True)
    description  = Column(Text, default="")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    category_rel = relationship("Category", back_populates="products")
    order_items  = relationship("OrderItem", back_populates="product")


class Order(Base):
    __tablename__ = "orders"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=True)   # null = guest
    customer_name = Column(String(150), default="Guest")
    customer_email= Column(String(200), default="")
    address       = Column(Text, default="")
    status        = Column(String(30), default="pending")   # pending | confirmed | delivered
    total         = Column(Float, default=0.0)
    notes         = Column(Text, default="")
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    user  = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id         = Column(Integer, primary_key=True, index=True)
    order_id   = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    qty        = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)

    order   = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
