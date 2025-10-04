"""Market-related Pydantic models"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date

class MarketPriceRequest(BaseModel):
    state: Optional[str] = None
    taluka: Optional[str] = None
    market: Optional[str] = None 
    crop: Optional[str] = None

class KeralaMarketAnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    selectedCrops: List[str]
    vegetableColumn: str

class KeralaMarketDataRequest(BaseModel):
    start_date: date
    end_date: Optional[date] = None
    crop_filter: Optional[str] = None

class PriceAnalysis(BaseModel):
    wholesale_avg: Optional[float] = None
    retail_avg: Optional[float] = None 
    margin: Optional[float] = None
    volatility: Optional[float] = None

class FarmerTip(BaseModel):
    icon: str
    message: str
    type: str  # opportunity, warning, caution, moderate