"""Schemes service for government agricultural schemes"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class SchemesService:
    """Service for managing government agricultural schemes"""
    
    def __init__(self):
        # In-memory storage for bookmarks (replace with database in production)
        self.bookmarked_schemes = set()
        self.schemes_data = self._load_schemes_data()
    
    def _load_schemes_data(self) -> List[Dict[str, Any]]:
        """Load schemes data (in production, this would come from a database)"""
        return [
            {
                "id": "pm-kisan-1",
                "name": "PM-KISAN",
                "full_name": "Pradhan Mantri Kisan Samman Nidhi",
                "category": "Direct Benefit Transfer",
                "description": "Income support scheme providing ₹6000 per year to small and marginal farmers",
                "benefits": "₹2000 per installment, 3 times a year",
                "eligibility": {
                    "land_holding": "up to 2 hectares",
                    "farmer_category": ["small", "marginal"],
                    "states": "All states"
                },
                "application_process": "Online registration through PM-KISAN portal",
                "documents_required": [
                    "Aadhaar Card",
                    "Land Records",
                    "Bank Account Details"
                ],
                "official_website": "https://pmkisan.gov.in",
                "launched_year": 2019,
                "ministry": "Ministry of Agriculture and Farmers Welfare"
            },
            {
                "id": "pmfby-1",
                "name": "PMFBY",
                "full_name": "Pradhan Mantri Fasal Bima Yojana",
                "category": "Crop Insurance",
                "description": "Comprehensive crop insurance scheme for farmers",
                "benefits": "Coverage against crop loss due to natural calamities",
                "eligibility": {
                    "land_holding": "All categories",
                    "farmer_category": ["small", "marginal", "large"],
                    "states": "All states"
                },
                "premium_rates": {
                    "kharif": "2% of sum insured",
                    "rabi": "1.5% of sum insured",
                    "commercial": "5% of sum insured"
                },
                "application_process": "Through banks, CSCs, or insurance companies",
                "documents_required": [
                    "Land Records",
                    "Sowing Certificate",
                    "Bank Account Details",
                    "Aadhaar Card"
                ],
                "official_website": "https://pmfby.gov.in",
                "launched_year": 2016,
                "ministry": "Ministry of Agriculture and Farmers Welfare"
            },
            {
                "id": "kcc-1",
                "name": "KCC",
                "full_name": "Kisan Credit Card",
                "category": "Credit Support",
                "description": "Flexible credit facility for farmers' cultivation needs",
                "benefits": "Easy access to credit at subsidized interest rates",
                "eligibility": {
                    "land_holding": "All categories",
                    "farmer_category": ["small", "marginal", "large"],
                    "states": "All states"
                },
                "interest_rate": "7% per annum (with subsidy)",
                "application_process": "Through scheduled banks and RRBs",
                "documents_required": [
                    "Land Records",
                    "Identity Proof",
                    "Address Proof",
                    "Bank Account Statement"
                ],
                "official_website": "https://www.nabard.org",
                "launched_year": 1998,
                "ministry": "Ministry of Agriculture and Farmers Welfare"
            }
        ]
    
    async def get_schemes(
        self, 
        category: Optional[str] = None, 
        state: Optional[str] = None, 
        eligibility: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get government agricultural schemes with filters"""
        try:
            schemes = self.schemes_data.copy()
            
            # Apply filters
            if category:
                schemes = [s for s in schemes if s["category"].lower() == category.lower()]
            
            if state:
                schemes = [
                    s for s in schemes 
                    if (isinstance(s["eligibility"].get("states"), str) and s["eligibility"]["states"].lower() == "all states") 
                    or (isinstance(s["eligibility"].get("states"), list) and state.lower() in [st.lower() for st in s["eligibility"]["states"]])
                ]
            
            if eligibility:
                schemes = [
                    s for s in schemes 
                    if eligibility.lower() in [cat.lower() for cat in s["eligibility"]["farmer_category"]]
                ]
            
            # Add bookmark status
            for scheme in schemes:
                scheme["is_bookmarked"] = scheme["id"] in self.bookmarked_schemes
            
            return {
                "success": True,
                "schemes": schemes,
                "total": len(schemes),
                "filters_applied": {
                    "category": category,
                    "state": state,
                    "eligibility": eligibility
                }
            }
        except Exception as e:
            logger.error(f"Error getting schemes: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_scheme_details(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific scheme"""
        try:
            for scheme in self.schemes_data:
                if scheme["id"] == scheme_id:
                    scheme_details = scheme.copy()
                    scheme_details["is_bookmarked"] = scheme_id in self.bookmarked_schemes
                    return {
                        "success": True,
                        "scheme": scheme_details
                    }
            return None
        except Exception as e:
            logger.error(f"Error getting scheme details: {e}")
            return {"success": False, "error": str(e)}
    
    async def bookmark_scheme(self, scheme_id: str) -> Dict[str, Any]:
        """Bookmark a scheme for easy access"""
        try:
            # Check if scheme exists
            scheme_exists = any(s["id"] == scheme_id for s in self.schemes_data)
            if not scheme_exists:
                return {"success": False, "error": "Scheme not found"}
            
            self.bookmarked_schemes.add(scheme_id)
            return {
                "success": True,
                "message": "Scheme bookmarked successfully",
                "scheme_id": scheme_id
            }
        except Exception as e:
            logger.error(f"Error bookmarking scheme: {e}")
            return {"success": False, "error": str(e)}
    
    async def remove_bookmark(self, scheme_id: str) -> Dict[str, Any]:
        """Remove scheme bookmark"""
        try:
            if scheme_id in self.bookmarked_schemes:
                self.bookmarked_schemes.remove(scheme_id)
                return {
                    "success": True,
                    "message": "Bookmark removed successfully",
                    "scheme_id": scheme_id
                }
            else:
                return {"success": False, "error": "Scheme not bookmarked"}
        except Exception as e:
            logger.error(f"Error removing bookmark: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_bookmarked_schemes(self) -> Dict[str, Any]:
        """Get user's bookmarked schemes"""
        try:
            bookmarked = [
                scheme for scheme in self.schemes_data 
                if scheme["id"] in self.bookmarked_schemes
            ]
            
            # Add bookmark status
            for scheme in bookmarked:
                scheme["is_bookmarked"] = True
            
            return {
                "success": True,
                "bookmarked_schemes": bookmarked,
                "total": len(bookmarked)
            }
        except Exception as e:
            logger.error(f"Error getting bookmarked schemes: {e}")
            return {"success": False, "error": str(e)}
    
    async def check_eligibility(
        self,
        scheme_id: str,
        farmer_category: str,
        land_size: float,
        crop_type: Optional[str] = None,
        state: str = "kerala"
    ) -> Dict[str, Any]:
        """Check eligibility for a specific scheme"""
        try:
            # Find the scheme
            scheme = None
            for s in self.schemes_data:
                if s["id"] == scheme_id:
                    scheme = s
                    break
            
            if not scheme:
                return {"success": False, "error": "Scheme not found"}
            
            eligibility_result = {
                "scheme_id": scheme_id,
                "scheme_name": scheme["name"],
                "is_eligible": True,
                "reasons": [],
                "requirements_met": [],
                "requirements_not_met": []
            }
            
            # Check farmer category eligibility
            if farmer_category.lower() not in [cat.lower() for cat in scheme["eligibility"]["farmer_category"]]:
                eligibility_result["is_eligible"] = False
                eligibility_result["requirements_not_met"].append(
                    f"Farmer category '{farmer_category}' not eligible. Required: {', '.join(scheme['eligibility']['farmer_category'])}"
                )
            else:
                eligibility_result["requirements_met"].append(f"Farmer category '{farmer_category}' is eligible")
            
            # Check land holding for specific schemes
            if scheme_id == "pm-kisan-1":  # PM-KISAN specific check
                if land_size > 2.0:  # More than 2 hectares
                    eligibility_result["is_eligible"] = False
                    eligibility_result["requirements_not_met"].append(
                        f"Land holding {land_size} hectares exceeds limit of 2 hectares for PM-KISAN"
                    )
                else:
                    eligibility_result["requirements_met"].append(f"Land holding {land_size} hectares is within limit")
            
            # State eligibility (most schemes are pan-India)
            if isinstance(scheme["eligibility"]["states"], str) and scheme["eligibility"]["states"].lower() == "all states":
                eligibility_result["requirements_met"].append("Available in all states")
            
            # Add recommendations
            if eligibility_result["is_eligible"]:
                eligibility_result["recommendation"] = f"You are eligible for {scheme['name']}. Proceed with the application process."
                eligibility_result["next_steps"] = [
                    f"Visit {scheme.get('official_website', 'the official website')}",
                    "Prepare required documents",
                    "Complete the application process"
                ]
            else:
                eligibility_result["recommendation"] = f"You are not currently eligible for {scheme['name']}. Check other available schemes."
                eligibility_result["alternative_suggestions"] = [
                    "Consider other schemes that match your profile",
                    "Contact local agriculture office for guidance"
                ]
            
            return {
                "success": True,
                "eligibility": eligibility_result
            }
            
        except Exception as e:
            logger.error(f"Error checking eligibility: {e}")
            return {"success": False, "error": str(e)}