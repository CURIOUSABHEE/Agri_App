"""API routes for the application"""

from .dashboard import router as dashboard_router
from .kerala_market import router as kerala_market_router
from .market_prices import router as market_prices_router
from .weather import router as weather_router
from .chatbot import router as chatbot_router
from .inventory import router as inventory_router
from .schemes import router as schemes_router
from .disease_detection import router as disease_detection_router

__all__ = [
    "dashboard_router",
    "kerala_market_router", 
    "market_prices_router",
    "weather_router",
    "chatbot_router",
    "inventory_router", 
    "schemes_router",
    "disease_detection_router"
]