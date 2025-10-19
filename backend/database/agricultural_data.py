"""
Centralized Agricultural Data Management System
Stores all agricultural reference data in database for consistency across the application
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
from database.mongodb_setup import get_database

class AgriculturalDataManager:
    def __init__(self):
        self.db: Optional[AsyncIOMotorDatabase] = None
        
    async def initialize(self):
        """Initialize database connection and setup collections"""
        self.db = await get_database()
        
        # Check if data already exists, if not populate it
        if await self.db.agricultural_data.count_documents({}) == 0:
            await self.populate_initial_data()
            
    async def populate_initial_data(self):
        """Populate database with initial agricultural reference data"""
        
        # Indian States and Districts Data
        states_data = {
            "type": "states_districts",
            "data": {
                "Kerala": {
                    "districts": [
                        "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
                        "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
                        "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
                    ],
                    "talukas": {
                        "Thiruvananthapuram": ["Thiruvananthapuram", "Chirayinkeezhu", "Nedumangad"],
                        "Kollam": ["Kollam", "Kunnattur", "Kottarakkara", "Punalur"],
                        "Ernakulam": ["Ernakulam", "Kanayannur", "Kochi", "Muvattupuzha", "Kothamangalam"]
                    }
                },
                "Tamil Nadu": {
                    "districts": [
                        "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
                        "Tirunelveli", "Thanjavur", "Vellore", "Erode", "Kanchipuram"
                    ]
                },
                "Karnataka": {
                    "districts": [
                        "Bengaluru Urban", "Mysuru", "Mangaluru", "Hubballi", "Belagavi",
                        "Shivamogga", "Tumakuru", "Vijayapura", "Ballari", "Kalaburagi"
                    ]
                },
                "Andhra Pradesh": {
                    "districts": [
                        "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool",
                        "Rajahmundry", "Tirupati", "Kakinada", "Anantapur", "Kadapa"
                    ]
                },
                "Maharashtra": {
                    "districts": [
                        "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad",
                        "Solapur", "Kolhapur", "Sangli", "Satara", "Ahmednagar"
                    ]
                },
                "Gujarat": {
                    "districts": [
                        "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar",
                        "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Bharuch"
                    ]
                }
            },
            "translations": {
                "en": {"label": "States & Districts"},
                "hi": {"label": "राज्य और जिले"},
                "ml": {"label": "സംസ്ഥാനങ്ങളും ജില്ലകളും"}
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Soil Types
        soil_types_data = {
            "type": "soil_types",
            "data": [
                {
                    "value": "clay",
                    "label": "Clay Soil",
                    "description": "Heavy, water-retaining soil good for rice",
                    "crops_suitable": ["rice", "wheat", "sugarcane"],
                    "ph_range": [6.0, 7.5],
                    "water_retention": "high"
                },
                {
                    "value": "loamy",
                    "label": "Loamy Soil", 
                    "description": "Balanced soil ideal for most crops",
                    "crops_suitable": ["wheat", "maize", "cotton", "tomato"],
                    "ph_range": [6.0, 7.0],
                    "water_retention": "medium"
                },
                {
                    "value": "sandy",
                    "label": "Sandy Soil",
                    "description": "Well-draining soil good for root vegetables",
                    "crops_suitable": ["potato", "carrot", "groundnut"],
                    "ph_range": [6.0, 7.0],
                    "water_retention": "low"
                },
                {
                    "value": "laterite",
                    "label": "Laterite Soil",
                    "description": "Iron-rich soil common in coastal areas",
                    "crops_suitable": ["coconut", "cashew", "pepper"],
                    "ph_range": [5.5, 6.5],
                    "water_retention": "medium"
                },
                {
                    "value": "alluvial",
                    "label": "Alluvial Soil",
                    "description": "Fertile soil deposited by rivers",
                    "crops_suitable": ["rice", "wheat", "sugarcane", "jute"],
                    "ph_range": [6.0, 8.0],
                    "water_retention": "high"
                },
                {
                    "value": "black_cotton",
                    "label": "Black Cotton Soil",
                    "description": "Rich soil ideal for cotton cultivation",
                    "crops_suitable": ["cotton", "jowar", "wheat"],
                    "ph_range": [6.5, 8.0],
                    "water_retention": "high"
                }
            ],
            "translations": {
                "en": {"label": "Soil Types"},
                "hi": {
                    "label": "मिट्टी के प्रकार",
                    "clay": "चिकनी मिट्टी",
                    "loamy": "दोमट मिट्टी", 
                    "sandy": "रेतीली मिट्टी",
                    "laterite": "लेटराइट मिट्टी",
                    "alluvial": "जलोढ़ मिट्टी",
                    "black_cotton": "काली कपास मिट्टी"
                },
                "ml": {
                    "label": "മണ്ണിന്റെ തരങ്ങൾ",
                    "clay": "കളിമണ്ണ്",
                    "loamy": "എക്കൽ മണ്ണ്",
                    "sandy": "മണൽമണ്ണ്", 
                    "laterite": "ലാറ്ററൈറ്റ് മണ്ണ്",
                    "alluvial": "വെള്ളപ്പൊക്ക മണ്ണ്",
                    "black_cotton": "കറുത്ത പരുത്തി മണ്ണ്"
                }
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Irrigation Types
        irrigation_types_data = {
            "type": "irrigation_types",
            "data": [
                {
                    "value": "drip",
                    "label": "Drip Irrigation",
                    "description": "Water-efficient targeted irrigation",
                    "water_efficiency": "high",
                    "suitable_for": ["vegetables", "fruits", "cash_crops"],
                    "cost": "high",
                    "maintenance": "medium"
                },
                {
                    "value": "sprinkler",
                    "label": "Sprinkler Irrigation",
                    "description": "Overhead water distribution system",
                    "water_efficiency": "medium", 
                    "suitable_for": ["field_crops", "vegetables"],
                    "cost": "medium",
                    "maintenance": "medium"
                },
                {
                    "value": "flood",
                    "label": "Flood Irrigation",
                    "description": "Traditional field flooding method",
                    "water_efficiency": "low",
                    "suitable_for": ["rice", "wheat"],
                    "cost": "low",
                    "maintenance": "low"
                },
                {
                    "value": "monsoon_dependent",
                    "label": "Monsoon Dependent",
                    "description": "Rain-fed agriculture",
                    "water_efficiency": "variable",
                    "suitable_for": ["traditional_crops"],
                    "cost": "none",
                    "maintenance": "none"
                },
                {
                    "value": "borwell",
                    "label": "Borewell Irrigation",
                    "description": "Groundwater extraction system",
                    "water_efficiency": "medium",
                    "suitable_for": ["all_crops"],
                    "cost": "high",
                    "maintenance": "medium"
                },
                {
                    "value": "canal",
                    "label": "Canal Irrigation",
                    "description": "Government canal water supply",
                    "water_efficiency": "medium",
                    "suitable_for": ["field_crops"],
                    "cost": "low",
                    "maintenance": "low"
                }
            ],
            "translations": {
                "en": {"label": "Irrigation Types"},
                "hi": {
                    "label": "सिंचाई के प्रकार",
                    "drip": "ड्रिप सिंचाई",
                    "sprinkler": "स्प्रिंकलर सिंचाई",
                    "flood": "बाढ़ सिंचाई", 
                    "monsoon_dependent": "मानसून आधारित",
                    "borwell": "बोरवेल सिंचाई",
                    "canal": "नहर सिंचाई"
                },
                "ml": {
                    "label": "ജലസേചന തരങ്ങൾ",
                    "drip": "ഡ്രിപ്പ് ജലസേചനം",
                    "sprinkler": "സ്പ്രിങ്ക്ലർ ജലസേചനം",
                    "flood": "വെള്ളപ്പൊക്ക ജലസേചനം",
                    "monsoon_dependent": "മൺസൂൺ ആശ്രിത",
                    "borwell": "ബോർവെൽ ജലസേചനം",
                    "canal": "കനാൽ ജലസേചനം"
                }
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Seasons
        seasons_data = {
            "type": "seasons",
            "data": [
                {
                    "value": "kharif",
                    "label": "Kharif (Monsoon Season)",
                    "months": ["June", "July", "August", "September", "October"],
                    "description": "Monsoon season crops sown in June-July",
                    "typical_crops": ["rice", "cotton", "sugarcane", "jowar"],
                    "rainfall_dependent": True
                },
                {
                    "value": "rabi", 
                    "label": "Rabi (Winter Season)",
                    "months": ["November", "December", "January", "February", "March", "April"],
                    "description": "Winter season crops sown in November-December",
                    "typical_crops": ["wheat", "barley", "peas", "gram"],
                    "rainfall_dependent": False
                },
                {
                    "value": "summer",
                    "label": "Summer/Zaid Season", 
                    "months": ["March", "April", "May", "June"],
                    "description": "Summer crops with irrigation support",
                    "typical_crops": ["watermelon", "cucumber", "fodder"],
                    "rainfall_dependent": False
                },
                {
                    "value": "winter",
                    "label": "Winter Season",
                    "months": ["November", "December", "January", "February"],
                    "description": "Cool season vegetables and crops",
                    "typical_crops": ["potato", "onion", "tomato", "cabbage"],
                    "rainfall_dependent": False
                },
                {
                    "value": "monsoon",
                    "label": "Monsoon Season",
                    "months": ["June", "July", "August", "September"],
                    "description": "Heavy rainfall period crops",
                    "typical_crops": ["rice", "maize", "cotton"],
                    "rainfall_dependent": True
                },
                {
                    "value": "year_round",
                    "label": "Year Round",
                    "months": ["All"],
                    "description": "Crops that can be grown throughout the year", 
                    "typical_crops": ["banana", "coconut", "sugarcane"],
                    "rainfall_dependent": False
                }
            ],
            "translations": {
                "en": {"label": "Seasons"},
                "hi": {
                    "label": "मौसम",
                    "kharif": "खरीफ (मानसून)",
                    "rabi": "रबी (सर्दी)",
                    "summer": "गर्मी/जायद",
                    "winter": "सर्दी",
                    "monsoon": "मानसून",
                    "year_round": "साल भर"
                },
                "ml": {
                    "label": "സീസണുകൾ", 
                    "kharif": "ഖരീഫ് (മൺസൂൺ)",
                    "rabi": "റാബി (ശീതകാലം)",
                    "summer": "വേനൽ/സെയ്ദ്",
                    "winter": "ശീതകാലം",
                    "monsoon": "മൺസൂൺ",
                    "year_round": "വർഷം മുഴുവനും"
                }
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Farming Experience Levels
        experience_data = {
            "type": "farming_experience",
            "data": [
                {
                    "value": "beginner",
                    "label": "Beginner (0-2 years)",
                    "description": "New to farming with basic knowledge",
                    "recommended_crops": ["easy_to_grow"],
                    "support_needed": "high",
                    "years_range": [0, 2]
                },
                {
                    "value": "intermediate", 
                    "label": "Intermediate (3-7 years)",
                    "description": "Moderate farming experience",
                    "recommended_crops": ["medium_difficulty"],
                    "support_needed": "medium",
                    "years_range": [3, 7]
                },
                {
                    "value": "expert",
                    "label": "Expert (8+ years)",
                    "description": "Experienced farmer with advanced knowledge",
                    "recommended_crops": ["all_crops"],
                    "support_needed": "low", 
                    "years_range": [8, 50]
                }
            ],
            "translations": {
                "en": {"label": "Farming Experience"},
                "hi": {
                    "label": "कृषि अनुभव",
                    "beginner": "नौसिखिया (0-2 साल)",
                    "intermediate": "मध्यम (3-7 साल)",
                    "expert": "विशेषज्ञ (8+ साल)"
                },
                "ml": {
                    "label": "കൃഷി അനുഭവം",
                    "beginner": "തുടക്കക്കാരൻ (0-2 വർഷം)",
                    "intermediate": "ഇടത്തരം (3-7 വർഷം)", 
                    "expert": "വിദഗ്ധൻ (8+ വർഷം)"
                }
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Farm Size Categories
        farm_size_data = {
            "type": "farm_sizes",
            "data": [
                {
                    "value": "marginal",
                    "label": "Marginal (Below 1 hectare)",
                    "description": "Very small farms, subsistence farming",
                    "hectare_range": [0, 1],
                    "acre_range": [0, 2.47],
                    "category": "marginal"
                },
                {
                    "value": "small",
                    "label": "Small (1-2 hectares)", 
                    "description": "Small scale farming operations",
                    "hectare_range": [1, 2],
                    "acre_range": [2.47, 4.94],
                    "category": "small"
                },
                {
                    "value": "semi_medium",
                    "label": "Semi-Medium (2-4 hectares)",
                    "description": "Medium scale with some commercial potential",
                    "hectare_range": [2, 4],
                    "acre_range": [4.94, 9.88],
                    "category": "semi_medium"
                },
                {
                    "value": "medium",
                    "label": "Medium (4-10 hectares)",
                    "description": "Commercial farming operations",
                    "hectare_range": [4, 10],
                    "acre_range": [9.88, 24.7],
                    "category": "medium"
                },
                {
                    "value": "large",
                    "label": "Large (Above 10 hectares)",
                    "description": "Large scale commercial farming",
                    "hectare_range": [10, 1000],
                    "acre_range": [24.7, 2470],
                    "category": "large"
                }
            ],
            "translations": {
                "en": {"label": "Farm Size Categories"},
                "hi": {
                    "label": "खेत के आकार की श्रेणियां",
                    "marginal": "सीमांत (1 हेक्टेयर से कम)",
                    "small": "छोटा (1-2 हेक्टेयर)",
                    "semi_medium": "अर्ध-मध्यम (2-4 हेक्टेयर)",
                    "medium": "मध्यम (4-10 हेक्टेयर)",
                    "large": "बड़ा (10 हेक्टेयर से अधिक)"
                },
                "ml": {
                    "label": "കൃഷിഭൂമി വലുപ്പ വിഭാഗങ്ങൾ",
                    "marginal": "നാമമാത്ര (1 ഹെക്ടറിന് താഴെ)",
                    "small": "ചെറുത് (1-2 ഹെക്ടർ)",
                    "semi_medium": "അർദ്ധ-ഇടത്തരം (2-4 ഹെക്ടർ)",
                    "medium": "ഇടത്തരം (4-10 ഹെക്ടർ)",
                    "large": "വലുത് (10 ഹെക്ടറിനു മുകളിൽ)"
                }
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Farm Size Units
        units_data = {
            "type": "farm_size_units", 
            "data": [
                {
                    "value": "acres",
                    "label": "Acres",
                    "conversion_factor": 1.0,
                    "symbol": "acres",
                    "description": "Traditional land measurement unit in India"
                },
                {
                    "value": "hectares",
                    "label": "Hectares",
                    "conversion_factor": 0.4047,
                    "symbol": "ha", 
                    "description": "Metric land measurement unit"
                }
            ],
            "translations": {
                "en": {"label": "Land Measurement Units"},
                "hi": {
                    "label": "भूमि माप इकाइयां",
                    "acres": "एकड़",
                    "hectares": "हेक्टेयर"
                },
                "ml": {
                    "label": "ഭൂമി അളക്കൽ യൂണിറ്റുകൾ",
                    "acres": "ഏക്കർ",
                    "hectares": "ഹെക്ടർ"
                }
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Insert all data
        data_collections = [
            states_data, soil_types_data, irrigation_types_data,
            seasons_data, experience_data, farm_size_data, units_data
        ]
        
        for data_collection in data_collections:
            await self.db.agricultural_data.insert_one(data_collection)
            
        print("✅ Agricultural reference data populated successfully")
        
    async def get_data_by_type(self, data_type: str, language: str = "en") -> Dict[str, Any]:
        """Get agricultural data by type with language support"""
        if self.db is None:
            await self.initialize()
            
        data = await self.db.agricultural_data.find_one({"type": data_type})
        if not data:
            return {}
            
        # Apply translations
        result = data.copy()
        if "translations" in data and language in data["translations"]:
            result["translations_applied"] = data["translations"][language]
            
        return result
        
    async def get_all_options(self, language: str = "en") -> Dict[str, Any]:
        """Get all agricultural options for dropdowns"""
        if self.db is None:
            await self.initialize()
            
        all_data = {}
        
        # Get all data types
        data_types = [
            "states_districts", "soil_types", "irrigation_types", 
            "seasons", "farming_experience", "farm_sizes", "farm_size_units"
        ]
        
        for data_type in data_types:
            data = await self.get_data_by_type(data_type, language)
            all_data[data_type] = data
            
        return all_data
        
    async def update_data(self, data_type: str, new_data: Dict[str, Any]) -> bool:
        """Update agricultural data"""
        if self.db is None:
            await self.initialize()
            
        new_data["updated_at"] = datetime.now()
        result = await self.db.agricultural_data.update_one(
            {"type": data_type},
            {"$set": new_data}
        )
        
        return result.modified_count > 0

# Global instance
agricultural_data_manager = AgriculturalDataManager()

# Utility functions for easy access
async def get_agricultural_options(language: str = "en") -> Dict[str, Any]:
    """Get all agricultural options for frontend dropdowns"""
    return await agricultural_data_manager.get_all_options(language)

async def get_states_districts(language: str = "en") -> Dict[str, Any]:
    """Get states and districts data"""
    return await agricultural_data_manager.get_data_by_type("states_districts", language)

async def get_soil_types(language: str = "en") -> List[Dict[str, Any]]:
    """Get soil types with translations"""
    data = await agricultural_data_manager.get_data_by_type("soil_types", language)
    return data.get("data", [])

async def get_irrigation_types(language: str = "en") -> List[Dict[str, Any]]:
    """Get irrigation types with translations"""
    data = await agricultural_data_manager.get_data_by_type("irrigation_types", language)
    return data.get("data", [])

async def get_seasons(language: str = "en") -> List[Dict[str, Any]]:
    """Get seasons with translations"""
    data = await agricultural_data_manager.get_data_by_type("seasons", language)
    return data.get("data", [])

async def get_farming_experience_levels(language: str = "en") -> List[Dict[str, Any]]:
    """Get farming experience levels with translations"""
    data = await agricultural_data_manager.get_data_by_type("farming_experience", language)
    return data.get("data", [])

async def get_farm_size_categories(language: str = "en") -> List[Dict[str, Any]]:
    """Get farm size categories with translations"""
    data = await agricultural_data_manager.get_data_by_type("farm_sizes", language)
    return data.get("data", [])

async def get_farm_size_units(language: str = "en") -> List[Dict[str, Any]]:
    """Get farm size units with translations"""
    data = await agricultural_data_manager.get_data_by_type("farm_size_units", language)
    return data.get("data", [])