"""
Market Locator API
Provides endpoints for finding nearby markets for crop sales
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from services.market_locator_service import market_locator_service

router = APIRouter()

class MarketSearchRequest(BaseModel):
    selected_crops: List[str]
    farmer_location: Optional[str] = None
    max_distance: Optional[float] = 100
    limit: Optional[int] = 10

@router.get("/nearby-markets")
async def get_nearby_markets(
    crops: str = Query(..., description="Comma-separated list of crop names"),
    location: Optional[str] = Query(None, description="Farmer's location (district/city name)"),
    max_distance: Optional[float] = Query(100, description="Maximum distance in km"),
    limit: Optional[int] = Query(10, description="Maximum number of markets to return")
):
    """
    Find nearby markets that accept the specified crops
    """
    try:
        # Parse crops from comma-separated string
        selected_crops = [crop.strip() for crop in crops.split(",") if crop.strip()]
        
        if not selected_crops:
            raise HTTPException(status_code=400, detail="No crops specified")
        
        result = market_locator_service.find_nearby_markets(
            selected_crops=selected_crops,
            farmer_location=location,
            max_distance=max_distance,
            limit=limit
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding nearby markets: {str(e)}")

@router.post("/find-markets")
async def find_markets(request: MarketSearchRequest):
    """
    Find nearby markets using POST request with JSON body
    """
    try:
        result = market_locator_service.find_nearby_markets(
            selected_crops=request.selected_crops,
            farmer_location=request.farmer_location,
            max_distance=request.max_distance,
            limit=request.limit
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding markets: {str(e)}")

@router.get("/market/{market_id}")
async def get_market_details(market_id: int):
    """
    Get detailed information about a specific market
    """
    try:
        result = market_locator_service.get_market_details(market_id)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result.get("error", "Market not found"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting market details: {str(e)}")

@router.get("/market-categories")
async def get_market_categories():
    """
    Get available market categories
    """
    try:
        categories = {
            "DMart": "D-Mart retail stores - good for consistent bulk sales",
            "Retail Chain": "Other retail chains like Reliance Fresh, Spencer's",
            "Wholesale Market": "Traditional wholesale markets with auction systems",
            "Mixed Market": "Markets that handle both vegetables and other products"
        }
        
        return {
            "success": True,
            "categories": categories
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting categories: {str(e)}")

@router.get("/supported-locations")
async def get_supported_locations():
    """
    Get list of supported locations
    """
    try:
        locations = [
            "Kochi", "Ernakulam", "Thiruvananthapuram", "Kozhikode", 
            "Thrissur", "Kottayam", "Alappuzha", "Kannur", "Kollam", "Palakkad"
        ]
        
        return {
            "success": True,
            "locations": locations,
            "default_location": "Kochi"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting locations: {str(e)}")