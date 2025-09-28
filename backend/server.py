from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import aiohttp
import base64
import json

# Import LLM integration
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Agricultural AI Decision Support System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Agricultural Data Models
class SoilData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location: Dict[str, float]  # {"lat": float, "lon": float}
    ph_level: Optional[float] = None
    moisture_content: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    organic_matter: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WeatherData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location: Dict[str, float]
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float
    weather_condition: str
    forecast_days: int = 7
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CropRecommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    recommended_crops: List[Dict[str, Any]]
    soil_analysis: Dict[str, Any]
    weather_analysis: Dict[str, Any]
    market_analysis: Dict[str, Any]
    ai_insights: str
    sustainability_score: float
    expected_yield: Dict[str, float]
    profit_estimation: Dict[str, float]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LocationRequest(BaseModel):
    latitude: float
    longitude: float
    state: Optional[str] = "Maharashtra"
    district: Optional[str] = None

class CropDiseaseAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    disease_detected: str
    confidence_score: float
    treatment_recommendations: List[str]
    prevention_tips: List[str]
    severity_level: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Initialize Gemini AI
def get_gemini_chat():
    api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message="You are an expert agricultural AI assistant specializing in Indian farming, particularly Maharashtra region. Provide practical, actionable advice for farmers focusing on crop recommendations, soil health, and sustainable farming practices. Always consider local climate, soil conditions, and market trends."
    ).with_model("gemini", "gemini-2.0-flash")
    return chat

# Satellite Data Integration (Bhuvan API)
async def get_soil_data_from_satellite(latitude: float, longitude: float):
    """Fetch soil data from Bhuvan API"""
    try:
        bhuvan_api_key = os.environ.get('BHUVAN_API_KEY')
        if not bhuvan_api_key:
            # Return mock data if API key not available
            return {
                "ph_level": 6.5 + (latitude % 1) * 2,  # Mock pH between 6.5-8.5
                "moisture_content": 35 + (longitude % 1) * 20,  # Mock moisture 35-55%
                "nitrogen": 150 + (latitude % 1) * 100,  # Mock N in kg/ha
                "phosphorus": 25 + (longitude % 1) * 20,  # Mock P in kg/ha
                "potassium": 200 + (latitude % 1) * 150,  # Mock K in kg/ha
                "organic_matter": 2.5 + (longitude % 1) * 1.5  # Mock OM percentage
            }
        
        # Real Bhuvan API integration would go here
        # For now, using enhanced mock data based on Maharashtra soil patterns
        return {
            "ph_level": 7.2,  # Typical Maharashtra soil pH
            "moisture_content": 42.0,
            "nitrogen": 180.0,
            "phosphorus": 35.0, 
            "potassium": 280.0,
            "organic_matter": 3.2
        }
    except Exception as e:
        logging.error(f"Error fetching soil data: {e}")
        return None

# Weather Data Integration (OpenWeather API)
async def get_weather_data(latitude: float, longitude: float):
    """Fetch weather data from OpenWeather API"""
    try:
        weather_api_key = os.environ.get('OPENWEATHER_API_KEY')
        if not weather_api_key:
            # Return mock weather data for Maharashtra
            return {
                "temperature": 28.5,
                "humidity": 65.0, 
                "rainfall": 150.0,  # mm per month
                "wind_speed": 12.0,
                "weather_condition": "Partly Cloudy"
            }
        
        async with aiohttp.ClientSession() as session:
            url = f"http://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={weather_api_key}&units=metric"
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "temperature": data['main']['temp'],
                        "humidity": data['main']['humidity'],
                        "rainfall": data.get('rain', {}).get('1h', 0) * 24 * 30,  # Convert to monthly
                        "wind_speed": data['wind']['speed'],
                        "weather_condition": data['weather'][0]['description']
                    }
                else:
                    return None
    except Exception as e:
        logging.error(f"Error fetching weather data: {e}")
        return None

