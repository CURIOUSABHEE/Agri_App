"""
Simple Authentication System for Agricultural Platform
This implementation works without database initially and can be upgraded later
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, validator
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
import secrets
import hashlib
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-agricultural-jwt-key-2025")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
OTP_EXPIRE_MINUTES = 5

# Database imports
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DB_NAME", "agriadvisor")

# Global database connection
database = None
client = None

# Enhanced storage system
from enhanced_storage import farmer_storage

# Fallback: In-memory storage (for development without DB)
otp_storage = {}  # phone -> {otp_hash, expires_at, attempts}

# Security Bearer
security = HTTPBearer()

# Database Functions
async def get_database():
    """Get MongoDB database connection"""
    global client, database
    if database is None:
        try:
            client = AsyncIOMotorClient(MONGODB_URL)
            database = client[DATABASE_NAME]
            # Test connection
            await database.command("ping")
            print("✅ Connected to MongoDB")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            print("🔄 Using in-memory storage as fallback")
            database = None
    return database

async def save_farmer_to_db(farmer_data):
    """Save farmer to MongoDB or enhanced storage"""
    try:
        db = await get_database()
        if db is not None:
            # Save to MongoDB
            result = await db.farmers.update_one(
                {"farmer_id": farmer_data["farmer_id"]},
                {"$set": farmer_data},
                upsert=True
            )
            print(f"✅ Farmer saved to MongoDB: {farmer_data['farmer_id']}")
            return True
        else:
            # Use enhanced storage with file backup
            return farmer_storage.save_farmer(farmer_data)
    except Exception as e:
        print(f"❌ Error saving to MongoDB: {e}")
        # Fallback to enhanced storage
        return farmer_storage.save_farmer(farmer_data)

async def get_farmer_from_db(farmer_id=None, phone=None):
    """Get farmer from MongoDB or enhanced storage"""
    try:
        db = await get_database()
        if db is not None:
            # Query MongoDB
            query = {}
            if farmer_id:
                query["farmer_id"] = farmer_id
            elif phone:
                query["phone"] = phone
            
            farmer = await db.farmers.find_one(query)
            if farmer:
                farmer.pop('_id', None)  # Remove MongoDB _id field
                return farmer
        else:
            # Use enhanced storage
            if farmer_id:
                return farmer_storage.get_farmer_by_id(farmer_id)
            elif phone:
                return farmer_storage.get_farmer_by_phone(phone)
        return None
    except Exception as e:
        print(f"❌ Error getting farmer from MongoDB: {e}")
        # Fallback to enhanced storage
        if farmer_id:
            return farmer_storage.get_farmer_by_id(farmer_id)
        elif phone:
            return farmer_storage.get_farmer_by_phone(phone)
        return None

async def get_all_farmers_from_db():
    """Get all farmers from database or enhanced storage"""
    try:
        db = await get_database()
        if db is not None:
            # Query MongoDB
            cursor = db.farmers.find({}, {"_id": 0})
            farmers = await cursor.to_list(length=None)
            return farmers
        else:
            # Use enhanced storage
            return farmer_storage.get_all_farmers()
    except Exception as e:
        print(f"❌ Error getting farmers from MongoDB: {e}")
        # Fallback to enhanced storage
        return farmer_storage.get_all_farmers()

# Authentication Router
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Pydantic Models
class PhoneLoginRequest(BaseModel):
    phone: str
    
    @validator('phone')
    def validate_phone(cls, v):
        import re
        # Indian phone number validation
        pattern = r"^\+91[6-9]\d{9}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid Indian phone number format. Use +91XXXXXXXXXX")
        return v

class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str
    farmer_name: Optional[str] = None
    district: Optional[str] = None
    language: Optional[str] = "ml"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    farmer_data: Dict[str, Any]

class FarmerProfile(BaseModel):
    farmer_id: str
    name: str
    phone: str
    district: Optional[str] = None
    language: str = "ml"
    registration_date: datetime
    last_active: datetime
    farms_count: int = 0
    inventory_items: int = 0

class GoogleLoginRequest(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    google_id: str
    email_verified: bool = False
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    language: Optional[str] = "ml"

# Authentication Functions
def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return str(secrets.randbelow(900000) + 100000)

def hash_otp(otp: str) -> str:
    """Hash OTP for secure storage"""
    return hashlib.sha256(otp.encode()).hexdigest()

def create_farmer_id() -> str:
    """Create unique farmer ID"""
    return f"farmer_{secrets.token_hex(8)}"

def generate_tokens(farmer_data: Dict[str, Any]) -> TokenResponse:
    """Generate JWT access token"""
    
    # Access token payload
    access_payload = {
        "farmer_id": farmer_data["farmer_id"],
        "phone": farmer_data["phone"],
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access"
    }
    
    # Generate token
    access_token = jwt.encode(access_payload, SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return TokenResponse(
        access_token=access_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        farmer_data={
            "farmer_id": farmer_data["farmer_id"],
            "name": farmer_data["name"],
            "phone": farmer_data["phone"],
            "language": farmer_data["language"],
            "district": farmer_data.get("district"),
            "farms_count": farmer_data.get("farms_count", 0),
            "inventory_items": farmer_data.get("inventory_items", 0)
        }
    )

async def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, str]:
    """Verify JWT token and return farmer info"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        farmer_id = payload.get("farmer_id")
        
        if farmer_id is None or payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Check if farmer exists in database
        farmer_exists = await get_farmer_from_db(farmer_id=farmer_id)
        if not farmer_exists:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Farmer not found"
            )
        
        return {"farmer_id": farmer_id}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# API Endpoints
