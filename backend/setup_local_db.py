"""
Local Development Database Setup
This creates a local SQLite database as a fallback for development
"""

import sqlite3
import json
from datetime import datetime
import os

def setup_local_database():
    """Setup local SQLite database for development"""
    
    db_path = "local_agri_db.sqlite"
    
    print("🏠 Setting up local development database...")
    
    # Create connection
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create farmers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS farmers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id TEXT UNIQUE NOT NULL,
            personal_details TEXT NOT NULL,
            authentication TEXT,
            farms TEXT DEFAULT '[]',
            inventory TEXT DEFAULT '[]',
            registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
            account_status TEXT DEFAULT 'active'
        )
    ''')
    
    # Create farms table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS farms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_id TEXT UNIQUE NOT NULL,
            farmer_id TEXT NOT NULL,
            name TEXT NOT NULL,
            area_acres REAL,
            soil_type TEXT,
            location TEXT,
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (farmer_id) REFERENCES farmers (farmer_id)
        )
    ''')
    
    # Create inventory table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id TEXT UNIQUE NOT NULL,
            farmer_id TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT,
            quantity REAL,
            unit TEXT,
            price_per_unit REAL,
            expiry_date DATETIME,
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (farmer_id) REFERENCES farmers (farmer_id)
        )
    ''')
    
    # Create chat history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id TEXT,
            message TEXT NOT NULL,
            response TEXT NOT NULL,
            language TEXT DEFAULT 'en',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (farmer_id) REFERENCES farmers (farmer_id)
        )
    ''')
    
    # Create activity logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id TEXT,
            activity_type TEXT NOT NULL,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create reference data tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS kerala_districts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            malayalam TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS crops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            malayalam TEXT,
            hindi TEXT,
            seasons TEXT,
            soil_types TEXT
        )
    ''')
    
    # Insert Kerala districts
    districts = [
        ("Thiruvananthapuram", "തിരുവനന്തപുരം"),
        ("Kollam", "കൊല്ലം"),
        ("Kottayam", "കോട്ടയം"),
        ("Ernakulam", "എറണാകുളം"),
        ("Thrissur", "തൃശ്ശൂർ"),
        ("Palakkad", "പാലക്കാട്"),
        ("Kozhikode", "കോഴിക്കോട്"),
        ("Kannur", "കണ്ണൂർ")
    ]
    
    cursor.executemany(
        "INSERT OR IGNORE INTO kerala_districts (name, malayalam) VALUES (?, ?)",
        districts
    )
    
    # Insert common crops
    crops = [
        ("Rice", "നെൽ", "चावल", "monsoon,post_monsoon", "clay,loamy"),
        ("Coconut", "തെങ്ങ്", "नारियल", "year_round", "sandy,loamy,laterite"),
        ("Pepper", "കുരുമുളക്", "काली मिर्च", "post_monsoon", "laterite,loamy"),
        ("Cardamom", "ഏലക്ക", "इलायची", "post_monsoon", "laterite")
    ]
    
    cursor.executemany(
        "INSERT OR IGNORE INTO crops (name, malayalam, hindi, seasons, soil_types) VALUES (?, ?, ?, ?, ?)",
        crops
    )
    
    # Commit and close
    conn.commit()
    conn.close()
    
    print(f"✅ Local database created: {db_path}")
    print("📊 Tables created: farmers, farms, inventory, chat_history, activity_logs")
    print("🌴 Kerala reference data added")
    
    return db_path

if __name__ == "__main__":
    db_path = setup_local_database()
    print(f"\n🎯 Local database ready at: {db_path}")
    print("💡 You can use this for development while fixing MongoDB connection")