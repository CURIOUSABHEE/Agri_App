from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import uvicorn
import os
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
import base64
import logging
import json
from datetime import datetime
from functools import lru_cache
import asyncio
import aiohttp
from deep_translator import GoogleTranslator, MyMemoryTranslator, LibreTranslator, PonsTranslator
from langdetect import detect
import time

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Agricultural AI - FREE Multilingual Backend",
    description="AI-powered farming assistant with FREE translation support",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Supported languages - focusing on most needed ones for efficiency
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'hi': 'Hindi (हिन्दी)',
    'mr': 'Marathi (मराठी)',
    'gu': 'Gujarati (ગુજરાતી)',
    'ta': 'Tamil (தமிழ்)',
    'te': 'Telugu (తెలుగు)',
    'kn': 'Kannada (ಕನ್ನಡ)',
    'bn': 'Bengali (বাংলা)',
    'pa': 'Punjabi (ਪੰਜਾਬੀ)',
    'ur': 'Urdu (اردو)',
    'es': 'Spanish (Español)',
    'fr': 'French (Français)',
    'de': 'German (Deutsch)',
    'pt': 'Portuguese (Português)',
    'ru': 'Russian (Русский)',
    'ja': 'Japanese (日本語)',
    'ko': 'Korean (한국어)',
    'zh': 'Chinese (中文)',
    'ar': 'Arabic (العربية)',
    'it': 'Italian (Italiano)',
}

DEFAULT_LANGUAGE = 'en'

class FreeTranslationService:
    """Free translation service using multiple fallback APIs"""
    
    def __init__(self):
        self.cache = {}  # In-memory cache
        self.last_request_time = {}
        self.min_interval = 0.1  # 100ms between requests to avoid rate limiting
        
        # Initialize multiple free translators as fallbacks
        self.translators = [
            ('mymemory', self._translate_mymemory),
            ('libre', self._translate_libre),
            ('google_free', self._translate_google_free),
        ]
    
    def _rate_limit(self, service_name: str):
        """Simple rate limiting"""
        now = time.time()
        if service_name in self.last_request_time:
            time_diff = now - self.last_request_time[service_name]
            if time_diff < self.min_interval:
                time.sleep(self.min_interval - time_diff)
        self.last_request_time[service_name] = time.time()
    
    def _translate_mymemory(self, text: str, target_lang: str, source_lang: str = 'en') -> str:
        """MyMemory translator - FREE with 10,000 chars/day limit"""
        try:
            self._rate_limit('mymemory')
            translator = MyMemoryTranslator(source=source_lang, target=target_lang)
            return translator.translate(text)
        except Exception as e:
            logger.warning(f"MyMemory translation failed: {e}")
            raise
    
    def _translate_libre(self, text: str, target_lang: str, source_lang: str = 'en') -> str:
        """LibreTranslate - FREE and open source"""
        try:
            self._rate_limit('libre')
            # Using free LibreTranslate instance (you can host your own)
            translator = LibreTranslator(source=source_lang, target=target_lang, base_url="https://libretranslate.de")
            return translator.translate(text)
        except Exception as e:
            logger.warning(f"LibreTranslate failed: {e}")
            raise
    
    def _translate_google_free(self, text: str, target_lang: str, source_lang: str = 'en') -> str:
        """Google Translate scraper - FREE but use sparingly"""
        try:
            self._rate_limit('google_free')
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            return translator.translate(text)
        except Exception as e:
            logger.warning(f"Google free translation failed: {e}")
            raise
    
    @lru_cache(maxsize=2000)
    def translate_text(self, text: str, target_lang: str, source_lang: str = 'en') -> str:
        """Translate text with multiple fallbacks and caching"""
        if target_lang == source_lang or not text.strip():
            return text
        
        # Check cache first
        cache_key = f"{hash(text)}_{source_lang}_{target_lang}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Try each translator as fallback
        for service_name, translator_func in self.translators:
            try:
                result = translator_func(text, target_lang, source_lang)
                if result and result != text:  # Valid translation
                    self.cache[cache_key] = result
                    logger.info(f"Translation successful using {service_name}")
                    return result
            except Exception as e:
                logger.warning(f"Translation service {service_name} failed: {e}")
                continue
        
        # If all fail, return original text
        logger.warning(f"All translation services failed for {target_lang}")
        return text
    
    def translate_dict(self, data: dict, target_lang: str, source_lang: str = 'en') -> dict:
        """Recursively translate dictionary values"""
        if target_lang == source_lang:
            return data
        
        translated = {}
        for key, value in data.items():
            try:
                if isinstance(value, str) and value.strip():
                    # Only translate meaningful strings
                    if len(value) > 1 and not value.replace('.', '').replace(',', '').replace(' ', '').isdigit():
                        translated[key] = self.translate_text(value, target_lang, source_lang)
                    else:
                        translated[key] = value
                elif isinstance(value, dict):
                    translated[key] = self.translate_dict(value, target_lang, source_lang)
                elif isinstance(value, list):
                    translated[key] = []
                    for item in value:
                        if isinstance(item, str) and item.strip():
                            translated[key].append(self.translate_text(item, target_lang, source_lang))
                        elif isinstance(item, dict):
                            translated[key].append(self.translate_dict(item, target_lang, source_lang))
                        else:
                            translated[key].append(item)
                else:
                    translated[key] = value
            except Exception as e:
                logger.error(f"Error translating key {key}: {e}")
                translated[key] = value  # Keep original on error
        
        return translated
    
    def detect_language(self, text: str) -> str:
        """Detect language of text"""
        try:
            detected = detect(text)
            return detected if detected in SUPPORTED_LANGUAGES else 'en'
        except:
            return 'en'

