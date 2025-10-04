"""Market price utilities for various agricultural markets"""

import os
import random
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class MarketPriceService:
    """Service for managing general market prices (not Kerala-specific)"""
    
    def __init__(self):
        # Sample market data - in real app, this would come from a database
        self.states_data = {
            "Maharashtra": {
                "talukas": {
                    "Pune": ["Pune Market", "Hadapsar Market", "Kothrud Market"],
                    "Mumbai": ["Crawford Market", "Dadar Market", "Vashi Market"],
                    "Nashik": ["Nashik Main Market", "Deolali Market"]
                }
            },
            "Karnataka": {
                "talukas": {
                    "Bangalore": ["KR Market", "Yeshwantpur Market", "Madiwala Market"],
                    "Mysore": ["Devaraja Market", "Bandipalya Market"]
                }
            },
            "Kerala": {
                "talukas": {
                    "Kochi": ["Broadway Market", "Mattancherry Market"],
                    "Kozhikode": ["Palayam Market", "SM Street Market"]
                }
            },
            "Punjab": {
                "talukas": {
                    "Amritsar": ["Katra Jaimal Singh Market", "Hall Bazaar"],
                    "Ludhiana": ["Chaura Bazaar", "Ghumar Mandi"]
                }
            }
        }
        
        self.crops = [
            "Rice", "Wheat", "Sugarcane", "Cotton", "Tomato", "Onion", "Potato", 
            "Banana", "Apple", "Mango", "Coconut", "Turmeric", "Chilli", "Garlic"
        ]
    
    async def get_market_prices(self, state: str = "", taluka: str = "", 
                               market: str = "", crop: str = "") -> Dict[str, Any]:
        """Get market prices with filtering"""
        try:
            market_data = []
            
            # Generate sample market price data
            for state_name, state_info in self.states_data.items():
                if state and state.lower() not in state_name.lower():
                    continue
                    
                for taluka_name, markets in state_info["talukas"].items():
                    if taluka and taluka.lower() not in taluka_name.lower():
                        continue
                    
                    for market_name in markets:
                        if market and market.lower() not in market_name.lower():
                            continue
                        
                        for crop_name in self.crops:
                            if crop and crop.lower() not in crop_name.lower():
                                continue
                            
                            # Generate random price data
                            base_price = random.randint(20, 200)
                            arrival_quantity = random.randint(50, 500)
                            
                            market_entry = {
                                "state": state_name,
                                "taluka": taluka_name,
                                "market": market_name,
                                "crop": crop_name,
                                "variety": f"{crop_name} Grade A",
                                "arrival_date": (datetime.now() - timedelta(days=random.randint(0, 7))).strftime("%Y-%m-%d"),
                                "arrival_quantity": f"{arrival_quantity} quintals",
                                "min_price": base_price - random.randint(5, 15),
                                "max_price": base_price + random.randint(5, 20),
                                "avg_price": base_price,
                                "price_unit": "per quintal",
                                "trend": random.choice(["stable", "increasing", "decreasing"]),
                                "last_updated": datetime.now().isoformat()
                            }
                            
                            market_data.append(market_entry)
            
            # Limit results for performance
            limited_data = market_data[:100]
            
            return {
                "success": True,
                "total": len(market_data),
                "prices": limited_data,
                "filters": {
                    "states": list(self.states_data.keys()),
                    "crops": self.crops,
                    "applied_filters": {
                        "state": state,
                        "taluka": taluka,
                        "market": market,
                        "crop": crop
                    }
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting market prices: {e}")
            return {
                "success": False,
                "error": str(e),
                "prices": []
            }
    
    async def get_price_trends(self, crop: str, state: str = "") -> Dict[str, Any]:
        """Get price trends for a specific crop"""
        try:
            # Generate mock trend data for the last 30 days
            trend_data = []
            base_price = random.randint(50, 150)
            
            for i in range(30):
                date = datetime.now() - timedelta(days=29-i)
                # Add some realistic price variation
                price_change = random.randint(-10, 10)
                current_price = max(base_price + price_change, 10)  # Ensure price doesn't go negative
                
                trend_data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "price": current_price,
                    "change": price_change,
                    "volume": random.randint(100, 1000)
                })
                
                base_price = current_price
            
            # Calculate statistics
            prices = [entry["price"] for entry in trend_data]
            avg_price = sum(prices) / len(prices)
            min_price = min(prices)
            max_price = max(prices)
            
            return {
                "success": True,
                "crop": crop,
                "state": state or "All States",
                "period": "Last 30 days",
                "trend_data": trend_data,
                "statistics": {
                    "average_price": round(avg_price, 2),
                    "minimum_price": min_price,
                    "maximum_price": max_price,
                    "price_volatility": round((max_price - min_price) / avg_price * 100, 2)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting price trends: {e}")
            return {
                "success": False,
                "error": str(e)
            }