from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta
import numpy as np
from PIL import Image
import io  # <-- 1. IMPORTED IO MODULE
import base64
import google.generativeai as genai
import json

# Try to import TensorFlow (optional for chatbot functionality)
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    TENSORFLOW_AVAILABLE = True
    print("✅ TensorFlow loaded successfully")
except ImportError as e:
    print(f"⚠️ TensorFlow not available: {e}")
    print("🤖 Chatbot will work, but disease detection will be disabled")
    TENSORFLOW_AVAILABLE = False
    tf = None

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBl26CKJYJaa7riLnhfIxRKKs6oUp8HEa4")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-pro')
else:
    gemini_model = None
    print("⚠️ Gemini API key not found. Chatbot will use mock responses.")

# Simple farmer data - no database needed
FARMER_DATA = {
    "name": "John Farmer",
    "location": "Maharashtra, India",
    "farm_count": 3,
    "total_area": "25 acres"
}

# Weather API configuration
WEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
WEATHER_BASE_URL = "http://api.openweathermap.org/data/2.5"

# Kerala districts for location-based weather (using API-friendly names)
KERALA_DISTRICTS = [
    "Trivandrum", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
    "Idukki", "Kochi", "Thrissur", "Palakkad", "Malappuram", 
    "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
]

# District name mapping for API compatibility
DISTRICT_NAME_MAPPING = {
    "thiruvananthapuram": "Trivandrum",
    "ernakulam": "Kochi",
    "calicut": "Kozhikode",
    "trichur": "Thrissur"
}

# Pydantic models for API requests
class ChatMessage(BaseModel):
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    response: str
    timestamp: str

# Initialize FastAPI app
app = FastAPI(
    title="Simple Agri Dashboard",
    description="Basic farmer dashboard",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Load crop disease detection model
MODEL_PATH = "Model.hdf5"
disease_model = None
disease_classes = [
    "Apple___Apple_scab",
    "Apple___Black_rot", 
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy"
]

def load_disease_model():
    """Load the trained disease detection model"""
    print("--- ATTEMPTING TO LOAD MODEL (Simplified) ---")
    global disease_model
    
    if not TENSORFLOW_AVAILABLE:
        print("⚠️ TensorFlow not available. Disease detection disabled.")
        disease_model = None
        return
        
    try:
        model_path = "Model.hdf5"
        if os.path.exists(model_path):
            # Directly load the model and compile it.
            # This is a more robust way to handle potential version issues.
            disease_model = tf.keras.models.load_model(model_path, compile=True)

            print(f"✅ Disease detection model loaded successfully from {model_path}")
            disease_model.summary()
        else:
            print(f"❌ Model file not found at {model_path}")
            disease_model = None
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        disease_model = None

# Initialize model on startup (only if TensorFlow is available)
if TENSORFLOW_AVAILABLE:
    load_disease_model()
else:
    print("⚠️ Skipping disease model loading - TensorFlow not available")


def preprocess_image(image_file):
    """Preprocess the uploaded image for model prediction"""
    try:
        # Open and convert image
        image = Image.open(image_file)
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to model's expected input size (224x224 for most models)
        image = image.resize((224, 224))
        
        # Convert to numpy array and normalize
        img_array = np.array(image, dtype=np.float32)
        img_array = img_array / 255.0
        
        # Add batch dimension - should be (1, 224, 224, 3)
        img_array = np.expand_dims(img_array, axis=0)
        
        print(f"✅ Image preprocessed successfully. Shape: {img_array.shape}")
        return img_array
        
    except Exception as e:
        print(f"❌ Error preprocessing image: {str(e)}")
        return None

def predict_disease(image_array):
    """Predict crop disease using the loaded model"""
    global disease_model, disease_classes
    
    if disease_model is None:
        return None
    
    try:
        print(f"Input array shape for prediction: {image_array.shape}")
        print(f"Input array dtype: {image_array.dtype}")
        
        # Make prediction
        predictions = disease_model.predict(image_array, verbose=0)
        
        print(f"Prediction output shape: {predictions.shape}")
        
        # Get top prediction
        predicted_class_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_index])
        
        # Ensure we have enough classes
        if predicted_class_index >= len(disease_classes):
            print(f"Warning: Predicted index {predicted_class_index} exceeds available classes ({len(disease_classes)})")
            predicted_disease = f"Unknown_Disease_{predicted_class_index}"
        else:
            predicted_disease = disease_classes[predicted_class_index]
        
        return {
            "disease": predicted_disease,
            "confidence": confidence * 100,  # Convert to percentage
            "raw_predictions": predictions[0].tolist()
        }
    except Exception as e:
        print(f"Error making prediction: {e}")
        print(f"Image array shape: {image_array.shape if image_array is not None else 'None'}")
        return None

def format_disease_name(disease_name):
    """Format disease name for better readability"""
    # Replace underscores with spaces
    formatted = disease_name.replace("_", " ").replace("(", " (").replace(")", ") ")
    
    # Handle special formatting
    formatted = formatted.replace("  ", " ").strip()
    
    return formatted

