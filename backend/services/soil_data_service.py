"""
Soil Data Service
Integrates with data.gov.in API for real-time soil information
Falls back to local CSV data when API is unavailable
"""

import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from services.csv_soil_data_service import csv_soil_data_service

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False
    aiohttp = None

logger = logging.getLogger(__name__)

class SoilDataService:
    """Service for fetching soil data from data.gov.in"""
    
    def __init__(self):
        self.api_key = os.getenv("SOIL_DATA_API")
        self.base_url = "https://api.data.gov.in/resource"
        self.resource_id = "5713d7e0-8961-4742-a71c-4c5001bac94a"
        
        if not self.api_key:
            logger.warning("SOIL_DATA_API key not found in environment variables")
    
    async def get_soil_data(
        self, 
        state: Optional[str] = None, 
        district: Optional[str] = None, 
        limit: int = 100, 
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Fetch soil data from data.gov.in API with CSV fallback
        """
        if not AIOHTTP_AVAILABLE or not self.api_key:
            logger.warning("aiohttp not available or API key missing, using CSV fallback")
            return await csv_soil_data_service.get_soil_data_from_csv(
                state=state, district=district, limit=limit, offset=offset
            )
        
        try:
            # Prepare API request
            url = f"{self.base_url}/resource/{self.resource_id}/api"
            params = {
                "api-key": self.api_key,
                "format": "json",
                "limit": limit,
                "offset": offset
            }
            
            # Add filters for state and district
            if state:
                params["filters[state_name]"] = state.upper()
            if district:
                params["filters[district_name]"] = district.upper()
            
            logger.info(f"Requesting soil data: {url} with params: {params}")
            
            # Make API request
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"Successfully fetched {len(data.get('records', []))} soil records")
                        
                        return {
                            "success": True,
                            "data": data.get("records", []),
                            "total_records": len(data.get("records", [])),
                            "api_info": {
                                "source": "data.gov.in",
                                "resource_id": self.resource_id,
                                "fetched_at": datetime.now().isoformat(),
                                "filters_applied": {
                                    "state": state,
                                    "district": district,
                                    "limit": limit,
                                    "offset": offset
                                }
                            }
                        }
                    else:
                        logger.error(f"API request failed with status {response.status}")
                        # Fall back to CSV data
                        logger.info("Falling back to local CSV data due to API failure")
                        return await csv_soil_data_service.get_soil_data_from_csv(
                            state=state, district=district, limit=limit, offset=offset
                        )
                        
        except Exception as e:
            # Handle all exceptions (including timeout, connection errors, etc.)
            logger.error(f"Error fetching soil data from API: {e}")
            # Fall back to CSV data
            logger.info("Falling back to local CSV data due to API error")
            return await csv_soil_data_service.get_soil_data_from_csv(
                state=state, district=district, limit=limit, offset=offset
            )
    
    async def get_soil_data_for_location(self, state: str, district: Optional[str] = None) -> Dict[str, Any]:
        """
        Get soil data specific to a location for crop prediction
        
        Args:
            state: State name
            district: District name (optional)
            
        Returns:
            Processed soil data for the location
        """
        try:
            # Fetch soil data for the location
            soil_response = await self.get_soil_data(state=state, district=district, limit=50)
            
            if not soil_response["success"]:
                return soil_response
            
            records = soil_response["data"]
            
            if not records:
                return {
                    "success": False,
                    "error": f"No soil data found for {state}" + (f", {district}" if district else ""),
                    "data": []
                }
            
            # Process and analyze soil data
            processed_data = self._process_soil_records(records)
            
            return {
                "success": True,
                "location": {
                    "state": state,
                    "district": district
                },
                "soil_analysis": processed_data,
                "total_samples": len(records),
                "data_source": "data.gov.in",
                "fetched_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing soil data for location: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": []
            }
    
    def _process_soil_records(self, records: List[Dict]) -> Dict[str, Any]:
        """
        Process raw soil records into useful agricultural insights
        
        Args:
            records: List of soil data records from API
            
        Returns:
            Processed soil analysis
        """
        try:
            analysis = {
                "soil_moisture_levels": [],
                "soil_moisture_volumes": [],
                "aggregate_percentages": [],
                "volume_percentages": [],
                "districts": [],
                "dates": [],
                "recommendations": []
            }
            
            # Extract and analyze soil parameters from the API fields
            for record in records:
                # District information
                if "districtname" in record:
                    analysis["districts"].append(record["districtname"])
                
                # Date information
                if "date" in record:
                    analysis["dates"].append(record["date"])
                
                # Soil moisture at 15cm depth
                if "average_soilmoisture_level__at_15cm_" in record:
                    try:
                        moisture_level = float(record["average_soilmoisture_level__at_15cm_"])
                        analysis["soil_moisture_levels"].append(moisture_level)
                    except (ValueError, TypeError):
                        pass
                
                # Soil moisture volume at 15cm
                if "_average_soilmoisture_volume__at_15cm_" in record:
                    try:
                        moisture_volume = float(record["_average_soilmoisture_volume__at_15cm_"])
                        analysis["soil_moisture_volumes"].append(moisture_volume)
                    except (ValueError, TypeError):
                        pass
                
                # Aggregate soil moisture percentage
                if "aggregate_soilmoisture_percentage__at_15cm_" in record:
                    try:
                        aggregate_pct = float(record["aggregate_soilmoisture_percentage__at_15cm_"])
                        analysis["aggregate_percentages"].append(aggregate_pct)
                    except (ValueError, TypeError):
                        pass
                
                # Volume soil moisture percentage
                if "volume_soilmoisture_percentage__at_15cm_" in record:
                    try:
                        volume_pct = float(record["volume_soilmoisture_percentage__at_15cm_"])
                        analysis["volume_percentages"].append(volume_pct)
                    except (ValueError, TypeError):
                        pass
            
            # Calculate summary and provide recommendations
            summary = self._calculate_soil_summary(analysis)
            
            return summary
            
        except Exception as e:
            logger.error(f"Error processing soil records: {e}")
            return {
                "error": str(e),
                "summary": "Unable to process soil data"
            }
    
    def _calculate_soil_summary(self, analysis: Dict) -> Dict[str, Any]:
        """Calculate soil summary and recommendations for moisture data"""
        try:
            summary = {
                "districts_covered": [],
                "average_moisture_level": None,
                "average_moisture_volume": None,
                "average_aggregate_percentage": None,
                "average_volume_percentage": None,
                "moisture_classification": None,
                "crop_suitability": [],
                "recommendations": [],
                "data_period": None
            }
            
            # Districts covered
            if analysis["districts"]:
                from collections import Counter
                district_counter = Counter(analysis["districts"])
                summary["districts_covered"] = list(district_counter.keys())
            
            # Date range
            if analysis["dates"]:
                dates = sorted(analysis["dates"])
                if len(dates) > 1:
                    summary["data_period"] = f"{dates[0]} to {dates[-1]}"
                else:
                    summary["data_period"] = dates[0]
            
            # Average soil moisture level
            if analysis["soil_moisture_levels"]:
                avg_moisture = sum(analysis["soil_moisture_levels"]) / len(analysis["soil_moisture_levels"])
                summary["average_moisture_level"] = round(avg_moisture, 2)
                
                # Moisture classification
                if avg_moisture < 20:
                    summary["moisture_classification"] = "Low"
                    summary["recommendations"].append("🚰 Low soil moisture - increase irrigation frequency")
                    summary["crop_suitability"].extend(["Drought-resistant crops", "Millets", "Sorghum"])
                elif avg_moisture > 60:
                    summary["moisture_classification"] = "High"
                    summary["recommendations"].append("💧 High soil moisture - ensure proper drainage")
                    summary["crop_suitability"].extend(["Rice", "Sugarcane", "Water-loving crops"])
                else:
                    summary["moisture_classification"] = "Optimal"
                    summary["recommendations"].append("✅ Soil moisture is optimal for most crops")
                    summary["crop_suitability"].extend(["Cotton", "Wheat", "Vegetables"])
            
            # Average moisture volume
            if analysis["soil_moisture_volumes"]:
                avg_volume = sum(analysis["soil_moisture_volumes"]) / len(analysis["soil_moisture_volumes"])
                summary["average_moisture_volume"] = round(avg_volume, 2)
            
            # Average aggregate percentage
            if analysis["aggregate_percentages"]:
                avg_agg = sum(analysis["aggregate_percentages"]) / len(analysis["aggregate_percentages"])
                summary["average_aggregate_percentage"] = round(avg_agg, 2)
            
            # Average volume percentage
            if analysis["volume_percentages"]:
                avg_vol = sum(analysis["volume_percentages"]) / len(analysis["volume_percentages"])
                summary["average_volume_percentage"] = round(avg_vol, 2)
            
            # General recommendations based on Kerala context
            summary["recommendations"].extend([
                "🌧️ Monitor monsoon patterns for irrigation planning",
                "🌾 Consider crop rotation to maintain soil health",
                "💧 Install drip irrigation for water conservation"
            ])
            
            # Kerala-specific crop suggestions
            if not summary["crop_suitability"]:
                summary["crop_suitability"] = ["Rice", "Coconut", "Spices", "Rubber", "Tea"]
            
            return summary
            
        except Exception as e:
            logger.error(f"Error calculating soil summary: {e}")
            return {"error": str(e)}
    
    def _classify_nutrient_level(self, nutrient: str, value: float) -> str:
        """Classify nutrient levels as Low, Medium, or High"""
        
        # Threshold values (these are general guidelines)
        thresholds = {
            "organic_carbon": {"low": 0.5, "medium": 0.75},
            "nitrogen": {"low": 280, "medium": 560},
            "phosphorus": {"low": 10, "medium": 25},
            "potassium": {"low": 110, "medium": 280}
        }
        
        if nutrient in thresholds:
            thresh = thresholds[nutrient]
            if value < thresh["low"]:
                return "Low"
            elif value < thresh["medium"]:
                return "Medium"
            else:
                return "High"
        
        return "Unknown"
    
    def _suggest_crops_based_on_soil(self, summary: Dict) -> List[str]:
        """Suggest crops based on soil analysis"""
        suggestions = []
        
        # pH-based suggestions
        ph = summary.get("average_ph")
        if ph:
            if 6.0 <= ph <= 7.5:
                suggestions.extend(["Rice", "Wheat", "Maize", "Cotton"])
            elif ph < 6.0:
                suggestions.extend(["Tea", "Potato", "Blueberry"])
            elif ph > 7.5:
                suggestions.extend(["Barley", "Sugar beet"])
        
        # Soil type based suggestions
        soil_type = summary.get("dominant_soil_type", "").lower()
        if "clay" in soil_type:
            suggestions.extend(["Rice", "Wheat"])
        elif "sandy" in soil_type:
            suggestions.extend(["Groundnut", "Millets"])
        elif "loamy" in soil_type:
            suggestions.extend(["Cotton", "Sugarcane", "Vegetables"])
        
        return list(set(suggestions))  # Remove duplicates

# Global service instance
soil_data_service = SoilDataService()