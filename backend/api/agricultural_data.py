"""
Agricultural Data API - Centralized data source for all agricultural reference data
Replaces hardcoded dropdowns and ensures consistency across the application
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Dict, List, Any
from database.agricultural_data import (
    get_agricultural_options,
    get_states_districts, 
    get_soil_types,
    get_irrigation_types,
    get_seasons,
    get_farming_experience_levels,
    get_farm_size_categories,
    get_farm_size_units,
    agricultural_data_manager
)

router = APIRouter(prefix="/api/agricultural-data", tags=["Agricultural Data"])

@router.get("/all")
async def get_all_agricultural_data(
    language: str = Query("en", description="Language code (en, hi, ml)")
) -> Dict[str, Any]:
    """
    Get all agricultural reference data for frontend dropdowns
    This replaces all hardcoded arrays across the application
    """
    try:
        raw_data = await get_agricultural_options(language)
        
        # Convert to JSON-serializable format (remove MongoDB ObjectId and datetime)
        clean_data = {}
        for key, value in raw_data.items():
            if isinstance(value, dict):
                # Extract only the data part, skip MongoDB metadata
                clean_data[key] = value.get("data", value)
            else:
                clean_data[key] = value
                
        return clean_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching agricultural data: {str(e)}")

@router.get("/states-districts")
async def get_states_and_districts(
    language: str = Query("en", description="Language code (en, hi, ml)")
) -> Dict[str, Any]:
    """Get Indian states and districts data with multilingual support"""
    try:
        raw_data = await get_states_districts(language)
        
        # Extract only the data part, skip MongoDB metadata (_id, timestamps, etc.)
        if isinstance(raw_data, dict) and "data" in raw_data:
            return raw_data["data"]
        else:
            return raw_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching states data: {str(e)}")

@router.get("/soil-types")
async def get_soil_types_api(
    language: str = Query("en", description="Language code (en, hi, ml)")
) -> List[Dict[str, Any]]:
    """Get soil types with detailed information and translations"""
    try:
        return await get_soil_types(language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching soil types: {str(e)}")

@router.get("/irrigation-types")
async def get_irrigation_types_api(
    language: str = Query("en", description="Language code (en, hi, ml)")
) -> List[Dict[str, Any]]:
    """Get irrigation types with efficiency and cost information"""
    try:
        return await get_irrigation_types(language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching irrigation types: {str(e)}")

@router.get("/seasons")
async def get_seasons_api(
    language: str = Query("en", description="Language code (en, hi, ml)")
) -> List[Dict[str, Any]]:
    """Get agricultural seasons with crop recommendations"""
    try:
        return await get_seasons(language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching seasons: {str(e)}")

@router.get("/farming-experience")
async def get_farming_experience_api(
    language: str = Query("en", description="Language code (en, hi, ml)")
) -> List[Dict[str, Any]]:
    """Get farming experience levels with recommendations"""
    try:
        return await get_farming_experience_levels(language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching farming experience levels: {str(e)}")

@router.get("/farm-size-categories") 
async def get_farm_size_categories_api(
    language: str = Query("en", description="Language code (en, hi, ml)")
) -> List[Dict[str, Any]]:
    """Get farm size categories with area ranges"""
    try:
        return await get_farm_size_categories(language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching farm size categories: {str(e)}")

@router.get("/farm-size-units")
async def get_farm_size_units_api(
    language: str = Query("en", description="Language code (en, hi, ml)")
) -> List[Dict[str, Any]]:
    """Get land measurement units with conversion factors"""
    try:
        return await get_farm_size_units(language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching farm size units: {str(e)}")

@router.post("/initialize")
async def initialize_agricultural_data():
    """Initialize the agricultural database with reference data (Admin only)"""
    try:
        await agricultural_data_manager.initialize()
        return {"message": "Agricultural data initialized successfully", "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing data: {str(e)}")

@router.get("/options-for-crop-prediction")
async def get_crop_prediction_options(
    language: str = Query("en", description="Language code (en, hi, ml)")
) -> Dict[str, Any]:
    """
    Get formatted options specifically for crop prediction form
    This replaces the hardcoded options in crop_prediction.py
    """
    try:
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
                if language in all_data["soil_types"]["translations"]:
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
                if language in all_data["seasons"]["translations"]:
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
                if language in all_data["farming_experience"]["translations"]:
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
                if language in all_data["farm_sizes"]["translations"]:
                    trans = all_data["farm_sizes"]["translations"][language]
                    if size["value"] in trans:
                        translated_label = trans[size["value"]]
                        
                formatted_options["farm_sizes"].append({
                    "value": size["value"],
                    "label": translated_label
                })
        
        return formatted_options
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error formatting crop prediction options: {str(e)}")

@router.get("/options-for-settings")
async def get_settings_options(
    language: str = Query("en", description="Language code (en, hi, ml)")
) -> Dict[str, Any]:
    """
    Get formatted options specifically for Settings component
    This replaces the hardcoded constants in Settings.jsx
    """
    try:
        all_data = await get_agricultural_options(language)
        
        # Format for Settings component compatibility
        formatted_options = {
            "farmingExperienceOptions": [],
            "seasonOptions": [],
            "soilTypeOptions": [], 
            "irrigationTypeOptions": [],
            "farmSizeOptions": [],
            "farmSizeUnitOptions": [],
            "statesData": {}
        }
        
        # Format all options similarly to the existing constants
        if "farming_experience" in all_data and "data" in all_data["farming_experience"]:
            for exp in all_data["farming_experience"]["data"]:
                translated_label = exp["label"]
                if language in all_data["farming_experience"]["translations"]:
                    trans = all_data["farming_experience"]["translations"][language]
                    if exp["value"] in trans:
                        translated_label = trans[exp["value"]]
                        
                formatted_options["farmingExperienceOptions"].append({
                    "value": exp["value"],
                    "label": translated_label,
                    "description": exp.get("description", "")
                })
        
        # Add other options similarly...
        # (Similar formatting for seasons, soil types, irrigation types, etc.)
        
        # Format states data  
        if "states_districts" in all_data and "data" in all_data["states_districts"]:
            formatted_options["statesData"] = all_data["states_districts"]["data"]
        
        return formatted_options
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error formatting settings options: {str(e)}")