"""
Test MongoDB Connection with Correct Credentials  
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

async def test_mongodb_connection():
    """Test the MongoDB connection"""
    
    # Connection string from your example
    uri = "mongodb+srv://jamdadeabhishek039:AbhiMongo@cluster0.uqicqbb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    
    print("🔄 Testing MongoDB Atlas connection...")
    print(f"URI: {uri.replace('AbhiMongo', 'AbhiMongo***')}")
    
    try:
        # Create async client
        client = AsyncIOMotorClient(uri, server_api=ServerApi('1'))
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Pinged your deployment. You successfully connected to MongoDB!")
        
        # Test database operations
        database = client.agriadvisor
        
        # Insert a test farmer
        test_farmer = {
            "farmer_id": "test_connection_2025",
            "name": "Test Connection User",
            "phone": "+911234567890", 
            "district": "Test District",
            "language": "en",
            "registration_date": "2025-10-02T12:00:00",
            "last_active": "2025-10-02T12:00:00"
        }
        
        result = await database.farmers.insert_one(test_farmer)
        print(f"✅ Test farmer inserted with ID: {result.inserted_id}")
        
        # Retrieve the farmer
        found_farmer = await database.farmers.find_one({"farmer_id": "test_connection_2025"})
        if found_farmer:
            print(f"✅ Test farmer retrieved: {found_farmer['name']}")
            
            # Clean up test data
            await database.farmers.delete_one({"farmer_id": "test_connection_2025"})
            print("✅ Test data cleaned up")
        
        # List existing collections
        collections = await database.list_collection_names()
        print(f"✅ Available collections: {collections}")
        
        # Count existing farmers
        farmer_count = await database.farmers.count_documents({})
        print(f"✅ Existing farmers in database: {farmer_count}")
        
        client.close()
        print("✅ MongoDB connection test completed successfully!")
        
        # Update .env file with working connection
        env_content = f"""# MongoDB settings - Working Connection
MONGO_URL={uri}

# LLM API keys (at least one is needed)  
GEMINI_API_KEY=AIzaSyC1lAQPzGqdnY4eAdmn2YfDPoaIWITGC2A

# Bhuvan API (satellite soil data)
BHUVAN_API_KEY=7ea597519f9a04a77c0d2ca692fa51387d8c17e3   # optional, if not provided mock data will be used

# OpenWeather API (weather forecast)
OPENWEATHER_API_KEY=27ac41c437fd3dae7f1e6c6f68d2766d  # optional, mock data will be used if missing

# CORS allowed origins (for frontend access)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
"""
        
        with open(".env", "w") as f:
            f.write(env_content)
        print("✅ .env file updated with working MongoDB connection!")
        
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_mongodb_connection())
    if success:
        print("\n🎉 MongoDB Atlas is now connected!")
        print("🌾 Your agricultural app will now save data to the cloud database!")
    else:
        print("\n⚠️  Connection failed - check credentials and IP whitelist")