# Initialize free translation service
translation_service = FreeTranslationService()

# Language detection and validation
def get_language_from_header(accept_language: Optional[str] = Header(None)) -> str:
    """Extract preferred language from Accept-Language header"""
    if not accept_language:
        return DEFAULT_LANGUAGE
    
    for lang_item in accept_language.split(','):
        lang_code = lang_item.split(';')[0].strip().split('-')[0].lower()
        if lang_code in SUPPORTED_LANGUAGES:
            return lang_code
    
    return DEFAULT_LANGUAGE

# Data models
class LocationRequest(BaseModel):
    latitude: float
    longitude: float
    state: Optional[str] = "Maharashtra"
    district: Optional[str] = None
    language: Optional[str] = None

class SoilData(BaseModel):
    id: str = "soil_analysis_001"
    location: Dict[str, float]
    ph_level: float
    moisture_content: float
    nitrogen: float
    phosphorus: float
    potassium: float
    organic_matter: float
    timestamp: str
    analysis_summary: str = "Soil analysis completed successfully"
    recommendations: List[str] = []

class WeatherData(BaseModel):
    id: str = "weather_001"
    location: Dict[str, float]
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float
    weather_condition: str
    forecast_days: int = 7
    timestamp: str
    weather_summary: str = "Weather forecast generated"

class CropRecommendations(BaseModel):
    recommended_crops: List[Dict[str, Any]]
    soil_analysis: Dict[str, Any]
    weather_analysis: Dict[str, Any]
    market_analysis: Dict[str, Any]
    ai_insights: str
    sustainability_score: float
    expected_yield: Dict[str, float]
    profit_estimation: Dict[str, int]
    timestamp: str
    general_advice: List[str] = []

class DiseaseAnalysis(BaseModel):
    disease_detected: str
    confidence_score: float
    treatment_recommendations: List[str]
    prevention_tips: List[str]
    severity_level: str
    estimated_crop_loss: str
    treatment_cost: str
    detailed_description: str = "Disease analysis completed"

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = "farming assistant"
    language: Optional[str] = None

