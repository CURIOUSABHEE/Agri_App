"""Disease Detection API routes"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from services.disease_detection_service import DiseaseDetectionService
import io

router = APIRouter(prefix="/api/disease-detection", tags=["disease-detection"])

# Initialize disease detection service
disease_service = DiseaseDetectionService()

@router.post("/analyze")
async def analyze_disease(
    image: UploadFile = File(...),
    crop_type: Optional[str] = Form(None),
    symptoms: Optional[str] = Form(None)
):
    """Analyze plant image for disease detection"""
    try:
        # Validate image format
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await image.read()
        
        # Analyze the disease
        analysis = await disease_service.analyze_disease(
            image_data=image_data,
            crop_type=crop_type,
            symptoms=symptoms
        )
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/diseases/{crop_type}")
async def get_common_diseases(crop_type: str):
    """Get common diseases for a specific crop type"""
    try:
        diseases = await disease_service.get_common_diseases(crop_type)
        return diseases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/treatment/{disease_id}")
async def get_treatment_recommendations(disease_id: str):
    """Get treatment recommendations for a specific disease"""
    try:
        treatment = await disease_service.get_treatment_recommendations(disease_id)
        if not treatment:
            raise HTTPException(status_code=404, detail="Disease not found")
        return treatment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prevention/{crop_type}")
async def get_prevention_tips(crop_type: str):
    """Get disease prevention tips for a crop type"""
    try:
        tips = await disease_service.get_prevention_tips(crop_type)
        return tips
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
async def submit_diagnosis_feedback(
    analysis_id: str = Form(...),
    is_correct: bool = Form(...),
    actual_disease: Optional[str] = Form(None),
    comments: Optional[str] = Form(None)
):
    """Submit feedback on disease diagnosis accuracy"""
    try:
        result = await disease_service.submit_feedback(
            analysis_id=analysis_id,
            is_correct=is_correct,
            actual_disease=actual_disease,
            comments=comments
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))