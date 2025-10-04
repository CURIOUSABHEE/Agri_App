"""
Database Initialization Script for Agricultural Platform
This script will set up all collections, indexes, and seed data for your MongoDB database
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

async def initialize_agricultural_database():
    """Initialize the complete agricultural database"""
    
    MONGO_URL = os.getenv("MONGO_URL")
    DB_NAME = os.getenv("DB_NAME", "agriadvisor")
    
    if not MONGO_URL:
        print("❌ MONGO_URL not found in environment variables")
        return False
    
    print("🌾 Initializing Agricultural Database...")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGO_URL)
        database = client[DB_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas successfully!")
        
        # Initialize collections and data
        await setup_farmers_collection(database)
        await setup_farms_collection(database)
        await setup_inventory_collection(database)
        await setup_weather_collection(database)
        await setup_market_collection(database)
        await setup_schemes_collection(database)
        await setup_activity_logs_collection(database)
        await setup_authentication_collections(database)
        
        # Seed reference data
        await seed_kerala_reference_data(database)
        
        print("\n🎉 Database initialization completed successfully!")
        print(f"📊 Database: {DB_NAME}")
        print("✅ Ready for agricultural platform operations!")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Check your MongoDB Atlas credentials")
        print("2. Verify network access (whitelist your IP)")
        print("3. Ensure database user has read/write permissions")
        return False

async def setup_farmers_collection(db):
    """Setup farmers collection with indexes and validation"""
    print("👨‍🌾 Setting up farmers collection...")
    
    # Create collection with validation
    try:
        await db.create_collection("farmers", validator={
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["farmer_id", "personal_details", "registration_date"],
                "properties": {
                    "farmer_id": {"bsonType": "string"},
                    "personal_details": {
                        "bsonType": "object",
                        "required": ["phone"],
                        "properties": {
                            "name": {"bsonType": "string"},
                            "phone": {"bsonType": "string"},
                            "language_preference": {"enum": ["en", "hi", "ml", "ta", "te", "kn"]}
                        }
                    }
                }
            }
        })
    except Exception:
        pass  # Collection might already exist
    
    # Create indexes
    await db.farmers.create_index("farmer_id", unique=True)
    await db.farmers.create_index("personal_details.phone", unique=True)
    await db.farmers.create_index([("personal_details.name", "text")])
    
    print("   ✅ Farmers collection ready")

async def setup_farms_collection(db):
    """Setup farms collection with geospatial indexes"""
    print("🚜 Setting up farms collection...")
    
    await db.farms.create_index("farm_id", unique=True)
    await db.farms.create_index("farmer_id")
    await db.farms.create_index([("location", "2dsphere")])  # Geospatial
    await db.farms.create_index("address.district")
    
    print("   ✅ Farms collection ready")

async def setup_inventory_collection(db):
    """Setup inventory collection"""
    print("📦 Setting up inventory collection...")
    
    await db.inventory.create_index([("farmer_id", 1), ("category", 1)])
    await db.inventory.create_index("expiry_date")
    await db.inventory.create_index([("name", "text")])
    
    print("   ✅ Inventory collection ready")

async def setup_weather_collection(db):
    """Setup weather data time series collection"""
    print("🌤️ Setting up weather collection...")
    
    try:
        await db.create_collection(
            "weather_data",
            timeseries={
                "timeField": "timestamp",
                "metaField": "location",
                "granularity": "hours"
            }
        )
    except Exception:
        pass
    
    await db.weather_data.create_index([("timestamp", -1), ("location", 1)])
    
    print("   ✅ Weather collection ready")

async def setup_market_collection(db):
    """Setup market prices time series collection"""
    print("💰 Setting up market prices collection...")
    
    try:
        await db.create_collection(
            "market_prices",
            timeseries={
                "timeField": "timestamp", 
                "metaField": "crop",
                "granularity": "hours"
            }
        )
    except Exception:
        pass
    
    await db.market_prices.create_index([("timestamp", -1), ("crop", 1)])
    
    print("   ✅ Market prices collection ready")

async def setup_schemes_collection(db):
    """Setup government schemes collection"""
    print("🏛️ Setting up schemes collection...")
    
    await db.schemes.create_index("scheme_id", unique=True)
    await db.schemes.create_index("category")
    await db.schemes.create_index([("name", "text"), ("description", "text")])
    
    print("   ✅ Schemes collection ready")

async def setup_activity_logs_collection(db):
    """Setup activity logs with TTL"""
    print("📝 Setting up activity logs...")
    
    await db.activity_logs.create_index([("farmer_id", 1), ("timestamp", -1)])
    await db.activity_logs.create_index("timestamp", expireAfterSeconds=7776000)  # 90 days
    
    print("   ✅ Activity logs collection ready")

async def setup_authentication_collections(db):
    """Setup authentication related collections"""
    print("🔐 Setting up authentication collections...")
    
    # OTP verifications (with TTL)
    await db.otp_verifications.create_index("phone", unique=True)
    await db.otp_verifications.create_index("expires_at", expireAfterSeconds=0)
    
    # Passkey challenges (with TTL)  
    await db.passkey_challenges.create_index("farmer_id", unique=True)
    await db.passkey_challenges.create_index("expires_at", expireAfterSeconds=0)
    
    print("   ✅ Authentication collections ready")

async def seed_kerala_reference_data(db):
    """Seed Kerala-specific reference data"""
    print("🌴 Seeding Kerala reference data...")
    
    # Kerala districts
    kerala_districts = [
        {"name": "Thiruvananthapuram", "malayalam": "തിരുവനന്തപുരം"},
        {"name": "Kollam", "malayalam": "കൊല്ലം"},
        {"name": "Pathanamthitta", "malayalam": "പത്തനംതിട്ട"},
        {"name": "Alappuzha", "malayalam": "ആലപ്പുഴ"},
        {"name": "Kottayam", "malayalam": "കോട്ടയം"},
        {"name": "Idukki", "malayalam": "ഇടുക്കി"},
        {"name": "Ernakulam", "malayalam": "എറണാകുളം"},
        {"name": "Thrissur", "malayalam": "തൃശ്ശൂർ"},
        {"name": "Palakkad", "malayalam": "പാലക്കാട്"},
        {"name": "Malappuram", "malayalam": "മലപ്പുറം"},
        {"name": "Kozhikode", "malayalam": "കോഴിക്കോട്"},
        {"name": "Wayanad", "malayalam": "വയനാട്"},
        {"name": "Kannur", "malayalam": "കണ്ണൂർ"},
        {"name": "Kasaragod", "malayalam": "കാസർഗോഡ്"}
    ]
    
    # Kerala crops
    kerala_crops = [
        {
            "name": "Rice",
            "malayalam": "നെൽ",
            "hindi": "चावल",
            "scientific_name": "Oryza sativa",
            "seasons": ["kharif", "rabi"],
            "soil_types": ["clay", "loamy"],
            "water_requirement": "high",
            "growing_period_days": 120
        },
        {
            "name": "Coconut",
            "malayalam": "തെങ്ങ്", 
            "hindi": "नारियल",
            "scientific_name": "Cocos nucifera",
            "seasons": ["year_round"],
            "soil_types": ["sandy", "loamy", "laterite"],
            "water_requirement": "medium",
            "growing_period_days": 365
        },
        {
            "name": "Pepper",
            "malayalam": "കുരുമുളക്",
            "hindi": "काली मिर्च", 
            "scientific_name": "Piper nigrum",
            "seasons": ["post_monsoon"],
            "soil_types": ["laterite", "loamy"],
            "water_requirement": "medium",
            "growing_period_days": 240
        },
        {
            "name": "Cardamom",
            "malayalam": "ഏലക്ക",
            "hindi": "इलायची",
            "scientific_name": "Elettaria cardamomum", 
            "seasons": ["post_monsoon"],
            "soil_types": ["laterite"],
            "water_requirement": "high",
            "growing_period_days": 180
        }
    ]
    
    # Government schemes
    government_schemes = [
        {
            "scheme_id": "PM_KISAN",
            "name": "PM-KISAN Samman Nidhi",
            "malayalam": "പ്രധാനമന്ത്രി കിസാൻ സമ്മാൻ നിധി",
            "hindi": "प्रधानमंत्री किसान सम्मान निधि",
            "category": "financial_support",
            "amount": "₹6000/year",
            "eligibility": "Small and marginal farmers with landholding up to 2 hectares",
            "application_process": "Online through pmkisan.gov.in",
            "documents_required": ["Aadhar Card", "Bank Account", "Land Records"],
            "active": True
        },
        {
            "scheme_id": "KERALA_KARSHAKA",
            "name": "Kerala Karshaka Welfare Fund",
            "malayalam": "കേരള കർഷക ക്ഷേമ ഫണ്ട്",
            "hindi": "केरल कर्षक कल्याण फंड",
            "category": "welfare",
            "amount": "Various benefits including pension, insurance",
            "eligibility": "All registered Kerala farmers",
            "application_process": "Through local Krishi Bhavans",
            "documents_required": ["Farmer Registration", "Land Records", "Bank Account"],
            "active": True
        }
    ]
    
    try:
        # Insert reference data (avoid duplicates)
        await db.districts.delete_many({})  # Clear old data
        await db.districts.insert_many(kerala_districts)
        
        await db.crops.delete_many({})
        await db.crops.insert_many(kerala_crops)
        
        await db.schemes.delete_many({})
        await db.schemes.insert_many(government_schemes)
        
        print("   ✅ Reference data seeded successfully")
        
    except Exception as e:
        print(f"   ⚠️ Error seeding data: {e}")

if __name__ == "__main__":
    print("🚀 Starting Agricultural Database Initialization...")
    success = asyncio.run(initialize_agricultural_database())
    
    if success:
        print("\n🎯 Next Steps:")
        print("1. Update your main.py to use the new database connection")
        print("2. Add authentication endpoints")
        print("3. Create farmer registration flow")
        print("4. Test the complete system")
    else:
        print("\n❌ Please fix the database connection and try again")
        sys.exit(1)