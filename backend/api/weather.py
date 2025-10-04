"""Weather API routes"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from services.weather_service import WeatherService

router = APIRouter(prefix="/api/weather", tags=["weather"])

# Initialize weather service
weather_service = WeatherService()

@router.get("/current")
async def get_current_weather(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    city: Optional[str] = None
):
    """Get current weather data"""
    result = weather_service.get_current_weather(lat, lon, city)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result

@router.get("/forecast")
async def get_weather_forecast(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    city: Optional[str] = None,
    days: int = 5
):
    """Get weather forecast"""
    result = weather_service.get_weather_forecast(lat, lon, city, days)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result

@router.get("/location/{location}")
async def get_weather_by_location(location: str):
    """Get weather for a specific Kerala location"""
    result = weather_service.get_weather_by_location(location)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result