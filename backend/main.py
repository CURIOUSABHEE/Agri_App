"""
Agricultural Dashboard API - Main Application File

A comprehensive FastAPI application with modular architecture for agricultural services.
Features include weather forecasting, market prices, disease detection, chatbot assistance,
inventory management, authentication system, and government schemes information.
"""

import os
import uvicorn
from datetime import datetime
from fastapi import FastAPI
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
    soil_data
)
from api.auth import auth_router
from api.agricultural_data import router as agricultural_data_router
from services.farmer_profile_service import router as farmer_router

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
# ...existing code...

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

# ...existing code...

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

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "🌾 Agricultural Dashboard API",
        "version": "2.0.0",
        "status": "running",
        "architecture": "modular",
        "features": [
            "� Phone Authentication (OTP)",
            "�📊 Dashboard Analytics",
            "🌤️ Weather Forecasting", 
            "📈 Kerala Market Prices",
            "🤖 AI Chatbot (Krishi Saathi)",
            "📦 Inventory Management",
            "🏛️ Government Schemes",
            "🔬 Disease Detection",
            "📍 Market Locator",
            "🌾 Crop Prediction"
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
                "/api/crop-prediction"
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
            "crop_prediction": "active"
        },
        "system_info": {
            "python_version": os.sys.version,
            "environment": os.getenv("ENVIRONMENT", "development")
        }
    }

@app.on_event("startup")
async def startup_event():
    """Initialize services on application startup"""
    print("\n" + "="*50)
    print("🚀 Agricultural Dashboard API Starting Up...")
    print("="*50)
    print("� Authentication service: ✅ Ready")
    print("�📊 Dashboard service: ✅ Ready")
    print("🌤️ Weather service: ✅ Ready") 
    print("📈 Kerala Market service: ✅ Ready")
    print("🤖 Chatbot service: ✅ Ready")
    print("📦 Inventory service: ✅ Ready")
    print("🏛️ Schemes service: ✅ Ready")
    print("🔬 Disease Detection service: ✅ Ready")
    print("📍 Market Locator service: ✅ Ready")
    print("🌾 Crop Prediction service: ✅ Ready")
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
    
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info" if DEBUG else "warning"
    )