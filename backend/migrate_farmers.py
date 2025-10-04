#!/usr/bin/env python3
"""
Migration script to move farmers from file storage to MongoDB Atlas
"""
import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.auth import get_database, save_farmer_to_db, get_all_farmers_from_db
from enhanced_storage import farmer_storage

async def migrate_farmers():
    """Migrate farmers from file storage to MongoDB"""
    print("🔄 Starting farmer migration from file storage to MongoDB...")
    
    try:
        # Get database connection
        db = await get_database()
        
        if db is None:
            print("❌ Could not connect to MongoDB. Migration aborted.")
            return False
        
        print("✅ Connected to MongoDB")
        
        # Get farmers from file storage
        file_farmers = farmer_storage.get_all_farmers()
        print(f"📁 Found {len(file_farmers)} farmers in file storage")
        
        if not file_farmers:
            print("ℹ️  No farmers to migrate")
            return True
        
        # Check existing farmers in MongoDB
        existing_farmers = await get_all_farmers_from_db()
        existing_ids = {f.get('farmer_id') for f in existing_farmers}
        print(f"💾 Found {len(existing_farmers)} farmers already in MongoDB")
        
        # Migrate farmers that don't exist in MongoDB
        migrated_count = 0
        for farmer in file_farmers:
            farmer_id = farmer.get('farmer_id')
            
            if farmer_id in existing_ids:
                print(f"⏭️  Skipping {farmer.get('name', 'Unknown')} (already in MongoDB)")
                continue
            
            # Save to MongoDB
            success = await save_farmer_to_db(farmer)
            if success:
                migrated_count += 1
                print(f"✅ Migrated: {farmer.get('name', 'Unknown')} ({farmer_id})")
            else:
                print(f"❌ Failed to migrate: {farmer.get('name', 'Unknown')} ({farmer_id})")
        
        print(f"\n🎉 Migration completed!")
        print(f"📊 Migrated {migrated_count} new farmers")
        print(f"📊 Total farmers in MongoDB: {len(existing_farmers) + migrated_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def verify_migration():
    """Verify that all farmers are properly stored in MongoDB"""
    print("\n🔍 Verifying migration...")
    
    try:
        # Get farmers from both sources
        file_farmers = farmer_storage.get_all_farmers()
        db_farmers = await get_all_farmers_from_db()
        
        print(f"📁 File storage: {len(file_farmers)} farmers")
        print(f"💾 MongoDB: {len(db_farmers)} farmers")
        
        # Check if all file farmers are in MongoDB
        file_ids = {f.get('farmer_id') for f in file_farmers}
        db_ids = {f.get('farmer_id') for f in db_farmers}
        
        missing_in_db = file_ids - db_ids
        extra_in_db = db_ids - file_ids
        
        if missing_in_db:
            print(f"⚠️  Missing in MongoDB: {missing_in_db}")
        
        if extra_in_db:
            print(f"ℹ️  Extra in MongoDB (created directly): {extra_in_db}")
        
        if not missing_in_db:
            print("✅ All file farmers are present in MongoDB!")
        
        # Show farmer details
        print("\n👥 Farmers in MongoDB:")
        for farmer in db_farmers:
            name = farmer.get('name', 'Unknown')
            phone = farmer.get('phone', 'No phone')
            reg_date = farmer.get('registration_date', 'Unknown date')
            print(f"  • {name} ({phone}) - {reg_date}")
        
        return len(missing_in_db) == 0
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

async def main():
    """Main migration function"""
    print("🚀 Farmer Migration Tool")
    print("=" * 40)
    
    # Run migration
    success = await migrate_farmers()
    
    if success:
        # Verify migration
        verified = await verify_migration()
        
        if verified:
            print("\n✅ Migration completed successfully!")
            print("💡 You can now safely use MongoDB as your primary database.")
        else:
            print("\n⚠️  Migration completed but verification found issues.")
    else:
        print("\n❌ Migration failed. Please check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())