"""
Database Connection Test Script
Run this to verify MongoDB Atlas connection works properly
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

async def test_database_connection():
    """Test MongoDB Atlas connection"""
    
    MONGO_URL = os.getenv("MONGO_URL")
    DB_NAME = os.getenv("DB_NAME", "agriadvisor")
    
    if not MONGO_URL:
        print("❌ MONGO_URL not found in environment variables")
        return False
    
    print(f"🔌 Connecting to MongoDB Atlas...")
    print(f"📊 Database: {DB_NAME}")
    
    try:
        # Create client
        client = AsyncIOMotorClient(MONGO_URL)
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")
        
        # Get database
        database = client[DB_NAME]
        
        # Test basic operations
        print("\n🧪 Testing basic operations...")
        
        # Insert test document
        test_doc = {
            "test_id": "connection_test",
            "timestamp": datetime.now(),
            "status": "connected",
            "message": "Database connection successful!"
        }
        
        result = await database.connection_tests.insert_one(test_doc)
        print(f"✅ Insert test successful - ID: {result.inserted_id}")
        
        # Read test document
        retrieved_doc = await database.connection_tests.find_one({"test_id": "connection_test"})
        if retrieved_doc:
            print(f"✅ Read test successful - Message: {retrieved_doc['message']}")
        
        # List collections
        collections = await database.list_collection_names()
        print(f"📋 Existing collections: {collections}")
        
        # Clean up test document
        await database.connection_tests.delete_one({"test_id": "connection_test"})
        print("🧹 Cleaned up test document")
        
        # Close connection
        client.close()
        print("\n🎉 All tests passed! Database is ready to use.")
        
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_database_connection())
    if success:
        print("\n✅ You can now proceed with the full database setup!")
    else:
        print("\n❌ Please check your MongoDB connection string and try again.")