"""Dashboard API routes"""

from fastapi import APIRouter, Depends, HTTPException
from services.dashboard_service import DashboardService
from services.weather_service import WeatherService
from utils.response_utils import create_success_response
from api.auth import verify_jwt_token, get_farmer_from_db
from datetime import datetime

router = APIRouter(prefix="/api", tags=["dashboard"])
weather_service = WeatherService()

def get_current_season():
    """Determine active agricultural season based on current month"""
    month = datetime.now().month
    
    if 6 <= month <= 9:  # June to September
        return "Kharif"
    elif 10 <= month <= 12 or 1 <= month <= 2:  # October to February
        return "Rabi"
    else:  # March to May
        return "Zaid"

@router.get("/dashboard")
async def get_dashboard(
    lat: float = None, 
    lon: float = None, 
    farmer_data: dict = Depends(verify_jwt_token)
):
    """Get farmer dashboard data"""
    try:
        # Get full farmer data from database
        full_farmer_data = await get_farmer_from_db(farmer_id=farmer_data["farmer_id"])
        
        if not full_farmer_data:
            raise HTTPException(status_code=404, detail="Farmer data not found")
        
        # Calculate total farm area from farms data
        total_area = 0
        total_area_unit = "acres"  # Default unit
        farm_count = 0
        
        print(f"🔍 Debug - Farmer farms data: {full_farmer_data.get('farms', [])}")
        
        if "farms" in full_farmer_data and full_farmer_data["farms"]:
            for farm in full_farmer_data["farms"]:
                print(f"🔍 Debug - Processing farm: {farm}")
                if "size" in farm and farm["size"]:
                    try:
                        farm_size = float(farm["size"])
                        total_area += farm_size
                        farm_count += 1
                        print(f"🔍 Debug - Added farm size: {farm_size}, running total: {total_area}")
                        # Use the unit from the last farm (assuming consistent units)
                        if "unit" in farm:
                            total_area_unit = farm["unit"]
                    except (ValueError, TypeError) as e:
                        print(f"⚠️ Debug - Skipping invalid farm size: {farm.get('size')} - {e}")
                        # Skip invalid farm sizes
                        continue
        
        # Format total area with unit
        formatted_total_area = f"{total_area} {total_area_unit}" if total_area > 0 else "No farms added"
        
        print(f"✅ Debug - Final calculated total area: {formatted_total_area}")

        # Get active season
        active_season = get_current_season()

        # Get weather data
        weather_data = {}
        try:
            # Priority: 1. Live coordinates, 2. Registered District, 3. Default "Kochi"
            if lat and lon:
                print(f"📍 Debug - Using live coordinates: {lat}, {lon}")
                weather_response = weather_service.get_current_weather(lat=lat, lon=lon)
            else:
                district = full_farmer_data.get("district")
                print(f"🔍 Debug - Farmer ID: {full_farmer_data.get('farmer_id')}")
                print(f"🔍 Debug - Farmer District from DB: {district}")
                
                if not district:
                    district = "Kochi"
                    print(f"⚠️ Debug - District not found, defaulting to: {district}")
                
                weather_response = weather_service.get_current_weather(city=district)
            
            print(f"🔍 Debug - Weather API Response: {weather_response}")
            
            if weather_response.get("success"):
                weather_data = weather_response.get("data", {})
            else:
                print(f"❌ Debug - Weather API failed: {weather_response.get('error')}")
        except Exception as e:
            print(f"⚠️ Debug - Failed to fetch weather: {e}")

        
        # Prepare dashboard data
        dashboard_farmer_data = {
            "name": full_farmer_data.get("name", "Farmer"),
            "location": f"{full_farmer_data.get('district', '')}, {full_farmer_data.get('state', '')}".strip(", "),
            "farm_count": farm_count,
            "total_area": formatted_total_area,
            "phone": full_farmer_data.get("phone", ""),
            "district": full_farmer_data.get("district", ""),
            "state": full_farmer_data.get("state", ""),
            "village": full_farmer_data.get("village", ""),
            "farmer_id": full_farmer_data.get("farmer_id", ""),
            "farms": full_farmer_data.get("farms", []),
            "active_season": active_season,
            "weather": weather_data
        }
        
        return create_success_response(farmer=dashboard_farmer_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Dashboard error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load dashboard: {str(e)}")