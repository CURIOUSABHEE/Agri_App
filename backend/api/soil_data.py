"""
Soil Data API
Provides endpoints for soil data from data.gov.in API with CSV fallback
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.soil_data_service import soil_data_service
from services.csv_soil_data_service import csv_soil_data_service

router = APIRouter(prefix="/api/soil-data", tags=["Soil Data"])

@router.get("/")
async def get_soil_data(
    state: Optional[str] = Query(None, description="State name to filter by"),
    district: Optional[str] = Query(None, description="District name to filter by"),
    limit: int = Query(50, description="Number of records to fetch (max 100)"),
    offset: int = Query(0, description="Offset for pagination")
):
    """
    Get soil data from data.gov.in API
    
    Example: /api/soil-data?state=Kerala&district=Kollam&limit=10
    """
    try:
        result = await soil_data_service.get_soil_data(
            state=state,
            district=district,
            limit=limit,
            offset=offset
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching soil data: {str(e)}")

@router.get("/analysis")
async def get_soil_analysis(
    state: str = Query(..., description="State name (required)"),
    district: Optional[str] = Query(None, description="District name (optional)")
):
    """
    Get processed soil analysis for a specific location
    
    This endpoint fetches soil data and provides agricultural insights
    including pH levels, nutrient status, and crop recommendations.
    
    Example: /api/soil-data/analysis?state=Kerala&district=Kollam
    """
    try:
        result = await soil_data_service.get_soil_data_for_location(
            state=state,
            district=district
        )
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing soil data: {str(e)}")

@router.get("/csv")
async def get_csv_soil_data(
    district: Optional[str] = Query(None, description="District name to filter by"),
    limit: int = Query(50, description="Number of records to fetch"),
    offset: int = Query(0, description="Offset for pagination")
):
    """
    Get soil data from local CSV file (Kerala 2020 data)
    
    This endpoint always uses the local CSV data regardless of API status.
    Useful for guaranteed data access and testing.
    
    Example: /api/soil-data/csv?district=Kollam&limit=10
    """
    try:
        result = await csv_soil_data_service.get_soil_data_from_csv(
            state="Kerala",
            district=district,
            limit=limit,
            offset=offset
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching CSV soil data: {str(e)}")

@router.get("/districts")
async def get_available_districts():
    """
    Get list of available districts in Kerala soil data
    """
    try:
        districts = await csv_soil_data_service.get_districts_available()
        
        return {
            "success": True,
            "districts": districts,
            "count": len(districts),
            "state": "Kerala"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching districts: {str(e)}")

@router.get("/summary/{district}")
async def get_district_soil_summary(district: str):
    """
    Get detailed soil summary for a specific Kerala district
    
    Provides statistical analysis of soil moisture data for the district.
    
    Example: /api/soil-data/summary/Kollam
    """
    try:
        summary = await csv_soil_data_service.get_district_summary(district)
        
        if "error" in summary:
            raise HTTPException(status_code=404, detail=summary["error"])
        
        return {
            "success": True,
            "data": summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting district summary: {str(e)}")

@router.get("/info")
async def get_dataset_info():
    """
    Get information about the available soil dataset
    """
    try:
        date_range = await csv_soil_data_service.get_date_range()
        districts = await csv_soil_data_service.get_districts_available()
        
        return {
            "success": True,
            "dataset_info": {
                "source": "Kerala Soil Moisture Dataset 2020",
                "state": "Kerala",
                "districts_available": len(districts),
                "districts": districts,
                "date_range": date_range,
                "data_fields": [
                    "Average Soilmoisture Level (at 15cm)",
                    "Average SoilMoisture Volume (at 15cm)", 
                    "Aggregate Soilmoisture Percentage (at 15cm)",
                    "Volume Soilmoisture percentage (at 15cm)"
                ]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting dataset info: {str(e)}")

@router.get("/test")
async def test_soil_data_sources():
    """
    Test both soil data sources: API and CSV fallback
    """
    try:
        # Test API
        api_result = await soil_data_service.get_soil_data(limit=1)
        api_working = api_result["success"] and api_result.get("api_info", {}).get("source") == "data.gov.in"
        
        # Test CSV fallback
        csv_result = await csv_soil_data_service.get_soil_data_from_csv(limit=1)
        csv_working = csv_result["success"]
        
        return {
            "api_status": {
                "working": api_working,
                "source": "data.gov.in",
                "error": None if api_working else api_result.get("error", "Unknown error")
            },
            "csv_fallback": {
                "working": csv_working,
                "source": "local_csv",
                "records_available": csv_result.get("total_records", 0) if csv_working else 0,
                "error": None if csv_working else csv_result.get("error", "Unknown error")
            },
            "recommendation": "API working" if api_working else "Using CSV fallback" if csv_working else "No data sources available"
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "status": "Error testing data sources"
        }