#!/usr/bin/env python3
"""
Simplified server for just the chatbot functionality
This runs without TensorFlow dependencies
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
from datetime import datetime
import google.generativeai as genai
import json

# Load environment variables
load_dotenv()

# Configure APIs
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
WEATHER_BASE_URL = "http://api.openweathermap.org/data/2.5"

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-pro')
    print("✅ Gemini API configured successfully")
else:
    gemini_model = None
    print("⚠️ Gemini API key not found. Using mock responses.")

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    response: str
    timestamp: str

# Initialize FastAPI app
app = FastAPI(title="Krishi Saathi Chatbot", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kerala districts mapping for weather API
KERALA_LOCATION_MAP = {
    "thiruvananthapuram": "Trivandrum",
    "kollam": "Kollam", 
    "pathanamthitta": "Pathanamthitta",
    "alappuzha": "Alappuzha",
    "kottayam": "Kottayam",
    "idukki": "Idukki",
    "ernakulam": "Kochi", 
    "thrissur": "Thrissur",
    "palakkad": "Palakkad",
    "malappuram": "Malappuram",
    "kozhikode": "Kozhikode",
    "wayanad": "Wayanad",
    "kannur": "Kannur", 
    "kasaragod": "Kasaragod"
}

# Helper functions
async def get_weather_data(location="Kochi, Kerala"):
    """Fetch real weather data using OpenWeather API"""
    try:
        if WEATHER_API_KEY and WEATHER_API_KEY != "your_weather_api_key":
            # Extract city name for API call
            city = location.split(",")[0].strip()
            if city.lower() in KERALA_LOCATION_MAP:
                city = KERALA_LOCATION_MAP[city.lower()]
            
            url = f"{WEATHER_BASE_URL}/weather?q={city},IN&appid={WEATHER_API_KEY}&units=metric"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Generate farming advice based on weather
                temp = data['main']['temp']
                humidity = data['main']['humidity'] 
                conditions = data['weather'][0]['description']
                
                advice = generate_farming_advice(temp, humidity, conditions)
                
                return {
                    "location": f"{data['name']}, Kerala",
                    "temperature": f"{temp}°C",
                    "humidity": f"{humidity}%",
                    "conditions": conditions.title(),
                    "wind_speed": f"{data['wind']['speed']} m/s",
                    "farming_advice": advice
                }
        
        # Fallback to mock data
        return {
            "location": location,
            "temperature": "28°C", 
            "humidity": "82%",
            "conditions": "Partly cloudy with high humidity",
            "wind_speed": "12 km/h",
            "farming_advice": "Good conditions for rice cultivation. Monitor for fungal diseases due to humidity."
        }
        
    except Exception as e:
        print(f"Weather API error: {e}")
        return None

def generate_farming_advice(temp, humidity, conditions):
    """Generate farming advice based on weather conditions"""
    advice = []
    
    if temp > 32:
        advice.append("Very hot - water plants early morning and evening")
    elif temp < 20:
        advice.append("Cool weather - good for leafy vegetables")
    else:
        advice.append("Good temperature for most crops")
        
    if humidity > 80:
        advice.append("High humidity - watch for fungal diseases")
    elif humidity < 50:
        advice.append("Low humidity - increase watering")
        
    if "rain" in conditions.lower():
        advice.append("Rain expected - good for transplanting rice")
    elif "sunny" in conditions.lower():
        advice.append("Sunny weather - perfect for drying harvested crops")
        
    return ". ".join(advice) + "."

async def get_market_data():
    """Get current market prices"""
    return {
        "rice": "₹28-32 per kg",
        "coconut": "₹18-22 per piece",
        "pepper": "₹450-520 per kg", 
        "cardamom": "₹1400-1600 per kg",
        "rubber": "₹190-210 per kg",
        "banana": "₹25-30 per dozen"
    }

async def get_schemes_data():
    """Get government schemes"""
    return [
        {
            "name": "PM-KISAN",
            "description": "₹6000 annual direct benefit transfer",
            "eligibility": "Small and marginal farmers"
        },
        {
            "name": "Kerala Karshaka Welfare Scheme",
            "description": "State welfare and insurance for farmers", 
            "eligibility": "All registered Kerala farmers"
        }
    ]

# System prompt for Krishi Saathi
KRISHI_SAATHI_PROMPT = """You are "Krishi Saathi", a farmer-friendly assistant for people in Kerala. You talk in a simple, clear, and respectful way so that even an illiterate farmer or a villager can easily understand you.

Your role is to:
• Give easy-to-follow guidance about farming, crops, weather, and cultivation methods specific to Kerala.
• Use local context: Kerala's soil types, climate, water availability, and common farming practices.
• Suggest best crops for each season and also mention high-yield crops that grow well in Kerala.
• Share practical tips for farmers (like how to save water, protect crops, or store harvest).
• Always keep answers short, simple, and direct. Avoid technical jargon. If you must use a technical term, explain it in a farmer-friendly way.
• Be kind, patient, and supportive, like a trusted village advisor.
• If the farmer asks something outside farming (like health, politics, or unrelated topics), politely guide them back to farming or say you don't know.