def get_disease_info(disease_name, language="en"):
    """Get disease information including treatment and prevention"""
    
    # Extract crop and disease from the prediction
    if "___" in disease_name:
        crop, disease = disease_name.split("___", 1)
    else:
        crop, disease = "Unknown", disease_name
    
    # Format names
    crop = format_disease_name(crop)
    disease = format_disease_name(disease)
    
    # Determine severity
    severity = "none" if "healthy" in disease.lower() else "moderate"
    if any(keyword in disease.lower() for keyword in ["blight", "rot", "virus"]):
        severity = "severe"
    elif any(keyword in disease.lower() for keyword in ["spot", "mildew"]):
        severity = "moderate"
    
    # Generate treatment and prevention based on disease type
    if "healthy" in disease.lower():
        treatment = {
            "en": "Continue current care routine. No treatment needed.",
            "hi": "वर्तमान देखभाल जारी रखें। कोई उपचार की आवश्यकता नहीं।",
            "ml": "നിലവിലെ പരിചരണം തുടരുക. ചികിത്സ ആവശ്യമില്ല."
        }
        prevention = {
            "en": "Regular fertilization, proper watering, and good plant spacing.",
            "hi": "नियमित उर्वरक, उचित सिंचाई, और उचित पौधे की दूरी।",
            "ml": "നിയമിത വളം, ശരിയായ നീരൊഴിക്കൽ, ഉചിതമായ ചെടികളുടെ അകലം."
        }
    elif "blight" in disease.lower():
        treatment = {
            "en": "Apply copper-based fungicide. Remove infected parts. Improve air circulation.",
            "hi": "कॉपर-आधारित फंगीसाइड लगाएं। संक्रमित भागों को हटाएं। हवा की आवाजाही में सुधार करें।",
            "ml": "കോപ്പർ അധിഷ്ഠിത ഫംഗിസൈഡ് പ്രയോഗിക്കുക. രോഗബാധിത ഭാഗങ്ങൾ നീക്കം ചെയ്യുക. വായുസഞ്ചാരം മെച്ചപ്പെടുത്തുക."
        }
        prevention = {
            "en": "Avoid overhead watering, provide good drainage, rotate crops annually.",
            "hi": "ऊपर से पानी देने से बचें, अच्छी जल निकासी प्रदान करें, वार्षिक फसल चक्रण करें।",
            "ml": "മുകളിൽ നിന്ന് വെള്ളം ഒഴിക്കുന്നത് ഒഴിവാക്കുക, നല്ല നീർവഴി, വാർഷിക വിള ഭ്രമണം."
        }
    elif "spot" in disease.lower():
        treatment = {
            "en": "Apply preventive fungicide spray every 7-14 days. Remove affected leaves.",
            "hi": "हर 7-14 दिन में निवारक फंगीसाइड स्प्रे करें। प्रभावित पत्तियों को हटाएं।",
            "ml": "7-14 ദിവസത്തിലൊരിക്കൽ പ്രതിരോധ ഫംഗിസൈഡ് സ്പ്രേ ചെയ്യുക. രോഗബാധിത ഇലകൾ നീക്കം ചെയ്യുക."
        }
        prevention = {
            "en": "Ensure proper plant spacing for air circulation. Avoid leaf wetness.",
            "hi": "हवा की आवाजाही के लिए उचित पौधे की दूरी सुनिश्चित करें। पत्ती की नमी से बचें।",
            "ml": "വായുസഞ്ചാരത്തിനായി ഉചിതമായ ചെടികളുടെ അകലം ഉറപ്പാക്കുക. ഇലകളിലെ ഈർപ്പം ഒഴിവാക്കുക."
        }
    else:
        treatment = {
            "en": "Consult agricultural expert for specific treatment. Apply appropriate fungicide or bactericide.",
            "hi": "विशिष्ट उपचार के लिए कृषि विशेषज्ञ से परामर्श करें। उपयुक्त फंगीसाइड या बैक्टीरिसाइड लगाएं।",
            "ml": "നിർദ്ദിഷ്ട ചികിത്സയ്ക്കായി കാർഷിക വിദഗ്ധനെ സമീപിക്കുക. ഉചിതമായ ഫംഗിസൈഡ് അല്ലെങ്കിൽ ബാക്ടീരിസൈഡ് പ്രയോഗിക്കുക."
        }
        prevention = {
            "en": "Maintain plant health through proper nutrition and watering. Regular monitoring.",
            "hi": "उचित पोषण और पानी के माध्यम से पौधे का स्वास्थ्य बनाए रखें। नियमित निगरानी।",
            "ml": "ശരിയായ പോഷണവും നീരൊഴിക്കലും വഴി ചെടിയുടെ ആരോഗ്യം നിലനിർത്തുക. നിയമിത നിരീക്ഷണം."
        }
    
    return {
        "crop": crop,
        "disease": disease,
        "severity": severity,
        "treatment": treatment.get(language, treatment["en"]),
        "prevention": prevention.get(language, prevention["en"])
    }

# Helper functions for chatbot data integration
async def get_weather_data(location="Kochi, Kerala"):
    """Fetch current weather data for the location using OpenWeather API"""
    try:
        # Try to get real weather data if API key is available
        if WEATHER_API_KEY and WEATHER_API_KEY.strip():
            try:
                url = f"{WEATHER_BASE_URL}/weather?q={location}&appid={WEATHER_API_KEY}&units=metric"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Generate farming advice based on real weather conditions
                    farming_advice = get_farming_advice_from_weather(data)
                    
                    return {
                        "location": f"{data['name']}, {data['sys']['country']}",
                        "temperature": f"{round(data['main']['temp'])}°C",
                        "feels_like": f"{round(data['main']['feels_like'])}°C", 
                        "humidity": f"{data['main']['humidity']}%",
                        "conditions": data['weather'][0]['description'].title(),
                        "wind_speed": f"{round(data['wind']['speed'] * 3.6)} km/h",
                        "pressure": f"{data['main']['pressure']} hPa",
                        "visibility": f"{data.get('visibility', 0)/1000:.1f} km",
                        "uv_index": "Moderate",  # OpenWeather free tier doesn't include UV
                        "farming_advice": farming_advice,
                        "api_source": "OpenWeatherMap"
                    }
                else:
                    print(f"Weather API error: {response.status_code} - {response.text}")
            except requests.RequestException as e:
                print(f"Weather API request failed: {e}")
        
        # Fallback to mock data if API is not available or fails
        print("Using mock weather data as fallback")
        import random
        temperatures = [26, 27, 28, 29, 30, 31]
        conditions = [
            "Partly cloudy with high humidity",
            "Cloudy with chance of rain", 
            "Sunny and humid",
            "Light rain expected",
            "Overcast with high moisture"
        ]
        
        temp = random.choice(temperatures)
        condition = random.choice(conditions)
        
        # Generate farming advice based on conditions
        advice = ""
        if "rain" in condition.lower():
            advice = "Good time for transplanting rice. Avoid fertilizer application during rain."
        elif "sunny" in condition.lower():
            advice = "Perfect for drying harvested crops. Water plants early morning or evening."
        elif "humid" in condition.lower():
            advice = "Watch for fungal diseases. Ensure good air circulation around plants."
        else:
            advice = "Monitor soil moisture and water as needed. Check plant health regularly."
            
        return {
            "location": location,
            "temperature": f"{temp}°C",
            "feels_like": f"{temp + random.randint(-2, 3)}°C",
            "humidity": f"{random.randint(75, 90)}%",
            "conditions": condition,
            "wind_speed": f"{random.randint(8, 18)} km/h",
            "pressure": f"{random.randint(1005, 1020)} hPa",
            "visibility": f"{random.randint(8, 15)} km",
            "uv_index": "High" if "sunny" in condition.lower() else "Moderate",
            "farming_advice": advice,
            "api_source": "Mock Data"
        }
    except Exception as e:
        print(f"Error fetching weather: {e}")
        return None

def get_farming_advice_from_weather(weather_data):
    """Generate farming advice based on weather conditions"""
    try:
        temp = weather_data['main']['temp']
        humidity = weather_data['main']['humidity']
        conditions = weather_data['weather'][0]['main'].lower()
        
        advice = []
        
        # Temperature-based advice
        if temp > 32:
            advice.append("Very hot day - water crops early morning and evening.")
        elif temp < 20:
            advice.append("Cool weather - good for transplanting and land preparation.")
        else:
            advice.append("Good temperature for most farming activities.")
        
        # Humidity-based advice
        if humidity > 80:
            advice.append("High humidity - watch for fungal diseases, ensure good ventilation.")
        elif humidity < 50:
            advice.append("Low humidity - increase watering frequency.")
        
        # Weather condition-based advice
        if "rain" in conditions:
            advice.append("Rainy conditions - avoid pesticide spraying, good for rice cultivation.")
        elif "clear" in conditions or "sun" in conditions:
            advice.append("Clear skies - perfect for drying harvested crops and field work.")
        elif "cloud" in conditions:
            advice.append("Cloudy weather - good for transplanting as plants won't get stressed.")
        
        return " ".join(advice)
        
    except Exception as e:
        print(f"Error generating farming advice: {e}")
        return "Monitor weather conditions and adjust farming activities accordingly."

