from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from .schemas import FarmerSignup, FarmCreate, FarmUpdate, MarketListing, ActivityLog
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============ FARMER CRUD ============
async def create_farmer(db: AsyncIOMotorDatabase, farmer_data: FarmerSignup) -> Dict[str, Any]:
    """Create a new farmer account"""
    # Hash password with bcrypt compatibility
    password = farmer_data.password[:70] if len(farmer_data.password) > 70 else farmer_data.password
    hashed_password = pwd_context.hash(password)
    
    farmer_doc = {
        "name": farmer_data.name,
        "phone": farmer_data.phone,
        "village": farmer_data.village,
        "taluka": farmer_data.taluka,
        "state": farmer_data.state,
        "language": farmer_data.language,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "profile_complete": False
    }
    
    result = await db.farmers.insert_one(farmer_doc)
    farmer_doc["_id"] = str(result.inserted_id)
    return farmer_doc

async def get_farmer_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[Dict[str, Any]]:
    """Get farmer by email address"""
    farmer = await db.farmers.find_one({"email": email})
    return farmer

async def get_farmer_by_phone(db: AsyncIOMotorDatabase, phone: str) -> Optional[Dict[str, Any]]:
    """Get farmer by phone number"""
    farmer = await db.farmers.find_one({"phone": phone})
    return farmer

