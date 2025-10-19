"""
Crop Prediction Service
Provides recommendations for optimal crops based on various factors
Enhanced with real-time weather, market data, and soil data integration
"""

import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
from services.weather_service import WeatherService
from services.kerala_market_service import KeralaMarketService
from services.market_price_service import MarketPriceService
from services.soil_data_service import soil_data_service

logger = logging.getLogger(__name__)

class CropPredictionService:
    def __init__(self):
        # Initialize external services
        self.weather_service = WeatherService()
        self.kerala_market_service = KeralaMarketService()
        self.market_price_service = MarketPriceService()
        self.soil_data_service = soil_data_service
        
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
    
    async def get_real_time_soil_data(self, state: str, district: Optional[str] = None) -> Dict[str, Any]:
        """Fetch real-time soil data for enhanced prediction"""
        try:
            logger.info(f"Fetching soil data for {state}, {district}")
            
            # Get soil analysis from data.gov.in
            soil_response = await self.soil_data_service.get_soil_data_for_location(
                state=state, 
                district=district
            )
            
            if soil_response["success"]:
                logger.info("Successfully fetched real-time soil data")
                return {
                    "available": True,
                    "analysis": soil_response["soil_analysis"],
                    "location": soil_response["location"],
                    "source": "data.gov.in",
                    "fetched_at": soil_response["fetched_at"]
                }
            else:
                logger.warning(f"Soil data not available: {soil_response.get('error', 'Unknown error')}")
                return {
                    "available": False,
                    "error": soil_response.get("error", "Soil data not available")
                }
                
        except Exception as e:
            logger.error(f"Error fetching soil data: {e}")
            return {
                "available": False,
                "error": str(e)
            }
    
    async def predict_crops_async(
        self,
        soil_type: str,
        season: str,
        state: str,
        ph_level: Optional[float] = None,
        water_availability: str = "medium",
        experience_level: str = "intermediate",
        farm_size: str = "small",
        use_real_time_data: bool = True,
        district: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Async version of predict_crops with soil data integration
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
            soil_data = None
            
            if use_real_time_data:
                try:
                    # Fetch weather data
                    weather_data = await self.get_real_time_weather_data(state)
                    
                    # Fetch soil data
                    soil_data = await self.get_real_time_soil_data(state, district)
                    
                    # Get crop names for price lookup
                    crop_names = [self.crop_market_mappings.get(crop_key) for crop_key in self.crops_database.keys()]
                    crop_names = [name for name in crop_names if name]  # Remove None values
                    
                    # Fetch current market prices
                    current_prices = await self.get_current_market_prices(crop_names, state)
                    
                except Exception as e:
                    logger.warning(f"Error fetching real-time data: {e}")
            
            # Use soil data for enhanced predictions if available
            if soil_data and soil_data["available"]:
                analysis = soil_data["analysis"]
                
                # Override pH if soil data provides it
                if analysis.get("average_ph") and not ph_level:
                    ph_level = analysis["average_ph"]
                    logger.info(f"Using soil data pH: {ph_level}")
                
                # Override soil type if soil data provides it
                if analysis.get("dominant_soil_type"):
                    detected_soil = analysis["dominant_soil_type"].lower()
                    logger.info(f"Soil data suggests dominant soil type: {detected_soil}")
                    # You could override the user input here if desired
                    # soil_type = detected_soil
            
            # Evaluate each crop
            for crop_key, crop_data in self.crops_database.items():
                score = 0
                reasons = []
                
                # Check soil type compatibility
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
                    score += 25
                    reasons.append(f"Suitable for {state}")
                
                # pH compatibility check
                if ph_level is not None:
                    ph_min, ph_max = crop_data["ph_range"]
                    if ph_min <= ph_level <= ph_max:
                        score += 10
                        reasons.append(f"pH {ph_level} is suitable")
                    else:
                        score -= 5
                        reasons.append(f"pH {ph_level} is not optimal (needs {ph_min}-{ph_max})")
                
                # Water availability check
                water_req = crop_data["water_requirement"].lower()
                water_score = self._calculate_water_score(water_availability, water_req)
                score += water_score
                if water_score > 0:
                    reasons.append("Water requirement matches availability")
                
                # Experience level adjustment
                if experience_level == "beginner" and crop_key in ["wheat", "rice", "tomato"]:
                    score += 5
                    reasons.append("Good crop for beginners")
                elif experience_level == "expert" and crop_key in ["cotton", "sugarcane"]:
                    score += 5
                    reasons.append("Suitable for experienced farmers")
                
                # Farm size consideration
                if farm_size == "small" and crop_key in ["tomato", "onion", "potato"]:
                    score += 3
                    reasons.append("Suitable for small farms")
                elif farm_size == "large" and crop_key in ["sugarcane", "cotton", "wheat"]:
                    score += 3
                    reasons.append("Suitable for large-scale farming")
                
                # Weather integration
                weather_suitability = None
                current_temperature = None
                if weather_data and weather_data.get("temperature"):
                    temp = weather_data["temperature"]
                    current_temperature = f"{temp}°C"
                    temp_min, temp_max = crop_data["temperature_range"]
                    
                    if temp_min <= temp <= temp_max:
                        score += 10
                        weather_suitability = "Ideal"
                        reasons.append(f"Current temperature ({temp}°C) is ideal")
                    elif temp_min - 5 <= temp <= temp_max + 5:
                        score += 5
                        weather_suitability = "Good"
                        reasons.append(f"Current temperature ({temp}°C) is acceptable")
                    else:
                        weather_suitability = "Poor"
                        reasons.append(f"Current temperature ({temp}°C) is not suitable")
                
                # Market price integration
                current_price = None
                price_status = "Historical"
                if crop_key in self.crop_market_mappings:
                    market_name = self.crop_market_mappings[crop_key]
                    if market_name in current_prices:
                        current_price = current_prices[market_name]
                        price_status = "Current"
                        score += 5
                        reasons.append("Current market price available")
                
                # Only include crops with reasonable scores
                if score >= 50:
                    suitable_crops.append({
                        "crop_name": crop_data["name"],
                        "crop_key": crop_key,
                        "suitability_score": min(score, 100),
                        "suitability_percentage": min(score, 100),
                        "recommendation_level": self._get_recommendation_level(min(score, 100)),
                        "reasons": reasons,
                        "details": {
                            **crop_data,
                            "current_market_price": current_price or crop_data["market_price_range"],
                            "price_status": price_status,
                            "weather_suitability": weather_suitability,
                            "current_temperature": current_temperature
                        }
                    })
            
            # Sort by suitability score
            suitable_crops.sort(key=lambda x: x["suitability_score"], reverse=True)
            
            # Generate summary
            if suitable_crops:
                top_crop = suitable_crops[0]
                summary = f"Based on {soil_type} soil and {season} season in {state}, {top_crop['crop_name']} is the top recommendation with {top_crop['suitability_percentage']}% suitability. Found {len(suitable_crops)} suitable crops total."
            else:
                summary = f"No highly suitable crops found for {soil_type} soil in {season} season for {state}. Consider adjusting growing conditions or consulting local experts."
            
            # Generate farming tips
            farming_tips = self._generate_farming_tips(suitable_crops, soil_type, season, state, ph_level, soil_data)
            
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
                "predicted_crops": suitable_crops,
                "total_suitable_crops": len(suitable_crops),
                "summary": summary,
                "farming_tips": farming_tips,
                "real_time_data": {
                    "weather_integrated": weather_data is not None,
                    "market_prices_integrated": len(current_prices) > 0,
                    "soil_data_integrated": soil_data and soil_data["available"],
                    "current_weather": weather_data,
                    "available_market_prices": len(current_prices),
                    "soil_analysis": soil_data if soil_data and soil_data["available"] else None
                }
            }
            
        except Exception as e:
            logger.error(f"Error in crop prediction: {e}")
            return {
                "success": False,
                "error": str(e),
                "predicted_crops": []
            }
    
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
    
    def _calculate_water_score(self, water_availability: str, water_requirement: str) -> int:
        """Calculate compatibility score between water availability and requirement"""
        try:
            # Define water level mappings
            water_levels = {
                "low": 1,
                "medium": 2,
                "high": 3,
                "very_high": 4
            }
            
            avail_level = water_levels.get(water_availability.lower(), 2)  # Default to medium
            req_level = water_levels.get(water_requirement.lower(), 2)    # Default to medium
            
            # Calculate compatibility
            if avail_level >= req_level:
                # Perfect match or excess water
                if avail_level == req_level:
                    return 15  # Perfect match
                elif avail_level == req_level + 1:
                    return 10  # Slight excess, still good
                else:
                    return 5   # Too much water might not be ideal
            else:
                # Insufficient water
                deficit = req_level - avail_level
                if deficit == 1:
                    return -5  # Minor shortage
                else:
                    return -10 # Major shortage
        except Exception as e:
            logger.warning(f"Error calculating water score: {e}")
            return 0
    
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
    
    def _generate_farming_tips(self, top_crops: List[Dict], soil_type: str, season: str, state: str, ph_level: Optional[float] = None, soil_data: Optional[Dict] = None) -> List[str]:
        """Generate contextual farming tips with real-time insights including soil data"""
        tips = []
        
        # Soil data based tips
        if soil_data and soil_data.get("available"):
            analysis = soil_data["analysis"]
            
            # pH recommendations
            if analysis.get("average_ph"):
                ph = analysis["average_ph"]
                ph_class = analysis.get("ph_classification", "")
                if ph_class == "Acidic":
                    tips.append(f"🧪 Soil is acidic (pH {ph}) - consider lime application to increase pH for better crop growth")
                elif ph_class == "Alkaline":
                    tips.append(f"🧪 Soil is alkaline (pH {ph}) - consider sulfur application to decrease pH")
                else:
                    tips.append(f"🧪 Soil pH ({ph}) is optimal for most crops")
            
            # Nutrient recommendations
            fertility = analysis.get("fertility_status", {})
            for nutrient, data in fertility.items():
                status = data.get("status", "").lower()
                if status == "low":
                    nutrient_tips = {
                        "nitrogen": "Apply nitrogen-rich fertilizers like urea or compost",
                        "phosphorus": "Apply phosphate fertilizers or bone meal",
                        "potassium": "Apply potash or wood ash",
                        "organic_carbon": "Add organic matter like compost or farmyard manure"
                    }
                    if nutrient in nutrient_tips:
                        tips.append(f"🌱 {nutrient.title()} is low - {nutrient_tips[nutrient]}")
            
            # Soil-based crop suggestions
            soil_suggestions = analysis.get("crop_suitability", [])
            if soil_suggestions:
                tips.append(f"🌾 Soil analysis suggests these crops: {', '.join(soil_suggestions[:3])}")
        
        # Standard farming tips based on top crops
        if top_crops:
            top_crop = top_crops[0]
            tips.append(f"💰 Focus on high-value crops with good market demand")
            tips.append(f"🔄 Consider crop rotation to maintain soil health")
            
            # Crop-specific tips
            if top_crop["crop_key"] == "banana":
                tips.append("💧 Banana requires high water - plan irrigation accordingly")
                tips.append("⏱️ Growth period is 300 days - plan your calendar")
            elif top_crop["crop_key"] == "rice":
                tips.append("💧 Rice needs standing water - ensure proper field preparation")
                tips.append("🌾 Consider System of Rice Intensification (SRI) for better yields")
            elif top_crop["crop_key"] == "cotton":
                tips.append("🐛 Monitor for bollworm and other pests regularly")
                tips.append("💧 Cotton needs consistent moisture during flowering")
            elif top_crop["crop_key"] == "sugarcane":
                tips.append("⏰ Sugarcane is a long-duration crop (12-18 months)")
                tips.append("💧 Requires high water throughout growth period")
        
        # Seasonal tips
        season_tips = {
            "kharif": "🌧️ Monsoon season - ensure proper drainage to prevent waterlogging",
            "rabi": "❄️ Winter season - protect crops from frost and cold winds",
            "summer": "☀️ Summer season - focus on water management and heat protection",
            "monsoon": "🌧️ High rainfall expected - choose flood-resistant varieties"
        }
        if season in season_tips:
            tips.append(season_tips[season])
        
        # General agricultural tips
        tips.extend([
            "🌡️ Monitor weather forecasts regularly for timely decisions",
            "🔬 Test soil health before planting for optimal results"
        ])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_tips = []
        for tip in tips:
            if tip not in seen:
                seen.add(tip)
                unique_tips.append(tip)
        
        return unique_tips[:6]  # Limit to 6 tips

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