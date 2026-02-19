from fastapi import APIRouter, Depends, HTTPException, Query
from services.rental_service import RentalService
from models.rental_models import Equipment
from typing import List

router = APIRouter()

# Dependency override in main.py
def get_rental_service():
    raise NotImplementedError("Service dependency not overridden")

@router.get("/nearby", response_model=List[dict])
async def get_nearby_equipment(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: float = Query(50.0, description="Radius in km"),
    category: str = Query(None, description="Equipment category filter"),
    service: RentalService = Depends(get_rental_service)
):
    try:
        equipments = await service.get_nearby_equipment(lat, lng, radius, category)
        return equipments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/equipment")
async def add_equipment(
    equipment: Equipment,
    service: RentalService = Depends(get_rental_service)
):
    try:
        equipment_dict = equipment.model_dump(by_alias=True, exclude_none=True)
        # Convert Pydantic 'location' to dict if needed, but model handles it
        # Ensure location is properly formatted for GeoJSON
        # If frontend sends {lat, lng}, we might need to convert here
        # But assuming frontend follows our model
        
        inserted_id = await service.add_equipment(equipment_dict)
        return {"success": True, "id": inserted_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-listings", response_model=List[dict])
async def get_my_listings(
    owner_id: str = Query(..., description="Owner ID"),
    service: RentalService = Depends(get_rental_service)
):
    return await service.get_equipment_by_owner(owner_id)

@router.get("/my-bookings", response_model=List[dict])
async def get_my_bookings(
    user_id: str = Query(..., description="User ID"),
    service: RentalService = Depends(get_rental_service)
):
    return await service.get_bookings_by_user(user_id)

@router.delete("/equipment/{equipment_id}")
async def delete_equipment(
    equipment_id: str,
    owner_id: str = Query(..., description="Owner ID verification"),
    service: RentalService = Depends(get_rental_service)
):
    success = await service.delete_equipment(equipment_id, owner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Equipment not found or unauthorized")
    return {"success": True, "message": "Equipment deleted"}
