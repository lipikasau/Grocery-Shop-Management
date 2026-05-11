"""
FreshNest — crud.py
All database read/write operations.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas
from auth_utils import hash_password, verify_password


# ─── Users ──────────────────────────────────────────────────────────────────

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email.lower()).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, data: schemas.UserCreate):
    if get_user_by_email(db, data.email):
        return None   # email already exists
    user = models.User(
        name=data.name,
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_orders(db: Session, user_id: int):
    return (
        db.query(models.Order)
        .filter(models.Order.user_id == user_id)
        .order_by(models.Order.created_at.desc())
        .all()
    )


# ─── Categories ──────────────────────────────────────────────────────────────

def get_categories(db: Session):
    return db.query(models.Category).all()

def create_category(db: Session, data: schemas.CategoryCreate):
    cat = models.Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

def delete_category(db: Session, key: str):
    cat = db.query(models.Category).filter(models.Category.key == key).first()
    if cat:
        db.delete(cat)
        db.commit()
    return cat


# ─── Products ────────────────────────────────────────────────────────────────

def get_products(
    db: Session,
    category: str = None,
    search: str   = None,
    sort: str     = "default",
    skip: int     = 0,
    limit: int    = 200,
):
    q = db.query(models.Product)

    if category and category != "all":
        q = q.filter(models.Product.category == category)

    if search:
        term = f"%{search.lower()}%"
        q = q.filter(
            models.Product.name.ilike(term)  |
            models.Product.brand.ilike(term) |
            models.Product.category.ilike(term)
        )

    if sort == "price-asc":
        q = q.order_by(models.Product.price.asc())
    elif sort == "price-desc":
        q = q.order_by(models.Product.price.desc())
    elif sort == "name":
        q = q.order_by(models.Product.name.asc())
    else:
        q = q.order_by(models.Product.id.asc())

    return q.offset(skip).limit(limit).all()

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def create_product(db: Session, data: schemas.ProductCreate):
    product = models.Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

def update_product(db: Session, product_id: int, data: schemas.ProductUpdate):
    product = get_product(db, product_id)
    if not product:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product

def delete_product(db: Session, product_id: int):
    product = get_product(db, product_id)
    if product:
        db.delete(product)
        db.commit()
    return product


# ─── Orders ──────────────────────────────────────────────────────────────────

def create_order(db: Session, data: schemas.OrderCreate):
    total = 0.0
    order = models.Order(
        user_id=data.user_id,
        customer_name=data.customer_name,
        customer_email=data.customer_email,
        address=data.address,
        notes=data.notes,
    )
    db.add(order)
    db.flush()   # get order.id without committing

    for item_in in data.items:
        product = get_product(db, item_in.product_id)
        if not product:
            continue
        unit_price = product.price
        order_item = models.OrderItem(
            order_id=order.id,
            product_id=item_in.product_id,
            qty=item_in.qty,
            unit_price=unit_price,
        )
        db.add(order_item)
        total += unit_price * item_in.qty

    order.total = round(total, 2)
    db.commit()
    db.refresh(order)
    return order

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Order)
        .order_by(models.Order.created_at.desc())
        .offset(skip).limit(limit).all()
    )

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def update_order_status(db: Session, order_id: int, status: str):
    order = get_order(db, order_id)
    if order:
        order.status = status
        db.commit()
        db.refresh(order)
    return order


# ─── Stats ───────────────────────────────────────────────────────────────────

def get_stats(db: Session) -> schemas.StatsOut:
    total_products = db.query(func.count(models.Product.id)).scalar()
    total_orders   = db.query(func.count(models.Order.id)).scalar()
    total_revenue  = db.query(func.sum(models.Order.total)).scalar() or 0.0
    pending_orders = db.query(func.count(models.Order.id)).filter(models.Order.status == "pending").scalar()
    low_stock      = db.query(func.count(models.Product.id)).filter(models.Product.in_stock == False).scalar()

    return schemas.StatsOut(
        total_products=total_products,
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        pending_orders=pending_orders,
        low_stock=low_stock,
    )
