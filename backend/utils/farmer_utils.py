"""Farmer data utilities and helper functions"""

from datetime import datetime
from typing import Dict, Any

# Sample farmer data
FARMER_DATA = {
    "name": "Rajesh Kumar",
    "location": "Wayanad, Kerala",
    "farm_size": "5.2 acres",
    "crops": ["Rice", "Coconut", "Black Pepper", "Cardamom"],
    "farming_experience": "15 years",
    "contact": {
        "phone": "+91-9876543210",
        "email": "rajesh.farmer@gmail.com"
    },
    "farm_details": {
        "soil_type": "Laterite and Alluvial",
        "irrigation": "Monsoon + Bore well",
        "organic_certified": True,
        "livestock": ["2 Cows", "5 Goats", "20 Chickens"]
    },
    "recent_activities": [
        {
            "activity": "Paddy transplanting",
            "date": "2024-01-20",
            "area": "2 acres",
            "status": "completed"
        },
        {
            "activity": "Pepper vine pruning",
            "date": "2024-01-18",
            "area": "0.5 acres",
            "status": "completed"
        },
        {
            "activity": "Coconut harvesting",
            "date": "2024-01-15",
            "quantity": "500 nuts",
            "status": "completed"
        }
    ],
    "upcoming_tasks": [
        {
            "task": "Fertilizer application for rice",
            "due_date": "2024-02-01",
            "priority": "high"
        },
        {
            "task": "Pepper harvesting",
            "due_date": "2024-02-15",
            "priority": "medium"
        }
    ]
}

def get_farmer_summary() -> Dict[str, Any]:
    """Get farmer profile summary"""
    return {
        "farmer": FARMER_DATA,
        "summary": {
            "total_crops": len(FARMER_DATA["crops"]),
            "farm_size": FARMER_DATA["farm_size"],
            "location": FARMER_DATA["location"],
            "experience": FARMER_DATA["farming_experience"],
            "organic_status": FARMER_DATA["farm_details"]["organic_certified"]
        },
        "last_updated": datetime.now().isoformat()
    }

def get_farming_tips_by_season(season: str = "monsoon") -> Dict[str, Any]:
    """Get farming tips based on season"""
    tips = {
        "monsoon": [
            "Perfect time for rice transplanting in Kerala",
            "Ensure proper drainage to prevent waterlogging",
            "Apply organic fertilizers before heavy rains",
            "Monitor crops for fungal diseases due to high humidity"
        ],
        "post_monsoon": [
            "Harvest mature rice crops",
            "Plant winter vegetables like beans, carrots",
            "Prune coconut and other fruit trees",
            "Prepare land for rabi crops"
        ],
        "summer": [
            "Focus on water conservation techniques",
            "Harvest spices like pepper, cardamom",
            "Plant shade-loving crops",
            "Maintain livestock with adequate water and shade"
        ],
        "pre_monsoon": [
            "Prepare fields for monsoon planting",
            "Repair irrigation systems",
            "Stock seeds and fertilizers",
            "Complete harvesting of summer crops"
        ]
    }
    
    return {
        "season": season,
        "tips": tips.get(season, tips["monsoon"]),
        "applicable_crops": FARMER_DATA["crops"],
        "region": "Kerala"
    }