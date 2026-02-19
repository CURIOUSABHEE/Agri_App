"""
Agricultural Dashboard API - Main Application File

A comprehensive FastAPI application with modular architecture for agricultural services.
Features include weather forecasting, market prices, disease detection, chatbot assistance,
inventory management, authentication system, and government schemes information.
"""

import os
import uvicorn
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import API routers
from api import (
    dashboard, 
    weather, 
    kerala_market,
    market_prices, 
    chatbot, 
    inventory, 
    schemes, 
    disease_detection,
    market_locator,
    crop_prediction,
    soil_data,
    smart_cultivation
)
from api.auth import auth_router
from api.agricultural_data import router as agricultural_data_router
from services.farmer_profile_service import router as farmer_router
from services.smart_cultivation_service import SmartCultivationService 
from api.smart_cultivation import get_smart_cultivation_service

# ----------------------------------------------------------------
# NEW: Real-Time Rental Service Imports
# ----------------------------------------------------------------
import socketio
from motor.motor_asyncio import AsyncIOMotorClient
from services.rental_service import RentalService
from services.socket_service import SocketService, sio
from api.rental import router as rental_router, get_rental_service


# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Agricultural Dashboard API",
    description="Comprehensive agricultural platform with AI-powered features",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include API routers with their respective endpoints
app.include_router(auth_router)  # Authentication system
app.include_router(agricultural_data_router)  # Centralized agricultural data
app.include_router(farmer_router)  # Farmer profile and farm management
app.include_router(dashboard.router)
app.include_router(weather.router)
app.include_router(kerala_market.router)
app.include_router(market_prices.router)
app.include_router(chatbot.router)
app.include_router(inventory.router)
app.include_router(schemes.router)
app.include_router(disease_detection.router)
app.include_router(market_locator.router, prefix="/api/markets", tags=["Market Locator"])
app.include_router(crop_prediction.router)
app.include_router(soil_data.router)  # Soil data from data.gov.in
app.include_router(smart_cultivation.router) # Smart Cultivation Pilot

# ----------------------------------------------------------------
# NEW: Real-Time Rental Service Integration
# ----------------------------------------------------------------
# MongoDB Configuration for Rental Service
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://jamdadeabhishek039:AbhiMongo@cluster0.uqicqbb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
DB_NAME = os.getenv("DB_NAME", "agriadvisor")

# Global instances (will be initialized in startup)
mongo_client = None
rental_service_instance = None
socket_service_instance = None
smart_cultivation_service_instance = None

# Mount Socket.IO (wraps FastAPI app)
# We do NOT mount at "/" because socket_app handles dispatching.
# We will run socket_app in uvicorn.
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# Include Rental Router
app.include_router(rental_router, prefix="/api/rental", tags=["Rental"])

# Dependency Override
async def get_rental_service_override():
    if not rental_service_instance:
        # In case it's called before startup or failed init
        # Try to initialize or error out
        raise HTTPException(status_code=503, detail="Rental service not initialized")
    return rental_service_instance

app.dependency_overrides[get_rental_service] = get_rental_service_override

async def get_smart_cultivation_service_override():
    if not smart_cultivation_service_instance:
        raise HTTPException(status_code=503, detail="Smart Cultivation service not initialized")
    return smart_cultivation_service_instance

app.dependency_overrides[get_smart_cultivation_service] = get_smart_cultivation_service_override


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "🌾 Agricultural Dashboard API",
        "version": "2.0.0",
        "status": "running",
        "architecture": "modular",
        "features": [
            " Phone Authentication (OTP)",
            "📊 Dashboard Analytics",
            "🌤️ Weather Forecasting", 
            "📈 Kerala Market Prices",
            "🤖 AI Chatbot (Krishi Saathi)",
            "📦 Inventory Management",
            "🏛️ Government Schemes",
            "🔬 Disease Detection",
            "📍 Market Locator",
            "🌾 Crop Prediction",
            "🚜 Equipment Rental (Real-time)",
            "📅 Smart Cultivation Pilot"
        ],
        "endpoints": {
            "documentation": "/docs",
            "health": "/health",
            "api_routes": [
                "/api/auth",
                "/api/agricultural-data",
                "/api/farmer",
                "/api/dashboard",
                "/api/weather", 
                "/api/kerala-market",
                "/api/market-prices",
                "/api/chat",
                "/api/inventory",
                "/api/schemes",
                "/api/disease",
                "/api/markets",
                "/api/crop-prediction",
                "/api/rental",
                "/api/smart-cultivation"
            ]
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "dashboard": "active",
            "weather": "active", 
            "kerala_market": "active",
            "market_prices": "active",
            "chatbot": "active",
            "inventory": "active",
            "schemes": "active",
            "disease_detection": "active",
            "market_locator": "active",
            "crop_prediction": "active",
            "rental": "active" if rental_service_instance else "inactive",
            "socket_io": "active" if socket_service_instance else "inactive",
            "smart_cultivation": "active" if smart_cultivation_service_instance else "inactive"
        },
        "system_info": {
            "python_version": os.sys.version,
            "environment": os.getenv("ENVIRONMENT", "development")
        }
    }

@app.on_event("startup")
async def startup_event():
    """Initialize services on application startup"""
    global mongo_client, rental_service_instance, socket_service_instance, smart_cultivation_service_instance
    
    print("\n" + "="*50)
    print("🚀 Agricultural Dashboard API Starting Up...")
    print("="*50)
    
    # Initialize Rental Service
    try:
        mongo_client = AsyncIOMotorClient(MONGO_URL)
        db = mongo_client[DB_NAME]
        rental_service_instance = RentalService(db)
        await rental_service_instance.initialize_indexes()

        # Initialize Smart Cultivation Service
        smart_cultivation_service_instance = SmartCultivationService(db)
        
        # Initialize Socket Service
        socket_service_instance = SocketService(rental_service_instance)
        print("🚜 Rental & Socket Services: ✅ Ready")
    except Exception as e:
        print(f"❌ Failed to initialize Rental services: {e}")

    print(" Authentication service: ✅ Ready")
    print("📊 Dashboard service: ✅ Ready")
    print("🌤️ Weather service: ✅ Ready") 
    print("📈 Kerala Market service: ✅ Ready")
    print("🤖 Chatbot service: ✅ Ready")
    print("📦 Inventory service: ✅ Ready")
    print("🏛️ Schemes service: ✅ Ready")
    print("🔬 Disease Detection service: ✅ Ready")
    print("📍 Market Locator service: ✅ Ready")
    print("🌾 Crop Prediction service: ✅ Ready")
    print("📅 Smart Cultivation service: ✅ Ready")
    print("="*50)
    print("✅ All services initialized successfully!")
    print(f"📚 API Documentation: http://localhost:8000/docs")
    print(f"🔍 Health Check: http://localhost:8000/health")
    print("="*50 + "\n")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on application shutdown"""
    print("\n" + "="*50)
    print("🔽 Agricultural Dashboard API Shutting Down...")
    print("🧹 Cleaning up resources...")
    if mongo_client:
        mongo_client.close()
        print("✅ MongoDB connection closed")
    print("✅ Cleanup completed!")
    print("👋 Goodbye!")
    print("="*50 + "\n")

if __name__ == "__main__":
    # Configuration from environment variables
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    print("🌾 Starting Agricultural Platform API...")
    print(f"📡 Server will run on http://{HOST}:{PORT}")
    print(f"📚 Documentation available at http://{HOST}:{PORT}/docs")
    
    # Run the socket_app (which wraps FastAPI app)
    uvicorn.run(
        "main:socket_app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info" if DEBUG else "warning"
    )
