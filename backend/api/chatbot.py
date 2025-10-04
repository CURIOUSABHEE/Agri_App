"""Chatbot API routes"""

from fastapi import APIRouter, HTTPException
from models.chat_models import ChatMessage, ChatResponse
from services.chatbot_service import ChatbotService
from datetime import datetime

router = APIRouter(prefix="/api", tags=["chatbot"])

# Initialize chatbot service
chatbot_service = ChatbotService()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(message: ChatMessage):
    """Chat with the agricultural assistant"""
    try:
        response_text = await chatbot_service.get_response(
            message.message, 
            message.language
        )
        
        return ChatResponse(
            response=response_text,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chatbot/context")
async def get_chatbot_context():
    """Get contextual information for the chatbot"""
    result = await chatbot_service.get_context()
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result