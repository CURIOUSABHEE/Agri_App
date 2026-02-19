from pydantic import BaseModel, model_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class DailyTask(BaseModel):
    day_number: int
    date: Optional[str] = None  # YYYY-MM-DD
    task_name: str
    description: str
    resources_needed: Optional[List[str]] = None
    instructions: str
    status: str = "pending"  # pending, completed, skipped
    task_type: str = "general" # irrigation, fertilization, harvesting, protection, general
    weather_condition: Optional[str] = None # forecasted weather for this day
    deep_link: Optional[str] = None # rental, market, schemes, etc.

class SmartCultivationRequest(BaseModel):
    user_id: Optional[str] = None
    land_area: float
    land_unit: str = "acres"
    soil_type: str
    soil_ph: Optional[float] = None
    water_availability: Optional[str] = None # e.g., "High", "Moderate", "Low"
    sowing_date: str # YYYY-MM-DD
    season: Optional[str] = None # Kharif, Rabi, Zaid
    selected_crops: List[str] # Changed from single crop to list
    budget: Optional[float] = None
    location: Optional[str] = None
    
    @model_validator(mode='before')
    @classmethod
    def check_legacy_crops(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Handle legacy 'selected_crop' field
            if 'selected_crops' not in data and 'selected_crop' in data:
                 data['selected_crops'] = [data['selected_crop']]
            # Ensure selected_crops is a list if it exists
            if 'selected_crops' in data and isinstance(data['selected_crops'], str):
                 data['selected_crops'] = [data['selected_crops']]
        return data

class SmartCultivationPlan(BaseModel):
    plan_id: Optional[str] = None
    user_id: str
    crop_name: str # string representation of crops (e.g. "Wheat + Mustard")
    start_date: str
    end_date: Optional[str] = None
    status: str = "active"
    input_details: SmartCultivationRequest
    intercropping_strategy: Optional[str] = None
    analysis: Optional[Dict[str, str]] = None
    best_practices: Optional[List[str]] = None
    schedule: List[DailyTask]
    yield_estimate: Optional[str] = None
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()

class GeneratePlanRequest(BaseModel):
    soil_type: str
    land_area: float
    sowing_date: str
    selected_crop: str
    location: str
