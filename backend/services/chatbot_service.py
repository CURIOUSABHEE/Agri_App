"""Chatbot service for agricultural assistance"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class ChatbotService:
    """Service for handling chatbot interactions"""
    
    def __init__(self):
        self.context_data = {
            "topics": ["crop_management", "weather", "market_prices", "diseases", "schemes"],
            "languages": ["english", "hindi", "malayalam"],
            "last_updated": datetime.now().isoformat()
        }
    
    async def get_response(self, message: str, language: str = "english") -> str:
        """Generate chatbot response based on user message"""
        try:
            # Check for empty message
            if not message or not message.strip():
                return self._get_general_response(language)

            # Try to use Gemini API first
            import google.generativeai as genai
            import os
            
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                try:
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel('gemini-pro')
                    
                    # Create context-aware prompt
                    system_prompt = f"""
                    You are Krishi Saathi, an intelligent agricultural assistant helper for farmers in India. 
                    Your goal is to provide accurate, helpful, and practical advice on farming, crops, weather, government schemes, and market prices.
                    
                    Context:
                    - User Language: {language}
                    - Role: Agricultural Expert & Assistant
                    - Tone: Friendly, Respectful, encouraging, and authoritative on farming matters.
                    
                    Instructions:
                    1. Answer the farmer's question simply and clearly.
                    2. If the user asks about specific live data (like today's weather or exact market prices) that you don't have access to, 
                       politely explain that you can provide general advice and guide them to the specific section of the app (Weather or Market Prices tab) for real-time data.
                    3. Do not invent false data.
                    4. Keep answers concise (under 150 words) unless detailed explanation is requested.
                    5. Respond in the requested language ({language}) if possible, or English if you cannot.
                    """
                    
                    full_prompt = f"{system_prompt}\n\nFarmer's Question: {message}\n\nAnswer:"
                    
                    response = model.generate_content(full_prompt)
                    return response.text
                except Exception as api_error:
                    logger.error(f"Gemini API Error: {api_error}")
                    # Fallback to rule-based if API fails
            
            # Fallback rule-based responses
            message_lower = message.lower()
            
            if any(keyword in message_lower for keyword in ["weather", "rain", "temperature"]):
                return self._get_weather_response(language)
            elif any(keyword in message_lower for keyword in ["price", "market", "sell", "buy"]):
                return self._get_market_response(language)
            elif any(keyword in message_lower for keyword in ["disease", "pest", "infection", "sick"]):
                return self._get_disease_response(language)
            elif any(keyword in message_lower for keyword in ["scheme", "subsidy", "government", "loan"]):
                return self._get_scheme_response(language)
            else:
                return self._get_general_response(language)
                
        except Exception as e:
            logger.error(f"Error generating chatbot response: {e}")
            return "I'm sorry, I encountered an error. Please try again."
    
    def _get_weather_response(self, language: str) -> str:
        """Get weather-related response"""
        responses = {
            "english": "I can help you with weather information! Check the Weather Forecast section for current conditions and 7-day predictions. For specific weather queries, I can provide crop-specific advice based on current conditions.",
            "hindi": "मैं मौसम की जानकारी में आपकी मदद कर सकता हूं! वर्तमान स्थितियों और 7-दिन की भविष्यवाणियों के लिए मौसम पूर्वानुमान अनुभाग देखें।",
            "malayalam": "കാലാവസ്ഥാ വിവരങ്ങളിൽ എനിക്ക് നിങ്ങളെ സഹായിക്കാം! നിലവിലെ അവസ്ഥകൾക്കും 7 ദിവസത്തെ പ്രവചനങ്ങൾക്കും കാലാവസ്ഥാ പ്രവചന വിഭാഗം പരിശോധിക്കുക।"
        }
        return responses.get(language, responses["english"])
    
    def _get_market_response(self, language: str) -> str:
        """Get market-related response"""
        responses = {
            "english": "I can provide current market prices for various crops! Visit the Market Prices section to see live rates from Kerala markets. I can also suggest the best time to sell based on price trends.",
            "hindi": "मैं विभिन्न फसलों के लिए वर्तमान बाजार मूल्य प्रदान कर सकता हूं! केरल बाजारों से लाइव दरें देखने के लिए बाजार मूल्य अनुभाग पर जाएं।",
            "malayalam": "വിവിധ വിളകളുടെ നിലവിലെ മാർക്കറ്റ് വിലകൾ എനിക്ക് നൽകാൻ കഴിയും! കേരള മാർക്കറ്റുകളിൽ നിന്നുള്ള തത്സമയ നിരക്കുകൾ കാണാൻ മാർക്കറ്റ് വിലകൾ വിഭാഗം സന്ദർശിക്കുക।"
        }
        return responses.get(language, responses["english"])
    
    def _get_disease_response(self, language: str) -> str:
        """Get disease-related response"""
        responses = {
            "english": "I can help identify plant diseases and suggest treatments! Use the Disease Detection feature to upload plant photos for analysis, or describe the symptoms you're observing.",
            "hindi": "मैं पौधों की बीमारियों की पहचान करने और उपचार सुझाने में मदद कर सकता हूं! विश्लेषण के लिए पौधों की तस्वीरें अपलोड करने के लिए रोग का पता लगाने की सुविधा का उपयोग करें।",
            "malayalam": "സസ്യരോഗങ്ങൾ തിരിച്ചറിയാനും ചികിത്സകൾ നിർദ്ദേശിക്കാനും എനിക്ക് സഹായിക്കാനാകും! വിശകലനത്തിനായി സസ്യ ഫോട്ടോകൾ അപ്‌ലോഡ് ചെയ്യാൻ രോഗനിർണയ സവിശേഷത ഉപയോഗിക്കുക।"
        }
        return responses.get(language, responses["english"])
    
    def _get_scheme_response(self, language: str) -> str:
        """Get scheme-related response"""
        responses = {
            "english": "I can guide you through various government agricultural schemes and subsidies! Check the Schemes section for available programs, eligibility criteria, and application processes.",
            "hindi": "मैं विभिन्न सरकारी कृषि योजनाओं और सब्सिडी के माध्यम से आपका मार्गदर्शन कर सकता हूं! उपलब्ध कार्यक्रमों, पात्रता मानदंड और आवेदन प्रक्रियाओं के लिए योजना अनुभाग देखें।",
            "malayalam": "വിവിധ സർക്കാർ കാർഷിക പദ്ധതികളിലൂടെയും സബ്‌സിഡികളിലൂടെയും എനിക്ക് നിങ്ങളെ വഴികാട്ടാൻ കഴിയും! ലഭ്യമായ പ്രോഗ്രാമുകൾ, യോഗ്യതാ മാനദണ്ഡങ്ങൾ, അപേക്ഷാ പ്രക്രിയകൾ എന്നിവയ്ക്കായി സ്കീമുകൾ വിഭാഗം പരിശോധിക്കുക।"
        }
        return responses.get(language, responses["english"])
    
    def _get_general_response(self, language: str) -> str:
        """Get general response"""
        responses = {
            "english": "Hello! I'm your agricultural assistant. I can help you with weather forecasts, market prices, disease detection, government schemes, and general farming advice. What would you like to know?",
            "hindi": "नमस्ते! मैं आपका कृषि सहायक हूं। मैं मौसम पूर्वानुमान, बाजार मूल्य, रोग का पता लगाने, सरकारी योजनाओं और सामान्य कृषि सलाह के साथ आपकी मदद कर सकता हूं।",
            "malayalam": "ഹലോ! ഞാൻ നിങ്ങളുടെ കാർഷിക സഹായിയാണ്. കാലാവസ്ഥാ പ്രവചനങ്ങൾ, മാർക്കറ്റ് വിലകൾ, രോഗനിർണയം, സർക്കാർ പദ്ധതികൾ, പൊതു കൃഷി ഉപദേശം എന്നിവയിൽ എനിക്ക് നിങ്ങളെ സഹായിക്കാനാകും।"
        }
        return responses.get(language, responses["english"])
    
    async def get_context(self) -> Dict[str, Any]:
        """Get chatbot context information"""
        try:
            return {
                "success": True,
                "context": self.context_data,
                "available_topics": self.context_data["topics"],
                "supported_languages": self.context_data["languages"]
            }
        except Exception as e:
            logger.error(f"Error getting chatbot context: {e}")
            return {
                "success": False,
                "error": str(e)
            }