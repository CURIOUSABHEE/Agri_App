"""Dashboard service for farmer data"""

from typing import Dict, Any

# Simple farmer data - no database needed
FARMER_DATA = {
    "name": "John Farmer",
    "location": "Maharashtra, India",
    "farm_count": 3,
    "total_area": "25 acres"
}

class DashboardService:
    """Service for dashboard-related operations"""
    
    @staticmethod
    def get_farmer_data() -> Dict[str, Any]:
        """Get farmer dashboard data"""
        return FARMER_DATA.copy()
    
    @staticmethod
    def get_dashboard_stats() -> Dict[str, Any]:
        """Get dashboard statistics"""
        return {
            "total_farms": FARMER_DATA["farm_count"],
            "total_area": FARMER_DATA["total_area"],
            "active_season": "Kharif",
            "weather_status": "Favorable"
        }