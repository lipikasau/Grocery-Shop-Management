"""
FreshNest — main.py
FastAPI application entry point.
Serves the frontend as static files AND exposes the REST API.
"""

import os
from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import models
from database import engine, get_db
import crud, schemas
from routers import products, orders, categories, auth, admin_auth

# ─── Create all tables ────────────────────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FreshNest API",
    description="Premium Grocery Store Backend",
    version="1.0.0",
)

# Allow all origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(categories.router)
app.include_router(auth.router)
app.include_router(admin_auth.router)

# ─── Stats endpoint ──────────────────────────────────────────────────────────
@app.get("/api/stats", response_model=schemas.StatsOut, tags=["stats"])
def get_stats(db: Session = Depends(get_db)):
    return crud.get_stats(db)

# ─── Health check ────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "app": "FreshNest"}

# ─── Static files (serve the frontend) ──────────────────────────────────────
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..")

# Mount static files — this must come AFTER all API routes
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")