@auth_router.post("/send-otp")
async def send_otp(request: PhoneLoginRequest):
    """Send OTP to farmer's phone"""
    
    try:
        # Generate OTP
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        
        # Store OTP (in production, use database)
        otp_storage[request.phone] = {
            "otp_hash": otp_hash,
            "expires_at": datetime.now() + timedelta(minutes=OTP_EXPIRE_MINUTES),
            "attempts": 0
        }
        
        # In production, send SMS here
        print(f"📱 SMS to {request.phone}: Your Krishi Saathi OTP is: {otp}")
        
        # For development, include OTP in response (remove in production)
        return {
            "success": True,
            "message": f"OTP sent to {request.phone}",
            "expires_in_minutes": OTP_EXPIRE_MINUTES,
            "dev_otp": otp  # Remove this in production!
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP"
        )

@auth_router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(request: OTPVerifyRequest):
    """Verify OTP and login/register farmer"""
    
    try:
        # Check if OTP exists
        if request.phone not in otp_storage:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP not found. Please request a new OTP."
            )
        
        otp_data = otp_storage[request.phone]
        
        # Check expiry
        if datetime.now() > otp_data["expires_at"]:
            del otp_storage[request.phone]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired. Please request a new OTP."
            )
        
        # Check attempts
        if otp_data["attempts"] >= 3:
            del otp_storage[request.phone]
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts. Please request a new OTP."
            )
        
        # Verify OTP
        otp_hash = hash_otp(request.otp)
        if otp_hash != otp_data["otp_hash"]:
            otp_storage[request.phone]["attempts"] += 1
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP. Please try again."
            )
        
        # OTP verified, remove from storage
        del otp_storage[request.phone]
        
        # Find existing farmer or create new one
        existing_farmer = await get_farmer_from_db(phone=request.phone)
        
        if existing_farmer:
            # Update last active
            existing_farmer["last_active"] = datetime.now()
            farmer_data = existing_farmer
            # Save updated data
            await save_farmer_to_db(farmer_data)
        else:
            # Create new farmer
            farmer_id = create_farmer_id()
            farmer_data = {
                "farmer_id": farmer_id,
                "name": request.farmer_name or "Farmer",
                "phone": request.phone,
                "district": request.district,
                "language": request.language or "ml",
                "registration_date": datetime.now(),
                "last_active": datetime.now(),
                "farms": [],
                "inventory": [],
                "chat_history": [],
                "farms_count": 0,
                "inventory_items": 0
            }
            # Save new farmer to database
            await save_farmer_to_db(farmer_data)
        
        # Generate tokens
        return generate_tokens(farmer_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Authentication Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

import requests
from fastapi import Body

@auth_router.post("/google-login", response_model=TokenResponse)
async def google_login(id_token: str = Body(..., embed=True)):
    """Authenticate with Google using ID token verification"""

    try:
        # Verify token with Google
        response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token"
            )

        google_data = response.json()

        email = google_data["email"]
        name = google_data.get("name", "Google User")
        picture = google_data.get("picture")
        google_id = google_data["sub"]
        email_verified = google_data.get("email_verified", "false") == "true"
        given_name = google_data.get("given_name")
        family_name = google_data.get("family_name")

        # Find or create farmer
        existing_farmer = await get_farmer_from_db(phone=email)  # treating email as phone for uniqueness

        if existing_farmer:
            existing_farmer.update({
                "last_active": datetime.now(),
                "email": email,
                "picture": picture,
                "google_id": google_id,
                "email_verified": email_verified
            })
            farmer_data = existing_farmer
            await save_farmer_to_db(farmer_data)
        else:
            farmer_id = create_farmer_id()
            farmer_data = {
                "farmer_id": farmer_id,
                "name": name,
                "phone": email,
                "email": email,
                "picture": picture,
                "google_id": google_id,
                "email_verified": email_verified,
                "given_name": given_name,
                "family_name": family_name,
                "district": None,
                "language": "ml",
                "registration_date": datetime.now(),
                "last_active": datetime.now(),
                "auth_method": "google",
                "farms": [],
                "inventory": [],
                "chat_history": [],
                "farms_count": 0,
                "inventory_items": 0
            }
            await save_farmer_to_db(farmer_data)

        return generate_tokens(farmer_data)

    except Exception as e:
        print(f"❌ Google Authentication Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )

@auth_router.get("/profile", response_model=FarmerProfile)
async def get_profile(current_farmer: dict = Depends(verify_jwt_token)):
    """Get current farmer profile"""
    
    farmer_data = await get_farmer_from_db(farmer_id=current_farmer["farmer_id"])
    if not farmer_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found"
        )
    
    return FarmerProfile(
        farmer_id=farmer_data["farmer_id"],
        name=farmer_data["name"],
        phone=farmer_data["phone"],
        district=farmer_data.get("district"),
        language=farmer_data["language"],
        registration_date=farmer_data["registration_date"],
        last_active=farmer_data["last_active"],
        farms_count=len(farmer_data.get("farms", [])),
        inventory_items=len(farmer_data.get("inventory", []))
    )

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    state: Optional[str] = None
    taluka: Optional[str] = None
    pincode: Optional[str] = None
    farm_size: Optional[str] = None
    farm_size_unit: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None
    current_season: Optional[str] = None
    farming_experience: Optional[str] = None
    main_crops: Optional[list] = None
    language: Optional[str] = None

