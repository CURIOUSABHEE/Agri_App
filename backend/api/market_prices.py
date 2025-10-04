"""General market prices API routes (not Kerala-specific)"""

from fastapi import APIRouter, HTTPException
from services.market_price_service import MarketPriceService

router = APIRouter(prefix="/api", tags=["market_prices"])

# Initialize market price service
market_service = MarketPriceService()

@router.get("/market-prices")
async def get_market_prices(
    state: str = "",
    taluka: str = "",
    market: str = "",
    crop: str = ""
):
    """Get market prices with filtering"""
    result = await market_service.get_market_prices(
        state=state,
        taluka=taluka,
        market=market,
        crop=crop
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result

@router.get("/market-prices/trends/{crop}")
async def get_price_trends(crop: str, state: str = ""):
    """Get price trends for a specific crop"""
    result = await market_service.get_price_trends(crop=crop, state=state)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result