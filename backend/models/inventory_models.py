"""Inventory-related Pydantic models"""

from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

class InventoryItemBase(BaseModel):
    name: str
    category: str
    quantity: int
    unit: str
    price: float
    supplier: Optional[str] = None
    expiry_date: Optional[str] = None
    location: Optional[str] = None
    minimum_stock: int = 10

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItem(InventoryItemBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class StockUpdate(BaseModel):
    quantity: int
    type: str = "adjustment"  # adjustment, usage, purchase, sale
    reason: Optional[str] = None

class Transaction(BaseModel):
    id: str
    item_id: str
    item_name: str
    type: str  # purchase, sale, usage, adjustment
    quantity: int
    unit_price: float
    total_amount: float
    timestamp: datetime
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class InventoryStats(BaseModel):
    total_items: int
    total_value: float
    low_stock_count: int
    expiring_count: int
    categories: Dict[str, int]
    last_updated: datetime

class InventoryUpdateRequest(BaseModel):
    quantity: float
    type: str = "adjustment"  # purchase, sale, production, adjustment
    notes: Optional[str] = None