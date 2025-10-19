"""
Farmer Profile Management System
Priority: HIGH - Phase 2, Day 6-8

Complete CRUD operations for farmer data with real persistence
"""

from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from pydantic import BaseModel, validator, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import json

from services.auth_service import verify_token
from database.mongodb_setup import get_database

router = APIRouter(prefix="/api/farmer", tags=["Farmer Profile"])

# Pydantic Models for Farmer Data
class Address(BaseModel):
    district: str
    state: str = "Kerala"
    pincode: Optional[str] = Field(None, pattern=r"^\d{6}$")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

class PersonalDetailsUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = Field(None, pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = Field(None, pattern=r"^(male|female|other)$")
    language_preference: Optional[str] = Field(None, pattern=r"^(en|hi|ml|ta|te|kn)$")
    education_level: Optional[str] = None
    family_size: Optional[int] = Field(None, ge=1, le=20)
    address: Optional[Address] = None
    aadhar_number: Optional[str] = Field(None, pattern=r"^\d{12}$")
    bank_account: Optional[Dict[str, str]] = None

class FarmCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    area_acres: float = Field(..., gt=0, le=1000)
    soil_type: str = Field(..., pattern=r"^(clay|loamy|sandy|laterite|alluvial|black_cotton)$")
    soil_ph: Optional[float] = Field(None, ge=0, le=14)
    irrigation_type: str = Field(..., pattern=r"^(drip|sprinkler|flood|monsoon_dependent|borwell|canal)$")
    water_source: List[str] = []
    current_crops: List[str] = []
    address: Address
    
    # Infrastructure
    storage_facilities: List[str] = []
    machinery_owned: List[str] = []
    organic_certified: bool = False

class FarmUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    area_acres: Optional[float] = Field(None, gt=0, le=1000)
    soil_type: Optional[str] = Field(None, pattern=r"^(clay|loamy|sandy|laterite|alluvial|black_cotton)$")
    soil_ph: Optional[float] = Field(None, ge=0, le=14)
    irrigation_type: Optional[str] = Field(None, pattern=r"^(drip|sprinkler|flood|monsoon_dependent|borwell|canal)$")
    water_source: Optional[List[str]] = None
    current_crops: Optional[List[str]] = None
    storage_facilities: Optional[List[str]] = None
    machinery_owned: Optional[List[str]] = None
    organic_certified: Optional[bool] = None

class FarmerProfileService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database

    # Profile Management
    async def get_farmer_profile(self, farmer_id: str) -> Dict[str, Any]:
        """Get complete farmer profile with all related data"""
        try:
            farmer = await self.db.farmers.find_one({"farmer_id": farmer_id})
            
            if not farmer:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Farmer profile not found"
                )
            
            # Convert ObjectId to string for JSON serialization
            farmer["_id"] = str(farmer["_id"])
            
            # Get aggregated statistics
            stats = await self._get_farmer_statistics(farmer_id)
            farmer["statistics"] = stats
            
            return farmer
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error fetching farmer profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error fetching profile"
            )

    async def update_personal_details(self, farmer_id: str, updates: PersonalDetailsUpdate) -> Dict[str, Any]:
        """Update farmer personal details"""
        try:
            # Prepare update data
            update_data = {}
            for field, value in updates.dict(exclude_unset=True).items():
                if field == "address" and value:
                    # Handle nested address update
                    for addr_field, addr_value in value.items():
                        update_data[f"personal_details.address.{addr_field}"] = addr_value
                else:
                    update_data[f"personal_details.{field}"] = value
            
            # Add last updated timestamp
            update_data["last_active"] = datetime.now()
            
            # Update farmer document
            result = await self.db.farmers.update_one(
                {"farmer_id": farmer_id},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Farmer not found"
                )
            
            # Return updated profile
            return await self.get_farmer_profile(farmer_id)
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error updating farmer profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error updating profile"
            )

    # Farm Management
    async def create_farm(self, farmer_id: str, farm_data: FarmCreate) -> Dict[str, Any]:
        """Create a new farm for farmer"""
        try:
            # Generate farm ID
            farm_id = f"farm_{ObjectId()}"
            
            # Prepare farm document
            farm_doc = {
                "farm_id": farm_id,
                "farmer_id": farmer_id,
                **farm_data.dict(),
                "created_date": datetime.now(),
                "last_updated": datetime.now()
            }
            
            # Add geospatial coordinates if provided
            if farm_data.address.latitude and farm_data.address.longitude:
                farm_doc["location"] = {
                    "type": "Point",
                    "coordinates": [farm_data.address.longitude, farm_data.address.latitude]
                }
            
            # Insert farm document
            await self.db.farms.insert_one(farm_doc)
            
            # Update farmer's farms array
            await self.db.farmers.update_one(
                {"farmer_id": farmer_id},
                {
                    "$push": {"farms": {
                        "farm_id": farm_id,
                        "name": farm_data.name,
                        "area_acres": farm_data.area_acres
                    }},
                    "$set": {"last_active": datetime.now()}
                }
            )
            
            # Log activity
            await self._log_activity(farmer_id, "farm_created", {"farm_id": farm_id, "name": farm_data.name})
            
            return {"success": True, "farm_id": farm_id, "message": "Farm created successfully"}
            
        except Exception as e:
            print(f"Error creating farm: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error creating farm"
            )

    async def get_farmer_farms(self, farmer_id: str) -> List[Dict[str, Any]]:
        """Get all farms for a farmer"""
        try:
            farms = await self.db.farms.find({"farmer_id": farmer_id}).to_list(length=None)
            
            # Convert ObjectId to string
            for farm in farms:
                farm["_id"] = str(farm["_id"])
            
            return farms
            
        except Exception as e:
            print(f"Error fetching farms: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error fetching farms"
            )

    async def update_farm(self, farmer_id: str, farm_id: str, updates: FarmUpdate) -> Dict[str, Any]:
        """Update farm details"""
        try:
            # Prepare update data
            update_data = {k: v for k, v in updates.dict(exclude_unset=True).items()}
            update_data["last_updated"] = datetime.now()
            
            # Update farm document
            result = await self.db.farms.update_one(
                {"farm_id": farm_id, "farmer_id": farmer_id},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Farm not found"
                )
            
            # Update farmer's farms array if name or area changed
            if "name" in update_data or "area_acres" in update_data:
                farmer_update = {}
                if "name" in update_data:
                    farmer_update["farms.$.name"] = update_data["name"]
                if "area_acres" in update_data:
                    farmer_update["farms.$.area_acres"] = update_data["area_acres"]
                
                await self.db.farmers.update_one(
                    {"farmer_id": farmer_id, "farms.farm_id": farm_id},
                    {"$set": farmer_update}
                )
            
            # Log activity
            await self._log_activity(farmer_id, "farm_updated", {"farm_id": farm_id})
            
            return {"success": True, "message": "Farm updated successfully"}
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error updating farm: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error updating farm"
            )

    # Statistics and Analytics
    async def _get_farmer_statistics(self, farmer_id: str) -> Dict[str, Any]:
        """Get farmer statistics and analytics"""
        try:
            # Aggregate statistics
            pipeline = [
                {"$match": {"farmer_id": farmer_id}},
                {
                    "$lookup": {
                        "from": "farms",
                        "localField": "farmer_id",
                        "foreignField": "farmer_id",
                        "as": "farms_data"
                    }
                },
                {
                    "$lookup": {
                        "from": "inventory",
                        "localField": "farmer_id",
                        "foreignField": "farmer_id", 
                        "as": "inventory_data"
                    }
                },
                {
                    "$lookup": {
                        "from": "activity_logs",
                        "localField": "farmer_id",
                        "foreignField": "farmer_id",
                        "as": "activities"
                    }
                },
                {
                    "$project": {
                        "total_farms": {"$size": "$farms_data"},
                        "total_area": {"$sum": "$farms_data.area_acres"},
                        "total_inventory_items": {"$size": "$inventory_data"},
                        "total_inventory_value": {"$sum": "$inventory_data.total_value"},
                        "total_activities": {"$size": "$activities"},
                        "last_activity": {"$max": "$activities.timestamp"}
                    }
                }
            ]
            
            result = await self.db.farmers.aggregate(pipeline).to_list(length=1)
            
            if result:
                stats = result[0]
                # Add more calculated fields
                stats["average_farm_size"] = stats["total_area"] / max(stats["total_farms"], 1)
                stats["account_age_days"] = (datetime.now() - farmer["registration_date"]).days if "farmer" in locals() else 0
                return stats
            
            return {
                "total_farms": 0,
                "total_area": 0,
                "total_inventory_items": 0, 
                "total_inventory_value": 0,
                "total_activities": 0,
                "average_farm_size": 0,
                "account_age_days": 0
            }
            
        except Exception as e:
            print(f"Error calculating statistics: {e}")
            return {}

    async def _log_activity(self, farmer_id: str, activity_type: str, details: Dict[str, Any]):
        """Log farmer activity"""
        try:
            activity = {
                "activity_id": str(ObjectId()),
                "farmer_id": farmer_id,
                "activity_type": activity_type,
                "details": details,
                "timestamp": datetime.now()
            }
            
            await self.db.activity_logs.insert_one(activity)
            
        except Exception as e:
            print(f"Error logging activity: {e}")

