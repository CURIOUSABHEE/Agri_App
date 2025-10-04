#!/usr/bin/env python3
"""
Test MongoDB connection for Agricultural Platform
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Configuration
MONGODB_URL = os.getenv("MONGO_URL", "mongodb+srv://jamdadeabhishek039:AbhiMongo@cluster0.uqicqbb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
DATABASE_NAME = os.getenv("DB_NAME", "agriadvisor")

async def test_connection():
    """Test MongoDB connection"""
    print("🔄 Testing MongoDB connection...")
    
    try:
        # Create client
        client = AsyncIOMotorClient(MONGODB_URL)
        database = client[DATABASE_NAME]
        
        # Test connection
        await database.command("ping")
        print("✅ MongoDB connection successful!")
        
        # Test basic operations
        # Insert a test farmer
        test_farmer = {
            "farmer_id": "test_farmer_123",
            "name": "Test Farmer",
            "phone": "+919999999999",
            "district": "Test District",
            "registration_date": "2025-10-02T12:00:00",
            "last_active": "2025-10-02T12:00:00"
        }
        
        await database.farmers.insert_one(test_farmer)
        print("✅ Test farmer inserted")
        
        # Retrieve the farmer
        found_farmer = await database.farmers.find_one({"farmer_id": "test_farmer_123"})
        if found_farmer:
            print(f"✅ Test farmer retrieved: {found_farmer['name']}")
        
        # Clean up
        await database.farmers.delete_one({"farmer_id": "test_farmer_123"})
        print("✅ Test farmer cleaned up")
        
        # Close connection
        client.close()
        print("✅ MongoDB test completed successfully!")
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(test_connection())
    if success:
        print("\n🎉 Database is ready for use!")
    else:
        print("\n⚠️  Database connection issues - falling back to in-memory storage")