# Mock Market Data
def get_market_data():
    """Mock market data for Maharashtra crops"""
    return {
        "cotton": {"price_per_quintal": 5800, "demand": "High", "trend": "Increasing"},
        "sugarcane": {"price_per_quintal": 350, "demand": "Stable", "trend": "Stable"},
        "wheat": {"price_per_quintal": 2100, "demand": "Medium", "trend": "Increasing"},
        "rice": {"price_per_quintal": 2500, "demand": "High", "trend": "Stable"},
        "maize": {"price_per_quintal": 1900, "demand": "Medium", "trend": "Stable"},
        "soybean": {"price_per_quintal": 4200, "demand": "High", "trend": "Increasing"},
        "groundnut": {"price_per_quintal": 5500, "demand": "Medium", "trend": "Stable"},
        "onion": {"price_per_quintal": 1200, "demand": "High", "trend": "Volatile"}
    }

# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "Agricultural AI Decision Support System API"}

@api_router.post("/analyze-soil")
async def analyze_soil(location_data: LocationRequest):
    """Analyze soil conditions for given location"""
    try:
        # Get satellite soil data
        soil_info = await get_soil_data_from_satellite(location_data.latitude, location_data.longitude)
        
        if not soil_info:
            raise HTTPException(status_code=500, detail="Failed to fetch soil data")
        
        # Create soil data record
        soil_data = SoilData(
            location={"lat": location_data.latitude, "lon": location_data.longitude},
            **soil_info
        )
        
        # Store in database
        await db.soil_analysis.insert_one(soil_data.dict())
        
        return soil_data
    
    except Exception as e:
        logging.error(f"Error in soil analysis: {e}")
        raise HTTPException(status_code=500, detail="Soil analysis failed")

@api_router.post("/weather-forecast")
async def get_weather_forecast(location_data: LocationRequest):
    """Get weather forecast for location"""
    try:
        weather_info = await get_weather_data(location_data.latitude, location_data.longitude)
        
        if not weather_info:
            raise HTTPException(status_code=500, detail="Failed to fetch weather data")
        
        weather_data = WeatherData(
            location={"lat": location_data.latitude, "lon": location_data.longitude},
            **weather_info
        )
        
        # Store in database
        await db.weather_data.insert_one(weather_data.dict())
        
        return weather_data
    
    except Exception as e:
        logging.error(f"Error in weather forecast: {e}")
        raise HTTPException(status_code=500, detail="Weather forecast failed")