Tone: Warm, respectful, and caring. Talk like you are speaking to a farmer in person."""

async def get_enhanced_response(message: str, language: str = "en"):
    """Get enhanced chatbot response with real-time data"""
    try:
        # Fetch real-time data
        weather_data = await get_weather_data()
        market_data = await get_market_data()
        schemes_data = await get_schemes_data()
        
        # Create enhanced prompt with context
        context_info = ""
        if weather_data:
            context_info += f"\nCurrent Weather: {weather_data['temperature']}, {weather_data['conditions']}. {weather_data['farming_advice']}"
        if market_data:
            prices = ", ".join([f"{crop}: {price}" for crop, price in list(market_data.items())[:3]])
            context_info += f"\nCurrent Market Prices: {prices}"
        if schemes_data:
            schemes = ", ".join([scheme['name'] for scheme in schemes_data])
            context_info += f"\nAvailable Schemes: {schemes}"
            
        # Language instruction
        lang_instruction = ""
        if language == "hi":
            lang_instruction = "\nPlease respond in simple Hindi (हिंदी)."
        elif language == "ml":
            lang_instruction = "\nPlease respond in simple Malayalam (മലയാളം)."
        else:
            lang_instruction = "\nPlease respond in simple English."
            
        full_prompt = KRISHI_SAATHI_PROMPT + context_info + lang_instruction + f"\n\nFarmer's question: {message}"
        
        if gemini_model:
            response = gemini_model.generate_content(full_prompt)
            return response.text
        else:
            return get_mock_response(message, language)
            
    except Exception as e:
        print(f"Error getting enhanced response: {e}")
        return get_mock_response(message, language)

def get_mock_response(message: str, language: str = "en"):
    """Fallback mock responses"""
    message_lower = message.lower()
    
    if language == "hi":
        if any(word in message_lower for word in ["मौसम", "बारिश"]):
            return "आज केरल में अच्छा मौसम है। धान की खेती के लिए उपयुक्त समय है। नमी अधिक है तो फंगल रोग से बचाव करें।"
        elif any(word in message_lower for word in ["कीमत", "बाज़ार"]):
            return "आज धान ₹28-32, नारियल ₹18-22, काली मिर्च ₹450-520 रुपये किलो मिल रही है। अच्छी कीमत पर बेचें।"
        else:
            return "मैं कृषि साथी हूँ। केरल की खेती के बारे में पूछें - फसल, मौसम, कीमत, योजनाओं के बारे में।"
    elif language == "ml":
        if any(word in message_lower for word in ["കാലാവസ്ഥ", "മഴ"]):
            return "ഇന്ന് കേരളത്തിൽ നല്ല കാലാവസ്ഥയാണ്. നെൽകൃഷിക്ക് അനുയോജ്യമായ സമയം. ഈർപ്പം കൂടുതലാണ് എങ്കിൽ ഫംഗൽ രോഗങ്ങളിൽ നിന്ന് സംരക്ഷിക്കുക."
        elif any(word in message_lower for word in ["വില", "മാർക്കറ്റ്"]):
            return "ഇന്ന് നെൽ ₹28-32, തെങ്ങ് ₹18-22, കുരുമുളക് ₹450-520 രൂപ കിലോ കിട്ടുന്നു. നല്ല വിലയ്ക്ക് വിൽക്കുക."
        else:
            return "ഞാൻ കൃഷി സാഥിയാണ്. കേരള കൃഷിയെക്കുറിച്ച് ചോദിക്കുക - വിള, കാലാവസ്ഥ, വില, പദ്ധതികൾ."
    else:
        if any(word in message_lower for word in ["weather", "rain", "climate"]):
            return "Today Kerala has good weather for farming. Suitable time for rice cultivation. High humidity, so watch for fungal diseases."
        elif any(word in message_lower for word in ["price", "market", "sell"]):
            return "Today's prices: Rice ₹28-32/kg, Coconut ₹18-22/piece, Pepper ₹450-520/kg. Sell at good prices!"
        else:
            return "I'm Krishi Saathi, your Kerala farming assistant. Ask about crops, weather, prices, or government schemes!"

# API Endpoints
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(chat_message: ChatMessage):
    """Enhanced Krishi Saathi chatbot with real-time data"""
    try:
        response = await get_enhanced_response(chat_message.message, chat_message.language)
        return ChatResponse(
            response=response,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Sorry, I'm having trouble right now.")

@app.get("/api/chatbot/context")
async def get_context():
    """Get current context data"""
    try:
        weather = await get_weather_data()
        market = await get_market_data()
        schemes = await get_schemes_data()
        
        return {
            "success": True,
            "data": {
                "weather": weather,
                "market_prices": market,
                "schemes": schemes
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "🤖 Krishi Saathi Chatbot API",
        "status": "running",
        "features": ["AI-powered farming advice", "Real-time weather", "Market prices", "Government schemes"]
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Krishi Saathi Chatbot Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)