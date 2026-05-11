"""
One-time migration: add 'address' column to the orders table if it doesn't exist.
Run from the backend directory: python migrate_address.py
"""
import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "freshnest.db")

conn   = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check existing columns
cursor.execute("PRAGMA table_info(orders)")
columns = [row[1] for row in cursor.fetchall()]
print("Current orders columns:", columns)

if "address" not in columns:
    cursor.execute("ALTER TABLE orders ADD COLUMN address TEXT DEFAULT ''")
    conn.commit()
    print("✅  'address' column added to orders table.")
else:
    print("ℹ️  'address' column already exists — nothing to do.")

conn.close()
