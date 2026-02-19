import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import MagicMock, AsyncMock
from main import app
from api.smart_cultivation import get_smart_cultivation_service
from models.smart_cultivation_models import SmartCultivationPlan, DailyTask

# Mock Service
mock_service = MagicMock()
mock_service.generate_plan = AsyncMock()
mock_service.save_plan = AsyncMock()
mock_service.get_active_plan = AsyncMock()

# Mock Data
mock_plan_data = {
    "user_id": "test_user_123",
    "crop_name": "Wheat, Mustard",
    "start_date": "2023-10-01",
    "status": "active",
    "intercropping_strategy": "1/3 Wheat, 2/3 Mustard for optimal yield",
    "input_details": {
        "land_area": 5.0,
        "land_unit": "acres",
        "soil_type": "Alluvial",
        "soil_ph": 6.5,
        "water_availability": "Moderate",
        "sowing_date": "2023-10-01",
        "season": "Rabi",
        "selected_crops": ["Wheat", "Mustard"],
        "location": "Punjab",
        "budget": 50000.0
    },
    "schedule": [
        {
            "day_number": 1,
            "task_name": "Soil Preparation",
            "description": "Plough the field and add manure",
            "resources_needed": ["Tractor", "Cow Dung"],
            "instructions": "Deep ploughing",
            "task_type": "soil_preparation"
        },
        {
            "day_number": 15,
            "task_name": "Sowing",
            "description": "Sow seeds in 1:2 ratio",
            "resources_needed": ["Wheat Seeds", "Mustard Seeds"],
            "instructions": "Sow in rows",
            "task_type": "sowing"
        }
    ]
}

# Override Dependency
async def get_mock_service():
    return mock_service

app.dependency_overrides[get_smart_cultivation_service] = get_mock_service

@pytest.mark.asyncio
async def test_smart_cultivation_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        
        # 1. Test Generate
        mock_service.generate_plan.return_value = SmartCultivationPlan(**mock_plan_data)
        
        payload = mock_plan_data["input_details"]
        response = await ac.post("/api/smart-cultivation/generate", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "Wheat" in data["crop_name"]
        assert len(data["schedule"]) == 2
        assert data["intercropping_strategy"] is not None
        
        # 2. Test Save
        mock_service.save_plan.return_value = "new_plan_id_123"
        
        save_response = await ac.post("/api/smart-cultivation/save", json=mock_plan_data)
        assert save_response.status_code == 200
        assert save_response.json()["success"] == True
        assert save_response.json()["plan_id"] == "new_plan_id_123"
        
        # 3. Test Get Active
        mock_service.get_active_plan.return_value = SmartCultivationPlan(**mock_plan_data)
        
        get_response = await ac.get("/api/smart-cultivation/active/test_user_123")
        assert get_response.status_code == 200
        active_plan = get_response.json()
        assert active_plan["user_id"] == "test_user_123"
        assert "Wheat" in active_plan["crop_name"]
