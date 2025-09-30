from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Simple farmer data - no database needed
FARMER_DATA = {
    "name": "John Farmer",
    "location": "Maharashtra, India",
    "farm_count": 3,
    "total_area": "25 acres"
}

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

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "🌾 Simple Farmer Dashboard API",
        "version": "1.0.0"
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
