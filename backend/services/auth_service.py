"""
Authentication System Implementation
Priority: HIGH - Phase 1, Day 4-5

Multi-method authentication for Indian farmers:
- Phone + OTP (Primary)
- Passkey/WebAuthn (Modern)
- Google OAuth (Convenience)
- Password fallback (Compatibility)
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, validator
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import jwt
import secrets
import hashlib
import pyotp
import qrcode
import io
import base64
from motor.motor_asyncio import AsyncIOMotorDatabase
import httpx
from webauthn import generate_registration_options, verify_registration_response, generate_authentication_options, verify_authentication_response
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    PublicKeyCredentialDescriptor
)
import os

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
OTP_EXPIRE_MINUTES = 5

# SMS Configuration (using multiple providers for reliability)
TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")

# WebAuthn Configuration
RP_ID = os.getenv("RP_ID", "localhost")  # Your domain
RP_NAME = "Krishi Saathi - Agricultural Platform"
ORIGIN = os.getenv("ORIGIN", "http://localhost:3000")

# Security Bearer
security = HTTPBearer()

# Pydantic Models
class PhoneLoginRequest(BaseModel):
    phone: str
    
    @validator('phone')
    def validate_phone(cls, v):
        # Indian phone number validation
        import re
        pattern = r"^\+91[6-9]\d{9}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid Indian phone number format. Use +91XXXXXXXXXX")
        return v

class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str
    device_info: Optional[Dict[str, str]] = None

class PasskeyRegistrationStart(BaseModel):
    farmer_id: str
    device_name: Optional[str] = "Device"

class PasskeyRegistrationComplete(BaseModel):
    farmer_id: str
    credential_response: Dict[str, Any]

class PasskeyLoginRequest(BaseModel):
    farmer_id: Optional[str] = None
    phone: Optional[str] = None

class GoogleAuthRequest(BaseModel):
    id_token: str
    device_info: Optional[Dict[str, str]] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    farmer_data: Dict[str, Any]

class AuthenticationService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        
    # Phone + OTP Authentication
    async def send_otp(self, phone: str) -> Dict[str, Any]:
        """Send OTP via SMS to farmer's phone"""
        try:
            # Generate 6-digit OTP
            otp = secrets.randbelow(900000) + 100000
            otp_str = str(otp)
            
            # Store OTP in database with expiry
            otp_data = {
                "phone": phone,
                "otp": hashlib.sha256(otp_str.encode()).hexdigest(),
                "created_at": datetime.now(),
                "expires_at": datetime.now() + timedelta(minutes=OTP_EXPIRE_MINUTES),
                "attempts": 0,
                "verified": False
            }
            
            # Upsert OTP record
            await self.db.otp_verifications.update_one(
                {"phone": phone},
                {"$set": otp_data},
                upsert=True
            )
            
            # Send SMS via multiple providers for reliability
            sms_sent = await self._send_sms_multi_provider(phone, otp_str)
            
            if sms_sent:
                return {
                    "success": True,
                    "message": "OTP sent successfully",
                    "expires_in_minutes": OTP_EXPIRE_MINUTES
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to send OTP. Please try again."
                )
                
        except Exception as e:
            print(f"Error sending OTP: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error sending OTP"
            )
    
    async def _send_sms_multi_provider(self, phone: str, otp: str) -> bool:
        """Send SMS using multiple providers for reliability"""
        
        # SMS message in multiple languages
        messages = {
            "en": f"Your Krishi Saathi OTP is: {otp}. Valid for {OTP_EXPIRE_MINUTES} minutes. Do not share with anyone.",
            "hi": f"आपका कृषि साथी OTP है: {otp}। {OTP_EXPIRE_MINUTES} मिनट के लिए वैध। किसी के साथ साझा न करें।",
            "ml": f"നിങ്ങളുടെ കൃഷി സാഥി OTP: {otp}। {OTP_EXPIRE_MINUTES} മിനിറ്റ് വരെ വാലിഡ്। ആരുമായും പങ്കിടരുത്।"
        }
        
        # Try Twilio first
        if TWILIO_SID and TWILIO_TOKEN:
            try:
                from twilio.rest import Client
                client = Client(TWILIO_SID, TWILIO_TOKEN)
                
                message = client.messages.create(
                    body=messages["en"],  # Default to English
                    from_="+1234567890",  # Your Twilio number
                    to=phone
                )
                return True
            except Exception as e:
                print(f"Twilio SMS failed: {e}")
        
        # Fallback to Firebase SMS (or any other provider)
        try:
            # Implement Firebase SMS or other provider
            return await self._send_firebase_sms(phone, messages["en"])
        except Exception as e:
            print(f"Firebase SMS failed: {e}")
            return False
    
    async def _send_firebase_sms(self, phone: str, message: str) -> bool:
        """Send SMS via Firebase or other provider"""
        # Implement your preferred SMS provider here
        # For now, return True for development
        print(f"SMS to {phone}: {message}")
        return True
    
    async def verify_otp(self, phone: str, otp: str, device_info: Optional[Dict] = None) -> TokenResponse:
        """Verify OTP and create/login farmer"""
        try:
            # Get OTP record
            otp_record = await self.db.otp_verifications.find_one({"phone": phone})
            
            if not otp_record:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OTP not found or expired"
                )
            
            # Check expiry
            if datetime.now() > otp_record["expires_at"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OTP has expired"
                )
            
            # Check attempts
            if otp_record["attempts"] >= 3:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many failed attempts. Please request new OTP"
                )
            
            # Verify OTP
            otp_hash = hashlib.sha256(otp.encode()).hexdigest()
            if otp_hash != otp_record["otp"]:
                # Increment attempts
                await self.db.otp_verifications.update_one(
                    {"phone": phone},
                    {"$inc": {"attempts": 1}}
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid OTP"
                )
            
            # OTP verified, mark as used
            await self.db.otp_verifications.update_one(
                {"phone": phone},
                {"$set": {"verified": True}}
            )
            
            # Find or create farmer
            farmer = await self.db.farmers.find_one({"personal_details.phone": phone})
            
            if not farmer:
                # Create new farmer account
                farmer = await self._create_new_farmer(phone)
            
            # Update login info
            await self._update_login_info(farmer["farmer_id"], device_info)
            
            # Generate tokens
            return await self._generate_tokens(farmer)
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error verifying OTP: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error verifying OTP"
            )
    
    # Passkey/WebAuthn Authentication
    async def start_passkey_registration(self, farmer_id: str, device_name: str = "Device") -> Dict[str, Any]:
        """Start passkey registration process"""
        try:
            farmer = await self.db.farmers.find_one({"farmer_id": farmer_id})
            if not farmer:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Farmer not found"
                )
            
            # Generate registration options
            registration_options = generate_registration_options(
                rp_id=RP_ID,
                rp_name=RP_NAME,
                user_id=farmer_id.encode(),
                user_name=farmer["personal_details"]["phone"],
                user_display_name=farmer["personal_details"]["name"],
                authenticator_selection=AuthenticatorSelectionCriteria(
                    user_verification=UserVerificationRequirement.REQUIRED
                )
            )
            
            # Store challenge
            await self.db.passkey_challenges.update_one(
                {"farmer_id": farmer_id},
                {
                    "$set": {
                        "challenge": registration_options.challenge,
                        "created_at": datetime.now(),
                        "expires_at": datetime.now() + timedelta(minutes=5)
                    }
                },
                upsert=True
            )
            
            return {
                "success": True,
                "options": registration_options
            }
            
        except Exception as e:
            print(f"Error starting passkey registration: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error starting passkey registration"
            )
    
    # Google OAuth Authentication  
    async def verify_google_token(self, id_token: str, device_info: Optional[Dict] = None) -> TokenResponse:
        """Verify Google ID token and authenticate farmer"""
        try:
            # Verify Google ID token
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid Google token"
                    )
                
                user_data = response.json()
            
            # Extract user info
            email = user_data.get("email")
            name = user_data.get("name")
            phone = user_data.get("phone_number")  # May not be available
            
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not found in Google token"
                )
            
            # Find farmer by email or create new
            farmer = await self.db.farmers.find_one({"personal_details.email": email})
            
            if not farmer and phone:
                # Try to find by phone
                farmer = await self.db.farmers.find_one({"personal_details.phone": phone})
            
            if not farmer:
                # Create new farmer with Google data
                farmer = await self._create_new_farmer_google(email, name, phone)
            
            # Update login info
            await self._update_login_info(farmer["farmer_id"], device_info)
            
            # Generate tokens
            return await self._generate_tokens(farmer)
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error verifying Google token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error verifying Google authentication"
            )
    
    # Helper Methods
    async def _create_new_farmer(self, phone: str) -> Dict[str, Any]:
        """Create new farmer account with phone"""
        from bson import ObjectId
        
        farmer_id = f"farmer_{ObjectId()}"
        
        farmer_data = {
            "farmer_id": farmer_id,
            "personal_details": {
                "name": "",  # To be updated later
                "phone": phone,
                "language_preference": "ml",  # Default to Malayalam
                "address": {}
            },
            "authentication": {
                "auth_methods": ["phone_otp"],
                "phone_verified": True,
                "email_verified": False,
                "last_login": datetime.now(),
                "login_count": 1
            },
            "farms": [],
            "inventory": [],
            "registration_date": datetime.now(),
            "last_active": datetime.now(),
            "account_status": "active",
            "subscription_plan": "free"
        }
        
        result = await self.db.farmers.insert_one(farmer_data)
        farmer_data["_id"] = result.inserted_id
        
        return farmer_data
    
    async def _create_new_farmer_google(self, email: str, name: str, phone: Optional[str]) -> Dict[str, Any]:
        """Create new farmer account with Google data"""
        from bson import ObjectId
        
        farmer_id = f"farmer_{ObjectId()}"
        
        farmer_data = {
            "farmer_id": farmer_id,
            "personal_details": {
                "name": name or "",
                "phone": phone or "",
                "email": email,
                "language_preference": "en",  # Default for Google users
                "address": {}
            },
            "authentication": {
                "auth_methods": ["google"],
                "phone_verified": bool(phone),
                "email_verified": True,
                "last_login": datetime.now(),
                "login_count": 1
            },
            "farms": [],
            "inventory": [],
            "registration_date": datetime.now(),
            "last_active": datetime.now(),
            "account_status": "active",
            "subscription_plan": "free"
        }
        
        result = await self.db.farmers.insert_one(farmer_data)
        farmer_data["_id"] = result.inserted_id
        
        return farmer_data
    
    async def _update_login_info(self, farmer_id: str, device_info: Optional[Dict] = None):
        """Update farmer login information"""
        update_data = {
            "authentication.last_login": datetime.now(),
            "last_active": datetime.now(),
            "$inc": {"authentication.login_count": 1}
        }
        
        if device_info:
            # Store device info for security
            await self.db.farmers.update_one(
                {"farmer_id": farmer_id},
                {"$addToSet": {"authentication.registered_devices": device_info}}
            )
        
        await self.db.farmers.update_one(
            {"farmer_id": farmer_id},
            {"$set": update_data}
        )
    
    async def _generate_tokens(self, farmer: Dict[str, Any]) -> TokenResponse:
        """Generate access and refresh tokens"""
        # Access token payload
        access_payload = {
            "farmer_id": farmer["farmer_id"],
            "phone": farmer["personal_details"]["phone"],
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
            "type": "access"
        }
        
        # Refresh token payload
        refresh_payload = {
            "farmer_id": farmer["farmer_id"],
            "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            "type": "refresh"
        }
        
        # Generate tokens
        access_token = jwt.encode(access_payload, SECRET_KEY, algorithm=JWT_ALGORITHM)
        refresh_token = jwt.encode(refresh_payload, SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            farmer_data={
                "farmer_id": farmer["farmer_id"],
                "name": farmer["personal_details"]["name"],
                "phone": farmer["personal_details"]["phone"],
                "language_preference": farmer["personal_details"]["language_preference"]
            }
        )

# JWT Token Verification
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return farmer data"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        farmer_id = payload.get("farmer_id")
        
        if farmer_id is None or payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
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