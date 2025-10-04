"""
Market Locator Service
Provides nearby market information for farmers to sell their crops
"""

import math
from typing import List, Dict, Optional, Tuple
import requests
import json

class MarketLocatorService:
    def __init__(self):
        # Sample market data - in production, this would come from a database or API
        self.markets = [
            {
                "id": 1,
                "name": "DMart Kochi",
                "type": "retail",
                "category": "DMart",
                "address": "Oberon Mall, NH Bypass, Vyttila, Kochi, Kerala 682019",
                "latitude": 9.9673,
                "longitude": 76.2955,
                "phone": "+91 484 4050200",
                "crops_accepted": ["Tomato", "Onion Big", "Potato", "Carrot", "Cabbage", "Cauliflower"],
                "operating_hours": "8:00 AM - 11:00 PM",
                "contact_person": "Store Manager",
                "procurement_process": "Contact store manager for bulk sales",
                "rating": 4.2
            },
            {
                "id": 2,
                "name": "DMart Thrissur",
                "type": "retail",
                "category": "DMart",
                "address": "Sobha City Mall, Puzhakkal, Thrissur, Kerala 680553",
                "latitude": 10.5276,
                "longitude": 76.2144,
                "phone": "+91 487 2970200",
                "crops_accepted": ["Tomato", "Onion Big", "Potato", "Beans", "Okra", "Brinjal"],
                "operating_hours": "8:00 AM - 11:00 PM",
                "contact_person": "Procurement Head",
                "procurement_process": "Submit quality samples and pricing proposal",
                "rating": 4.1
            },
            {
                "id": 3,
                "name": "Kochi Vegetable Wholesale Market",
                "type": "wholesale",
                "category": "Wholesale Market",
                "address": "Ernakulam Market Road, Broadway, Kochi, Kerala 682001",
                "latitude": 9.9816,
                "longitude": 76.2999,
                "phone": "+91 484 2355678",
                "crops_accepted": ["Tomato", "Onion Big", "Potato", "Carrot", "Beans", "Cabbage", "Cauliflower", "Okra", "Brinjal", "Chilli Green"],
                "operating_hours": "4:00 AM - 12:00 PM",
                "contact_person": "Market Secretary",
                "procurement_process": "Direct auction system, arrive early morning",
                "rating": 3.8
            },
            {
                "id": 4,
                "name": "Palayam Market Thiruvananthapuram",
                "type": "wholesale",
                "category": "Wholesale Market",
                "address": "Palayam Market, Thiruvananthapuram, Kerala 695033",
                "latitude": 8.5241,
                "longitude": 76.9366,
                "phone": "+91 471 2330456",
                "crops_accepted": ["Tomato", "Onion Big", "Potato", "Beans", "Chilli Green", "Ginger", "Turmeric"],
                "operating_hours": "4:00 AM - 1:00 PM",
                "contact_person": "Market Officer",
                "procurement_process": "Registration required, commission-based sales",
                "rating": 3.9
            },
            {
                "id": 5,
                "name": "Reliance Fresh Kottayam",
                "type": "retail",
                "category": "Retail Chain",
                "address": "MC Road, Kottayam, Kerala 686001",
                "latitude": 9.5916,
                "longitude": 76.5222,
                "phone": "+91 481 2563789",
                "crops_accepted": ["Tomato", "Carrot", "Beans", "Cabbage", "Brinjal"],
                "operating_hours": "7:00 AM - 10:00 PM",
                "contact_person": "Store Operations Manager",
                "procurement_process": "Quality certification required, contract-based supply",
                "rating": 4.0
            },
            {
                "id": 6,
                "name": "Kozhikode Vegetable Market",
                "type": "wholesale",
                "category": "Wholesale Market",
                "address": "Mittayi Theruvu, Kozhikode, Kerala 673001",
                "latitude": 11.2588,
                "longitude": 75.7804,
                "phone": "+91 495 2720123",
                "crops_accepted": ["Tomato", "Onion Big", "Potato", "Ginger", "Turmeric", "Chilli Green", "Coconut"],
                "operating_hours": "3:00 AM - 11:00 AM",
                "contact_person": "Market Association President",
                "procurement_process": "Direct sales to traders, no commission for members",
                "rating": 3.7
            },
            {
                "id": 7,
                "name": "Spencer's Retail Kannur",
                "type": "retail",
                "category": "Retail Chain",
                "address": "City Centre Mall, Kannur, Kerala 670002",
                "latitude": 11.8745,
                "longitude": 75.3704,
                "phone": "+91 497 2789012",
                "crops_accepted": ["Tomato", "Onion Big", "Carrot", "Cabbage", "Cauliflower"],
                "operating_hours": "9:00 AM - 10:00 PM",
                "contact_person": "Purchase Manager",
                "procurement_process": "Seasonal contracts available, quality standards apply",
                "rating": 3.9
            },
            {
                "id": 8,
                "name": "Alappuzha Fish & Vegetable Market",
                "type": "wholesale",
                "category": "Mixed Market",
                "address": "Boat Jetty Road, Alappuzha, Kerala 688001",
                "latitude": 9.4981,
                "longitude": 76.3388,
                "phone": "+91 477 2253456",
                "crops_accepted": ["Tomato", "Onion Big", "Beans", "Okra", "Coconut"],
                "operating_hours": "4:00 AM - 2:00 PM",
                "contact_person": "Market Supervisor",
                "procurement_process": "Daily auctions, cash transactions",
                "rating": 3.6
            }
        ]
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula
        Returns distance in kilometers
        """
        # Convert latitude and longitude from degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
    
    def get_farmer_location(self, location_input: str = None) -> Tuple[float, float]:
        """
        Get farmer's location coordinates
        For demo purposes, using Kochi as default location
        In production, this would use GPS or location input
        """
        if location_input:
            # In production, use geocoding service to convert location to coordinates
            # For now, return some sample locations based on district names
            location_coords = {
                "kochi": (9.9312, 76.2673),
                "ernakulam": (9.9312, 76.2673),
                "thiruvananthapuram": (8.5241, 76.9366),
                "kozhikode": (11.2588, 75.7804),
                "thrissur": (10.5276, 76.2144),
                "kottayam": (9.5916, 76.5222),
                "alappuzha": (9.4981, 76.3388),
                "kannur": (11.8745, 75.3704),
                "kollam": (8.8932, 76.6141),
                "palakkad": (10.7867, 76.6548)
            }
            
            location_lower = location_input.lower().strip()
            for key, coords in location_coords.items():
                if key in location_lower or location_lower in key:
                    return coords
        
        # Default to Kochi coordinates
        return (9.9312, 76.2673)
    
    def find_nearby_markets(
        self, 
        selected_crops: List[str],
        farmer_location: str = None,
        max_distance: float = 100,
        limit: int = 10
    ) -> Dict:
        """
        Find nearby markets that accept the selected crops
        """
        try:
            farmer_lat, farmer_lon = self.get_farmer_location(farmer_location)
            
            # Filter markets that accept at least one of the selected crops
            relevant_markets = []
            
            for market in self.markets:
                # Check if market accepts any of the selected crops
                accepted_crops = set(market["crops_accepted"])
                selected_crops_set = set(selected_crops)
                
                if accepted_crops.intersection(selected_crops_set):
                    # Calculate distance
                    distance = self.calculate_distance(
                        farmer_lat, farmer_lon,
                        market["latitude"], market["longitude"]
                    )
                    
                    if distance <= max_distance:
                        market_info = market.copy()
                        market_info["distance_km"] = round(distance, 2)
                        market_info["matching_crops"] = list(accepted_crops.intersection(selected_crops_set))
                        relevant_markets.append(market_info)
            
            # Sort by distance
            relevant_markets.sort(key=lambda x: x["distance_km"])
            
            # Limit results
            relevant_markets = relevant_markets[:limit]
            
            # Group by category
            grouped_markets = {
                "DMart": [],
                "Retail Chain": [],
                "Wholesale Market": [],
                "Mixed Market": []
            }
            
            for market in relevant_markets:
                category = market["category"]
                if category in grouped_markets:
                    grouped_markets[category].append(market)
            
            return {
                "success": True,
                "farmer_location": {
                    "latitude": farmer_lat,
                    "longitude": farmer_lon,
                    "input_location": farmer_location or "Kochi (Default)"
                },
                "total_markets": len(relevant_markets),
                "markets_by_category": grouped_markets,
                "all_markets": relevant_markets,
                "selected_crops": selected_crops
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error finding markets: {str(e)}"
            }
    
    def get_market_details(self, market_id: int) -> Dict:
        """
        Get detailed information about a specific market
        """
        try:
            market = next((m for m in self.markets if m["id"] == market_id), None)
            
            if not market:
                return {
                    "success": False,
                    "error": "Market not found"
                }
            
            return {
                "success": True,
                "market": market
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error getting market details: {str(e)}"
            }

# Global service instance
market_locator_service = MarketLocatorService()