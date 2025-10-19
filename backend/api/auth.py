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
import base64
import struct
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.exceptions import InvalidSignature
from dotenv import load_dotenv
import bcrypt

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
    farms: Optional[list] = []

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
    total_area: Optional[str] = None
    state: Optional[str] = None
    village: Optional[str] = None

# Passkey Models
class PasskeyRegisterRequest(BaseModel):
    credentialId: str
    publicKey: str
    challenge: str
    userId: str

class PasskeyAuthRequest(BaseModel):
    credentialId: str
    clientDataJSON: str
    authenticatorData: str
    signature: str
    challenge: str

class PasskeyChallengeResponse(BaseModel):
    challenge: str

class SignupRequest(BaseModel):
    phone: str
    password: str
    name: str
    state: str
    district: str
    village: str
    farms: list
    language: str = "en"
    
    @validator('phone')
    def validate_phone(cls, v):
        import re
        # 10-digit Indian phone number
        if not re.match(r"^\d{10}$", v):
            raise ValueError("Phone number must be 10 digits")
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

class LoginRequest(BaseModel):
    phone: str  # Only phone number
    password: str

# Authentication Functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

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
        print(f"🔍 Debug - Received token: {credentials.credentials[:20]}...")
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        farmer_id = payload.get("farmer_id")
        print(f"🔍 Debug - Decoded farmer_id: {farmer_id}")
        
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
        print("❌ Debug - Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.JWTError as e:
        print(f"❌ Debug - JWT Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# Passkey Utility Functions
def generate_challenge() -> str:
    """Generate a random challenge for passkey authentication"""
    challenge_bytes = secrets.token_bytes(32)
    return base64.urlsafe_b64encode(challenge_bytes).decode('utf-8').rstrip('=')

async def store_passkey(credential_id: str, public_key: str, user_id: str) -> bool:
    """Store passkey credentials (simplified for development)"""
    try:
        passkey_data = {
            "credential_id": credential_id,
            "public_key": public_key,
            "user_id": user_id,
            "created_at": datetime.now().isoformat()
        }
        
        # In development, store in a simple JSON file
        passkeys_file = "passkeys.json"
        
        if os.path.exists(passkeys_file):
            with open(passkeys_file, 'r') as f:
                passkeys = json.load(f)
        else:
            passkeys = {}
        
        passkeys[credential_id] = passkey_data
        
        with open(passkeys_file, 'w') as f:
            json.dump(passkeys, f, indent=2)
        
        return True
    except Exception as e:
        print(f"Error storing passkey: {e}")
        return False

async def get_passkey(credential_id: str) -> Optional[Dict]:
    """Retrieve stored passkey"""
    try:
        passkeys_file = "passkeys.json"
        
        if not os.path.exists(passkeys_file):
            return None
            
        with open(passkeys_file, 'r') as f:
            passkeys = json.load(f)
            
        return passkeys.get(credential_id)
    except Exception as e:
        print(f"Error retrieving passkey: {e}")
        return None

async def store_challenge(challenge: str) -> bool:
    """Store challenge temporarily"""
    try:
        challenges_file = "challenges.json"
        
        if os.path.exists(challenges_file):
            with open(challenges_file, 'r') as f:
                challenges = json.load(f)
        else:
            challenges = {}
        
        # Store challenge with timestamp for expiration
        challenges[challenge] = {
            "timestamp": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(minutes=5)).isoformat()
        }
        
        # Clean up expired challenges
        current_time = datetime.now()
        challenges = {
            k: v for k, v in challenges.items() 
            if datetime.fromisoformat(v["expires_at"]) > current_time
        }
        
        with open(challenges_file, 'w') as f:
            json.dump(challenges, f, indent=2)
        
        return True
    except Exception as e:
        print(f"Error storing challenge: {e}")
        return False

async def verify_challenge(challenge: str) -> bool:
    """Verify challenge exists and is not expired"""
    try:
        challenges_file = "challenges.json"
        
        if not os.path.exists(challenges_file):
            return False
            
        with open(challenges_file, 'r') as f:
            challenges = json.load(f)
        
        if challenge not in challenges:
            return False
        
        # Check if challenge is expired
        expires_at = datetime.fromisoformat(challenges[challenge]["expires_at"])
        if datetime.now() > expires_at:
            return False
        
        return True
    except Exception as e:
        print(f"Error verifying challenge: {e}")
        return False

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
                "farms": request.farms or [],
                "inventory": [],
                "chat_history": [],
                "farms_count": len(request.farms or []),
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



@auth_router.get("/profile", response_model=FarmerProfile)
async def get_profile(current_farmer: dict = Depends(verify_jwt_token)):
    """Get current farmer profile"""
    
    farmer_data = await get_farmer_from_db(farmer_id=current_farmer["farmer_id"])
    if not farmer_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found"
        )
    
    # Calculate total farm area
    total_area = 0
    total_area_unit = "acres"  # Default unit
    
    if "farms" in farmer_data and farmer_data["farms"]:
        for farm in farmer_data["farms"]:
            if "size" in farm and farm["size"]:
                try:
                    farm_size = float(farm["size"])
                    total_area += farm_size
                    # Use the unit from the last farm (assuming consistent units)
                    if "unit" in farm:
                        total_area_unit = farm["unit"]
                except (ValueError, TypeError):
                    # Skip invalid farm sizes
                    continue
    
    # Format total area with unit
    formatted_total_area = f"{total_area} {total_area_unit}" if total_area > 0 else None
    
    return FarmerProfile(
        farmer_id=farmer_data["farmer_id"],
        name=farmer_data["name"],
        phone=farmer_data["phone"],
        district=farmer_data.get("district"),
        state=farmer_data.get("state"),
        village=farmer_data.get("village"),
        language=farmer_data["language"],
        registration_date=farmer_data["registration_date"],
        last_active=farmer_data["last_active"],
        farms_count=len(farmer_data.get("farms", [])),
        inventory_items=len(farmer_data.get("inventory", [])),
        total_area=formatted_total_area
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

# Password-based Authentication Endpoints

@auth_router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest):
    """Create new account with password"""
    try:
        # Check if phone number already exists (primary uniqueness check)
        existing_farmer = await get_farmer_from_db(phone=request.phone)
        if existing_farmer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Phone number {request.phone} is already registered. Please use a different phone number or login to your existing account."
            )
        
        # Hash password
        hashed_password = hash_password(request.password)
        
        # Create farmer ID
        farmer_id = create_farmer_id()
        
        # Create farmer data (no email field)
        farmer_data = {
            "farmer_id": farmer_id,
            "name": request.name,
            "phone": request.phone,
            "password_hash": hashed_password,
            "state": request.state,
            "district": request.district,
            "village": request.village,
            "farms": request.farms,
            "language": request.language,
            "registration_date": datetime.now(),
            "last_active": datetime.now(),
            "auth_method": "password",
            "inventory": [],
            "chat_history": [],
            "farms_count": len(request.farms),
            "inventory_items": 0
        }
        
        # Save to database
        success = await save_farmer_to_db(farmer_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create account"
            )
        
        # Generate tokens
        return generate_tokens(farmer_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Signup error: {e}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signup failed: {str(e)}"
        )

