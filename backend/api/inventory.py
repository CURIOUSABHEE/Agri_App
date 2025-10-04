"""Inventory API routes"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models.inventory_models import InventoryItem, InventoryItemCreate, InventoryStats, InventoryUpdateRequest, Transaction
from services.inventory_service import InventoryService

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

# Initialize inventory service
inventory_service = InventoryService()

@router.get("/")
async def get_inventory(
    sortBy: Optional[str] = Query("name", description="Sort by field (name, category, quantity, etc.)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock: Optional[bool] = Query(None, description="Show only low stock items")
):
    """Get all inventory items with summary (root endpoint for compatibility)"""
    try:
        items = await inventory_service.get_items(category=category, low_stock=low_stock, sort_by=sortBy)
        stats = await inventory_service.get_stats()
        
        return {
            "success": True,
            "data": {
                "summary": {
                    "total_value": stats.total_value,
                    "total_items": stats.total_items,
                    "low_stock_count": stats.low_stock_count,
                    "expiring_count": stats.expiring_count
                },
                "items": items
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/items", response_model=List[InventoryItem])
async def get_inventory_items(
    sortBy: Optional[str] = Query("name", description="Sort by field (name, category, quantity, etc.)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock: Optional[bool] = Query(None, description="Show only low stock items")
):
    """Get all inventory items with optional filters and sorting"""
    try:
        items = await inventory_service.get_items(category=category, low_stock=low_stock, sort_by=sortBy)
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/items", response_model=InventoryItem)
async def create_inventory_item(item: InventoryItemCreate):
    """Create a new inventory item"""
    try:
        new_item = await inventory_service.create_item(item)
        return new_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/items/{item_id}", response_model=InventoryItem)
async def update_inventory_item(item_id: str, item: InventoryItemCreate):
    """Update an existing inventory item"""
    try:
        updated_item = await inventory_service.update_item(item_id, item)
        if not updated_item:
            raise HTTPException(status_code=404, detail="Item not found")
        return updated_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/items/{item_id}")
async def delete_inventory_item(item_id: str):
    """Delete an inventory item"""
    try:
        deleted = await inventory_service.delete_item(item_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/items/{item_id}/stock")
async def update_item_stock(item_id: str, update_data: InventoryUpdateRequest):
    """Update stock quantity for an inventory item"""
    try:
        # Get the current item
        items = await inventory_service.get_items()
        item = next((item for item in items if item.id == item_id), None)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Calculate new quantity based on type
        if update_data.type == "purchase":
            new_quantity = item.quantity + int(update_data.quantity)
        elif update_data.type == "sale":
            new_quantity = item.quantity - int(update_data.quantity)
        elif update_data.type == "usage":
            new_quantity = item.quantity - int(update_data.quantity)
        else:  # adjustment
            new_quantity = int(update_data.quantity)
        
        # Ensure quantity doesn't go below 0
        if new_quantity < 0:
            raise HTTPException(status_code=400, detail="Quantity cannot be negative")
        
        # Update the item with new quantity
        updated_item_data = InventoryItemCreate(
            name=item.name,
            category=item.category,
            quantity=new_quantity,
            unit=item.unit,
            price=item.price,
            supplier=item.supplier,
            expiry_date=item.expiry_date,
            location=item.location,
            minimum_stock=item.minimum_stock
        )
        
        updated_item = await inventory_service.update_item(item_id, updated_item_data)
        
        return {
            "success": True,
            "message": "Stock updated successfully",
            "item": updated_item
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=InventoryStats)
async def get_inventory_stats():
    """Get inventory statistics"""
    try:
        stats = await inventory_service.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions")
async def get_inventory_transactions(
    itemId: Optional[str] = Query(None, description="Filter by item ID"),
    limit: Optional[int] = Query(10, description="Number of transactions to return")
):
    """Get inventory transaction history"""
    try:
        transactions = await inventory_service.get_transactions(item_id=itemId, limit=limit)
        return {
            "success": True,
            "data": transactions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))