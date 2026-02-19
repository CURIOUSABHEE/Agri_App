import logging
import datetime
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from models.smart_cultivation_models import SmartCultivationPlan, DailyTask, SmartCultivationRequest
from services.groq_service import groq_service
from services.weather_service import WeatherService

logger = logging.getLogger(__name__)

class SmartCultivationService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.smart_cultivations
        self.weather_service = WeatherService()
    
    async def generate_plan(self, request: SmartCultivationRequest) -> SmartCultivationPlan:
        """
        Generates a smart cultivation plan based on inputs.
        Does NOT save to DB yet (preview mode).
        """
        # 1. Generate base plan from Groq
        groq_response = await groq_service.generate_cultivation_plan(
            crops=request.selected_crops,
            soil_type=request.soil_type,
            soil_ph=request.soil_ph,
            water_availability=request.water_availability,
            location=request.location or "Kerala",
            season=request.season
        )
        groq_tasks = groq_response.get("tasks", [])
        intercropping_strategy = groq_response.get("intercropping_strategy")
        yield_estimate = groq_response.get("yield_estimate")
        analysis = groq_response.get("analysis", {})
        best_practices = groq_response.get("best_practices", [])
        
        # 2. Process tasks and map to dates
        start_date = datetime.datetime.strptime(request.sowing_date, "%Y-%m-%d")
        processed_tasks = []
        
        # Map existing Groq tasks to a dictionary by day number for easier checking
        task_map = {task.get("day_number"): task for task in groq_tasks}
        
        # Determine the full duration (e.g., 120 days or max day from Groq)
        max_day = max([task.get("day_number", 0) for task in groq_tasks] + [120]) # Default to at least 120 days
        
        # Weather Integration (Mock for now or use real)
        weather_forecast = {}
        if request.location:
             weather_res = self.weather_service.get_weather_forecast(city=request.location, days=5)
             if weather_res.get("success"):
                 for day in weather_res.get("data", {}).get("forecast", []):
                     w_date = day["date"].split(" ")[0]
                     weather_forecast[w_date] = day

        # Iterate through every single day of the lifecycle
        for day_num in range(1, max_day + 1):
            task_date = start_date + datetime.timedelta(days=day_num - 1)
            date_str = task_date.strftime("%Y-%m-%d")
            
            # Check if Groq provided a task for this day
            if day_num in task_map:
                task_data = task_map[day_num]
                
                # Weather Integration check
                weather_note = None
                if date_str in weather_forecast:
                    w_data = weather_forecast[date_str]
                    desc = w_data.get("description", "")
                    rain_prob = w_data.get("precipitation_chance", 0)
                    weather_note = f"Forecast: {desc}"
                    
                    # Intelligent Adjustment Logic
                    task_type = task_data.get("task_type", "").lower()
                    if "irrigation" in task_type and ("rain" in desc.lower() or rain_prob > 50):
                        task_data["status"] = "skipped"
                        task_data["instructions"] += " [AUTO-UPDATE] Rain predicted. Irrigation may not be needed."
                        weather_note += " (Rain expected)"
                
                daily_task = DailyTask(
                    day_number=task_data.get("day_number"),
                    date=date_str,
                    task_name=task_data.get("task_name"),
                    description=task_data.get("description"),
                    resources_needed=task_data.get("resources_needed"),
                    instructions=task_data.get("instructions"),
                    task_type=task_data.get("task_type", "general"),
                    weather_condition=weather_note,
                    deep_link=task_data.get("deep_link")
                )
                processed_tasks.append(daily_task)
            else:

                # FILLER TASK: Intelligent gap filling based on lifecycle stage
                stage_progress = day_num / max_day
                
                filler_name = "Field Observation"
                filler_desc = "Routine check of crop health."
                filler_instr = "Walk through the fields looking for general health indicators."
                filler_type = "monitoring"
                filler_link = None
                
                if stage_progress < 0.2:
                    filler_name = "Seedling Health Check"
                    filler_desc = "Monitor germination and early growth."
                    filler_instr = "Check for damping off disease. Ensure soil moisture is adequate for young roots."
                    filler_type = "monitoring"
                elif stage_progress < 0.5:
                    filler_name = "Weed & Pest Patrol"
                    filler_desc = "Critical growth phase monitoring."
                    filler_instr = "Look for early signs of pests under leaves. Remove competitive weeds manually if possible."
                    filler_type = "protection"
                    filler_link = "disease_detection"
                elif stage_progress < 0.8:
                    filler_name = "Water & Nutrient Check"
                    filler_desc = "Mid-season growth maintenance."
                    filler_instr = "Check soil moisture depth. Look for yellowing leaves indicating nutrient deficiency."
                    filler_type = "irrigation"
                else:
                    filler_name = "Pre-Harvest Inspection"
                    filler_desc = "Maturation and readiness check."
                    filler_instr = "Check grain/fruit maturity. Plan specifically for labor and equipment needs."
                    filler_type = "harvesting"
                    filler_link = "market"

                processed_tasks.append(DailyTask(
                    day_number=day_num,
                    date=date_str,
                    task_name=filler_name,
                    description=filler_desc,
                    instructions=filler_instr,
                    task_type=filler_type,
                    resources_needed=["Visual Inspection"],
                    status="pending",
                    deep_link=filler_link
                ))
            
        # 3. Create Plan Object
        plan = SmartCultivationPlan(
            user_id=request.user_id if request.user_id else "temp_user",
            crop_name=", ".join(request.selected_crops),
            start_date=request.sowing_date,
            end_date=processed_tasks[-1].date if processed_tasks else None,
            input_details=request,
            schedule=processed_tasks,
            intercropping_strategy=intercropping_strategy,
            yield_estimate=yield_estimate,
            analysis=analysis,
            best_practices=best_practices
        )
        
        return plan

    async def save_plan(self, plan: SmartCultivationPlan) -> str:
        """Saves a confirmed plan to MongoDB"""
        plan_dict = plan.dict()
        # Remove plan_id if None so Mongo generates it
        if plan_dict.get("plan_id") is None:
            del plan_dict["plan_id"]
        
        result = await self.collection.insert_one(plan_dict)
        return str(result.inserted_id)

    async def get_active_plan(self, user_id: str) -> Optional[SmartCultivationPlan]:
        """Gets the most recent active plan for a user"""
        doc = await self.collection.find_one(
            {"user_id": user_id, "status": "active"},
            sort=[("created_at", -1)]
        )
        if doc:
            doc["plan_id"] = str(doc["_id"])
            return SmartCultivationPlan(**doc)
        return None

    async def get_plan_by_id(self, plan_id: str) -> Optional[SmartCultivationPlan]:
        try:
            doc = await self.collection.find_one({"_id": ObjectId(plan_id)})
            if doc:
                doc["plan_id"] = str(doc["_id"])
                return SmartCultivationPlan(**doc)
            return None
            return None
        except Exception:
            return None

    async def get_all_plans(self, user_id: str) -> List[SmartCultivationPlan]:
        """Gets all plans for a user"""
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1)
        plans = []
        async for doc in cursor:
            doc["plan_id"] = str(doc["_id"])
            plans.append(SmartCultivationPlan(**doc))
        return plans

