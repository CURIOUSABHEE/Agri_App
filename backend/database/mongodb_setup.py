"""
MongoDB Database Setup for Agricultural Platform
Priority: CRITICAL - Phase 1, Day 1-2
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel
from datetime import datetime
import asyncio

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DB_NAME", "agriadvisor")

# Global database connection
database = None
client = None

async def connect_to_mongo():
    """Create database connection"""
    global client, database
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    print(f"Connected to MongoDB: {DATABASE_NAME}")
    return database

async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB")

async def create_indexes():
    """Create optimized indexes for all collections"""
    
    # Farmers Collection Indexes
    farmers_indexes = [
        IndexModel("farmer_id", unique=True),
        IndexModel("personal_details.phone", unique=True),
        IndexModel("personal_details.email", sparse=True),
        IndexModel([("personal_details.address.district", 1), ("account_status", 1)]),
        IndexModel("last_active"),
        IndexModel([("personal_details.name", "text"), ("farms.name", "text")])
    ]
    
    # Farms Collection Indexes (for geospatial queries)
    farms_indexes = [
        IndexModel("farm_id", unique=True),
        IndexModel("farmer_id"),
        IndexModel([("location.coordinates", "2dsphere")]),  # Geospatial
        IndexModel("district")
    ]
    
    # Inventory Collection Indexes
    inventory_indexes = [
        IndexModel([("farmer_id", 1), ("category", 1)]),
        IndexModel("expiry_date"),
        IndexModel([("farmer_id", 1), ("item_name", "text")])
    ]
    
    # Weather Data Indexes (Time Series)
    weather_indexes = [
        IndexModel([("timestamp", -1), ("district", 1)]),
        IndexModel("location")
    ]
    
    # Market Prices Indexes (Time Series)
    market_indexes = [
        IndexModel([("timestamp", -1), ("crop", 1), ("district", 1)]),
        IndexModel([("crop", 1), ("district", 1), ("timestamp", -1)])
    ]
    
    # Activity Logs Indexes
    activity_indexes = [
        IndexModel([("farmer_id", 1), ("timestamp", -1)]),
        IndexModel("activity_type"),
        IndexModel("timestamp", expireAfterSeconds=7776000)  # 90 days retention
    ]

    try:
        # Create indexes for all collections
        await database.farmers.create_indexes(farmers_indexes)
        await database.farms.create_indexes(farms_indexes)
        await database.inventory.create_indexes(inventory_indexes)
        await database.weather_data.create_indexes(weather_indexes)
        await database.market_prices.create_indexes(market_indexes)
        await database.activity_logs.create_indexes(activity_indexes)
        
        print("✅ All database indexes created successfully")
        
    except Exception as e:
        print(f"❌ Error creating indexes: {e}")

async def setup_collections():
    """Setup collections with validation rules"""
    
    # Farmers collection with schema validation
    farmers_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["farmer_id", "personal_details", "registration_date"],
            "properties": {
                "farmer_id": {"bsonType": "string"},
                "personal_details": {
                    "bsonType": "object",
                    "required": ["name", "phone"],
                    "properties": {
                        "name": {"bsonType": "string", "minLength": 2},
                        "phone": {"bsonType": "string", "pattern": "^\\+91[0-9]{10}$"},
                        "language_preference": {"enum": ["en", "hi", "ml", "ta", "te", "kn"]}
                    }
                },
                "account_status": {"enum": ["active", "inactive", "suspended"]},
                "subscription_plan": {"enum": ["free", "premium", "enterprise"]}
            }
        }
    }

    try:
        # Create collections with validation
        await database.create_collection("farmers", validator=farmers_validator)
        print("✅ Farmers collection created with validation")
        
        # Create time series collections for weather and market data
        await database.create_collection(
            "weather_data", 
            timeseries={"timeField": "timestamp", "metaField": "district"}
        )
        
        await database.create_collection(
            "market_prices",
            timeseries={"timeField": "timestamp", "metaField": "crop"}
        )
        
        print("✅ Time series collections created")
        
    except Exception as e:
        # Collections might already exist
        print(f"ℹ️  Collections setup: {e}")

async def seed_initial_data():
    """Seed initial reference data"""
    
    # Kerala Districts
    kerala_districts = [
        "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
        "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
        "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
    ]
    
    # Common Crops in Kerala
    kerala_crops = [
        {"name": "Rice", "malayalam": "നെൽ", "hindi": "चावल", "season": ["monsoon", "post_monsoon"]},
        {"name": "Coconut", "malayalam": "തെങ്ങ്", "hindi": "नारियल", "season": ["year_round"]},
        {"name": "Pepper", "malayalam": "കുരുമുളക്", "hindi": "काली मिर्च", "season": ["post_monsoon"]},
        {"name": "Cardamom", "malayalam": "ഏലക്ക", "hindi": "इलायची", "season": ["post_monsoon"]},
        {"name": "Rubber", "malayalam": "റബ്ബർ", "hindi": "रबड़", "season": ["year_round"]},
        {"name": "Tea", "malayalam": "ചായ", "hindi": "चाय", "season": ["year_round"]},
        {"name": "Coffee", "malayalam": "കാപ്പി", "hindi": "कॉफी", "season": ["year_round"]},
        {"name": "Banana", "malayalam": "വാഴ", "hindi": "केला", "season": ["year_round"]}
    ]
    
    # Government Schemes
    government_schemes = [
        {
            "scheme_id": "PM_KISAN",
            "name": "PM-KISAN Samman Nidhi",
            "malayalam": "പ്രധാനമന്ത്രി കിസാൻ സമ്മാൻ നിധി",
            "hindi": "प्रधानमंत्री किसान सम्मान निधि",
            "category": "financial_support",
            "amount": "₹6000/year",
            "eligibility": "Small and marginal farmers"
        },
        {
            "scheme_id": "KERALA_KARSHAKA",
            "name": "Kerala Karshaka Welfare Fund",
            "malayalam": "കേരള കർഷക ക്ഷേമ ഫണ്ട്",
            "hindi": "केरल कर्षक कल्याण फंड",
            "category": "welfare",
            "amount": "Various benefits",
            "eligibility": "Registered Kerala farmers"
        }
    ]

    try:
        # Insert reference data
        await database.districts.insert_many([{"name": d, "state": "Kerala"} for d in kerala_districts])
        await database.crops.insert_many(kerala_crops)
        await database.schemes.insert_many(government_schemes)
        
        print("✅ Initial reference data seeded")
        
    except Exception as e:
        print(f"ℹ️  Seed data: {e}")

# Main setup function
async def initialize_database():
    """Complete database initialization"""
    print("🚀 Starting database initialization...")
    
    # Connect to MongoDB
    await connect_to_mongo()
    
    # Setup collections
    await setup_collections()
    
    # Create indexes
    await create_indexes()
    
    # Seed initial data
    await seed_initial_data()
    
    print("✅ Database initialization complete!")
    return database

# Database utility functions
async def get_database():
    """Get database instance"""
    global database
    if database is None:
        database = await connect_to_mongo()
    return database

async def health_check():
    """Database health check"""
    try:
        db = await get_database()
        # Simple ping
        await db.command("ping")
        return {"status": "healthy", "timestamp": datetime.now()}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e), "timestamp": datetime.now()}

if __name__ == "__main__":
    # Run database setup
    asyncio.run(initialize_database())