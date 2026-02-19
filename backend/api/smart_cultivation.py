from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Optional, Dict, Any, List
from models.smart_cultivation_models import SmartCultivationRequest, SmartCultivationPlan
from services.smart_cultivation_service import SmartCultivationService

router = APIRouter(prefix="/api/smart-cultivation", tags=["Smart Cultivation"])

# Helper dependency to get service
# In main.py we will likely set this up, but for now we can rely on a similar pattern to rental
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Placeholder for the global instance, will be injected via main.py dependency overrides or similar
smart_cultivation_service: Optional[SmartCultivationService] = None

async def get_smart_cultivation_service():
    if smart_cultivation_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    return smart_cultivation_service

@router.post("/generate", response_model=SmartCultivationPlan)
async def generate_plan(
    request: SmartCultivationRequest,
    service: SmartCultivationService = Depends(get_smart_cultivation_service)
):
    """
    Generate a preview of the cultivation calendar using Groq.
    This does NOT save to the database.
    """
    try:
        plan = await service.generate_plan(request)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save", response_model=Dict[str, Any])
async def save_plan(
    plan: SmartCultivationPlan,
    service: SmartCultivationService = Depends(get_smart_cultivation_service)
):
    """
    Save the confirmed plan to the database.
    """
    try:
        plan_id = await service.save_plan(plan)
        return {"success": True, "plan_id": plan_id, "message": "Cultivation plan activated!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active/{user_id}", response_model=Optional[SmartCultivationPlan])
async def get_active_plan(
    user_id: str,
    service: SmartCultivationService = Depends(get_smart_cultivation_service)
):
    """
    Get the current active plan for the user.
    """
    try:
        plan = await service.get_active_plan(user_id)
        if not plan:
            return None # Return null if no active plan
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/saved/{user_id}", response_model=List[SmartCultivationPlan])
async def get_saved_plans(
    user_id: str,
    service: SmartCultivationService = Depends(get_smart_cultivation_service)
):
    """
    Get all saved plans for the user.
    """
    try:
        plans = await service.get_all_plans(user_id)
        return plans
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plan/{plan_id}", response_model=SmartCultivationPlan)
async def get_plan_details(
    plan_id: str,
    service: SmartCultivationService = Depends(get_smart_cultivation_service)
):
    try:
        plan = await service.get_plan_by_id(plan_id)
        if not plan:
             raise HTTPException(status_code=404, detail="Plan not found")
        return plan
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
