"""
One-time migration: adds columns that were added to models.py
but are missing from the existing SQLite database file.
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "..", "freshnest.db")
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# ── orders table ────────────────────────────────────────────────
cur.execute("PRAGMA table_info(orders)")
order_cols = [row[1] for row in cur.fetchall()]
print("orders columns:", order_cols)

if "user_id" not in order_cols:
    cur.execute("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)")
    print("  [OK] Added orders.user_id")
else:
    print("  [SKIP] orders.user_id already exists")

if "address" not in order_cols:
    cur.execute("ALTER TABLE orders ADD COLUMN address TEXT DEFAULT ''")
    print("  [OK] Added orders.address")
else:
    print("  [SKIP] orders.address already exists")

conn.commit()
conn.close()
print("Migration complete.")
