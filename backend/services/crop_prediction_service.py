"""
Crop Prediction Service
Provides recommendations for optimal crops based on various factors
Enhanced with real-time weather and market data integration
"""

import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
from services.weather_service import WeatherService
from services.kerala_market_service import KeralaMarketService
from services.market_price_service import MarketPriceService

logger = logging.getLogger(__name__)

class CropPredictionService:
    def __init__(self):
        # Initialize external services
        self.weather_service = WeatherService()
        self.kerala_market_service = KeralaMarketService()
        self.market_price_service = MarketPriceService()
        
        # Sample crop database with growing conditions
        self.crops_database = {
            "rice": {
                "name": "Rice",
                "season": ["monsoon", "winter"],
                "soil_types": ["clay", "loamy", "silty"],
                "ph_range": [5.5, 7.0],
                "water_requirement": "high",
                "temperature_range": [20, 35],
                "rainfall_mm": [1000, 2500],
                "growth_period_days": 120,
                "yield_per_acre": "15-20 quintals",
                "market_price_range": "₹1800-2200/quintal",
                "pros": ["High demand", "Government support", "Multiple varieties"],
                "cons": ["High water requirement", "Pest susceptible"],
                "states_suitable": ["Kerala", "Tamil Nadu", "West Bengal", "Odisha", "Punjab"]
            },
            "wheat": {
                "name": "Wheat",
                "season": ["winter", "rabi"],
                "soil_types": ["loamy", "clay", "sandy"],
                "ph_range": [6.0, 7.5],
                "water_requirement": "medium",
                "temperature_range": [15, 25],
                "rainfall_mm": [300, 1000],
                "growth_period_days": 110,
                "yield_per_acre": "12-18 quintals",
                "market_price_range": "₹2000-2500/quintal",
                "pros": ["Good market price", "Storage friendly", "Multiple uses"],
                "cons": ["Temperature sensitive", "Requires irrigation"],
                "states_suitable": ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh"]
            },
            "sugarcane": {
                "name": "Sugarcane",
                "season": ["year_round"],
                "soil_types": ["loamy", "clay", "alluvial"],
                "ph_range": [6.0, 8.0],
                "water_requirement": "very_high",
                "temperature_range": [20, 35],
                "rainfall_mm": [1200, 2500],
                "growth_period_days": 365,
                "yield_per_acre": "300-500 quintals",
                "market_price_range": "₹300-400/quintal",
                "pros": ["High yield", "Guaranteed purchase", "Long-term crop"],
                "cons": ["Very high water requirement", "Long growth period"],
                "states_suitable": ["Maharashtra", "Uttar Pradesh", "Karnataka", "Tamil Nadu"]
            },
            "cotton": {
                "name": "Cotton",
                "season": ["kharif", "summer"],
                "soil_types": ["black", "loamy", "sandy"],
                "ph_range": [6.0, 8.0],
                "water_requirement": "medium",
                "temperature_range": [21, 32],
                "rainfall_mm": [500, 1200],
                "growth_period_days": 180,
                "yield_per_acre": "8-15 quintals",
                "market_price_range": "₹5000-6500/quintal",
                "pros": ["High market value", "Industrial demand", "Export potential"],
                "cons": ["Pest attacks", "Market fluctuations"],
                "states_suitable": ["Gujarat", "Maharashtra", "Andhra Pradesh", "Telangana"]
            },
            "tomato": {
                "name": "Tomato",
                "season": ["winter", "summer"],
                "soil_types": ["loamy", "sandy", "red"],
                "ph_range": [6.0, 7.0],
                "water_requirement": "medium",
                "temperature_range": [18, 29],
                "rainfall_mm": [400, 1200],
                "growth_period_days": 75,
                "yield_per_acre": "150-300 quintals",
                "market_price_range": "₹800-2000/quintal",
                "pros": ["High demand", "Multiple harvests", "Good returns"],
                "cons": ["Perishable", "Disease prone", "Market volatility"],
                "states_suitable": ["Karnataka", "Andhra Pradesh", "Maharashtra", "Odisha"]
            },
            "onion": {
                "name": "Onion",
                "season": ["rabi", "kharif"],
                "soil_types": ["loamy", "sandy", "alluvial"],
                "ph_range": [6.0, 7.5],
                "water_requirement": "medium",
                "temperature_range": [15, 25],
                "rainfall_mm": [300, 800],
                "growth_period_days": 120,
                "yield_per_acre": "100-200 quintals",
                "market_price_range": "₹1000-3000/quintal",
                "pros": ["Good storage", "High demand", "Export potential"],
                "cons": ["Price volatility", "Storage losses"],
                "states_suitable": ["Maharashtra", "Karnataka", "Gujarat", "Rajasthan"]
            },
            "potato": {
                "name": "Potato",
                "season": ["rabi", "winter"],
                "soil_types": ["loamy", "sandy", "well_drained"],
                "ph_range": [5.5, 6.5],
                "water_requirement": "medium",
                "temperature_range": [15, 25],
                "rainfall_mm": [400, 800],
                "growth_period_days": 90,
                "yield_per_acre": "100-250 quintals",
                "market_price_range": "₹500-1500/quintal",
                "pros": ["High yield", "Multiple uses", "Storage friendly"],
                "cons": ["Disease prone", "Price fluctuations"],
                "states_suitable": ["Uttar Pradesh", "West Bengal", "Bihar", "Punjab"]
            },
            "banana": {
                "name": "Banana",
                "season": ["year_round"],
                "soil_types": ["loamy", "alluvial", "clay"],
                "ph_range": [6.0, 7.5],
                "water_requirement": "high",
                "temperature_range": [26, 35],
                "rainfall_mm": [1000, 2500],
                "growth_period_days": 300,
                "yield_per_acre": "200-400 quintals",
                "market_price_range": "₹800-1500/quintal",
                "pros": ["Year-round harvest", "High nutrition", "Good demand"],
                "cons": ["Cyclone damage risk", "High water need"],
                "states_suitable": ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh"]
            }
        }
        
        # Seasonal recommendations
        self.seasonal_crops = {
            "kharif": ["rice", "cotton", "sugarcane", "tomato"],
            "rabi": ["wheat", "onion", "potato", "tomato"],
            "summer": ["cotton", "tomato", "banana"],
            "monsoon": ["rice", "sugarcane", "banana"],
            "winter": ["wheat", "tomato", "onion", "potato"],
            "year_round": ["sugarcane", "banana"]
        }
        
        # Market name mappings for crop price lookup
        self.crop_market_mappings = {
            "rice": "Rice",
            "wheat": "Wheat", 
            "sugarcane": "Sugarcane",
            "cotton": "Cotton",
            "tomato": "Tomato",
            "onion": "Onion",
            "potato": "Potato",
            "banana": "Banana"
        }

    async def get_real_time_weather_data(self, state: str) -> Dict[str, Any]:
        """Fetch real-time weather data for enhanced prediction"""
        try:
            # Map state to major city for weather data
            state_city_map = {
                "Kerala": "Kochi",
                "Tamil Nadu": "Chennai", 
                "Karnataka": "Bangalore",
                "Andhra Pradesh": "Hyderabad",
                "Telangana": "Hyderabad",
                "Maharashtra": "Mumbai",
                "Gujarat": "Ahmedabad",
                "Rajasthan": "Jaipur",
                "Punjab": "Chandigarh",
                "Haryana": "Chandigarh",
                "Uttar Pradesh": "Lucknow",
                "Madhya Pradesh": "Bhopal",
                "West Bengal": "Kolkata",
                "Odisha": "Bhubaneswar",
                "Bihar": "Patna"
            }
            
            city = state_city_map.get(state, "Mumbai")  # Default to Mumbai
            weather_data = self.weather_service.get_current_weather(city=city)
            
            if weather_data.get("success"):
                return weather_data["data"]
            return None
            
        except Exception as e:
            logger.error(f"Error fetching weather data: {e}")
            return None
    
    async def get_current_market_prices(self, crop_names: List[str], state: str) -> Dict[str, float]:
        """Fetch current market prices for crops"""
        try:
            crop_prices = {}
            
            # For Kerala, use the scraping service
            if state.lower() == "kerala":
                today = datetime.now().strftime("%Y-%m-%d")
                market_data = self.kerala_market_service.get_market_data(today, today)
                
                if market_data.get("success") and market_data.get("data"):
                    for item in market_data["data"]:
                        veg_name = item.get("vegetablename", "").lower()
                        for crop_name in crop_names:
                            if crop_name.lower() in veg_name or veg_name in crop_name.lower():
                                # Use retail price if available, else wholesale
                                retail_price = item.get("retailprice", "")
                                wholesale_price = item.get("price", "")
                                
                                price = None
                                
                                # Handle both string and numeric price values
                                for price_val in [retail_price, wholesale_price]:
                                    if price_val:
                                        try:
                                            if isinstance(price_val, (int, float)):
                                                price = float(price_val)
                                            elif isinstance(price_val, str) and price_val.replace(".", "").replace(",", "").isdigit():
                                                price = float(price_val.replace(",", ""))
                                            
                                            if price and price > 0:
                                                crop_prices[crop_name] = price
                                                break
                                        except (ValueError, AttributeError):
                                            continue
                                
                                if price and price > 0:
                                    break            # For other states, use general market price service
            else:
                for crop_name in crop_names:
                    market_crop_name = self.crop_market_mappings.get(crop_name, crop_name.title())
                    price_data = await self.market_price_service.get_market_prices(
                        state=state, crop=market_crop_name
                    )
                    
                    if price_data.get("success") and price_data.get("prices"):
                        prices = price_data["prices"]
                        if prices:
                            # Use average price from available data
                            avg_price = sum(p.get("avg_price", 0) for p in prices if p.get("avg_price", 0) > 0)
                            count = len([p for p in prices if p.get("avg_price", 0) > 0])
                            if count > 0:
                                crop_prices[crop_name] = avg_price / count
            
            return crop_prices
            
        except Exception as e:
            logger.error(f"Error fetching market prices: {e}")
            return {}
    
    def predict_crops(
        self,
        soil_type: str,
        season: str,
        state: str,
        ph_level: Optional[float] = None,
        water_availability: str = "medium",
        experience_level: str = "intermediate",
        farm_size: str = "small",
        use_real_time_data: bool = True
    ) -> Dict[str, Any]:
        """
        Predict suitable crops based on input parameters with real-time data integration
        """
        try:
            suitable_crops = []
            
            # Normalize inputs
            soil_type = soil_type.lower()
            season = season.lower()
            state = state.title()
            water_availability = water_availability.lower()
            
            # Fetch real-time data if enabled
            weather_data = None
            current_prices = {}
            
            if use_real_time_data:
                try:
                    import asyncio
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    
                    # Get weather data
                    weather_data = loop.run_until_complete(self.get_real_time_weather_data(state))
                    
                    # Get market prices for all crops
                    crop_names = list(self.crops_database.keys())
                    current_prices = loop.run_until_complete(self.get_current_market_prices(crop_names, state))
                    
                    loop.close()
                except Exception as e:
                    logger.warning(f"Could not fetch real-time data: {e}")
                    use_real_time_data = False
            
            for crop_key, crop_data in self.crops_database.items():
                score = 0
                reasons = []
                
                # Check soil compatibility
                if soil_type in [s.lower() for s in crop_data["soil_types"]]:
                    score += 25
                    reasons.append(f"Suitable for {soil_type} soil")
                
                # Check seasonal compatibility
                crop_seasons = [s.lower() for s in crop_data["season"]]
                if season in crop_seasons or "year_round" in crop_seasons:
                    score += 25
                    reasons.append(f"Suitable for {season} season")
                
                # Check state suitability
                if state in crop_data["states_suitable"]:
                    score += 20
                    reasons.append(f"Suitable for {state}")
                
                # Check water requirement compatibility
                water_compatibility = {
                    "low": ["low", "medium"],
                    "medium": ["low", "medium", "high"],
                    "high": ["medium", "high", "very_high"],
                    "very_high": ["high", "very_high"]
                }
                
                if crop_data["water_requirement"] in water_compatibility.get(water_availability, []):
                    score += 15
                    reasons.append("Water requirement matches availability")
                
                # Check pH compatibility if provided
                if ph_level and crop_data["ph_range"]:
                    ph_min, ph_max = crop_data["ph_range"]
                    if ph_min <= ph_level <= ph_max:
                        score += 15
                        reasons.append(f"pH {ph_level} is suitable")
                
                # Enhanced scoring with real-time data
                if use_real_time_data and weather_data:
                    # Weather compatibility bonus
                    current_temp = weather_data.get("temperature", 0)
                    temp_min, temp_max = crop_data["temperature_range"]
                    
                    if temp_min <= current_temp <= temp_max:
                        score += 10
                        reasons.append(f"Current temperature ({current_temp}°C) is ideal")
                    elif temp_min - 5 <= current_temp <= temp_max + 5:
                        score += 5
                        reasons.append(f"Current temperature ({current_temp}°C) is acceptable")
                    
                    # Humidity factor for water requirement
                    humidity = weather_data.get("humidity", 0)
                    if crop_data["water_requirement"] == "high" and humidity > 70:
                        score += 5
                        reasons.append("High humidity supports water-intensive crop")
                    elif crop_data["water_requirement"] == "low" and humidity < 50:
                        score += 5
                        reasons.append("Low humidity suits drought-resistant crop")
                
                # Market price incentive
                if current_prices.get(crop_key):
                    current_price = current_prices[crop_key]
                    # Extract base price from market_price_range string for comparison
                    price_range = crop_data.get("market_price_range", "")
                    if "₹" in price_range and "-" in price_range:
                        try:
                            # Extract average price from range like "₹1800-2200/quintal"
                            price_part = price_range.split("₹")[1].split("/")[0]
                            if "-" in price_part:
                                min_price, max_price = price_part.split("-")
                                avg_base_price = (int(min_price) + int(max_price)) / 2
                                
                                # Price premium bonus
                                if current_price > avg_base_price * 1.2:  # 20% above average
                                    score += 15
                                    reasons.append(f"Excellent market price (₹{current_price:.0f}/quintal)")
                                elif current_price > avg_base_price:
                                    score += 8
                                    reasons.append(f"Good market price (₹{current_price:.0f}/quintal)")
                        except (ValueError, IndexError):
                            pass  # Skip if price parsing fails
                
                # Only include crops with decent compatibility
                if score >= 40:
                    # Enhanced crop details with real-time data
                    enhanced_details = crop_data.copy()
                    
                    # Add current market price if available
                    if current_prices.get(crop_key):
                        enhanced_details["current_market_price"] = f"₹{current_prices[crop_key]:.0f}/quintal"
                        enhanced_details["price_status"] = "Real-time"
                    else:
                        enhanced_details["current_market_price"] = crop_data["market_price_range"]
                        enhanced_details["price_status"] = "Historical"
                    
                    # Add weather suitability if data available
                    if weather_data:
                        current_temp = weather_data.get("temperature", 0)
                        temp_min, temp_max = crop_data["temperature_range"]
                        
                        if temp_min <= current_temp <= temp_max:
                            enhanced_details["weather_suitability"] = "Ideal"
                        elif temp_min - 5 <= current_temp <= temp_max + 5:
                            enhanced_details["weather_suitability"] = "Good"
                        else:
                            enhanced_details["weather_suitability"] = "Challenging"
                        
                        enhanced_details["current_temperature"] = f"{current_temp}°C"
                        enhanced_details["current_humidity"] = f"{weather_data.get('humidity', 0)}%"
                    
                    suitable_crops.append({
                        "crop_name": crop_data["name"],
                        "crop_key": crop_key,
                        "suitability_score": score,
                        "suitability_percentage": min(100, score),
                        "reasons": reasons,
                        "details": enhanced_details,
                        "recommendation_level": self._get_recommendation_level(score)
                    })
            
            # Sort by suitability score
            suitable_crops.sort(key=lambda x: x["suitability_score"], reverse=True)
            
            # Generate summary and tips with real-time context
            summary = self._generate_prediction_summary(suitable_crops, season, soil_type, state, weather_data)
            tips = self._generate_farming_tips(suitable_crops[:3], experience_level, farm_size, weather_data, current_prices)
            
            return {
                "success": True,
                "prediction_date": datetime.now().isoformat(),
                "input_parameters": {
                    "soil_type": soil_type,
                    "season": season,
                    "state": state,
                    "ph_level": ph_level,
                    "water_availability": water_availability,
                    "experience_level": experience_level,
                    "farm_size": farm_size
                },
                "predicted_crops": suitable_crops[:6],  # Top 6 recommendations
                "total_suitable_crops": len(suitable_crops),
                "summary": summary,
                "farming_tips": tips,
                "real_time_data": {
                    "weather_integrated": weather_data is not None,
                    "market_prices_integrated": len(current_prices) > 0,
                    "current_weather": weather_data,
                    "available_market_prices": len(current_prices)
                }
            }
            
        except Exception as e:
            logger.error(f"Error in crop prediction: {e}")
            return {
                "success": False,
                "error": f"Crop prediction failed: {str(e)}"
            }
    
    def _get_recommendation_level(self, score: int) -> str:
        """Get recommendation level based on score"""
        if score >= 80:
            return "Highly Recommended"
        elif score >= 65:
            return "Recommended"
        elif score >= 50:
            return "Suitable"
        else:
            return "Consider with Caution"
    
    def _generate_prediction_summary(self, crops: List[Dict], season: str, soil_type: str, state: str, weather_data: Optional[Dict] = None) -> str:
        """Generate a summary of the prediction with real-time context"""
        if not crops:
            weather_context = ""
            if weather_data:
                temp = weather_data.get("temperature", 0)
                weather_context = f" Current temperature is {temp}°C which may limit options."
            return f"No highly suitable crops found for {soil_type} soil in {season} season in {state}.{weather_context} Consider soil improvement or different timing."
        
        top_crop = crops[0]["crop_name"]
        crop_count = len(crops)
        suitability = crops[0]["suitability_percentage"]
        
        weather_context = ""
        if weather_data:
            temp = weather_data.get("temperature", 0)
            humidity = weather_data.get("humidity", 0)
            weather_context = f" Current conditions: {temp}°C, {humidity}% humidity."
        
        return f"Based on {soil_type} soil and {season} season in {state}, {top_crop} is the top recommendation with {suitability}% suitability.{weather_context} Found {crop_count} suitable crops total."
    
    def _generate_farming_tips(self, top_crops: List[Dict], experience: str, farm_size: str, weather_data: Optional[Dict] = None, current_prices: Optional[Dict] = None) -> List[str]:
        """Generate contextual farming tips with real-time insights"""
        tips = []
        
        # Weather-based tips
        if weather_data:
            temp = weather_data.get("temperature", 0)
            humidity = weather_data.get("humidity", 0)
            
            if temp > 30:
                tips.append("🌡️ High temperature detected - ensure adequate irrigation and consider shade protection")
            elif temp < 15:
                tips.append("❄️ Cool weather - protect crops from frost and consider greenhouse cultivation")
            
            if humidity > 80:
                tips.append("💧 High humidity - watch for fungal diseases and ensure good drainage")
            elif humidity < 40:
                tips.append("🏜️ Low humidity - increase watering frequency and consider mulching")
        
        # Market price based tips
        if current_prices and top_crops:
            high_price_crops = []
            for crop in top_crops[:3]:
                crop_key = crop["crop_key"]
                if current_prices.get(crop_key):
                    high_price_crops.append(f"{crop['crop_name']} (₹{current_prices[crop_key]:.0f}/quintal)")
            
            if high_price_crops:
                tips.append(f"💰 Current high-value crops: {', '.join(high_price_crops)}")
        
        # Experience-based tips
        if experience == "beginner":
            tips.append("🌱 Start with crops that have shorter growth periods and are less pest-prone")
            tips.append("📚 Consider taking local agriculture training programs")
        elif experience == "expert":
            tips.append("🔬 Consider advanced techniques like precision farming and soil sensors")
            tips.append("📈 Explore value-added processing for higher margins")
        
        # Farm size tips
        if farm_size == "small":
            tips.append("💰 Focus on high-value crops with good market demand")
            tips.append("🔄 Consider crop rotation to maintain soil health")
        elif farm_size == "large":
            tips.append("🚜 Consider mechanization for better efficiency")
            tips.append("📊 Diversify crops to reduce market risks")
        
        # Crop-specific tips
        if top_crops:
            first_crop = top_crops[0]["details"]
            tips.append(f"💧 {first_crop['name']} requires {first_crop['water_requirement']} water - plan irrigation accordingly")
            tips.append(f"⏱️ Growth period is {first_crop['growth_period_days']} days - plan your calendar")
        
        # General tips
        tips.append("🌡️ Monitor weather forecasts regularly for timely decisions")
        tips.append("🔬 Test soil health before planting for optimal results")
        
        # Real-time data availability tip
        if weather_data or current_prices:
            tips.append("📊 This prediction uses real-time data for enhanced accuracy")
        
        return tips

    def get_crop_details(self, crop_key: str) -> Dict[str, Any]:
        """Get detailed information about a specific crop"""
        try:
            if crop_key.lower() in self.crops_database:
                crop_data = self.crops_database[crop_key.lower()]
                return {
                    "success": True,
                    "crop_data": crop_data
                }
            else:
                return {
                    "success": False,
                    "error": "Crop not found in database"
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error fetching crop details: {str(e)}"
            }

    def get_seasonal_recommendations(self, season: str, state: str) -> Dict[str, Any]:
        """Get seasonal crop recommendations"""
        try:
            season_crops = self.seasonal_crops.get(season.lower(), [])
            recommendations = []
            
            for crop_key in season_crops:
                if crop_key in self.crops_database:
                    crop_data = self.crops_database[crop_key]
                    if state.title() in crop_data["states_suitable"]:
                        recommendations.append({
                            "crop_name": crop_data["name"],
                            "crop_key": crop_key,
                            "yield": crop_data["yield_per_acre"],
                            "price_range": crop_data["market_price_range"],
                            "growth_period": crop_data["growth_period_days"]
                        })
            
            return {
                "success": True,
                "season": season,
                "state": state,
                "recommendations": recommendations
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error getting seasonal recommendations: {str(e)}"
            }

# Global service instance
crop_prediction_service = CropPredictionService()