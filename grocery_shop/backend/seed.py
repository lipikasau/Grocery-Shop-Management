"""
FreshNest — seed.py
Populates the database with all categories and 32 starter products.
Run once: python seed.py  (from the backend/ directory)
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

CATEGORIES = [
    {"key": "fruits",    "label": "Fruits & Vegetables",  "emoji": "🍎"},
    {"key": "dairy",     "label": "Dairy & Eggs",         "emoji": "🥛"},
    {"key": "bakery",    "label": "Bakery",                "emoji": "🍞"},
    {"key": "meat",      "label": "Meat & Seafood",        "emoji": "🥩"},
    {"key": "beverages", "label": "Beverages",             "emoji": "🧃"},
    {"key": "snacks",    "label": "Snacks",                "emoji": "🍫"},
    {"key": "pantry",    "label": "Pantry & Staples",      "emoji": "🫙"},
    {"key": "frozen",    "label": "Frozen Foods",          "emoji": "❄️"},
]

PRODUCTS = [
    # Fruits & Veg
    {"name":"Hass Avocado",          "brand":"Organic Roots",   "category":"fruits",    "unit":"piece",  "price":2.40, "emoji":"🥑",  "badge":"organic"},
    {"name":"Heirloom Tomatoes",     "brand":"Fresh Farm",      "category":"fruits",    "unit":"kg",     "price":3.20, "emoji":"🍅",  "badge":"organic"},
    {"name":"Rainbow Carrots",       "brand":"Green Leaf",      "category":"fruits",    "unit":"bunch",  "price":2.10, "emoji":"🥕",  "badge":"organic"},
    {"name":"Strawberries",          "brand":"Berry Lane",      "category":"fruits",    "unit":"punnet", "price":4.50, "emoji":"🍓",  "badge":"sale"},
    {"name":"Blueberries",           "brand":"Wild Harvest",    "category":"fruits",    "unit":"125g",   "price":3.80, "emoji":"🫐",  "badge":"organic"},
    {"name":"Spinach",               "brand":"Green Leaf",      "category":"fruits",    "unit":"bunch",  "price":1.90, "emoji":"🥬",  "badge":None},
    {"name":"Meyer Lemon",           "brand":"Citrus Grove",    "category":"fruits",    "unit":"3 pack", "price":2.60, "emoji":"🍋",  "badge":None},
    {"name":"Mango Alphonso",        "brand":"Tropical Sun",    "category":"fruits",    "unit":"piece",  "price":1.80, "emoji":"🥭",  "badge":"sale"},
    # Dairy
    {"name":"Full Cream Milk",       "brand":"Amul",            "category":"dairy",     "unit":"1L",     "price":1.10, "emoji":"🥛",  "badge":None},
    {"name":"Aged Cheddar",          "brand":"Artisan Co.",     "category":"dairy",     "unit":"200g",   "price":5.20, "emoji":"🧀",  "badge":None},
    {"name":"Cultured Butter",       "brand":"Épicerie",        "category":"dairy",     "unit":"250g",   "price":4.80, "emoji":"🧈",  "badge":"organic"},
    {"name":"Greek Yogurt",          "brand":"Epigamia",        "category":"dairy",     "unit":"400g",   "price":3.10, "emoji":"🍶",  "badge":None},
    {"name":"Free Range Eggs",       "brand":"Country Hens",    "category":"dairy",     "unit":"12 pk",  "price":4.20, "emoji":"🥚",  "badge":"organic"},
    # Bakery
    {"name":"Sourdough Loaf",        "brand":"Le Boulanger",    "category":"bakery",    "unit":"loaf",   "price":5.50, "emoji":"🍞",  "badge":None},
    {"name":"Almond Croissant",      "brand":"Maison Douce",    "category":"bakery",    "unit":"piece",  "price":2.80, "emoji":"🥐",  "badge":"sale"},
    {"name":"Blueberry Muffin",      "brand":"Bakehouse",       "category":"bakery",    "unit":"piece",  "price":2.20, "emoji":"🧁",  "badge":None},
    {"name":"Multigrain Bread",      "brand":"Modern Bakers",   "category":"bakery",    "unit":"loaf",   "price":3.90, "emoji":"🥖",  "badge":"organic"},
    # Meat & Seafood
    {"name":"Atlantic Salmon",       "brand":"OceanFresh",      "category":"meat",      "unit":"kg",     "price":12.50,"emoji":"🐟",  "badge":None},
    {"name":"Free Range Chicken",    "brand":"Suguna",          "category":"meat",      "unit":"kg",     "price":7.80, "emoji":"🍗",  "badge":"organic"},
    {"name":"Tiger Prawns",          "brand":"SeaKing",         "category":"meat",      "unit":"500g",   "price":9.20, "emoji":"🍤",  "badge":None},
    # Beverages
    {"name":"Cold Brew Coffee",      "brand":"Sleepy Owl",      "category":"beverages", "unit":"250ml",  "price":2.90, "emoji":"☕",  "badge":None},
    {"name":"Fresh Orange Juice",    "brand":"Tropicana",       "category":"beverages", "unit":"1L",     "price":3.40, "emoji":"🍊",  "badge":"organic"},
    {"name":"Sparkling Water",       "brand":"Evian",           "category":"beverages", "unit":"1L",     "price":1.60, "emoji":"💧",  "badge":None},
    {"name":"Matcha Latte Mix",      "brand":"OMGTea",          "category":"beverages", "unit":"100g",   "price":8.50, "emoji":"🍵",  "badge":"sale"},
    # Snacks
    {"name":"Dark Chocolate 72%",    "brand":"Lindt",           "category":"snacks",    "unit":"100g",   "price":3.90, "emoji":"🍫",  "badge":None},
    {"name":"Mixed Nuts",            "brand":"Happilo",         "category":"snacks",    "unit":"200g",   "price":5.60, "emoji":"🥜",  "badge":"organic"},
    {"name":"Digestive Biscuits",    "brand":"McVities",        "category":"snacks",    "unit":"400g",   "price":2.70, "emoji":"🍪",  "badge":None},
    # Pantry
    {"name":"Basmati Rice",          "brand":"India Gate",      "category":"pantry",    "unit":"5kg",    "price":9.80, "emoji":"🍚",  "badge":None},
    {"name":"Extra Virgin Olive Oil","brand":"Figaro",          "category":"pantry",    "unit":"500ml",  "price":7.40, "emoji":"🫙",  "badge":None},
    {"name":"Turmeric & Spice Set",  "brand":"Everest",         "category":"pantry",    "unit":"set",    "price":6.20, "emoji":"🌶️", "badge":"sale"},
    # Frozen
    {"name":"Frozen Garden Peas",    "brand":"McCain",          "category":"frozen",    "unit":"500g",   "price":2.10, "emoji":"🫛",  "badge":None},
    {"name":"Vanilla Bean Ice Cream","brand":"Kwality Walls",   "category":"frozen",    "unit":"1L",     "price":5.80, "emoji":"🍨",  "badge":"sale"},
]


def seed():
    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(models.Product).count() > 0:
            print("[OK] Database already seeded -- skipping.")
            return

        print("[*] Seeding categories...")
        for cat_data in CATEGORIES:
            cat = models.Category(**cat_data)
            db.add(cat)
        db.commit()

        print("[*] Seeding products...")
        for prod_data in PRODUCTS:
            prod = models.Product(**prod_data)
            db.add(prod)
        db.commit()

        print(f"[OK] Seeded {len(CATEGORIES)} categories and {len(PRODUCTS)} products.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
