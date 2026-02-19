"""Disease detection service for plant disease analysis"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import base64

logger = logging.getLogger(__name__)

class DiseaseDetectionService:
    """Service for plant disease detection and analysis"""
    
    def __init__(self):
        # In-memory storage for analysis history (replace with database in production)
        self.analysis_history = []
        self.disease_database = self._load_disease_database()
    
    def _load_disease_database(self) -> Dict[str, Any]:
        """Load disease database with common crop diseases"""
        return {
            "tomato": {
                "common_diseases": [
                    {
                        "id": "tomato_blight",
                        "name": "Tomato Blight",
                        "scientific_name": "Phytophthora infestans",
                        "symptoms": ["Dark spots on leaves", "Yellowing", "Wilting"],
                        "severity": "High",
                        "treatment": {
                            "chemical": ["Copper oxychloride spray", "Mancozeb fungicide"],
                            "organic": ["Neem oil spray", "Baking soda solution"],
                            "cultural": ["Remove affected parts", "Improve air circulation"]
                        },
                        "prevention": [
                            "Avoid overhead watering",
                            "Ensure proper spacing",
                            "Use resistant varieties"
                        ]
                    },
                    {
                        "id": "tomato_leaf_curl",
                        "name": "Tomato Leaf Curl Virus",
                        "scientific_name": "Tomato Leaf Curl Virus",
                        "symptoms": ["Curled leaves", "Stunted growth", "Reduced fruit size"],
                        "severity": "Medium",
                        "treatment": {
                            "chemical": ["Control whitefly vectors with imidacloprid"],
                            "organic": ["Reflective mulch", "Yellow sticky traps"],
                            "cultural": ["Remove infected plants", "Control weeds"]
                        },
                        "prevention": [
                            "Use virus-free seedlings",
                            "Control whitefly population",
                            "Remove alternate hosts"
                        ]
                    }
                ]
            },
            "rice": {
                "common_diseases": [
                    {
                        "id": "rice_blast",
                        "name": "Rice Blast",
                        "scientific_name": "Magnaporthe oryzae",
                        "symptoms": ["Diamond-shaped lesions", "Grey centers", "Brown borders"],
                        "severity": "High",
                        "treatment": {
                            "chemical": ["Tricyclazole", "Carbendazim"],
                            "organic": ["Silicon application", "Potassium fertilizer"],
                            "cultural": ["Field sanitation", "Balanced nutrition"]
                        },
                        "prevention": [
                            "Use resistant varieties",
                            "Avoid excessive nitrogen",
                            "Proper water management"
                        ]
                    }
                ]
            },
            "wheat": {
                "common_diseases": [
                    {
                        "id": "wheat_rust",
                        "name": "Wheat Rust",
                        "scientific_name": "Puccinia triticina",
                        "symptoms": ["Orange pustules", "Yellowing leaves", "Reduced yield"],
                        "severity": "High",
                        "treatment": {
                            "chemical": ["Propiconazole", "Tebuconazole"],
                            "organic": ["Sulfur spray", "Copper fungicides"],
                            "cultural": ["Crop rotation", "Remove volunteer plants"]
                        },
                        "prevention": [
                            "Use resistant varieties",
                            "Early sowing",
                            "Proper field sanitation"
                        ]
                    }
                ]
            }
        }
    
    async def analyze_disease(
        self, 
        image_data: bytes, 
        crop_type: Optional[str] = None, 
        symptoms: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze plant image for disease detection"""
        try:
            # Generate analysis ID
            analysis_id = str(uuid.uuid4())
            
            # In a real implementation, this would use ML models for image analysis
            # For now, we'll simulate analysis based on crop type and symptoms
            
            analysis_result = {
                "analysis_id": analysis_id,
                "timestamp": datetime.now().isoformat(),
                "crop_type": crop_type or "unknown",
                "confidence": 0.85,  # Simulated confidence score
                "detected_diseases": [],
                "recommendations": [],
                "severity": "Medium",
                "treatment_urgency": "Moderate"
            }
            
            # Simulate disease detection based on crop type
            if crop_type and crop_type.lower() in self.disease_database:
                crop_diseases = self.disease_database[crop_type.lower()]["common_diseases"]
                if crop_diseases:
                    # Select most likely disease (in real implementation, this would be ML-based)
                    likely_disease = crop_diseases[0]
                    analysis_result["detected_diseases"] = [likely_disease]
                    analysis_result["recommendations"] = self._generate_recommendations(likely_disease)
                    analysis_result["severity"] = likely_disease["severity"]
                    
                    # Add flattened fields for frontend compatibility
                    analysis_result["disease"] = likely_disease["name"]
                    analysis_result["crop"] = crop_type # Added for frontend compatibility
                    
                    # Format treatment text
                    treatment_items = []
                    if "treatment" in likely_disease:
                        t = likely_disease["treatment"]
                        if "chemical" in t: treatment_items.extend(t["chemical"])
                        if "organic" in t: treatment_items.extend(t["organic"])
                        if "cultural" in t: treatment_items.extend(t["cultural"])
                    analysis_result["treatment"] = ". ".join(treatment_items) + "."
                    
                    # Format prevention text
                    analysis_result["prevention"] = ". ".join(likely_disease.get("prevention", [])) + "."
            else:
                # Generic response for unknown crops
                analysis_result["detected_diseases"] = [{
                    "id": "unknown_disease",
                    "name": "Possible Fungal Infection",
                    "confidence": 0.65,
                    "symptoms": ["Discoloration", "Lesions", "Wilting"],
                    "general_treatment": [
                        "Remove affected parts",
                        "Improve air circulation",
                        "Apply fungicide if necessary"
                    ]
                }]
                analysis_result["recommendations"] = [
                    "Consult local agricultural expert for proper identification",
                    "Collect sample for laboratory analysis",
                    "Monitor plant closely for symptom progression"
                ]
                
                # Add flattened fields for frontend compatibility
                analysis_result["disease"] = "Possible Fungal Infection"
                analysis_result["treatment"] = "Remove affected parts. Improve air circulation. Apply fungicide if necessary."
                analysis_result["prevention"] = "Consult local agricultural expert. Monitor plant closely."
                analysis_result["crop"] = "Unknown"
            
            # Store analysis in history
            self.analysis_history.append(analysis_result)
            
            return {
                "success": True,
                "analysis": analysis_result
            }
            
        except Exception as e:
            logger.error(f"Error analyzing disease: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_recommendations(self, disease_info: Dict[str, Any]) -> List[str]:
        """Generate treatment recommendations based on disease info"""
        recommendations = []
        
        if "treatment" in disease_info:
            treatment = disease_info["treatment"]
            
            # Add chemical treatment if available
            if "chemical" in treatment and treatment["chemical"]:
                recommendations.append(f"Chemical treatment: {', '.join(treatment['chemical'])}")
            
            # Add organic treatment
            if "organic" in treatment and treatment["organic"]:
                recommendations.append(f"Organic treatment: {', '.join(treatment['organic'])}")
            
            # Add cultural practices
            if "cultural" in treatment and treatment["cultural"]:
                recommendations.append(f"Cultural practices: {', '.join(treatment['cultural'])}")
        
        # Add prevention tips
        if "prevention" in disease_info and disease_info["prevention"]:
            recommendations.append(f"Prevention: {', '.join(disease_info['prevention'])}")
        
        return recommendations
    
    async def get_common_diseases(self, crop_type: str) -> Dict[str, Any]:
        """Get common diseases for a specific crop type"""
        try:
            crop_type_lower = crop_type.lower()
            
            if crop_type_lower in self.disease_database:
                diseases = self.disease_database[crop_type_lower]["common_diseases"]
                return {
                    "success": True,
                    "crop_type": crop_type,
                    "diseases": diseases,
                    "total": len(diseases)
                }
            else:
                return {
                    "success": False,
                    "error": f"No disease data available for {crop_type}"
                }
        except Exception as e:
            logger.error(f"Error getting common diseases: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_treatment_recommendations(self, disease_id: str) -> Optional[Dict[str, Any]]:
        """Get treatment recommendations for a specific disease"""
        try:
            # Search through all crops for the disease
            for crop_type, crop_data in self.disease_database.items():
                for disease in crop_data["common_diseases"]:
                    if disease["id"] == disease_id:
                        return {
                            "success": True,
                            "disease": disease,
                            "crop_type": crop_type,
                            "treatment_options": disease.get("treatment", {}),
                            "prevention_tips": disease.get("prevention", [])
                        }
            
            return None
        except Exception as e:
            logger.error(f"Error getting treatment recommendations: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_prevention_tips(self, crop_type: str) -> Dict[str, Any]:
        """Get disease prevention tips for a crop type"""
        try:
            crop_type_lower = crop_type.lower()
            
            if crop_type_lower in self.disease_database:
                all_tips = []
                diseases = self.disease_database[crop_type_lower]["common_diseases"]
                
                for disease in diseases:
                    if "prevention" in disease:
                        all_tips.extend(disease["prevention"])
                
                # Remove duplicates while preserving order
                unique_tips = list(dict.fromkeys(all_tips))
                
                return {
                    "success": True,
                    "crop_type": crop_type,
                    "prevention_tips": unique_tips,
                    "general_tips": [
                        "Maintain proper field hygiene",
                        "Use disease-free seeds",
                        "Follow crop rotation",
                        "Ensure proper drainage",
                        "Monitor crops regularly"
                    ]
                }
            else:
                return {
                    "success": True,
                    "crop_type": crop_type,
                    "prevention_tips": [],
                    "general_tips": [
                        "Maintain proper field hygiene",
                        "Use disease-free seeds",
                        "Follow crop rotation",
                        "Ensure proper drainage",
                        "Monitor crops regularly"
                    ]
                }
        except Exception as e:
            logger.error(f"Error getting prevention tips: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def submit_feedback(
        self,
        analysis_id: str,
        is_correct: bool,
        actual_disease: Optional[str] = None,
        comments: Optional[str] = None
    ) -> Dict[str, Any]:
        """Submit feedback on disease diagnosis accuracy"""
        try:
            # Find the analysis in history
            analysis = None
            for record in self.analysis_history:
                if record["analysis_id"] == analysis_id:
                    analysis = record
                    break
            
            if not analysis:
                return {
                    "success": False,
                    "error": "Analysis not found"
                }
            
            # Store feedback (in production, this would go to a database)
            feedback = {
                "analysis_id": analysis_id,
                "is_correct": is_correct,
                "actual_disease": actual_disease,
                "comments": comments,
                "submitted_at": datetime.now().isoformat()
            }
            
            # Add feedback to analysis record
            if "feedback" not in analysis:
                analysis["feedback"] = []
            analysis["feedback"].append(feedback)
            
            return {
                "success": True,
                "message": "Feedback submitted successfully",
                "feedback_id": str(uuid.uuid4())
            }
            
        except Exception as e:
            logger.error(f"Error submitting feedback: {e}")
            return {
                "success": False,
                "error": str(e)
            }