# Smart content generators for different languages
def generate_localized_content(content_type: str, language: str = 'en') -> Dict[str, Any]:
    """Generate content that's appropriate for the target language/region"""
    
    base_content = {
        'soil_recommendations': [
            "Consider adding organic matter to improve soil structure",
            "pH level is suitable for cotton and soybean cultivation", 
            "Nitrogen levels are adequate for current growing season",
            "Regular soil testing recommended every 2-3 years"
        ],
        'weather_summary': "Weather conditions are favorable for farming activities",
        'general_farming_advice': [
            "Test soil regularly for optimal results",
            "Consider crop rotation for sustainability", 
            "Monitor weather forecasts before field operations",
            "Use integrated pest management practices"
        ],
        'crop_growing_tips': {
            'Cotton': [
                "Use black cotton soil for best results",
                "Maintain proper plant spacing",
                "Monitor regularly for bollworm attacks",
                "Ensure adequate drainage"
            ],
            'Soybean': [
                "Use rhizobium culture for nitrogen fixation",
                "Ensure good field drainage",
                "Apply balanced NPK fertilizer",
                "Harvest at proper maturity stage"
            ]
        }
    }
    
    if language != 'en':
        return translation_service.translate_dict(base_content, language)
    
    return base_content

# Mock data generators
def generate_soil_data(latitude: float, longitude: float, language: str = 'en') -> Dict[str, Any]:
    lat_factor = abs(latitude) % 1
    lon_factor = abs(longitude) % 1
    
    localized_content = generate_localized_content('soil', language)
    
    return {
        "ph_level": round(6.8 + lat_factor * 1.4, 1),
        "moisture_content": round(30 + lon_factor * 25, 1),
        "nitrogen": round(120 + lat_factor * 180, 1),
        "phosphorus": round(20 + lon_factor * 30, 1),
        "potassium": round(180 + lat_factor * 220, 1),
        "organic_matter": round(2.0 + lon_factor * 2.5, 1),
        "analysis_summary": "Soil analysis shows good fertility levels for most crops",
        "recommendations": localized_content['soil_recommendations']
    }

def generate_weather_data(latitude: float, longitude: float, language: str = 'en') -> Dict[str, Any]:
    lat_factor = abs(latitude) % 1
    lon_factor = abs(longitude) % 1
    
    conditions = ["Clear Sky", "Partly Cloudy", "Cloudy", "Light Rain"]
    condition_index = int(lon_factor * len(conditions))
    
    localized_content = generate_localized_content('weather', language)
    
    base_data = {
        "temperature": round(26.5 + lat_factor * 8, 1),
        "humidity": round(55 + lon_factor * 25, 1),
        "rainfall": round(80 + lat_factor * 120, 1),
        "wind_speed": round(8 + lon_factor * 8, 1),
        "weather_condition": conditions[condition_index],
        "weather_summary": localized_content.get('weather_summary', "Weather forecast generated")
    }
    
    if language != 'en':
        # Translate weather condition
        base_data['weather_condition'] = translation_service.translate_text(
            base_data['weather_condition'], language
        )
    
    return base_data

# AI Model initialization
def get_ai_model():
    try:
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            logger.info("Gemini AI initialized successfully")
            return model
        else:
            logger.info("No GEMINI_API_KEY found, using enhanced mock responses")
            return None
    except ImportError:
        logger.info("google-generativeai not installed, using mock responses")
        return None
    except Exception as e:
        logger.error(f"Error initializing Gemini: {e}")
        return None

ai_model = get_ai_model()

def get_user_language(
    language: Optional[str] = None,
    accept_language: Optional[str] = Header(None)
) -> str:
    """Determine user's preferred language"""
    if language and language in SUPPORTED_LANGUAGES:
        return language
    return get_language_from_header(accept_language)

# API Endpoints
@app.get("/api/languages")
async def get_supported_languages():
    """Get list of all supported languages"""
    return {
        "supported_languages": SUPPORTED_LANGUAGES,
        "default_language": DEFAULT_LANGUAGE,
        "total_count": len(SUPPORTED_LANGUAGES),
        "translation_services": ["MyMemory", "LibreTranslate", "Google Free"],
        "features": ["Auto-detection", "Caching", "Fallback support"]
    }

