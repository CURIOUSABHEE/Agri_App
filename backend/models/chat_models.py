"""Chat-related Pydantic models"""

from pydantic import BaseModel
from typing import Optional

class ChatMessage(BaseModel):
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    response: str
    timestamp: str
    
class ChatContext(BaseModel):
    location: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None