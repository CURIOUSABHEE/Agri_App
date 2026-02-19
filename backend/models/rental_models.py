from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TimeSlot(BaseModel):
    id: str = Field(..., description="Unique ID for the slot")
    start_time: str = Field(..., description="Start time (e.g., '10:00')")
    end_time: str = Field(..., description="End time (e.g., '13:00')")
    is_booked: bool = Field(False, description="Booking status")
    booked_by: Optional[str] = Field(None, description="User ID of booker")

class Availability(BaseModel):
    date: str = Field(..., description="Date (YYYY-MM-DD)")
    slots: List[TimeSlot]

class Equipment(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    owner_id: str
    owner_name: str
    owner_contact: str
    name: str
    description: str
    category: str
    price_per_hour: float
    images: List[str] = []
    location: dict = Field(..., description="GeoJSON Point: {'type': 'Point', 'coordinates': [lon, lat]}")
    address: str
    district: str
    village: str
    availability: List[Availability] = []
    created_at: datetime = Field(default_factory=datetime.now)

class BookingRequest(BaseModel):
    equipment_id: str
    date: str
    slot_id: str
    user_id: str
    user_name: str
    user_contact: str 
