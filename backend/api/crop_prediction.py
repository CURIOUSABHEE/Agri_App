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
    district: Optional[str] = None  # For soil data lookup

@router.post("/predict")
async def predict_crops(request: EnhancedCropPredictionRequest):
    """
    Predict suitable crops based on farming conditions with real-time data integration
    Now includes soil data from data.gov.in API for enhanced predictions
    """
    try:
        # Use async version for soil data integration
        result = await crop_prediction_service.predict_crops_async(
            soil_type=request.soil_type,
            season=request.season,
            state=request.state,
            ph_level=request.ph_level,
            water_availability=request.water_availability,
            experience_level=request.experience_level,
            farm_size=request.farm_size,
            use_real_time_data=request.use_real_time_data,
            district=request.district
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
    use_real_time_data: bool = Query(True, description="Use real-time weather, market, and soil data"),
    district: Optional[str] = Query(None, description="District name for soil data lookup")
):
    """
    Predict suitable crops using GET request with enhanced soil data from data.gov.in
    """
    try:
        result = await crop_prediction_service.predict_crops_async(
            soil_type=soil_type,
            season=season,
            state=state,
            ph_level=ph_level,
            water_availability=water_availability,
            experience_level=experience_level,
            farm_size=farm_size,
            use_real_time_data=use_real_time_data,
            district=district
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
    Now uses centralized agricultural data from database
    """
    try:
        # Import here to avoid circular imports
        from database.agricultural_data import get_agricultural_options
        
        # Get centralized agricultural data
        all_data = await get_agricultural_options(language)
        
        # Format for crop prediction API compatibility
        formatted_options = {
            "soil_types": [],
            "seasons": [],
            "states": [],
            "experience_levels": [],
            "farm_sizes": [],
            "water_availability": [
                {"value": "low", "label": "Low" if language == "en" else ("कम" if language == "hi" else "കുറവ്")},
                {"value": "medium", "label": "Medium" if language == "en" else ("मध्यम" if language == "hi" else "ഇടത്തരം")},
                {"value": "high", "label": "High" if language == "en" else ("अधिक" if language == "hi" else "കൂടുതൽ")},
                {"value": "very_high", "label": "Very High" if language == "en" else ("बहुत अधिक" if language == "hi" else "വളരെ കൂടുതൽ")}
            ]
        }
        
        # Format soil types
        if "soil_types" in all_data and "data" in all_data["soil_types"]:
            for soil in all_data["soil_types"]["data"]:
                translated_label = soil["label"]
                if "translations" in all_data["soil_types"] and language in all_data["soil_types"]["translations"]:
                    trans = all_data["soil_types"]["translations"][language]
                    if soil["value"] in trans:
                        translated_label = trans[soil["value"]]
                        
                formatted_options["soil_types"].append({
                    "value": soil["value"],
                    "label": translated_label
                })
        
        # Format seasons
        if "seasons" in all_data and "data" in all_data["seasons"]:
            for season in all_data["seasons"]["data"]:
                translated_label = season["label"] 
                if "translations" in all_data["seasons"] and language in all_data["seasons"]["translations"]:
                    trans = all_data["seasons"]["translations"][language]
                    if season["value"] in trans:
                        translated_label = trans[season["value"]]
                        
                formatted_options["seasons"].append({
                    "value": season["value"],
                    "label": translated_label
                })
        
        # Format states (extract from states_districts)
        if "states_districts" in all_data and "data" in all_data["states_districts"]:
            states = list(all_data["states_districts"]["data"].keys())
            for state in states:
                formatted_options["states"].append({
                    "value": state,
                    "label": state  # State names remain in English for consistency
                })
        
        # Format experience levels
        if "farming_experience" in all_data and "data" in all_data["farming_experience"]:
            for exp in all_data["farming_experience"]["data"]:
                translated_label = exp["label"]
                if "translations" in all_data["farming_experience"] and language in all_data["farming_experience"]["translations"]:
                    trans = all_data["farming_experience"]["translations"][language]
                    if exp["value"] in trans:
                        translated_label = trans[exp["value"]]
                        
                formatted_options["experience_levels"].append({
                    "value": exp["value"],
                    "label": translated_label
                })
        
        # Format farm sizes
        if "farm_sizes" in all_data and "data" in all_data["farm_sizes"]:
            for size in all_data["farm_sizes"]["data"]:
                translated_label = size["label"]
                if "translations" in all_data["farm_sizes"] and language in all_data["farm_sizes"]["translations"]:
                    trans = all_data["farm_sizes"]["translations"][language]
                    if size["value"] in trans:
                        translated_label = trans[size["value"]]
                        
                formatted_options["farm_sizes"].append({
                    "value": size["value"],
                    "label": translated_label
                })
        
        return {
            "success": True,
            "language": language,
            "options": formatted_options
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting options: {str(e)}")