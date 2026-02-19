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
                # Return mock data for development
                return self._get_mock_weather(city or "Kochi")
            
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
                # Return mock forecast for development
                return self._get_mock_forecast(city or "Kochi", days)
            
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

    def _get_mock_weather(self, city: str) -> Dict[str, Any]:
        """Generate mock weather data for development"""
        import random
        
        temp = random.uniform(25, 32)
        conditions = ["clear sky", "few clouds", "scattered clouds", "light rain"]
        icons = ["01d", "02d", "03d", "10d"]
        idx = random.randint(0, len(conditions) - 1)
        
        weather_info = {
            "location": city.split(",")[0],
            "temperature": round(temp, 1),
            "feels_like": round(temp + 2, 1),
            "humidity": random.randint(60, 90),
            "description": conditions[idx],
            "icon": icons[idx],
            "wind_speed": round(random.uniform(5, 15), 1),
            "visibility": 10.0,
            "pressure": 1012,
            "is_mock": True
        }
        return create_success_response(data=weather_info)

    def _get_mock_forecast(self, city: str, days: int) -> Dict[str, Any]:
        """Generate mock forecast data for development"""
        import random
        from datetime import datetime, timedelta
        
        forecast_list = []
        base_time = datetime.now()
        
        for i in range(days * 8):
            time = base_time + timedelta(hours=3 * i)
            temp = random.uniform(24, 33)
            
            forecast_list.append({
                "date": time.strftime("%Y-%m-%d %H:%M:%S"),
                "temperature": round(temp, 1),
                "temperature_max": round(temp + 1, 1),
                "temperature_min": round(temp - 1, 1),
                "description": random.choice(["clear sky", "cloudy", "light rain"]),
                "icon": random.choice(["01d", "02d", "10d"]),
                "humidity": random.randint(60, 90),
                "wind_speed": round(random.uniform(5, 15), 1)
            })
            
        return create_success_response(
            data={
                "location": city.split(",")[0],
                "forecast": forecast_list,
                "is_mock": True
            }
        )