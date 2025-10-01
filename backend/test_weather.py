#!/usr/bin/env python3
"""
Test script to verify OpenWeather API integration
"""
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

WEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
WEATHER_BASE_URL = "http://api.openweathermap.org/data/2.5"

def test_weather_api():
    """Test the OpenWeather API with Kerala locations"""
    
    if not WEATHER_API_KEY:
        print("❌ No OpenWeather API key found in .env file")
        return False
    
    print(f"🔑 API Key found: {WEATHER_API_KEY[:10]}...")
    
    # Test locations in Kerala
    test_locations = [
        "Kochi, Kerala, India",
        "Thiruvananthapuram, Kerala, India", 
        "Kozhikode, Kerala, India"
    ]
    
    for location in test_locations:
        print(f"\n📍 Testing weather for: {location}")
        
        try:
            url = f"{WEATHER_BASE_URL}/weather?q={location}&appid={WEATHER_API_KEY}&units=metric"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success!")
                print(f"   Temperature: {data['main']['temp']}°C")
                print(f"   Humidity: {data['main']['humidity']}%")
                print(f"   Conditions: {data['weather'][0]['description']}")
                print(f"   Wind: {data['wind']['speed']} m/s")
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                
        except requests.RequestException as e:
            print(f"❌ Request failed: {e}")
    
    return True

if __name__ == "__main__":
    print("🌤️  Testing OpenWeather API Integration")
    print("=" * 50)
    test_weather_api()