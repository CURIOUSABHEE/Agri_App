"""Kerala Market API routes"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from services.kerala_market_service import KeralaMarketService
from models.market_models import KeralaMarketAnalysisRequest

router = APIRouter(prefix="/api/kerala-market", tags=["kerala-market"])

@router.get("/data")
async def get_kerala_market_data(
    start_date: str,
    end_date: Optional[str] = None,
    crop_filter: Optional[str] = None
):
    """Get Kerala vegetable market data for date range"""
    result = KeralaMarketService.get_market_data(start_date, end_date, crop_filter)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result

@router.post("/analyze")
async def analyze_kerala_market_data(request_data: KeralaMarketAnalysisRequest):
    """Analyze filtered Kerala market data and provide farmer tips"""
    result = KeralaMarketService.analyze_market_data(
        request_data.data,
        request_data.selectedCrops, 
        request_data.vegetableColumn
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result