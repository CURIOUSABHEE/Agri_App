"""Weather-related Pydantic models"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class WeatherRequest(BaseModel):
    lat: Optional[float] = None
    lon: Optional[float] = None
    city: Optional[str] = None
    days: int = 5

class WeatherCurrent(BaseModel):
    location: str
    temperature: float
    feels_like: float
    humidity: int
    description: str
    icon: str
    wind_speed: float
    visibility: float
    pressure: float

class WeatherForecast(BaseModel):
    date: str
    temperature_max: float
    temperature_min: float
    description: str
    icon: str
    humidity: int
    wind_speed: float
    precipitation_chance: int

class WeatherResponse(BaseModel):
    success: bool
    current: Optional[WeatherCurrent] = None
    forecast: Optional[List[WeatherForecast]] = None
    error: Optional[str] = None