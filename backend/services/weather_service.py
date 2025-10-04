"""Weather service for weather-related operations"""

import os
import requests
from typing import Dict, Any, Optional
from utils.response_utils import create_success_response, create_error_response
from utils.location_utils import detect_kerala_location, get_api_friendly_location

class WeatherService:
    """Service for weather operations"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENWEATHER_API_KEY", "")
        self.base_url = "http://api.openweathermap.org/data/2.5"
    
    def get_current_weather(
        self, 
        lat: Optional[float] = None, 
        lon: Optional[float] = None, 
        city: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get current weather data"""
        try:
            if not self.api_key:
                return create_error_response("Weather API key not configured")
            
            # Build API URL based on provided parameters
            if lat is not None and lon is not None:
                url = f"{self.base_url}/weather?lat={lat}&lon={lon}&appid={self.api_key}&units=metric"
            elif city:
                url = f"{self.base_url}/weather?q={city}&appid={self.api_key}&units=metric"
            else:
                # Default to Kochi, Kerala
                url = f"{self.base_url}/weather?q=Kochi,Kerala,India&appid={self.api_key}&units=metric"
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                weather_info = {
                    "location": data.get("name", "Unknown"),
                    "temperature": data["main"]["temp"],
                    "feels_like": data["main"]["feels_like"],
                    "humidity": data["main"]["humidity"],
                    "description": data["weather"][0]["description"],
                    "icon": data["weather"][0]["icon"],
                    "wind_speed": data.get("wind", {}).get("speed", 0),
                    "visibility": data.get("visibility", 0) / 1000,  # Convert to km
                    "pressure": data["main"]["pressure"]
                }
                
                return create_success_response(data=weather_info)
            else:
                return create_error_response(f"Weather API error: {response.status_code}")
                
        except Exception as e:
            return create_error_response(f"Error fetching weather data: {str(e)}")
    
    def get_weather_forecast(
        self, 
        lat: Optional[float] = None,
        lon: Optional[float] = None, 
        city: Optional[str] = None,
        days: int = 5
    ) -> Dict[str, Any]:
        """Get weather forecast"""
        try:
            if not self.api_key:
                return create_error_response("Weather API key not configured")
            
            # Build API URL
            if lat is not None and lon is not None:
                url = f"{self.base_url}/forecast?lat={lat}&lon={lon}&appid={self.api_key}&units=metric"
            elif city:
                url = f"{self.base_url}/forecast?q={city}&appid={self.api_key}&units=metric"
            else:
                url = f"{self.base_url}/forecast?q=Kochi,Kerala,India&appid={self.api_key}&units=metric"
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                forecast_list = []
                for item in data["list"][:days * 8]:  # 8 forecasts per day (3-hour intervals)
                    forecast_list.append({
                        "date": item["dt_txt"],
                        "temperature": item["main"]["temp"],
                        "temperature_max": item["main"]["temp_max"],
                        "temperature_min": item["main"]["temp_min"],
                        "description": item["weather"][0]["description"],
                        "icon": item["weather"][0]["icon"],
                        "humidity": item["main"]["humidity"],
                        "wind_speed": item.get("wind", {}).get("speed", 0)
                    })
                
                return create_success_response(
                    data={
                        "location": data["city"]["name"],
                        "forecast": forecast_list
                    }
                )
            else:
                return create_error_response(f"Weather API error: {response.status_code}")
                
        except Exception as e:
            return create_error_response(f"Error fetching weather forecast: {str(e)}")
    
    def get_weather_by_location(self, location: str) -> Dict[str, Any]:
        """Get weather for a specific location"""
        api_location = get_api_friendly_location(location)
        return self.get_current_weather(city=f"{api_location}, Kerala, India")