async def get_schemes_data():
    """Get current government schemes for farmers"""
    try:
        # Get schemes from existing endpoint data
        schemes_data = [
            {
                "name": "PM-KISAN",
                "description": "Direct income support to farmers - ₹6000 per year",
                "eligibility": "Small and marginal farmers with cultivable land",
                "status": "Active"
            },
            {
                "name": "Kerala Karshaka Welfare Scheme", 
                "description": "State scheme for farmer welfare and insurance",
                "eligibility": "All registered farmers in Kerala",
                "status": "Active"
            },
            {
                "name": "Crop Insurance Scheme",
                "description": "Protection against crop loss due to natural disasters",
                "eligibility": "All farmers with insurable crops",
                "status": "Active"
            }
        ]
        return schemes_data
    except Exception as e:
        print(f"Error fetching schemes: {e}")
        return []

async def get_market_prices_data():
    """Get current market prices for common crops"""
    try:
        # Return mock market data - can be replaced with real API
        return {
            "rice": "₹25-30 per kg",
            "coconut": "₹15-20 per piece", 
            "pepper": "₹400-450 per kg",
            "cardamom": "₹1200-1400 per kg",
            "rubber": "₹180-200 per kg",
            "banana": "₹20-25 per dozen",
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M")
        }
    except Exception as e:
        print(f"Error fetching market prices: {e}")
        return {}

async def get_dashboard_data():
    """Get farmer's dashboard information"""
    try:
        return {
            "total_farms": 3,
            "total_area": "25 acres",
            "active_crops": ["Rice", "Coconut", "Pepper"],
            "recent_activities": [
                "Watering - 2 hours ago",
                "Pesticide application - 1 day ago", 
                "Harvesting - 3 days ago"
            ],
            "alerts": [
                "Weather forecast shows rain in 2 days",
                "Market price for pepper increased by 5%"
            ]
        }
    except Exception as e:
        print(f"Error fetching dashboard data: {e}")
        return {}

def create_enhanced_system_prompt(weather_data, schemes_data, market_data, dashboard_data):
    """Create system prompt with real-time data for Krishi Saathi"""
    
    weather_info = ""
    if weather_data:
        weather_info = f"""
Current Weather Information:
- Location: {weather_data.get('location')}
- Temperature: {weather_data.get('temperature')}
- Humidity: {weather_data.get('humidity')}
- Rainfall: {weather_data.get('rainfall')}
- Conditions: {weather_data.get('conditions')}
- Farming Advice: {weather_data.get('farming_advice')}
"""

    schemes_info = ""
    if schemes_data:
        schemes_list = "\n".join([f"- {scheme['name']}: {scheme['description']}" for scheme in schemes_data])
        schemes_info = f"""
Available Government Schemes:
{schemes_list}
"""

    market_info = ""
    if market_data:
        market_list = "\n".join([f"- {crop}: {price}" for crop, price in market_data.items() if crop != "last_updated"])
        market_info = f"""
Current Market Prices:
{market_list}
Last Updated: {market_data.get('last_updated', 'N/A')}
"""

    dashboard_info = ""
    if dashboard_data:
        dashboard_info = f"""
Farmer's Current Status:
- Total Farms: {dashboard_data.get('total_farms', 'N/A')}
- Total Area: {dashboard_data.get('total_area', 'N/A')} 
- Active Crops: {', '.join(dashboard_data.get('active_crops', []))}
- Recent Activities: {', '.join(dashboard_data.get('recent_activities', []))}
"""

    return f"""You are "Krishi Saathi", a farmer-friendly assistant for people in Kerala. You talk in a simple, clear, and respectful way so that even an illiterate farmer or a villager can easily understand you.

Your role is to:
• Give easy-to-follow guidance about farming, crops, weather, and cultivation methods specific to Kerala.
• Use local context: Kerala's soil types, climate, water availability, and common farming practices.
• Suggest best crops for each season and also mention high-yield crops that grow well in Kerala.
• Share practical tips for farmers (like how to save water, protect crops, or store harvest).
• Always keep answers short, simple, and direct. Avoid technical jargon. If you must use a technical term, explain it in a farmer-friendly way.
• Be kind, patient, and supportive, like a trusted village advisor.
• If the farmer asks something outside farming (like health, politics, or unrelated topics), politely guide them back to farming or say you don't know.

CURRENT REAL-TIME INFORMATION TO USE IN YOUR RESPONSES:
{weather_info}
{schemes_info}
{market_info}
{dashboard_info}

Use this real-time information to give more accurate and helpful advice. For example:
- If asked about weather, use the current weather data
- If asked about schemes, mention the available government programs
- If asked about selling crops, reference current market prices
- Consider the farmer's current crops and activities when giving advice

Tone: Warm, respectful, and caring. Talk like you are speaking to a farmer in person."""

# Simple dashboard endpoint
@app.get("/api/dashboard")
async def get_dashboard():
    """Get farmer dashboard data"""
    return {
        "success": True,
        "farmer": FARMER_DATA
    }

# Schemes endpoint
@app.get("/api/schemes")
async def get_schemes(
    search: str = "",
    state: str = "",
    sector: str = "agriculture"
):
    """Get agricultural schemes with search functionality"""
    import csv
    import re
    
    schemes = []
    
    try:
        with open("updated_data.csv", "r", encoding="utf-8") as file:
            csv_reader = csv.DictReader(file)
            for row in csv_reader:
                # Filter for agriculture-related schemes
                scheme_category = row.get("schemeCategory", "").lower()
                tags = row.get("tags", "").lower()
                scheme_name = row.get("scheme_name", "").lower()
                details = row.get("details", "").lower()
                
                # Check if it's agriculture related
                is_agriculture = any(keyword in scheme_category or keyword in tags or keyword in scheme_name or keyword in details 
                                   for keyword in ["agriculture", "rural", "farm", "crop", "irrigation", "livestock", "kisan", "paddy", "fisheries"])
                
                if sector == "agriculture" and not is_agriculture:
                    continue
                
                # Apply search filters
                if search:
                    search_lower = search.lower()
                    if not any(search_lower in field.lower() for field in [
                        row.get("scheme_name", ""),
                        row.get("details", ""),
                        row.get("benefits", ""),
                        row.get("tags", "")
                    ]):
                        continue
                
                # Apply state filter (check in details, eligibility, and application fields)
                if state:
                    state_lower = state.lower()
                    state_fields = [
                        row.get("details", ""),
                        row.get("eligibility", ""),
                        row.get("application", ""),
                        row.get("level", "")
                    ]
                    if not any(state_lower in field.lower() for field in state_fields):
                        continue
                
                # Clean and structure the scheme data
                scheme = {
                    "id": len(schemes) + 1,
                    "scheme_name": row.get("scheme_name", ""),
                    "slug": row.get("slug", ""),
                    "details": row.get("details", "")[:300] + "..." if len(row.get("details", "")) > 300 else row.get("details", ""),
                    "benefits": row.get("benefits", ""),
                    "eligibility": row.get("eligibility", "")[:200] + "..." if len(row.get("eligibility", "")) > 200 else row.get("eligibility", ""),
                    "level": row.get("level", ""),
                    "category": row.get("schemeCategory", ""),
                    "tags": row.get("tags", "").split(", ") if row.get("tags") else []
                }
                schemes.append(scheme)
        
        return {
            "success": True,
            "total": len(schemes),
            "schemes": schemes[:50]  # Limit to 50 results for performance
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Error reading schemes data: {str(e)}",
            "schemes": []
        }