@app.get("/api/")
async def root(lang: str = Depends(get_user_language)):
    """API info in user's language"""
    response = {
        "message": "Agricultural AI Decision Support System - FREE Translation",
        "status": "running",
        "version": "2.0.0",
        "ai_enabled": ai_model is not None,
        "supported_languages": len(SUPPORTED_LANGUAGES),
        "current_language": lang,
        "translation_cost": "FREE",
        "features": [
            "Multi-language soil analysis", 
            "Weather forecasting",
            "Crop recommendations",
            "Disease detection", 
            "Farming chat assistant"
        ]
    }
    
    if lang != 'en':
        response = translation_service.translate_dict(response, lang)
    
    return response

@app.post("/api/analyze-soil")
async def analyze_soil(location_data: LocationRequest):
    """Analyze soil conditions - FREE multilingual support"""
    try:
        lang = location_data.language or DEFAULT_LANGUAGE
        logger.info(f"Analyzing soil in {lang}")
        
        soil_data_dict = generate_soil_data(
            location_data.latitude, 
            location_data.longitude, 
            lang
        )
        
        soil_data = SoilData(
            location={"lat": location_data.latitude, "lon": location_data.longitude},
            timestamp=datetime.now().isoformat(),
            **soil_data_dict
        )
        
        return soil_data
        
    except Exception as e:
        logger.error(f"Soil analysis error: {e}")
        error_msg = "Soil analysis failed"
        if lang != 'en':
            error_msg = translation_service.translate_text(error_msg, lang)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/weather-forecast")
async def get_weather_forecast(location_data: LocationRequest):
    """Weather forecast - FREE multilingual"""
    try:
        lang = location_data.language or DEFAULT_LANGUAGE
        
        weather_data_dict = generate_weather_data(
            location_data.latitude,
            location_data.longitude,
            lang
        )
        
        weather_data = WeatherData(
            location={"lat": location_data.latitude, "lon": location_data.longitude},
            timestamp=datetime.now().isoformat(),
            **weather_data_dict
        )
        
        return weather_data
        
    except Exception as e:
        logger.error(f"Weather forecast error: {e}")
        error_msg = "Weather forecast failed"
        if location_data.language and location_data.language != 'en':
            error_msg = translation_service.translate_text(error_msg, location_data.language)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/crop-recommendations")
