#!/usr/bin/env python3
"""
Test inventory to verify it's completely empty and dynamic
"""
import asyncio
import sys
import os

# Add backend path
sys.path.append('/Users/apple/Desktop/Agri_App/backend')

async def test_empty_inventory():
    """Test that inventory is now completely empty"""
    print("🧪 Testing inventory to verify it's empty and dynamic...\n")
    
    try:
        from services.inventory_service import InventoryService
        
        # Create inventory service instance
        inventory_service = InventoryService()
        
        # Test 1: Get all inventory items
        items = await inventory_service.get_items()
        print(f"📦 Total inventory items: {len(items)}")
        
        if len(items) == 0:
            print("✅ SUCCESS: Inventory is completely empty!")
        else:
            print(f"⚠️  WARNING: Still has {len(items)} hardcoded items:")
            for item in items:
                print(f"   - {item.name} ({item.category})")
        
        # Test 2: Get inventory stats
        stats = await inventory_service.get_stats()
        print(f"\n📊 Inventory Stats:")
        print(f"   - Total Items: {stats.total_items}")
        print(f"   - Total Value: ₹{stats.total_value}")
        print(f"   - Low Stock Count: {stats.low_stock_count}")
        print(f"   - Expiring Count: {stats.expiring_count}")
        
        if stats.total_items == 0:
            print("✅ SUCCESS: All stats show zero - completely dynamic!")
        
        # Test 3: Get transactions
        transactions = await inventory_service.get_transactions()
        print(f"\n📈 Transaction History: {len(transactions)} transactions")
        
        if len(transactions) == 0:
            print("✅ SUCCESS: No hardcoded transactions!")
        else:
            print(f"⚠️  WARNING: Still has {len(transactions)} mock transactions")
        
        print("\n🎉 Inventory Panel Status:")
        if len(items) == 0 and len(transactions) == 0 and stats.total_items == 0:
            print("✅ FULLY DYNAMIC - No hardcoded data remaining!")
            print("🚀 Users will start with completely empty inventory")
            print("📝 All data will come from user interactions only")
        else:
            print("⚠️  PARTIALLY DYNAMIC - Some hardcoded data still exists")
            
        return len(items) == 0 and len(transactions) == 0
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_empty_inventory())
    print(f"\n{'🎯 INVENTORY IS NOW FULLY DYNAMIC!' if success else '🔧 Still needs cleanup'}")