# Market Prices endpoint
@app.get("/api/market-prices")
async def get_market_prices(
    state: str = "",
    taluka: str = "",
    market: str = "",
    crop: str = ""
):
    """Get market prices with filtering"""
    import random
    from datetime import datetime, timedelta
    
    # Sample market data - in real app, this would come from a database
    states_data = {
        "Maharashtra": {
            "talukas": {
                "Pune": ["Pune Market", "Hadapsar Market", "Kothrud Market"],
                "Mumbai": ["Crawford Market", "Dadar Market", "Vashi Market"],
                "Nashik": ["Nashik Main Market", "Deolali Market"]
            }
        },
        "Karnataka": {
            "talukas": {
                "Bangalore": ["KR Market", "Yeshwantpur Market", "Madiwala Market"],
                "Mysore": ["Devaraja Market", "Bandipalya Market"]
            }
        },
        "Kerala": {
            "talukas": {
                "Kochi": ["Broadway Market", "Mattancherry Market"],
                "Kozhikode": ["Palayam Market", "SM Street Market"]
            }
        },
        "Punjab": {
            "talukas": {
                "Amritsar": ["Katra Jaimal Singh Market", "Hall Bazaar"],
                "Ludhiana": ["Chaura Bazaar", "Ghumar Mandi"]
            }
        }
    }
    
    crops = ["Rice", "Wheat", "Sugarcane", "Cotton", "Tomato", "Onion", "Potato", 
             "Banana", "Apple", "Mango", "Coconut", "Turmeric", "Chilli", "Garlic"]
    
    market_data = []
    
    # Generate sample market price data
    for state_name, state_info in states_data.items():
        if state and state.lower() not in state_name.lower():
            continue
            
        for taluka_name, markets in state_info["talukas"].items():
            if taluka and taluka.lower() not in taluka_name.lower():
                continue
                
            for market_name in markets:
                if market and market.lower() not in market_name.lower():
                    continue
                    
                for crop_name in crops:
                    if crop and crop.lower() not in crop_name.lower():
                        continue
                    
                    # Generate random price data
                    base_price = random.randint(20, 200)
                    current_price = base_price + random.randint(-10, 15)
                    yesterday_price = base_price + random.randint(-8, 12)
                    
                    market_item = {
                        "id": len(market_data) + 1,
                        "state": state_name,
                        "taluka": taluka_name, 
                        "market": market_name,
                        "crop": crop_name,
                        "current_price": current_price,
                        "yesterday_price": yesterday_price,
                        "price_change": current_price - yesterday_price,
                        "unit": "per quintal",
                        "date": datetime.now().strftime("%Y-%m-%d"),
                        "trend": "up" if current_price > yesterday_price else "down" if current_price < yesterday_price else "stable"
                    }
                    market_data.append(market_item)
    
    # Limit results for performance
    limited_data = market_data[:100]
    
    return {
        "success": True,
        "total": len(market_data),
        "prices": limited_data,
        "filters": {
            "states": list(states_data.keys()),
            "crops": crops
        }
    }

# Weather endpoints
@app.get("/api/weather/current")
async def get_current_weather(
    lat: str = "",
    lon: str = "",
    city: str = ""
):
    """Get current weather data"""
    import requests
    from dotenv import load_dotenv
    
    load_dotenv()
    
    api_key = os.getenv("OPENWEATHER_API_KEY")
    
    if not api_key:
        # Return mock data if no API key
        return {
            "success": True,
            "data": {
                "location": city or "Mumbai",
                "temperature": 28,
                "feels_like": 32,
                "humidity": 65,
                "pressure": 1013,
                "wind_speed": 12,
                "wind_direction": 180,
                "visibility": 10,
                "uv_index": 6,
                "weather": {
                    "main": "Clear",
                    "description": "clear sky",
                    "icon": "01d"
                },
                "timestamp": "2025-09-30T12:00:00Z"
            },
            "source": "mock_data"
        }
    
    try:
        base_url = "https://api.openweathermap.org/data/2.5/weather"
        
        # Build query parameters
        if lat and lon:
            params = {
                "lat": lat,
                "lon": lon,
                "appid": api_key,
                "units": "metric"
            }
        elif city:
            params = {
                "q": city,
                "appid": api_key,
                "units": "metric"
            }
        else:
            # Default to Mumbai
            params = {
                "q": "Mumbai,IN",
                "appid": api_key,
                "units": "metric"
            }
        
        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Format the response
        formatted_data = {
            "location": data["name"],
            "country": data["sys"]["country"],
            "temperature": round(data["main"]["temp"], 1),
            "feels_like": round(data["main"]["feels_like"], 1),
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "wind_speed": round(data["wind"].get("speed", 0) * 3.6, 1),  # Convert m/s to km/h
            "wind_direction": data["wind"].get("deg", 0),
            "visibility": round(data.get("visibility", 10000) / 1000, 1),  # Convert to km
            "weather": {
                "main": data["weather"][0]["main"],
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"]
            },
            "timestamp": data["dt"],
            "sunrise": data["sys"]["sunrise"],
            "sunset": data["sys"]["sunset"]
        }
        
        return {
            "success": True,
            "data": formatted_data,
            "source": "openweather_api"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to fetch weather data: {str(e)}",
            "data": None
        }