# FastAPI Endpoints
@router.get("/profile")
async def get_profile(
    current_farmer: dict = Depends(verify_token),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get farmer profile"""
    service = FarmerProfileService(db)
    return await service.get_farmer_profile(current_farmer["farmer_id"])

@router.put("/profile")
async def update_profile(
    updates: PersonalDetailsUpdate,
    current_farmer: dict = Depends(verify_token),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update farmer personal details"""
    service = FarmerProfileService(db)
    return await service.update_personal_details(current_farmer["farmer_id"], updates)

@router.post("/farms")
async def create_farm(
    farm_data: FarmCreate,
    current_farmer: dict = Depends(verify_token),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new farm"""
    service = FarmerProfileService(db)
    return await service.create_farm(current_farmer["farmer_id"], farm_data)

@router.get("/farms")
async def get_farms(
    current_farmer: dict = Depends(verify_token),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all farms for farmer"""
    service = FarmerProfileService(db)
    return await service.get_farmer_farms(current_farmer["farmer_id"])

@router.put("/farms/{farm_id}")
async def update_farm(
    farm_id: str,
    updates: FarmUpdate,
    current_farmer: dict = Depends(verify_token),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update farm details"""
    service = FarmerProfileService(db)
    return await service.update_farm(current_farmer["farmer_id"], farm_id, updates)