async def get_crop_recommendations(request: dict):
    """Crop recommendations - FREE multilingual"""
    try:
        latitude = request.get("latitude", 19.0760)
        longitude = request.get("longitude", 72.8777)
        lang = request.get("language", DEFAULT_LANGUAGE)
        
        logger.info(f"Generating crop recommendations in {lang}")
        
        # Get localized content
        localized_content = generate_localized_content('crops', lang)
        
        # Base recommendations
        base_crops = [
            {
                "crop": "Cotton",
                "suitability": 9.2,
                "expected_yield": 18,
                "profit_per_hectare": 95000,
                "best_season": "Kharif (June-July)",
                "water_requirement": "Medium to High",
                "growing_tips": localized_content.get('crop_growing_tips', {}).get('Cotton', [])
            },
            {
                "crop": "Soybean", 
                "suitability": 8.8,
                "expected_yield": 22,
                "profit_per_hectare": 75000,
                "best_season": "Kharif (June-July)",
                "water_requirement": "Medium",
                "growing_tips": localized_content.get('crop_growing_tips', {}).get('Soybean', [])
            }
        ]
        
        # Translate crop names and details if not English
        if lang != 'en':
            base_crops = translation_service.translate_dict({"crops": base_crops}, lang)["crops"]
        
        ai_insights = "Based on soil analysis and weather conditions, cotton and soybean are recommended for maximum profitability."
        if lang != 'en':
            ai_insights = translation_service.translate_text(ai_insights, lang)
        
        recommendations = CropRecommendations(
            recommended_crops=base_crops,
            soil_analysis=generate_soil_data(latitude, longitude, lang),
            weather_analysis=generate_weather_data(latitude, longitude, lang),
            market_analysis={"status": translation_service.translate_text("Market data varies by season", lang)},
            ai_insights=ai_insights,
            sustainability_score=8.2,
            expected_yield={"cotton": 18.5, "soybean": 22.0},
            profit_estimation={"cotton": 95000, "soybean": 75000},
            general_advice=localized_content.get('general_farming_advice', []),
            timestamp=datetime.now().isoformat()
        )
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Crop recommendations error: {e}")
        error_msg = "Crop recommendation failed"
        if request.get("language", 'en') != 'en':
            error_msg = translation_service.translate_text(error_msg, request.get("language"))
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/farming-chat")
async def farming_chat(request: ChatRequest):
    """FREE multilingual farming chat"""
    try:
        lang = request.language or DEFAULT_LANGUAGE
        message = request.message
        
        # Auto-detect language if not specified
        if not request.language:
            detected_lang = translation_service.detect_language(message)
            if detected_lang in SUPPORTED_LANGUAGES:
                lang = detected_lang
        
        logger.info(f"Processing chat in {lang}")
        
        # Generate appropriate response
        if ai_model:
            try:
                language_name = SUPPORTED_LANGUAGES.get(lang, 'English')
                chat_prompt = f"""
                You are an agricultural expert for India. 
                Respond in {language_name} language.
                Provide practical farming advice for: {message}
                """
                
                ai_response = ai_model.generate_content(chat_prompt)
                if hasattr(ai_response, 'text') and ai_response.text.strip():
                    return {
                        "response": ai_response.text,
                        "language": lang,
                        "source": "ai",
                        "detected_language": translation_service.detect_language(message)
                    }
            except Exception as ai_error:
                logger.error(f"AI chat error: {ai_error}")
        
        # Fallback response with smart content
        fallback_responses = {
            'cotton_advice': "Cotton farming requires black soil, proper drainage, and pest management. Sow during June-July monsoon period.",
            'soil_advice': "Regular soil testing is crucial. Maintain pH 6.5-7.5, add organic matter, and balance NPK nutrients.",
            'general_help': "I can help with crop selection, soil management, pest control, weather planning, and farming techniques."
        }
        
        message_lower = message.lower()
        if any(word in message_lower for word in ['cotton', 'कपास', 'कापूस']):
            response = fallback_responses['cotton_advice']
        elif any(word in message_lower for word in ['soil', 'मिट्टी', 'माती']):
            response = fallback_responses['soil_advice']
        else:
            response = fallback_responses['general_help']
        
        if lang != 'en':
            response = translation_service.translate_text(response, lang)
        
        return {
            "response": response,
            "language": lang,
            "source": "fallback",
            "detected_language": translation_service.detect_language(message)
        }
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        error_response = "Sorry, there's a technical issue. Please try again."
        if request.language and request.language != 'en':
            error_response = translation_service.translate_text(error_response, request.language)
        return {"response": error_response, "source": "error"}

class GovernmentSchemesRequest(BaseModel):
    state: str = "Maharashtra"
    language: str = "en"
    category: Optional[str] = "all"  # all, subsidy, loan, insurance, technology

def load_schemes_from_csv():
    """Load government schemes from CSV file"""
    try:
        csv_path = ROOT_DIR / "updated_data.csv"
        df = pd.read_csv(csv_path)
        
        schemes = []
        for _, row in df.iterrows():
            scheme = {
                "name": row['scheme_name'],
                "slug": row.get('slug', ''),
                "description": row['details'],
                "benefits": row['benefits'],
                "eligibility": row['eligibility'], 
                "application": row['application'],
                "documents": row['documents'].split('.') if pd.notna(row['documents']) else [],
                "level": row.get('level', 'Unknown'),
                "category": row.get('schemeCategory', 'General'),
                "tags": row.get('tags', '').split(', ') if pd.notna(row.get('tags')) else []
            }
            schemes.append(scheme)
        
        return schemes
    except Exception as e:
        logger.error(f"Error loading schemes from CSV: {e}")
        return []

