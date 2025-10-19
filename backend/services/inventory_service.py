"""Inventory service for managing agricultural inventory"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from models.inventory_models import InventoryItem, InventoryItemCreate, InventoryStats

logger = logging.getLogger(__name__)

class InventoryService:
    """Service for managing inventory operations"""
    
    def __init__(self):
        # In-memory storage for demonstration (replace with database in production)
        self.inventory_items = []
        # Start with completely empty inventory - fully dynamic
    
    async def get_items(self, category: Optional[str] = None, low_stock: Optional[bool] = None, sort_by: Optional[str] = "name") -> List[InventoryItem]:
        """Get inventory items with optional filters and sorting"""
        try:
            items = self.inventory_items.copy()
            
            # Filter by category safely
            if category:
                items = [item for item in items if getattr(item, 'category', None) and item.category.lower() == category.lower()]
            
            # Filter by low stock safely
            if low_stock:
                items = [item for item in items if getattr(item, 'quantity', None) is not None and getattr(item, 'minimum_stock', None) is not None and item.quantity <= item.minimum_stock]
            
            # Allowed sort keys
            allowed_sort_keys = {"name", "category", "quantity", "price", "created_at", "updated_at"}
            sort_key = sort_by.lower() if sort_by and sort_by.lower() in allowed_sort_keys else "name"
            
            if sort_key == "name":
                items.sort(key=lambda x: (getattr(x, 'name', '') or '').lower())
            elif sort_key == "category":
                items.sort(key=lambda x: (getattr(x, 'category', '') or '').lower())
            elif sort_key == "quantity":
                items.sort(key=lambda x: getattr(x, 'quantity', 0), reverse=True)
            elif sort_key == "price":
                items.sort(key=lambda x: getattr(x, 'price', 0.0), reverse=True)
            elif sort_key == "created_at":
                items.sort(key=lambda x: getattr(x, 'created_at', datetime.min), reverse=True)
            elif sort_key == "updated_at":
                items.sort(key=lambda x: getattr(x, 'updated_at', datetime.min), reverse=True)
            
            return items
        except Exception as e:
            logger.error(f"Error getting inventory items: {e}")
            return []
    
    async def create_item(self, item_data: InventoryItemCreate) -> InventoryItem:
        """Create a new inventory item"""
        try:
            new_item = InventoryItem(
                id=str(uuid.uuid4()),
                **item_data.model_dump(),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            self.inventory_items.append(new_item)
            return new_item
        except Exception as e:
            logger.error(f"Error creating inventory item: {e}")
            raise e
    
    async def update_item(self, item_id: str, item_data: InventoryItemCreate) -> Optional[InventoryItem]:
        """Update an existing inventory item"""
        try:
            for i, item in enumerate(self.inventory_items):
                if item.id == item_id:
                    updated_item = InventoryItem(
                        id=item_id,
                        **item_data.model_dump(),
                        created_at=item.created_at,
                        updated_at=datetime.now()
                    )
                    self.inventory_items[i] = updated_item
                    return updated_item
            return None
        except Exception as e:
            logger.error(f"Error updating inventory item: {e}")
            raise e
    
    async def delete_item(self, item_id: str) -> bool:
        """Delete an inventory item"""
        try:
            for i, item in enumerate(self.inventory_items):
                if item.id == item_id:
                    del self.inventory_items[i]
                    return True
            return False
        except Exception as e:
            logger.error(f"Error deleting inventory item: {e}")
            raise e
    
    async def get_stats(self) -> InventoryStats:
        """Get inventory statistics"""
        try:
            total_items = len(self.inventory_items)
            total_value = sum(item.quantity * item.price for item in self.inventory_items)
            
            # Count items by category
            categories = {}
            low_stock_items = []
            
            for item in self.inventory_items:
                # Category count
                if item.category in categories:
                    categories[item.category] += 1
                else:
                    categories[item.category] = 1
                
                # Low stock check
                if item.quantity <= item.minimum_stock:
                    low_stock_items.append({
                        "id": item.id,
                        "name": item.name,
                        "current_stock": item.quantity,
                        "minimum_stock": item.minimum_stock
                    })
            
            # Calculate items expiring soon (within 30 days)
            expiring_soon = []
            current_date = datetime.now()
            
            for item in self.inventory_items:
                if item.expiry_date:
                    try:
                        expiry = datetime.strptime(item.expiry_date, "%Y-%m-%d")
                        days_to_expiry = (expiry - current_date).days
                        if 0 <= days_to_expiry <= 30:
                            expiring_soon.append({
                                "id": item.id,
                                "name": item.name,
                                "expiry_date": item.expiry_date,
                                "days_remaining": days_to_expiry
                            })
                    except ValueError:
                        # Skip items with invalid expiry date format
                        continue
            
            return InventoryStats(
                total_items=total_items,
                total_value=total_value,
                categories=categories,
                low_stock_count=len(low_stock_items),
                expiring_count=len(expiring_soon),
                last_updated=datetime.now()
            )
        except Exception as e:
            logger.error(f"Error getting inventory stats: {e}")
            raise e

    async def get_transactions(self, item_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Get transaction history"""
        try:
            # Return empty transactions list - completely dynamic
            # Transactions will be populated when users actually add/remove inventory items
            transactions = []
            
            # In production, this would fetch from a transactions database table
            # For now, return empty list to make inventory completely dynamic
            return transactions
            
        except Exception as e:
            logger.error(f"Error getting transactions: {e}")
            return []