async def get_farmer_by_id(db: AsyncIOMotorDatabase, farmer_id: str) -> Optional[Dict[str, Any]]:
    """Get farmer by ID"""
    if not ObjectId.is_valid(farmer_id):
        return None
    
    farmer = await db.farmers.find_one({"_id": ObjectId(farmer_id)})
    if farmer:
        farmer["_id"] = str(farmer["_id"])
    return farmer

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password"""
    # Apply same truncation logic for consistency
    password = plain_password[:70] if len(plain_password) > 70 else plain_password
    return pwd_context.verify(password, hashed_password)

async def update_farmer_profile(db: AsyncIOMotorDatabase, farmer_id: str, updates: Dict[str, Any]) -> bool:
    """Update farmer profile"""
    if not ObjectId.is_valid(farmer_id):
        return False
    
    updates["updated_at"] = datetime.utcnow()
    result = await db.farmers.update_one(
        {"_id": ObjectId(farmer_id)},
        {"$set": updates}
    )
    return result.modified_count > 0

# ============ FARM CRUD ============
async def create_farm(db: AsyncIOMotorDatabase, farmer_id: str, farm_data: FarmCreate) -> Dict[str, Any]:
    """Create a new farm"""
    farm_doc = {
        "farmer_id": farmer_id,
        "name": farm_data.name,
        "location": farm_data.location,
        "area_acres": farm_data.area_acres,
        "soil_type": farm_data.soil_type,
        "crops": farm_data.crops,
        "irrigation_type": farm_data.irrigation_type,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.farms.insert_one(farm_doc)
    farm_doc["_id"] = str(result.inserted_id)
    return farm_doc

async def get_farms_by_farmer(db: AsyncIOMotorDatabase, farmer_id: str) -> List[Dict[str, Any]]:
    """Get all farms for a farmer"""
    farms = await db.farms.find({"farmer_id": farmer_id}).to_list(100)
    for farm in farms:
        farm["_id"] = str(farm["_id"])
    return farms

async def get_farm_by_id(db: AsyncIOMotorDatabase, farm_id: str) -> Optional[Dict[str, Any]]:
    """Get farm by ID"""
    if not ObjectId.is_valid(farm_id):
        return None
    
    farm = await db.farms.find_one({"_id": ObjectId(farm_id)})
    if farm:
        farm["_id"] = str(farm["_id"])
    return farm

async def update_farm(db: AsyncIOMotorDatabase, farm_id: str, updates: FarmUpdate) -> bool:
    """Update farm details"""
    if not ObjectId.is_valid(farm_id):
        return False
    
    update_data = {k: v for k, v in updates.dict(exclude_unset=True).items()}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        result = await db.farms.update_one(
            {"_id": ObjectId(farm_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    return False

async def delete_farm(db: AsyncIOMotorDatabase, farm_id: str, farmer_id: str) -> bool:
    """Delete a farm (only by owner)"""
    if not ObjectId.is_valid(farm_id):
        return False
    
    result = await db.farms.delete_one({
        "_id": ObjectId(farm_id),
        "farmer_id": farmer_id
    })
    return result.deleted_count > 0

# ============ IMAGE ANALYSIS CRUD ============
async def save_image_analysis(db: AsyncIOMotorDatabase, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """Save image analysis results"""
    analysis_doc = {
        **analysis_data,
        "created_at": datetime.utcnow()
    }
    
    result = await db.image_analyses.insert_one(analysis_doc)
    analysis_doc["_id"] = str(result.inserted_id)
    return analysis_doc

async def get_farm_analyses(db: AsyncIOMotorDatabase, farm_id: str) -> List[Dict[str, Any]]:
    """Get all analyses for a farm"""
    analyses = await db.image_analyses.find({"farm_id": farm_id}).sort("created_at", -1).to_list(50)
    for analysis in analyses:
        analysis["_id"] = str(analysis["_id"])
    return analyses

# ============ ACTIVITY LOG CRUD ============
async def log_activity(db: AsyncIOMotorDatabase, activity_data: Dict[str, Any]) -> Dict[str, Any]:
    """Log farmer activity"""
    activity_doc = {
        **activity_data,
        "created_at": datetime.utcnow()
    }
    
    result = await db.activity_logs.insert_one(activity_doc)
    activity_doc["_id"] = str(result.inserted_id)
    return activity_doc

async def get_farmer_activities(db: AsyncIOMotorDatabase, farmer_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get recent activities for a farmer"""
    activities = await db.activity_logs.find(
        {"farmer_id": farmer_id}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    for activity in activities:
        activity["_id"] = str(activity["_id"])
    return activities

async def get_farm_activities(db: AsyncIOMotorDatabase, farm_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get recent activities for a specific farm"""
    activities = await db.activity_logs.find(
        {"farm_id": farm_id}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    for activity in activities:
        activity["_id"] = str(activity["_id"])
    return activities

# ============ MARKET CRUD ============
async def create_market_listing(db: AsyncIOMotorDatabase, farmer_id: str, farmer_name: str, listing_data: MarketListing) -> Dict[str, Any]:
    """Create a new market listing"""
    listing_doc = {
        "farmer_id": farmer_id,
        "farmer_name": farmer_name,
        "crop_name": listing_data.crop_name,
        "quantity_kg": listing_data.quantity_kg,
        "price_per_kg": listing_data.price_per_kg,
        "harvest_date": listing_data.harvest_date,
        "quality_grade": listing_data.quality_grade,
        "location": listing_data.location,
        "contact_info": listing_data.contact_info,
        "description": listing_data.description,
        "status": "active",
        "created_at": datetime.utcnow(),
        "views": 0,
        "expires_at": datetime.utcnow() + timedelta(days=30)
    }
    
    result = await db.market_listings.insert_one(listing_doc)
    listing_doc["_id"] = str(result.inserted_id)
    return listing_doc

async def get_market_listings(db: AsyncIOMotorDatabase, crop_name: Optional[str] = None, location: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get market listings with optional filters"""
    query = {"status": "active", "expires_at": {"$gt": datetime.utcnow()}}
    
    if crop_name:
        query["crop_name"] = {"$regex": crop_name, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    listings = await db.market_listings.find(query).sort("created_at", -1).to_list(100)
    for listing in listings:
        listing["_id"] = str(listing["_id"])
    return listings

async def get_farmer_listings(db: AsyncIOMotorDatabase, farmer_id: str) -> List[Dict[str, Any]]:
    """Get all listings for a farmer"""
    listings = await db.market_listings.find({"farmer_id": farmer_id}).sort("created_at", -1).to_list(100)
    for listing in listings:
        listing["_id"] = str(listing["_id"])
    return listings

async def increment_listing_views(db: AsyncIOMotorDatabase, listing_id: str):
    """Increment view count for a listing"""
    if ObjectId.is_valid(listing_id):
        await db.market_listings.update_one(
            {"_id": ObjectId(listing_id)},
            {"$inc": {"views": 1}}
        )

# ============ CHAT HISTORY CRUD ============
async def save_chat_message(db: AsyncIOMotorDatabase, farmer_id: str, message: str, response: str, language: str) -> Dict[str, Any]:
    """Save chat conversation"""
    chat_doc = {
        "farmer_id": farmer_id,
        "message": message,
        "response": response,
        "language": language,
        "created_at": datetime.utcnow()
    }
    
    result = await db.chat_history.insert_one(chat_doc)
    chat_doc["_id"] = str(result.inserted_id)
    return chat_doc

async def get_chat_history(db: AsyncIOMotorDatabase, farmer_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Get recent chat history for a farmer"""
    chats = await db.chat_history.find(
        {"farmer_id": farmer_id}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    for chat in chats:
        chat["_id"] = str(chat["_id"])
    return list(reversed(chats))  # Return in chronological order