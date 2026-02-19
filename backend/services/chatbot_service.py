"""Chatbot service for agricultural assistance — powered by Groq"""

import logging
import os
from typing import Dict, Any
from datetime import datetime
from groq import Groq

logger = logging.getLogger(__name__)


class ChatbotService:
    """Service for handling chatbot interactions using Groq LLM"""

    def __init__(self):
        self.context_data = {
            "topics": ["crop_management", "weather", "market_prices", "diseases", "schemes"],
            "languages": ["english", "hindi", "malayalam"],
            "last_updated": datetime.now().isoformat()
        }
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set in environment variables.")
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"

    async def get_response(self, message: str, language: str = "english") -> str:
        """Generate chatbot response using Groq LLM"""
        if not message or not message.strip():
            return self._get_general_response(language)

        try:
            system_prompt = (
                "You are Krishi Saathi, an intelligent agricultural assistant for Indian farmers. "
                "Provide accurate, helpful, and practical advice on farming, crops, weather, "
                "government schemes, and market prices.\n\n"
                f"Context:\n"
                f"- User Language: {language}\n"
                "- Role: Agricultural Expert & Assistant\n"
                "- Tone: Friendly, respectful, encouraging, and authoritative on farming matters.\n\n"
                "Instructions:\n"
                "1. Answer the farmer's question simply and clearly.\n"
                "2. If the user asks about live data (today's weather, exact market prices) that you "
                "   don't have, politely explain and guide them to the relevant app section "
                "   (Weather or Market Prices tab).\n"
                "3. Do not invent false data.\n"
                "4. Keep answers concise (under 150 words) unless detailed explanation is requested.\n"
                f"5. Respond in {language} if possible, otherwise use English.\n"
                "6. Use simple language that farmers can understand easily."
            )

            chat_completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=512,
                temperature=0.7,
            )

            return chat_completion.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"Groq API Error: {e}")
            # Fallback to rule-based responses if Groq fails
            return self._rule_based_response(message, language)

    def _rule_based_response(self, message: str, language: str) -> str:
        """Fallback rule-based response if Groq API fails"""
        message_lower = message.lower()
        if any(k in message_lower for k in ["weather", "rain", "temperature"]):
            return self._get_weather_response(language)
        elif any(k in message_lower for k in ["price", "market", "sell", "buy"]):
            return self._get_market_response(language)
        elif any(k in message_lower for k in ["disease", "pest", "infection", "sick"]):
            return self._get_disease_response(language)
        elif any(k in message_lower for k in ["scheme", "subsidy", "government", "loan"]):
            return self._get_scheme_response(language)
        else:
            return self._get_general_response(language)

    def _get_weather_response(self, language: str) -> str:
        responses = {
            "english": "I can help with weather information! Check the Weather Forecast section for current conditions and 7-day predictions. For crop-specific advice based on weather, just ask me!",
            "hindi": "मैं मौसम की जानकारी में आपकी मदद कर सकता हूं! वर्तमान स्थितियों और 7-दिन की भविष्यवाणियों के लिए मौसम पूर्वानुमान अनुभाग देखें।",
            "malayalam": "കാലാവസ്ഥാ വിവരങ്ങളിൽ എനിക്ക് സഹായിക്കാം! ഏഴ് ദിവസത്തെ പ്രവചനങ്ങൾക്ക് കാലാവസ്ഥാ പ്രവചന വിഭാഗം പരിശോധിക്കുക."
        }
        return responses.get(language, responses["english"])

    def _get_market_response(self, language: str) -> str:
        responses = {
            "english": "Check the Market Prices section for live rates from Kerala markets. I can also suggest the best time to sell based on general price trends!",
            "hindi": "केरल बाजारों से लाइव दरें देखने के लिए बाजार मूल्य अनुभाग पर जाएं। मैं सामान्य मूल्य रुझानों के आधार पर बेचने का सबसे अच्छा समय भी सुझा सकता हूं!",
            "malayalam": "കേരള മാർക്കറ്റുകളിൽ നിന്നുള്ള തത്സമയ നിരക്കുകൾ കാണാൻ മാർക്കറ്റ് വിലകൾ വിഭാഗം സന്ദർശിക്കുക."
        }
        return responses.get(language, responses["english"])

    def _get_disease_response(self, language: str) -> str:
        responses = {
            "english": "Use the Disease Detection feature to upload plant photos for AI analysis, or describe the symptoms you're observing and I'll try to help identify the issue!",
            "hindi": "पौधों की तस्वीरें अपलोड करने के लिए रोग का पता लगाने की सुविधा का उपयोग करें या लक्षणों का वर्णन करें।",
            "malayalam": "സസ്യ ഫോട്ടോകൾ AI വിശകലനത്തിനായി അപ്‌ലോഡ് ചെയ്യാൻ രോഗനിർണയ സവിശേഷത ഉപയോഗിക്കുക."
        }
        return responses.get(language, responses["english"])

    def _get_scheme_response(self, language: str) -> str:
        responses = {
            "english": "Check the Schemes section for available government programs, eligibility criteria, and application processes. I can explain specific schemes if you ask!",
            "hindi": "उपलब्ध कार्यक्रमों और योजनाओं के लिए योजना अनुभाग देखें।",
            "malayalam": "ലഭ്യമായ സർക്കാർ പദ്ധതികൾക്കായി സ്കീമുകൾ വിഭാഗം പരിശോധിക്കുക."
        }
        return responses.get(language, responses["english"])

    def _get_general_response(self, language: str) -> str:
        responses = {
            "english": "Hello! I'm Krishi Saathi, your agricultural assistant. I can help with weather forecasts, market prices, disease detection, government schemes, and farming advice. What would you like to know?",
            "hindi": "नमस्ते! मैं कृषि साथी हूं। मैं मौसम, बाजार मूल्य, रोग, सरकारी योजनाओं और कृषि सलाह में मदद कर सकता हूं। आप क्या जानना चाहते हैं?",
            "malayalam": "ഹലോ! ഞാൻ കൃഷി സാഥി ആണ്. കാലാവസ്ഥ, മാർക്കറ്റ് വില, രോഗം, പദ്ധതികൾ, കൃഷി ഉപദേശം എന്നിവയിൽ സഹായിക്കാം."
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
            return {"success": False, "error": str(e)}