@app.post("/api/government-schemes")
async def get_government_schemes(request: GovernmentSchemesRequest):
    """Get latest government schemes for farmers"""
    try:
        lang = request.language or 'en'
        
        # Load schemes from CSV file
        all_schemes = load_schemes_from_csv()
        
        # Filter by category if specified
        if request.category and request.category != "all":
            category_keywords = {
                "subsidy": ["subsidy", "assistance", "financial", "grant", "support"],
                "loan": ["loan", "credit", "fund", "financing"],
                "insurance": ["insurance", "bima", "protection", "security"],
                "technology": ["technology", "digital", "mechanization", "equipment"]
            }
            
            keywords = category_keywords.get(request.category.lower(), [])
            filtered_schemes = []
            
            for scheme in all_schemes:
                scheme_text = f"{scheme['name']} {scheme['description']} {scheme['category']} {' '.join(scheme['tags'])}".lower()
                if any(keyword in scheme_text for keyword in keywords):
                    filtered_schemes.append(scheme)
            
            schemes_data = filtered_schemes[:20]  # Limit to 20 schemes
        else:
            schemes_data = all_schemes[:50]  # Limit to 50 schemes for "all"
        
        # State-specific information for Maharashtra
        state_info = {
            "state_portal": "https://krishi.maharashtra.gov.in/",
            "helpline": "1800-180-1551 (Kisan Call Center)",
            "local_offices": "District Collector Office, Agriculture Officer, Block Development Office"
        }
        
        # Translate content if needed
        if lang != 'en':
            for scheme in schemes_data:
                scheme['name'] = translation_service.translate_text(scheme['name'], lang)
                scheme['description'] = translation_service.translate_text(scheme['description'], lang)
                scheme['eligibility'] = translation_service.translate_text(scheme['eligibility'], lang)
                scheme['benefits'] = translation_service.translate_text(scheme['benefits'], lang)
                scheme['application'] = translation_service.translate_text(scheme['application'], lang)
        
        response_data = {
            "schemes": schemes_data,
            "total_count": len(schemes_data),
            "state_info": state_info,
            "last_updated": "2024-12-01",
            "language": lang,
            "categories": ["subsidy", "loan", "insurance", "technology"],
            "important_note": "Please verify eligibility and current status from official government portals before applying."
        }
        
        if lang != 'en':
            response_data["important_note"] = translation_service.translate_text(response_data["important_note"], lang)
        
        return response_data
        
    except Exception as e:
        logger.error(f"Government schemes error: {e}")
        error_msg = "Unable to fetch government schemes. Please try again later."
        if lang != 'en':
            error_msg = translation_service.translate_text(error_msg, lang)
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/api/translation/stats")
async def get_translation_stats():
    """Get translation service statistics"""
    return {
        "cache_size": len(translation_service.cache),
        "supported_languages": len(SUPPORTED_LANGUAGES),
        "available_services": [name for name, _ in translation_service.translators],
        "cost": "FREE",
        "rate_limits": "Built-in rate limiting to avoid service blocks"
    }

if __name__ == "__main__":
    print("🚀 Starting Agricultural AI - FREE Multilingual Backend")
    print(f"📊 Supported Languages: {len(SUPPORTED_LANGUAGES)}")
    print(f"💰 Translation Cost: FREE")
    print(f"🤖 AI Service: {'Enabled' if ai_model else 'Mock Mode'}")
    print(f"🔄 Translation Services: MyMemory, LibreTranslate, Google Free")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=int(os.environ.get("PORT", 8000)),
        reload=True,
        log_level="info"
    )