@app.get("/api/weather/forecast")
async def get_weather_forecast(
    lat: str = "",
    lon: str = "",
    city: str = "",
    days: int = 5
):
    """Get weather forecast data"""
    import requests
    from dotenv import load_dotenv
    from datetime import datetime, timedelta
    
    load_dotenv()
    
    api_key = os.getenv("OPENWEATHER_API_KEY")
    
    if not api_key:
        # Return mock forecast data if no API key
        forecast_data = []
        for i in range(days):
            date = datetime.now() + timedelta(days=i)
            forecast_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "day_name": date.strftime("%A"),
                "temperature": {
                    "min": 22 + (i % 3),
                    "max": 30 + (i % 5),
                    "avg": 26 + (i % 4)
                },
                "humidity": 60 + (i % 20),
                "wind_speed": 10 + (i % 8),
                "weather": {
                    "main": ["Clear", "Clouds", "Rain"][i % 3],
                    "description": ["clear sky", "scattered clouds", "light rain"][i % 3],
                    "icon": ["01d", "02d", "10d"][i % 3]
                },
                "precipitation": 0 if i % 3 != 2 else 2.5
            })
        
        return {
            "success": True,
            "data": {
                "location": city or "Mumbai",
                "forecast": forecast_data
            },
            "source": "mock_data"
        }
    
    try:
        base_url = "https://api.openweathermap.org/data/2.5/forecast"
        
        # Build query parameters
        if lat and lon:
            params = {
                "lat": lat,
                "lon": lon,
                "appid": api_key,
                "units": "metric"
            }
        elif city:
            params = {
                "q": city,
                "appid": api_key,
                "units": "metric"
            }
        else:
            # Default to Mumbai
            params = {
                "q": "Mumbai,IN",
                "appid": api_key,
                "units": "metric"
            }
        
        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Group forecast data by day
        daily_forecasts = {}
        
        for item in data["list"]:
            date = datetime.fromtimestamp(item["dt"]).strftime("%Y-%m-%d")
            day_name = datetime.fromtimestamp(item["dt"]).strftime("%A")
            
            if date not in daily_forecasts:
                daily_forecasts[date] = {
                    "date": date,
                    "day_name": day_name,
                    "temperatures": [],
                    "humidity": [],
                    "wind_speed": [],
                    "weather_data": [],
                    "precipitation": 0
                }
            
            daily_forecasts[date]["temperatures"].append(item["main"]["temp"])
            daily_forecasts[date]["humidity"].append(item["main"]["humidity"])
            daily_forecasts[date]["wind_speed"].append(item["wind"].get("speed", 0) * 3.6)  # Convert to km/h
            daily_forecasts[date]["weather_data"].append(item["weather"][0])
            
            # Add precipitation if exists
            if "rain" in item:
                daily_forecasts[date]["precipitation"] += item["rain"].get("3h", 0)
            if "snow" in item:
                daily_forecasts[date]["precipitation"] += item["snow"].get("3h", 0)
        
        # Format daily data
        forecast_list = []
        for date_key in sorted(daily_forecasts.keys())[:days]:
            day_data = daily_forecasts[date_key]
            
            forecast_list.append({
                "date": day_data["date"],
                "day_name": day_data["day_name"],
                "temperature": {
                    "min": round(min(day_data["temperatures"]), 1),
                    "max": round(max(day_data["temperatures"]), 1),
                    "avg": round(sum(day_data["temperatures"]) / len(day_data["temperatures"]), 1)
                },
                "humidity": round(sum(day_data["humidity"]) / len(day_data["humidity"])),
                "wind_speed": round(sum(day_data["wind_speed"]) / len(day_data["wind_speed"]), 1),
                "weather": day_data["weather_data"][len(day_data["weather_data"])//2],  # Middle weather of the day
                "precipitation": round(day_data["precipitation"], 1)
            })
        
        return {
            "success": True,
            "data": {
                "location": data["city"]["name"],
                "country": data["city"]["country"],
                "forecast": forecast_list
            },
            "source": "openweather_api"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to fetch forecast data: {str(e)}",
            "data": None
        }

# Inventory Management endpoints

# Sample inventory data - in real app, this would come from a database
INVENTORY_ITEMS = [
    {
        "id": 1,
        "name": "NPK Fertilizer",
        "category": "farm_inputs",
        "subcategory": "Fertilizers",
        "current_stock": 15,
        "minimum_stock": 20,
        "unit": "bags (50kg)",
        "price_per_unit": 850.0,
        "total_value": 12750.0,
        "supplier": "AgriCorp Ltd",
        "expiry_date": "2025-03-15",
        "location": "Storage Room A",
        "last_updated": "2024-01-15T10:30:00Z"
    },
    {
        "id": 2,
        "name": "Wheat Seeds (HD-2967)",
        "category": "farm_inputs", 
        "subcategory": "Seeds",
        "current_stock": 8,
        "minimum_stock": 10,
        "unit": "bags (25kg)",
        "price_per_unit": 1200.0,
        "total_value": 9600.0,
        "supplier": "National Seeds Corp",
        "expiry_date": "2024-11-30",
        "location": "Cold Storage",
        "last_updated": "2024-01-10T14:20:00Z"
    },
    {
        "id": 3,
        "name": "Organic Pesticide",
        "category": "farm_inputs",
        "subcategory": "Pesticides",
        "current_stock": 25,
        "minimum_stock": 15,
        "unit": "bottles (1L)",
        "price_per_unit": 320.0,
        "total_value": 8000.0,
        "supplier": "EcoFarm Solutions",
        "expiry_date": "2024-12-20",
        "location": "Chemical Storage",
        "last_updated": "2024-01-12T09:15:00Z"
    },
    {
        "id": 4,
        "name": "Harvested Wheat",
        "category": "farm_produce",
        "subcategory": "Grains",
        "current_stock": 150,
        "minimum_stock": 50,
        "unit": "quintals",
        "price_per_unit": 2200.0,
        "total_value": 330000.0,
        "supplier": "Own Production",
        "expiry_date": "2025-06-15",
        "location": "Grain Storage",
        "last_updated": "2024-01-08T16:45:00Z"
    },
    {
        "id": 5,
        "name": "Fresh Tomatoes",
        "category": "farm_produce",
        "subcategory": "Vegetables",
        "current_stock": 45,
        "minimum_stock": 20,
        "unit": "crates (20kg)",
        "price_per_unit": 800.0,
        "total_value": 36000.0,
        "supplier": "Own Production",
        "expiry_date": "2024-02-05",
        "location": "Cold Storage",
        "last_updated": "2024-01-18T12:30:00Z"
    }
]

# Sample transaction history
INVENTORY_TRANSACTIONS = [
    {
        "id": 1,
        "item_id": 1,
        "item_name": "NPK Fertilizer",
        "type": "purchase",
        "quantity": 20,
        "unit_price": 850.0,
        "total_amount": 17000.0,
        "date": "2024-01-15T10:30:00Z",
        "notes": "Bulk purchase for winter season"
    },
    {
        "id": 2,
        "item_id": 4,
        "item_name": "Harvested Wheat",
        "type": "sale",
        "quantity": 50,
        "unit_price": 2200.0,
        "total_amount": 110000.0,
        "date": "2024-01-12T14:20:00Z",
        "notes": "Sold to local grain market"
    },
    {
        "id": 3,
        "item_id": 2,
        "item_name": "Wheat Seeds (HD-2967)",
        "type": "adjustment",
        "quantity": -2,
        "unit_price": 1200.0,
        "total_amount": -2400.0,
        "date": "2024-01-10T09:15:00Z",
        "notes": "Damaged bags removed from inventory"
    },
    {
        "id": 4,
        "item_id": 5,
        "item_name": "Fresh Tomatoes",
        "type": "production",
        "quantity": 45,
        "unit_price": 800.0,
        "total_amount": 36000.0,
        "date": "2024-01-18T12:30:00Z",
        "notes": "Fresh harvest from Field #3"
    }
]

@app.get("/api/inventory")
async def get_inventory(
    category: str = "",
    search: str = "",
    sortBy: str = "name",
    showLowStock: bool = False,
    showExpiring: bool = False
):
    """Get inventory items with filtering and sorting"""
    from datetime import datetime, timedelta
    
    items = INVENTORY_ITEMS.copy()
    
    # Apply category filter
    if category and category != "all":
        items = [item for item in items if item["category"] == category]
    
    # Apply search filter
    if search:
        search_lower = search.lower()
        items = [
            item for item in items 
            if search_lower in item["name"].lower() or 
               search_lower in item["subcategory"].lower() or
               search_lower in item["supplier"].lower()
        ]
    
    # Apply low stock filter
    if showLowStock:
        items = [item for item in items if item["current_stock"] <= item["minimum_stock"]]
    
    # Apply expiring filter (items expiring in next 30 days)
    if showExpiring:
        thirty_days_from_now = datetime.now() + timedelta(days=30)
        items = [
            item for item in items 
            if datetime.fromisoformat(item["expiry_date"]) <= thirty_days_from_now
        ]
    
    # Sort items
    if sortBy == "name":
        items.sort(key=lambda x: x["name"].lower())
    elif sortBy == "stock":
        items.sort(key=lambda x: x["current_stock"], reverse=True)
    elif sortBy == "value":
        items.sort(key=lambda x: x["total_value"], reverse=True)
    elif sortBy == "expiry":
        items.sort(key=lambda x: datetime.fromisoformat(x["expiry_date"]))
    
    # Calculate summary statistics
    total_items = len(INVENTORY_ITEMS)
    total_value = sum(item["total_value"] for item in INVENTORY_ITEMS)
    low_stock_count = len([item for item in INVENTORY_ITEMS if item["current_stock"] <= item["minimum_stock"]])
    
    # Count expiring items (within 30 days)
    thirty_days_from_now = datetime.now() + timedelta(days=30)
    expiring_count = len([
        item for item in INVENTORY_ITEMS 
        if datetime.fromisoformat(item["expiry_date"]) <= thirty_days_from_now
    ])
    
    return {
        "success": True,
        "data": {
            "items": items,
            "summary": {
                "total_items": total_items,
                "total_value": total_value,
                "low_stock_count": low_stock_count,
                "expiring_count": expiring_count
            }
        }
    }

@app.post("/api/inventory/items")
async def add_inventory_item(item_data: dict):
    """Add new inventory item"""
    from datetime import datetime
    
    # Generate new ID
    new_id = max([item["id"] for item in INVENTORY_ITEMS], default=0) + 1
    
    # Create new item
    new_item = {
        "id": new_id,
        "name": item_data.get("name", ""),
        "category": item_data.get("category", "farm_inputs"),
        "subcategory": item_data.get("subcategory", ""),
        "current_stock": float(item_data.get("current_stock", 0)),
        "minimum_stock": float(item_data.get("minimum_stock", 0)),
        "unit": item_data.get("unit", ""),
        "price_per_unit": float(item_data.get("price_per_unit", 0)),
        "total_value": float(item_data.get("current_stock", 0)) * float(item_data.get("price_per_unit", 0)),
        "supplier": item_data.get("supplier", ""),
        "expiry_date": item_data.get("expiry_date", ""),
        "location": item_data.get("location", ""),
        "last_updated": datetime.now().isoformat() + "Z"
    }
    
    # Add to inventory
    INVENTORY_ITEMS.append(new_item)
    
    # Create transaction record
    transaction = {
        "id": max([t["id"] for t in INVENTORY_TRANSACTIONS], default=0) + 1,
        "item_id": new_id,
        "item_name": new_item["name"],
        "type": "purchase",
        "quantity": new_item["current_stock"],
        "unit_price": new_item["price_per_unit"],
        "total_amount": new_item["total_value"],
        "date": new_item["last_updated"],
        "notes": f"Initial stock entry for {new_item['name']}"
    }
    INVENTORY_TRANSACTIONS.append(transaction)
    
    return {
        "success": True,
        "data": new_item,
        "message": "Item added successfully"
    }

@app.patch("/api/inventory/items/{item_id}/stock")
async def update_inventory_stock(item_id: int, stock_data: dict):
    """Update inventory item stock"""
    from datetime import datetime
    
    # Find the item
    item = next((item for item in INVENTORY_ITEMS if item["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    quantity = float(stock_data.get("quantity", 0))
    transaction_type = stock_data.get("type", "adjustment")
    notes = stock_data.get("notes", "")
    
    # Update stock based on transaction type
    if transaction_type == "purchase" or transaction_type == "production":
        item["current_stock"] += quantity
    elif transaction_type == "sale" or transaction_type == "adjustment":
        item["current_stock"] += quantity  # quantity can be negative for sales/adjustments
    
    # Ensure stock doesn't go negative
    if item["current_stock"] < 0:
        item["current_stock"] = 0
    
    # Update total value
    item["total_value"] = item["current_stock"] * item["price_per_unit"]
    item["last_updated"] = datetime.now().isoformat() + "Z"
    
    # Create transaction record
    transaction = {
        "id": max([t["id"] for t in INVENTORY_TRANSACTIONS], default=0) + 1,
        "item_id": item_id,
        "item_name": item["name"],
        "type": transaction_type,
        "quantity": quantity,
        "unit_price": item["price_per_unit"],
        "total_amount": quantity * item["price_per_unit"],
        "date": item["last_updated"],
        "notes": notes or f"Stock {transaction_type} for {item['name']}"
    }
    INVENTORY_TRANSACTIONS.append(transaction)
    
    return {
        "success": True,
        "data": item,
        "message": "Stock updated successfully"
    }

@app.delete("/api/inventory/items/{item_id}")
async def delete_inventory_item(item_id: int):
    """Delete inventory item"""
    global INVENTORY_ITEMS
    
    # Find and remove the item
    item = next((item for item in INVENTORY_ITEMS if item["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    INVENTORY_ITEMS = [item for item in INVENTORY_ITEMS if item["id"] != item_id]
    
    return {
        "success": True,
        "message": "Item deleted successfully"
    }

@app.get("/api/inventory/transactions")
async def get_inventory_transactions(itemId: int = None, limit: int = 10):
    """Get inventory transaction history"""
    transactions = INVENTORY_TRANSACTIONS.copy()
    
    # Filter by item ID if provided
    if itemId:
        transactions = [t for t in transactions if t["item_id"] == itemId]
    
    # Sort by date (newest first)
    transactions.sort(key=lambda x: x["date"], reverse=True)
    
    # Limit results
    transactions = transactions[:limit]
    
    return {
        "success": True,
        "data": transactions
    }

# Crop Disease Detection endpoint
@app.post("/api/disease/detect")
async def detect_crop_disease(
    file: UploadFile = File(...),
    language: str = "en"
):
    """Detect crop disease from uploaded image"""
    
    # Check if TensorFlow and model are available
    if not TENSORFLOW_AVAILABLE or disease_model is None:
        raise HTTPException(
            status_code=503,
            detail="Disease detection service is currently unavailable. TensorFlow dependencies not installed."
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload an image file."
        )
    
    # Check file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > max_size:
        raise HTTPException(
            status_code=400, 
            detail="File too large. Maximum size is 10MB."
        )
    
    try:
        # Preprocess image
        # <-- 2. WRAPPED 'content' IN io.BytesIO()
        image_array = preprocess_image(io.BytesIO(content))
        if image_array is None:
            raise HTTPException(
                status_code=400, 
                detail="Failed to process image. Please try with a different image."
            )
        
        # Check if model is loaded
        if disease_model is None:
            # Return mock data if model is not available
            return {
                "success": True,
                "data": {
                    "disease": "Leaf Spot Disease" if language == "en" else 
                             "पत्ती धब्बा रोग" if language == "hi" else "ഇല പുള്ളി രോഗം",
                    "confidence": 92.5,
                    "severity": "moderate",
                    "treatment": "Apply copper-based fungicide spray. Repeat in 7-10 days." if language == "en" else
                               "कॉपर आधारित फंगीसाइड स्प्रे करें। 7-10 दिनों में दोहराएं।" if language == "hi" else
                               "കോപ്പർ അധിഷ്ഠിത ഫംഗിസൈഡ് സ്പ്രേ ചെയ്യുക. 7-10 ദിവസത്തിൽ ആവർത്തിക്കുക.",
                    "prevention": "Maintain proper plant spacing, avoid overwatering" if language == "en" else
                                "उचित पौधे की दूरी बनाए रखें, अत्यधिक पानी से बचें" if language == "hi" else
                                "ചെടികൾക്കിടയിൽ ഉചിതമായ അകലം, അമിതമായ നീരൊഴിക്കൽ ഒഴിവാക്കുക",
                    "crop": "Unknown",
                    "model_available": False
                },
                "message": "Using fallback prediction - AI model not loaded"
            }
        
        # Make prediction using the model
        prediction_result = predict_disease(image_array)
        if prediction_result is None:
            raise HTTPException(
                status_code=500, 
                detail="Failed to analyze image. Please try again."
            )
        
        # Get disease information
        disease_info = get_disease_info(prediction_result["disease"], language)
        
        # Combine results
        result = {
            "disease": disease_info["disease"],
            "crop": disease_info["crop"],
            "confidence": round(prediction_result["confidence"], 1),
            "severity": disease_info["severity"],
            "treatment": disease_info["treatment"],
            "prevention": disease_info["prevention"],
            "model_available": True,
            "raw_disease_code": prediction_result["disease"]
        }
        
        return {
            "success": True,
            "data": result,
            "message": "Disease detection completed successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in disease detection: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error during disease detection"
        )

# Krishi Saathi System Prompt
KRISHI_SAATHI_PROMPT = """You are "Krishi Saathi", a farmer-friendly assistant for people in Kerala. You talk in a simple, clear, and respectful way so that even an illiterate farmer or a villager can easily understand you.

Your role is to:
• Give easy-to-follow guidance about farming, crops, weather, and cultivation methods specific to Kerala.
• Use local context: Kerala's soil types, climate, water availability, and common farming practices.
• Suggest best crops for each season and also mention high-yield crops that grow well in Kerala.
• Share practical tips for farmers (like how to save water, protect crops, or store harvest).
• Always keep answers short, simple, and direct. Avoid technical jargon. If you must use a technical term, explain it in a farmer-friendly way.
• Be kind, patient, and supportive, like a trusted village advisor.
• If the farmer asks something outside farming (like health, politics, or unrelated topics), politely guide them back to farming or say you don't know.

Tone: Warm, respectful, and caring. Talk like you are speaking to a farmer in person.

Current context: You are helping farmers in Kerala, India. Focus on Kerala's tropical climate, monsoon seasons, and popular crops like rice, coconut, spices, rubber, and vegetables."""

def detect_location_from_message(message: str) -> str:
    """Detect Kerala district/location from user message"""
    message_lower = message.lower()
    
    # Check district name mapping first
    for original, api_friendly in DISTRICT_NAME_MAPPING.items():
        if original in message_lower:
            return f"{api_friendly}, Kerala, India"
    
    # Check for Kerala districts mentioned in the message
    for district in KERALA_DISTRICTS:
        if district.lower() in message_lower:
            return f"{district}, Kerala, India"
    
    # Check for common city variations
    location_mapping = {
        "kochi": "Kochi, Kerala, India",
        "cochin": "Kochi, Kerala, India", 
        "trivandrum": "Trivandrum, Kerala, India",
        "tvm": "Trivandrum, Kerala, India",
        "calicut": "Kozhikode, Kerala, India",
        "trichur": "Thrissur, Kerala, India",
        "thiruvananthapuram": "Trivandrum, Kerala, India"
    }
    
    for variation, standard_name in location_mapping.items():
        if variation in message_lower:
            return standard_name
    
    # Default location
    return "Kochi, Kerala, India"

async def get_enhanced_krishi_saathi_response(message: str, language: str = "en", 
                                          weather_data=None, schemes_data=None, 
                                          market_data=None, dashboard_data=None) -> str:
    """Get enhanced response from Krishi Saathi using Gemini API with real-time data"""
    try:
        if gemini_model is None:
            return get_mock_farmer_response(message, language)
        
        # Detect location from message and get location-specific weather if needed
        detected_location = detect_location_from_message(message)
        if weather_data is None or any(word in message.lower() for word in ["weather", "rain", "temperature", "मौसम", "बारिश", "കാലാവസ്ഥ", "മഴ"]):
            weather_data = await get_weather_data(detected_location)
        
        # Create enhanced system prompt with real-time data
        enhanced_prompt = create_enhanced_system_prompt(
            weather_data, schemes_data, market_data, dashboard_data
        )
        
        # Prepare the language context
        language_instruction = ""
        if language == "hi":
            language_instruction = "\nPlease respond in simple Hindi (हिंदी)."
        elif language == "ml":
            language_instruction = "\nPlease respond in simple Malayalam (മലയാളം)."
        else:
            language_instruction = "\nPlease respond in simple English."
        
        full_prompt = enhanced_prompt + language_instruction + f"\n\nFarmer's question: {message}"
        
        # Generate response using Gemini
        response = gemini_model.generate_content(full_prompt)
        return response.text
        
    except Exception as e:
        print(f"Error getting enhanced Gemini response: {e}")
        return get_mock_farmer_response(message, language)

def get_krishi_saathi_response(message: str, language: str = "en") -> str:
    """Get response from Krishi Saathi using Gemini API (legacy function)"""
    try:
        if gemini_model is None:
            return get_mock_farmer_response(message, language)
        
        # Prepare the prompt with language context
        language_instruction = ""
        if language == "hi":
            language_instruction = "\nPlease respond in simple Hindi (हिंदी)."
        elif language == "ml":
            language_instruction = "\nPlease respond in simple Malayalam (മലയാളം)."
        else:
            language_instruction = "\nPlease respond in simple English."
        
        full_prompt = KRISHI_SAATHI_PROMPT + language_instruction + f"\n\nFarmer's question: {message}"
        
        # Generate response using Gemini
        response = gemini_model.generate_content(full_prompt)
        return response.text
        
    except Exception as e:
        print(f"Error getting Gemini response: {e}")
        return get_mock_farmer_response(message, language)

def get_mock_farmer_response(message: str, language: str = "en") -> str:
    """Fallback mock responses when Gemini API is not available"""
    message_lower = message.lower()
    
    if language == "hi":
        if any(word in message_lower for word in ["फसल", "खेती", "कृषि"]):
            return "केरल में धान, नारियल, मसाले और सब्जियों की खेती अच्छी होती है। मानसून के समय धान बोना सबसे अच्छा होता है। आपको कौन सी फसल के बारे में जानना है?"
        elif any(word in message_lower for word in ["बारिश", "मौसम", "पानी"]):
            return "केरल में मानसून जून से सितंबर तक होता है। इस समय धान की रोपाई करना अच्छा है। बारिश के बाद नारियल और मसालों की देखभाल करें।"
        elif any(word in message_lower for word in ["रोग", "बीमारी", "कीट"]):
            return "पौधों की बीमारियों से बचने के लिए नीम का तेल छिड़कें। अगर आपको पत्तों पर धब्बे दिखें तो तुरंत उन्हें हटा दें। हमारे रोग पहचान टूल का इस्तेमाल करें।"
        else:
            return "मैं कृषि सहायक हूँ और केरल के किसानों की मदद करता हूँ। आप मुझसे खेती, फसल, मौसम के बारे में पूछ सकते हैं।"
    
    elif language == "ml":
        if any(word in message_lower for word in ["വിള", "കൃഷി", "കൃഷിക്കാര"]):
            return "കേരളത്തിൽ നെല്ല്, തെങ്ങ്, മസാല, പച്ചക്കറികൾ എന്നിവയുടെ കൃഷി നല്ലതാണ്. മഴക്കാലത്ത് നെൽകൃഷി തുടങ്ങുന്നത് നല്ലതാണ്. ഏത് വിളയെക്കുറിച്ച് അറിയാണം?"
        elif any(word in message_lower for word in ["മഴ", "കാലാവസ്ഥ", "വെള്ളം"]):
            return "കേരളത്തിൽ മഴക്കാലം ജൂൺ മുതൽ സെപ്റ്റംബർ വരെയാണ്. ഈ സമയത്ത് നെല് നടുന്നത് നല്ലതാണ്. മഴയ്ക്ക് ശേഷം തെങ്ങിന്റെയും മസാലകളുടെയും പരിചരണം ചെയ്യുക."
        elif any(word in message_lower for word in ["രോഗം", "അസുഖം", "കീടം"]):
            return "ചെടികളിലെ രോഗങ്ങളിൽ നിന്ന് രക്ഷപ്പെടാൻ വേപ്പെണ്ണ തളിക്കുക. ഇലകളിൽ പാടുകൾ കണ്ടാൽ ഉടനെ അത് നീക്കം ചെയ്യുക. ഞങ്ങളുടെ രോഗ കണ്ടെത്തൽ ഉപകരണം ഉപയോഗിക്കുക."
        else:
            return "ഞാൻ കൃഷി സഹായിയാണ്, കേരള കർഷകരെ സഹായിക്കുന്നു. നിങ്ങൾക്ക് കൃഷി, വിള, കാലാവസ്ഥയെക്കുറിച്ച് എന്നോട് ചോദിക്കാം."
    
    else:  # English
        if any(word in message_lower for word in ["crop", "farming", "agriculture", "cultivation"]):
            return "In Kerala, rice, coconut, spices, and vegetables grow very well. The monsoon season (June-September) is best for rice planting. Which crop would you like to know about?"
        elif any(word in message_lower for word in ["weather", "rain", "monsoon", "water"]):
            return "Kerala's monsoon season is from June to September. This is the best time for rice cultivation. After rains, take good care of coconut and spice plants."
        elif any(word in message_lower for word in ["disease", "pest", "problem", "sick"]):
            return "To protect plants from diseases, spray neem oil regularly. Remove infected leaves immediately. You can use our Disease Detector tool to identify plant problems."
        elif any(word in message_lower for word in ["price", "market", "sell", "buying"]):
            return "Check our Market Prices section for current rates. Sell your crops when prices are good. Local markets usually give better prices than distant ones."
        else:
            return "Hello! I'm Krishi Saathi, your farming assistant for Kerala. Ask me about crops, farming methods, weather, or any agricultural questions you have."

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_krishi_saathi(chat_message: ChatMessage):
    """Chat with Krishi Saathi AI assistant with real-time data integration"""
    try:
        # Fetch real-time data to enhance the chatbot response
        weather_data = await get_weather_data()
        schemes_data = await get_schemes_data() 
        market_data = await get_market_prices_data()
        dashboard_data = await get_dashboard_data()
        
        # Get response with enhanced context
        response = await get_enhanced_krishi_saathi_response(
            chat_message.message, 
            chat_message.language,
            weather_data,
            schemes_data, 
            market_data,
            dashboard_data
        )
        
        return ChatResponse(
            response=response,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Sorry, I'm having trouble right now. Please try again."
        )

@app.get("/api/weather/location/{location}")
async def get_weather_by_location(location: str):
    """Get weather data for a specific Kerala location"""
    try:
        # Ensure location is in Kerala context
        kerala_location = f"{location}, Kerala, India" if "Kerala" not in location else location
        
        weather_data = await get_weather_data(kerala_location)
        
        if weather_data:
            return {
                "success": True,
                "data": weather_data,
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "success": False,
                "error": "Unable to fetch weather data",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        print(f"Error getting weather for location {location}: {e}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/chatbot/context")
async def get_chatbot_context(location: str = "Kochi, Kerala"):
    """Get real-time context data for enhanced chatbot responses"""
    try:
        weather_data = await get_weather_data(location)
        schemes_data = await get_schemes_data()
        market_data = await get_market_prices_data()
        dashboard_data = await get_dashboard_data()
        
        return {
            "success": True,
            "data": {
                "weather": weather_data,
                "schemes": schemes_data,
                "market_prices": market_data,
                "dashboard": dashboard_data,
                "kerala_districts": KERALA_DISTRICTS
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error getting chatbot context: {e}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "🌾 Simple Farmer Dashboard API",
        "version": "1.0.0",
        "features": [
            "Crop Disease Detection with AI",
            "Krishi Saathi Chatbot with Voice Support", 
            "Weather Integration",
            "Market Prices",
            "Government Schemes",
            "Dashboard Analytics"
        ]
    }



if __name__ == "__main__":
    import uvicorn
    
    # Configuration from environment variables
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    print("🚀 Starting Agricultural Platform API...")
    print(f"📡 Server will run on http://{HOST}:{PORT}")
    print(f"📚 Documentation available at http://{HOST}:{PORT}/docs")
    
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info" if DEBUG else "warning"
    )