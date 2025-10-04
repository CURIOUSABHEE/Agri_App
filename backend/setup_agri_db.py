#!/usr/bin/env python3
"""
Setup Agricultural Database with correct credentials
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Try different connection strings
connection_strings = [
    "mongodb+srv://jamdadeabhishek039:AbhiMongo@cluster0.uqicqbb.mongodb.net/agriadvisor?retryWrites=true&w=majority",
    "mongodb+srv://jamdadeabhishek039:AbhiMongo%40123@cluster0.uqicqbb.mongodb.net/agriadvisor?retryWrites=true&w=majority",
    "mongodb+srv://jamdadeabhishek039:AbhiMongo@cluster0.uqicqbb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
]

async def test_and_setup_database():
    """Test different connection strings and setup database"""
    
    for i, connection_string in enumerate(connection_strings):
        print(f"\n🔄 Testing connection string {i+1}...")
        print(f"Connection: {connection_string.replace('AbhiMongo', 'AbhiMongo***')}")
        
        try:
            client = AsyncIOMotorClient(connection_string)
            database = client.agriadvisor
            
            # Test connection
            await database.command("ping")
            print("✅ Connection successful!")
            
            # Create farmers collection with a test document
            test_farmer = {
                "farmer_id": "test_connection_farmer",
                "name": "Test Setup",
                "phone": "+910000000000",
                "district": "Test District",
                "registration_date": "2025-10-02T12:00:00",
                "last_active": "2025-10-02T12:00:00"
            }
            
            result = await database.farmers.insert_one(test_farmer)
            print(f"✅ Test farmer inserted with ID: {result.inserted_id}")
            
            # Verify the farmer was inserted
            found = await database.farmers.find_one({"farmer_id": "test_connection_farmer"})
            if found:
                print(f"✅ Test farmer verified: {found['name']}")
                
                # Clean up
                await database.farmers.delete_one({"farmer_id": "test_connection_farmer"})
                print("✅ Test farmer cleaned up")
            
            # List collections
            collections = await database.list_collection_names()
            print(f"✅ Available collections: {collections}")
            
            client.close()
            print(f"✅ Database setup successful with connection string {i+1}!")
            
            # Update the .env file with the working connection string
            env_content = f"""# MongoDB settings
MONGO_URL={connection_string}

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
            print("✅ .env file updated with working connection string!")
            
            return True
            
        except Exception as e:
            print(f"❌ Connection {i+1} failed: {e}")
            continue
    
    print("\n❌ All connection attempts failed!")
    return False

if __name__ == "__main__":
    success = asyncio.run(test_and_setup_database())
    if success:
        print("\n🎉 Agricultural database is ready!")
        print("🌾 You can now register farmers and they will be saved to MongoDB Atlas!")
    else:
        print("\n⚠️  Using in-memory storage as fallback")