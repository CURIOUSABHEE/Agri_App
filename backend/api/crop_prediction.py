"""
Crop Prediction API
Provides endpoints for crop recommendation and prediction
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from pydantic import BaseModel
from services.crop_prediction_service import crop_prediction_service

router = APIRouter(prefix="/api/crop-prediction", tags=["Crop Prediction"])

class CropPredictionRequest(BaseModel):
    soil_type: str
    season: str
    state: str
    ph_level: Optional[float] = None
    water_availability: str = "medium"
    experience_level: str = "intermediate"
    farm_size: str = "small"

class EnhancedCropPredictionRequest(CropPredictionRequest):
    use_real_time_data: bool = True

@router.post("/predict")
async def predict_crops(request: EnhancedCropPredictionRequest):
    """
    Predict suitable crops based on farming conditions with real-time data integration
    """
    try:
        result = crop_prediction_service.predict_crops(
            soil_type=request.soil_type,
            season=request.season,
            state=request.state,
            ph_level=request.ph_level,
            water_availability=request.water_availability,
            experience_level=request.experience_level,
            farm_size=request.farm_size,
            use_real_time_data=request.use_real_time_data
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Prediction failed"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting crops: {str(e)}")

@router.get("/predict")
async def predict_crops_get(
    soil_type: str = Query(..., description="Type of soil (clay, loamy, sandy, etc.)"),
    season: str = Query(..., description="Growing season (kharif, rabi, summer, winter, monsoon)"),
    state: str = Query(..., description="State name"),
    ph_level: Optional[float] = Query(None, description="Soil pH level"),
    water_availability: str = Query("medium", description="Water availability (low, medium, high, very_high)"),
    experience_level: str = Query("intermediate", description="Farmer experience (beginner, intermediate, expert)"),
    farm_size: str = Query("small", description="Farm size (small, medium, large)"),
    use_real_time_data: bool = Query(True, description="Use real-time weather and market data")
):
    """
    Predict suitable crops using GET request with query parameters and real-time data integration
    """
    try:
        result = crop_prediction_service.predict_crops(
            soil_type=soil_type,
            season=season,
            state=state,
            ph_level=ph_level,
            water_availability=water_availability,
            experience_level=experience_level,
            farm_size=farm_size,
            use_real_time_data=use_real_time_data
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Prediction failed"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting crops: {str(e)}")

@router.get("/crop/{crop_key}")
async def get_crop_details(crop_key: str):
    """
    Get detailed information about a specific crop
    """
    try:
        result = crop_prediction_service.get_crop_details(crop_key)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result.get("error", "Crop not found"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching crop details: {str(e)}")

@router.get("/seasonal/{season}")
async def get_seasonal_recommendations(
    season: str,
    state: str = Query(..., description="State name")
):
    """
    Get crop recommendations for a specific season and state
    """
    try:
        result = crop_prediction_service.get_seasonal_recommendations(season, state)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to get recommendations"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting seasonal recommendations: {str(e)}")

@router.get("/options")
async def get_prediction_options(language: str = Query("en", description="Language code (en, hi, ml)")):
    """
    Get available options for crop prediction form with language support
    """
    try:
        # Multilingual options
        options_data = {
            "en": {
                "soil_types": [
                    {"value": "clay", "label": "Clay"},
                    {"value": "loamy", "label": "Loamy"},
                    {"value": "sandy", "label": "Sandy"},
                    {"value": "silty", "label": "Silty"},
                    {"value": "black", "label": "Black"},
                    {"value": "red", "label": "Red"},
                    {"value": "alluvial", "label": "Alluvial"},
                    {"value": "well_drained", "label": "Well Drained"}
                ],
                "seasons": [
                    {"value": "kharif", "label": "Kharif (June-October)"},
                    {"value": "rabi", "label": "Rabi (November-April)"},
                    {"value": "summer", "label": "Summer (March-June)"},
                    {"value": "winter", "label": "Winter (November-February)"},
                    {"value": "monsoon", "label": "Monsoon (June-September)"},
                    {"value": "year_round", "label": "Year Round"}
                ],
                "states": [
                    {"value": "Kerala", "label": "Kerala"},
                    {"value": "Tamil Nadu", "label": "Tamil Nadu"},
                    {"value": "Karnataka", "label": "Karnataka"},
                    {"value": "Andhra Pradesh", "label": "Andhra Pradesh"},
                    {"value": "Telangana", "label": "Telangana"},
                    {"value": "Maharashtra", "label": "Maharashtra"},
                    {"value": "Gujarat", "label": "Gujarat"},
                    {"value": "Rajasthan", "label": "Rajasthan"},
                    {"value": "Punjab", "label": "Punjab"},
                    {"value": "Haryana", "label": "Haryana"},
                    {"value": "Uttar Pradesh", "label": "Uttar Pradesh"},
                    {"value": "Madhya Pradesh", "label": "Madhya Pradesh"},
                    {"value": "West Bengal", "label": "West Bengal"},
                    {"value": "Odisha", "label": "Odisha"},
                    {"value": "Bihar", "label": "Bihar"}
                ],
                "water_availability": [
                    {"value": "low", "label": "Low (Rain-fed only)"},
                    {"value": "medium", "label": "Medium (Limited irrigation)"},
                    {"value": "high", "label": "High (Good irrigation)"},
                    {"value": "very_high", "label": "Very High (Abundant water)"}
                ],
                "experience_levels": [
                    {"value": "beginner", "label": "Beginner (0-2 years)"},
                    {"value": "intermediate", "label": "Intermediate (2-10 years)"},
                    {"value": "expert", "label": "Expert (10+ years)"}
                ],
                "farm_sizes": [
                    {"value": "small", "label": "Small (< 2 acres)"},
                    {"value": "medium", "label": "Medium (2-10 acres)"},
                    {"value": "large", "label": "Large (> 10 acres)"}
                ]
            },
            "hi": {
                "soil_types": [
                    {"value": "clay", "label": "चिकनी मिट्टी"},
                    {"value": "loamy", "label": "दोमट मिट्टी"},
                    {"value": "sandy", "label": "रेतीली मिट्टी"},
                    {"value": "silty", "label": "गादयुक्त मिट्टी"},
                    {"value": "black", "label": "काली मिट्टी"},
                    {"value": "red", "label": "लाल मिट्टी"},
                    {"value": "alluvial", "label": "जलोढ़ मिट्टी"},
                    {"value": "well_drained", "label": "अच्छी जल निकासी"}
                ],
                "seasons": [
                    {"value": "kharif", "label": "खरीफ (जून-अक्टूबर)"},
                    {"value": "rabi", "label": "रबी (नवंबर-अप्रैल)"},
                    {"value": "summer", "label": "गर्मी (मार्च-जून)"},
                    {"value": "winter", "label": "सर्दी (नवंबर-फरवरी)"},
                    {"value": "monsoon", "label": "मानसून (जून-सितंबर)"},
                    {"value": "year_round", "label": "साल भर"}
                ],
                "states": [
                    {"value": "Kerala", "label": "केरल"},
                    {"value": "Tamil Nadu", "label": "तमिल नाडु"},
                    {"value": "Karnataka", "label": "कर्नाटक"},
                    {"value": "Andhra Pradesh", "label": "आंध्र प्रदेश"},
                    {"value": "Telangana", "label": "तेलंगाना"},
                    {"value": "Maharashtra", "label": "महाराष्ट्र"},
                    {"value": "Gujarat", "label": "गुजरात"},
                    {"value": "Rajasthan", "label": "राजस्थान"},
                    {"value": "Punjab", "label": "पंजाब"},
                    {"value": "Haryana", "label": "हरियाणा"},
                    {"value": "Uttar Pradesh", "label": "उत्तर प्रदेश"},
                    {"value": "Madhya Pradesh", "label": "मध्य प्रदेश"},
                    {"value": "West Bengal", "label": "पश्चिम बंगाल"},
                    {"value": "Odisha", "label": "ओडिशा"},
                    {"value": "Bihar", "label": "बिहार"}
                ],
                "water_availability": [
                    {"value": "low", "label": "कम (केवल वर्षा पर निर्भर)"},
                    {"value": "medium", "label": "मध्यम (सीमित सिंचाई)"},
                    {"value": "high", "label": "अच्छी (अच्छी सिंचाई)"},
                    {"value": "very_high", "label": "बहुत अच्छी (भरपूर पानी)"}
                ],
                "experience_levels": [
                    {"value": "beginner", "label": "नौसिखिया (0-2 साल)"},
                    {"value": "intermediate", "label": "मध्यम (2-10 साल)"},
                    {"value": "expert", "label": "विशेषज्ञ (10+ साल)"}
                ],
                "farm_sizes": [
                    {"value": "small", "label": "छोटा (< 2 एकड़)"},
                    {"value": "medium", "label": "मध्यम (2-10 एकड़)"},
                    {"value": "large", "label": "बड़ा (> 10 एकड़)"}
                ]
            },
            "ml": {
                "soil_types": [
                    {"value": "clay", "label": "കളിമണ്ണ്"},
                    {"value": "loamy", "label": "എക്കൽ മണ്ണ്"},
                    {"value": "sandy", "label": "മണൽമണ്ണ്"},
                    {"value": "silty", "label": "ചെളിയുള്ള മണ്ണ്"},
                    {"value": "black", "label": "കറുത്ത മണ്ണ്"},
                    {"value": "red", "label": "ചുവന്ന മണ്ണ്"},
                    {"value": "alluvial", "label": "കഴുകിയ മണ്ണ്"},
                    {"value": "well_drained", "label": "നല്ല ഡ്രെയിനേജ്"}
                ],
                "seasons": [
                    {"value": "kharif", "label": "ഖരീഫ് (ജൂൺ-ഒക്ടോബർ)"},
                    {"value": "rabi", "label": "റബി (നവംബർ-ഏപ്രിൽ)"},
                    {"value": "summer", "label": "വേനൽ (മാർച്ച്-ജൂൺ)"},
                    {"value": "winter", "label": "ശീതകാലം (നവംബർ-ഫെബ്രുവരി)"},
                    {"value": "monsoon", "label": "മൺസൂൺ (ജൂൺ-സെപ്റ്റംബർ)"},
                    {"value": "year_round", "label": "വർഷം മുഴുവൻ"}
                ],
                "states": [
                    {"value": "Kerala", "label": "കേരളം"},
                    {"value": "Tamil Nadu", "label": "തമിഴ്‌നാട്"},
                    {"value": "Karnataka", "label": "കർണാടക"},
                    {"value": "Andhra Pradesh", "label": "ആന്ധ്രപ്രദേശ്"},
                    {"value": "Telangana", "label": "തെലങ്കാന"},
                    {"value": "Maharashtra", "label": "മഹാരാഷ്ട്ര"},
                    {"value": "Gujarat", "label": "ഗുജറാത്ത്"},
                    {"value": "Rajasthan", "label": "രാജസ്ഥാൻ"},
                    {"value": "Punjab", "label": "പഞ്ചാബ്"},
                    {"value": "Haryana", "label": "ഹരിയാണ"},
                    {"value": "Uttar Pradesh", "label": "ഉത്തർപ്രദേശ്"},
                    {"value": "Madhya Pradesh", "label": "മധ്യപ്രദേശ്"},
                    {"value": "West Bengal", "label": "പശ്ചിമ ബംഗാൾ"},
                    {"value": "Odisha", "label": "ഒഡിഷ"},
                    {"value": "Bihar", "label": "ബീഹാർ"}
                ],
                "water_availability": [
                    {"value": "low", "label": "കുറവ് (മഴയിൽ മാത്രം)"},
                    {"value": "medium", "label": "ഇടത്തരം (പരിമിത ജലസേചനം)"},
                    {"value": "high", "label": "നല്ലത് (നല്ല ജലസേചനം)"},
                    {"value": "very_high", "label": "വളരെ നല്ലത് (ധാരാളം വെള്ളം)"}
                ],
                "experience_levels": [
                    {"value": "beginner", "label": "തുടക്കക്കാരൻ (0-2 വർഷം)"},
                    {"value": "intermediate", "label": "ഇടത്തരം (2-10 വർഷം)"},
                    {"value": "expert", "label": "വിദഗ്ദ്ധൻ (10+ വർഷം)"}
                ],
                "farm_sizes": [
                    {"value": "small", "label": "ചെറുത് (< 2 ഏക്കർ)"},
                    {"value": "medium", "label": "ഇടത്തരം (2-10 ഏക്കർ)"},
                    {"value": "large", "label": "വലുത് (> 10 ഏക്കർ)"}
                ]
            }
        }
        
        # Get options for the requested language, default to English
        selected_options = options_data.get(language, options_data["en"])
        
        return {
            "success": True,
            "language": language,
            "options": selected_options
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting options: {str(e)}")