# Phone availability check model
class PhoneCheckRequest(BaseModel):
    phone: str

class PhoneCheckResponse(BaseModel):
    available: bool
    message: str

@auth_router.post("/check-phone", response_model=PhoneCheckResponse)
async def check_phone_availability(request: PhoneCheckRequest):
    """Check if phone number is available for registration"""
    try:
        # Check if phone number already exists
        farmer_data = await get_farmer_from_db(phone=request.phone)
        
        if farmer_data:
            return PhoneCheckResponse(
                available=False,
                message=f"Phone number {request.phone} is already registered"
            )
        else:
            return PhoneCheckResponse(
                available=True,
                message=f"Phone number {request.phone} is available"
            )
            
    except Exception as e:
        print(f"❌ Error checking phone availability: {e}")
        # On error, assume available to not block registration
        return PhoneCheckResponse(
            available=True,
            message="Phone availability check unavailable"
        )

@auth_router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login with phone/email and password"""
    try:
        # Find farmer by phone number only
        farmer_data = await get_farmer_from_db(phone=request.phone)
        
        # Check if farmer exists
        if not farmer_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Phone number not found. Please check your phone number or create a new account."
            )
        
        # Check if farmer has password (not OTP-only account)
        if "password_hash" not in farmer_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account was created with OTP. Please use OTP login."
            )
        
        # Verify password
        if not verify_password(request.password, farmer_data["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password. Please check your password and try again."
            )
        
        # Update last active
        farmer_data["last_active"] = datetime.now()
        await save_farmer_to_db(farmer_data)
        
        # Generate tokens
        return generate_tokens(farmer_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Login error: {e}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


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

# Passkey storage (in-memory for now, use database in production)
passkey_storage = {}

# Passkey utility functions
async def store_passkey(credential_id: str, public_key: str, user_id: str, farmer_id: str):
    """Store passkey credentials"""
    try:
        passkey_storage[credential_id] = {
            "credential_id": credential_id,
            "public_key": public_key,
            "user_id": user_id,
            "farmer_id": farmer_id,
            "created_at": datetime.now()
        }
        print(f"✅ Passkey stored for farmer: {farmer_id}")
        return True
    except Exception as e:
        print(f"❌ Error storing passkey: {e}")
        return False

async def get_passkey(credential_id: str):
    """Retrieve passkey credentials"""
    return passkey_storage.get(credential_id)

async def get_passkeys_by_farmer(farmer_id: str):
    """Get all passkeys for a farmer"""
    farmer_passkeys = []
    for credential_id, passkey_data in passkey_storage.items():
        if passkey_data.get("farmer_id") == farmer_id:
            farmer_passkeys.append(passkey_data)
    return farmer_passkeys

async def find_farmer_by_identifier(identifier: str):
    """Find farmer by phone or email"""
    # Check if identifier is phone (10 digits)
    if identifier.isdigit() and len(identifier) == 10:
        return await get_farmer_from_db(phone=identifier)
    else:
        # Search by email
        all_farmers = await get_all_farmers_from_db()
        for farmer in all_farmers:
            if farmer.get("email") == identifier:
                return farmer
    return None

async def verify_passkey_signature(credential_id: str, signature: str, challenge: str):
    """Verify passkey signature (simplified for demo)"""
    # In production, use proper cryptographic verification
    passkey = await get_passkey(credential_id)
    if passkey:
        # Simplified verification - in production, use proper WebAuthn verification
        return True
    return False

# Passkey Authentication Endpoints

@auth_router.post("/passkey/register")
async def register_passkey(request: PasskeyRegisterRequest, current_farmer: dict = Depends(verify_jwt_token)):
    """Register a new passkey for authenticated user"""
    try:
        # Store the passkey credentials linked to the authenticated user
        success = await store_passkey(
            credential_id=request.credentialId,
            public_key=request.publicKey,
            user_id=request.userId,
            farmer_id=current_farmer["farmer_id"]  # Link to authenticated user
        )
        
        if success:
            return {"message": "Passkey registered successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to register passkey"
            )
    except Exception as e:
        print(f"❌ Passkey registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Passkey registration failed: {str(e)}"
        )

@auth_router.post("/passkey/challenge", response_model=PasskeyChallengeResponse)
async def get_passkey_challenge():
    """Generate authentication challenge for passkey login"""
    try:
        challenge = generate_challenge()
        
        # Store challenge temporarily
        success = await store_challenge(challenge)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate challenge"
            )
        
        return PasskeyChallengeResponse(challenge=challenge)
    except Exception as e:
        print(f"❌ Challenge generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Challenge generation failed: {str(e)}"
        )

@auth_router.post("/passkey/verify", response_model=TokenResponse)
async def verify_passkey(request: PasskeyAuthRequest):
    """Verify passkey authentication and return JWT token"""
    try:
        # Verify challenge first
        challenge_valid = await verify_challenge(request.challenge)
        if not challenge_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired challenge"
            )
        
        # Get stored passkey
        passkey = await get_passkey(request.credentialId)
        if not passkey:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Passkey not found"
            )
        
        # In a production environment, you would verify the signature here
        # For now, we'll create a demo farmer account for passkey users
        
        # Create or get farmer account for passkey user
        farmer_id = f"passkey_user_{hashlib.sha256(request.credentialId.encode()).hexdigest()[:8]}"
        
        existing_farmer = await get_farmer_from_db(farmer_id=farmer_id)
        
        if existing_farmer:
            # Update last active
            existing_farmer["last_active"] = datetime.now()
            await save_farmer_to_db(existing_farmer)
            farmer_data = existing_farmer
        else:
            # Create new farmer account
            farmer_data = {
                "farmer_id": farmer_id,
                "name": "Passkey User",
                "phone": f"passkey_{farmer_id}",
                "email": None,
                "district": None,
                "language": "en",
                "registration_date": datetime.now(),
                "last_active": datetime.now(),
                "auth_method": "passkey",
                "farms": [],
                "inventory": [],
                "chat_history": [],
                "farms_count": 0,
                "inventory_items": 0,
                "passkey_credential_id": request.credentialId
            }
            await save_farmer_to_db(farmer_data)
        
        # Generate and return JWT token
        return generate_tokens(farmer_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Passkey verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Passkey authentication failed: {str(e)}"
        )

@auth_router.get("/passkey/list")
async def list_passkeys(current_farmer: dict = Depends(verify_jwt_token)):
    """List all passkeys registered for the authenticated user"""
    try:
        farmer_id = current_farmer["farmer_id"]
        
        # Get all passkeys for this farmer
        user_passkeys = []
        for credential_id, passkey_data in passkey_storage.items():
            if passkey_data.get("farmer_id") == farmer_id:
                user_passkeys.append({
                    "credential_id": credential_id,
                    "created_at": passkey_data.get("created_at").isoformat() if isinstance(passkey_data.get("created_at"), datetime) else passkey_data.get("created_at"),
                    "device_name": "Biometric Device"  # Could be enhanced to track device info
                })
        
        return {
            "passkeys": user_passkeys,
            "count": len(user_passkeys)
        }
    except Exception as e:
        print(f"❌ Error listing passkeys: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list passkeys: {str(e)}"
        )

@auth_router.delete("/passkey/delete/{credential_id}")
async def delete_passkey(credential_id: str, current_farmer: dict = Depends(verify_jwt_token)):
    """Delete a specific passkey"""
    try:
        farmer_id = current_farmer["farmer_id"]
        
        # Check if passkey exists and belongs to this farmer
        passkey = passkey_storage.get(credential_id)
        if not passkey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Passkey not found"
            )
        
        if passkey.get("farmer_id") != farmer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this passkey"
            )
        
        # Delete the passkey
        del passkey_storage[credential_id]
        print(f"✅ Passkey deleted for farmer: {farmer_id}")
        
        return {"message": "Passkey deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting passkey: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete passkey: {str(e)}"
        )

@auth_router.post("/passkey/find")
async def find_passkeys_by_identifier(request: dict):
    """Find passkeys by phone or email"""
    try:
        identifier = request.get("identifier")
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Identifier (phone or email) is required"
            )
        
        # Find farmer by identifier
        farmer = await find_farmer_by_identifier(identifier)
        if not farmer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this phone number or email"
            )
        
        # Get passkeys for this farmer
        farmer_passkeys = await get_passkeys_by_farmer(farmer["farmer_id"])
        
        if not farmer_passkeys:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No passkeys found for this account. Please login with password first and create a passkey."
            )
        
        # Return passkey info (without sensitive data)
        return {
            "farmer_id": farmer["farmer_id"],
            "name": farmer["name"],
            "passkeys_count": len(farmer_passkeys),
            "passkeys": [
                {
                    "credential_id": pk["credential_id"],
                    "created_at": pk["created_at"].isoformat() if isinstance(pk["created_at"], datetime) else pk["created_at"]
                }
                for pk in farmer_passkeys
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error finding passkeys: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find passkeys: {str(e)}"
        )

# Location endpoints for signup
@auth_router.get("/states")
async def get_states():
    """Get list of all Indian states and Union Territories"""
    try:
        from utils.location_utils import get_all_states, get_union_territories
        
        states = get_all_states()
        union_territories = list(get_union_territories().keys())
        
        return {
            "success": True,
            "states": states,
            "union_territories": union_territories,
            "total_count": len(states) + len(union_territories)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch states: {str(e)}"
        )

@auth_router.get("/districts/{state_name}")
async def get_districts(state_name: str):
    """Get all districts for a specific state or Union Territory"""
    try:
        from utils.location_utils import get_districts_by_state
        
        districts = get_districts_by_state(state_name)
        
        if not districts:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No districts found for state: {state_name}"
            )
        
        return {
            "success": True,
            "state": state_name,
            "districts": sorted(districts),
            "count": len(districts)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch districts: {str(e)}"
        )

@auth_router.get("/locations")
async def get_all_locations():
    """Get complete mapping of all states/UTs and their districts"""
    try:
        from utils.location_utils import get_all_locations
        
        locations = get_all_locations()
        
        return {
            "success": True,
            "locations": locations,
            "states_count": len([k for k in locations.keys()]),
            "total_districts": sum(len(districts) for districts in locations.values())
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch locations: {str(e)}"
        )

# Initialize on startup
load_farmers_data()

# Export router and utility functions
__all__ = ["auth_router", "verify_jwt_token", "save_farmers_data", "load_farmers_data"]