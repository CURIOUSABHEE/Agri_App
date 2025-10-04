"""Response formatting utilities"""

from typing import Any, Dict, Optional
from datetime import datetime

def create_success_response(
    data: Any = None, 
    message: str = "Success", 
    **kwargs
) -> Dict[str, Any]:
    """Create a standardized success response"""
    response = {
        "success": True,
        "timestamp": datetime.now().isoformat()
    }
    
    if data is not None:
        response["data"] = data
    
    if message != "Success":
        response["message"] = message
    
    # Add any additional fields
    response.update(kwargs)
    
    return response

def create_error_response(
    error: str,
    code: Optional[str] = None,
    details: Optional[Dict] = None
) -> Dict[str, Any]:
    """Create a standardized error response"""
    response = {
        "success": False,
        "error": error,
        "timestamp": datetime.now().isoformat()
    }
    
    if code:
        response["error_code"] = code
    
    if details:
        response["details"] = details
    
    return response

def create_paginated_response(
    data: list,
    total: int,
    page: int = 1,
    per_page: int = 10
) -> Dict[str, Any]:
    """Create a paginated response"""
    return create_success_response(
        data=data,
        pagination={
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    )