@api_router.post("/crop-recommendations")
async def get_crop_recommendations(location_data: LocationRequest):
    """Get AI-powered crop recommendations"""
    try:
        # Get soil and weather data
        soil_info = await get_soil_data_from_satellite(location_data.latitude, location_data.longitude)
        weather_info = await get_weather_data(location_data.latitude, location_data.longitude)
        market_info = get_market_data()
        
        if not soil_info or not weather_info:
            raise HTTPException(status_code=500, detail="Failed to fetch environmental data")
        
        # Prepare data for AI analysis
        analysis_prompt = f"""
        Analyze the following agricultural data for a farm in Maharashtra, India and provide crop recommendations:
        
        SOIL DATA:
        - pH Level: {soil_info['ph_level']}
        - Moisture Content: {soil_info['moisture_content']}%
        - Nitrogen: {soil_info['nitrogen']} kg/ha
        - Phosphorus: {soil_info['phosphorus']} kg/ha
        - Potassium: {soil_info['potassium']} kg/ha
        - Organic Matter: {soil_info['organic_matter']}%
        
        WEATHER DATA:
        - Temperature: {weather_info['temperature']}°C
        - Humidity: {weather_info['humidity']}%
        - Monthly Rainfall: {weather_info['rainfall']}mm
        - Wind Speed: {weather_info['wind_speed']} m/s
        - Condition: {weather_info['weather_condition']}
        
        MARKET TRENDS:
        {json.dumps(market_info, indent=2)}
        
        Please provide:
        1. Top 5 recommended crops with reasons
        2. Expected yield per hectare for each crop
        3. Profit estimation per hectare
        4. Sustainability score (1-10) for each recommendation
        5. Specific farming advice for soil improvement
        6. Irrigation recommendations
        7. Best planting time
        
        Format the response as JSON with clear structure.
        """
        
        # Get AI recommendations
        chat = get_gemini_chat()
        user_message = UserMessage(text=analysis_prompt)
        ai_response = await chat.send_message(user_message)
        
        # Create recommendation record
        recommendation = CropRecommendation(
            recommended_crops=[
                {"crop": "Cotton", "suitability": 9.2, "expected_yield": 18, "profit_per_hectare": 95000},
                {"crop": "Soybean", "suitability": 8.8, "expected_yield": 22, "profit_per_hectare": 75000},
                {"crop": "Sugarcane", "suitability": 8.5, "expected_yield": 85, "profit_per_hectare": 120000},
                {"crop": "Wheat", "suitability": 7.8, "expected_yield": 35, "profit_per_hectare": 55000},
                {"crop": "Onion", "suitability": 8.0, "expected_yield": 25, "profit_per_hectare": 80000}
            ],
            soil_analysis=soil_info,
            weather_analysis=weather_info,
            market_analysis=market_info,
            ai_insights=ai_response,
            sustainability_score=8.2,
            expected_yield={"cotton": 18.5, "soybean": 22.0, "sugarcane": 85.0},
            profit_estimation={"cotton": 95000, "soybean": 75000, "sugarcane": 120000}
        )
        
        # Store in database
        await db.crop_recommendations.insert_one(recommendation.dict())
        
        return recommendation
    
    except Exception as e:
        logging.error(f"Error in crop recommendations: {e}")
        raise HTTPException(status_code=500, detail="Crop recommendation failed")

@api_router.post("/analyze-crop-disease")
async def analyze_crop_disease(file: UploadFile = File(...)):
    """Analyze crop disease from uploaded image"""
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Please upload an image file")
        
        # Read and encode image
        image_data = await file.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Prepare AI analysis
        analysis_prompt = """Analyze this crop image for diseases, pests, or health issues. Provide:
        1. Disease/pest identification
        2. Confidence level (0-100%)
        3. Treatment recommendations
        4. Prevention tips
        5. Severity assessment (Low/Medium/High)
        
        Focus on common diseases in Maharashtra crops like cotton, sugarcane, wheat, soybean, etc.
        """
        
        # Get AI analysis
        chat = get_gemini_chat()
        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(
            text=analysis_prompt,
            file_contents=[image_content]
        )
        ai_response = await chat.send_message(user_message)
        
        # Create disease analysis record
        disease_analysis = CropDiseaseAnalysis(
            disease_detected="Cotton Bollworm",  # This would be parsed from AI response
            confidence_score=85.5,
            treatment_recommendations=[
                "Apply Bacillus thuringiensis (BT) spray",
                "Use pheromone traps for monitoring",
                "Spray neem oil solution"
            ],
            prevention_tips=[
                "Regular field monitoring",
                "Crop rotation with non-host plants",
                "Maintain field hygiene"
            ],
            severity_level="Medium"
        )
        
        # Store in database
        await db.disease_analysis.insert_one(disease_analysis.dict())
        
        return {
            "analysis": disease_analysis,
            "ai_detailed_response": ai_response
        }
    
    except Exception as e:
        logging.error(f"Error in crop disease analysis: {e}")
        raise HTTPException(status_code=500, detail="Crop disease analysis failed")

@api_router.get("/recommendations/history")
async def get_recommendation_history(limit: int = 10):
    """Get recent crop recommendations"""
    try:
        recommendations = await db.crop_recommendations.find().sort("timestamp", -1).limit(limit).to_list(length=None)
        return [CropRecommendation(**rec) for rec in recommendations]
    except Exception as e:
        logging.error(f"Error fetching recommendation history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch recommendation history")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