@auth_router.put("/profile")
async def update_profile(
    profile_update: UpdateProfileRequest,
    current_farmer: dict = Depends(verify_jwt_token)
):
    """Update farmer profile"""
    
    farmer_data = await get_farmer_from_db(farmer_id=current_farmer["farmer_id"])
    
    if not farmer_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found"
        )
    
    # Update fields that were provided
    update_dict = profile_update.dict(exclude_unset=True)
    for field, value in update_dict.items():
        if value is not None:
            farmer_data[field] = value
    
    farmer_data["last_active"] = datetime.now()
    
    # Save updated farmer data
    success = await save_farmer_to_db(farmer_data)
    
    if success:
        return {
            "success": True, 
            "message": "Profile updated successfully",
            "farmer_data": {
                "name": farmer_data["name"],
                "district": farmer_data.get("district"),
                "email": farmer_data.get("email"),
                "village": farmer_data.get("village"),
                "state": farmer_data.get("state"),
                "taluka": farmer_data.get("taluka"),
                "pincode": farmer_data.get("pincode"),
                "farm_size": farmer_data.get("farm_size"),
                "farm_size_unit": farmer_data.get("farm_size_unit"),
                "soil_type": farmer_data.get("soil_type"),
                "irrigation_type": farmer_data.get("irrigation_type"),
                "current_season": farmer_data.get("current_season"),
                "farming_experience": farmer_data.get("farming_experience"),
                "main_crops": farmer_data.get("main_crops"),
                "language": farmer_data.get("language")
            }
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )

@auth_router.get("/farmers")
async def list_farmers():
    """List all farmers (for development/testing)"""
    
    all_farmers = await get_all_farmers_from_db()
    
    return {
        "total_farmers": len(all_farmers),
        "farmers": [
            {
                "farmer_id": farmer_data["farmer_id"],
                "name": farmer_data["name"], 
                "phone": farmer_data["phone"],
                "district": farmer_data.get("district"),
                "registration_date": farmer_data["registration_date"].isoformat() if isinstance(farmer_data["registration_date"], datetime) else farmer_data["registration_date"],
                "farms_count": len(farmer_data.get("farms", []))
            }
            for farmer_data in all_farmers
        ]
    }

# Utility function to save data to file (backup)
def save_farmers_data():
    """Save farmers data to JSON file as backup"""
    try:
        # Convert datetime objects to strings for JSON serialization
        data_to_save = {}
        for farmer_id, farmer_data in farmers_storage.items():
            serializable_data = farmer_data.copy()
            serializable_data["registration_date"] = farmer_data["registration_date"].isoformat()
            serializable_data["last_active"] = farmer_data["last_active"].isoformat()
            data_to_save[farmer_id] = serializable_data
        
        with open("farmers_backup.json", "w") as f:
            json.dump(data_to_save, f, indent=2)
        print("✅ Farmers data backed up to farmers_backup.json")
    except Exception as e:
        print(f"❌ Error backing up farmers data: {e}")

def load_farmers_data():
    """Load farmers data from JSON file"""
    try:
        if os.path.exists("farmers_backup.json"):
            with open("farmers_backup.json", "r") as f:
                data = json.load(f)
            
            for farmer_id, farmer_data in data.items():
                # Convert string dates back to datetime
                farmer_data["registration_date"] = datetime.fromisoformat(farmer_data["registration_date"])
                farmer_data["last_active"] = datetime.fromisoformat(farmer_data["last_active"])
                farmers_storage[farmer_id] = farmer_data
            
            print(f"✅ Loaded {len(farmers_storage)} farmers from backup")
    except Exception as e:
        print(f"❌ Error loading farmers data: {e}")

# Initialize on startup
load_farmers_data()

# Export router and utility functions
__all__ = ["auth_router", "verify_jwt_token", "save_farmers_data", "load_farmers_data"]