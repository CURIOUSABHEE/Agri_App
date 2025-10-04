"""Location and mapping utilities"""

# Kerala districts for location-based weather (using API-friendly names)
KERALA_DISTRICTS = [
    "Trivandrum", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
    "Idukki", "Kochi", "Thrissur", "Palakkad", "Malappuram", 
    "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
]

# District name mapping for API compatibility
DISTRICT_NAME_MAPPING = {
    "thiruvananthapuram": "Trivandrum",
    "ernakulam": "Kochi",
    "calicut": "Kozhikode",
    "trichur": "Thrissur"
}

def detect_kerala_location(message: str) -> str:
    """Detect Kerala district/location from user message"""
    message_lower = message.lower()
    
    # First check if there's a mapped name
    for local_name, api_friendly in DISTRICT_NAME_MAPPING.items():
        if local_name in message_lower:
            return f"{api_friendly}, Kerala, India"
    
    # Check for Kerala districts mentioned in the message
    for district in KERALA_DISTRICTS:
        if district.lower() in message_lower:
            return f"{district}, Kerala, India"
    
    # Default to Kochi if no specific location found
    return "Kochi, Kerala, India"

def get_api_friendly_location(location_name: str) -> str:
    """Convert location name to API-friendly format"""
    location_lower = location_name.lower()
    
    # Check mapping first
    if location_lower in DISTRICT_NAME_MAPPING:
        return DISTRICT_NAME_MAPPING[location_lower]
    
    # Check if it's already a valid district
    for district in KERALA_DISTRICTS:
        if district.lower() == location_lower:
            return district
    
    # Default fallback
    return "Kochi"