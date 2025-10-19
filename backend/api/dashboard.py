"""Dashboard API routes"""

from fastapi import APIRouter, Depends, HTTPException
from services.dashboard_service import DashboardService
from utils.response_utils import create_success_response
from api.auth import verify_jwt_token, get_farmer_from_db

router = APIRouter(prefix="/api", tags=["dashboard"])

@router.get("/dashboard")
async def get_dashboard(farmer_data: dict = Depends(verify_jwt_token)):
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
            "farms": full_farmer_data.get("farms", [])
        }
        
        return create_success_response(farmer=dashboard_farmer_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Dashboard error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load dashboard: {str(e)}")