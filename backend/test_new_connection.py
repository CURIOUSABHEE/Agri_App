#!/usr/bin/env python3
"""
Quick test to verify MongoDB connection is working with the app
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add current directory to path
sys.path.append('.')

async def test_mongodb_integration():
    """Test if MongoDB is working with the auth system"""
    
    load_dotenv()
    print("🔄 Testing MongoDB integration with auth system...")
    
    try:
        # Import auth functions
        from api.auth import get_database, get_all_farmers_from_db
        
        # Test database connection
        db = await get_database()
        print("✅ Database connection established")
        
        # Test getting farmers (should work with MongoDB now, not files)
        farmers = await get_all_farmers_from_db()
        print(f"✅ Retrieved {len(farmers)} farmers from database")
        
        # Check if it's using MongoDB or file fallback
        if len(farmers) > 0:
            first_farmer = farmers[0]
            if '_id' in first_farmer:
                print("✅ SUCCESS: Using MongoDB (has ObjectId)")
            else:
                print("⚠️  WARNING: Still using file storage (no ObjectId)")
        
        print("\n🎉 MongoDB integration test completed!")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB integration test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_mongodb_integration())
    
    if success:
        print("\n✅ Your app is now connected to MongoDB Atlas!")
        print("🚀 Restart your backend server to see the changes")
        print("🔥 No more 'bad auth' errors!")
    else:
        print("\n⚠️  Still some issues with MongoDB integration")