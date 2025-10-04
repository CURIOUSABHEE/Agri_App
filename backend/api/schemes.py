"""Schemes API routes"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from services.schemes_service import SchemesService

router = APIRouter(prefix="/api/schemes", tags=["schemes"])

# Initialize schemes service
schemes_service = SchemesService()

@router.get("/")
async def get_schemes(
    category: Optional[str] = Query(None, description="Filter by scheme category"),
    state: Optional[str] = Query(None, description="Filter by state"),
    eligibility: Optional[str] = Query(None, description="Filter by eligibility criteria")
):
    """Get government agricultural schemes"""
    try:
        schemes = await schemes_service.get_schemes(
            category=category, 
            state=state, 
            eligibility=eligibility
        )
        return schemes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scheme_id}")
async def get_scheme_details(scheme_id: str):
    """Get detailed information about a specific scheme"""
    try:
        scheme_details = await schemes_service.get_scheme_details(scheme_id)
        if not scheme_details:
            raise HTTPException(status_code=404, detail="Scheme not found")
        return scheme_details
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{scheme_id}/bookmark")
async def bookmark_scheme(scheme_id: str):
    """Bookmark a scheme for easy access"""
    try:
        result = await schemes_service.bookmark_scheme(scheme_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{scheme_id}/bookmark")
async def remove_bookmark(scheme_id: str):
    """Remove scheme bookmark"""
    try:
        result = await schemes_service.remove_bookmark(scheme_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/bookmarks")
async def get_bookmarked_schemes():
    """Get user's bookmarked schemes"""
    try:
        bookmarks = await schemes_service.get_bookmarked_schemes()
        return bookmarks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/eligibility/check")
async def check_eligibility(
    scheme_id: str = Query(..., description="Scheme ID to check eligibility for"),
    farmer_category: str = Query(..., description="Farmer category (small/marginal/large)"),
    land_size: float = Query(..., description="Land size in acres"),
    crop_type: Optional[str] = Query(None, description="Primary crop type"),
    state: str = Query(..., description="Farmer's state")
):
    """Check eligibility for a specific scheme"""
    try:
        eligibility = await schemes_service.check_eligibility(
            scheme_id=scheme_id,
            farmer_category=farmer_category,
            land_size=land_size,
            crop_type=crop_type,
            state=state
        )
        return eligibility
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))