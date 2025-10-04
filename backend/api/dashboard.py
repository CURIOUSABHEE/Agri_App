"""Dashboard API routes"""

from fastapi import APIRouter
from services.dashboard_service import DashboardService
from utils.response_utils import create_success_response

router = APIRouter(prefix="/api", tags=["dashboard"])

@router.get("/dashboard")
async def get_dashboard():
    """Get farmer dashboard data"""
    farmer_data = DashboardService.get_farmer_data()
    return create_success_response(farmer=farmer_data)