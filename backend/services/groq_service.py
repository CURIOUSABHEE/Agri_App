import os
import json
import logging
from typing import Dict, Any, List, Optional
from groq import Groq

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            logger.warning("GROQ_API_KEY not found in environment variables")
        
        self.client = Groq(api_key=self.api_key)
        self.model = "llama-3.3-70b-versatile"

    async def generate_cultivation_plan(self, crops: List[str], soil_type: str, soil_ph: Optional[float] = None, water_availability: str = "Moderate", location: str = "India", season: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates a detailed cultivation plan using Groq LLM.
        """
        try:
            crops_str = ", ".join(crops)
            is_multi_crop = len(crops) > 1

            if not is_multi_crop:
                intercropping_instruction = (
                    f"Since the farmer chose ONLY {crops_str}, do NOT suggest other crops. "
                    f"Instead describe optimal plant spacing, row arrangement, and field density for {crops_str} to maximize yield."
                )
            else:
                intercropping_instruction = (
                    f"Analyze compatibility of {crops_str}. Give the optimal planting row ratio "
                    f"(e.g., '2 rows Wheat : 1 row Chickpea') and explain why this combination works."
                )

            lifecycle_days = 120
            if any(c.lower() in ["wheat", "barley", "mustard", "gram", "chickpea"] for c in crops):
                lifecycle_days = 120
            elif any(c.lower() in ["rice", "paddy", "cotton"] for c in crops):
                lifecycle_days = 150
            elif any(c.lower() in ["maize", "corn", "soybean"] for c in crops):
                lifecycle_days = 110
            elif any(c.lower() in ["vegetable", "tomato", "brinjal", "onion"] for c in crops):
                lifecycle_days = 90

            prompt = f"""You are a world-class Agronomist creating a PRECISION FARMING PLAN.
IMPORTANT: The farmer has chosen ONLY: {crops_str}. DO NOT mention any other crop at all.

Farm Details:
- Crops: {crops_str}
- Location: {location}
- Soil Type: {soil_type}
- pH Level: {soil_ph if soil_ph else "Unknown"}
- Water Availability: {water_availability}
- Season: {season if season else "auto-detect best season"}

OUTPUT a single valid JSON object. NO text outside JSON.

{{
    "intercropping_strategy": "string. {intercropping_instruction}",
    "yield_estimate": "string. Realistic yield in kg/acre for {crops_str} under these conditions.",
    "best_practices": [
        "string - specific high-impact tip for {crops_str} yield (e.g., seed rate, variety selection)",
        "string - soil or fertilization best practice specific to {crops_str}",
        "string - irrigation or water management tip specific to {crops_str}",
        "string - pest or disease prevention specific to {crops_str}",
        "string - harvesting or post-harvest tip for {crops_str}",
        "string - additional tip for maximizing {crops_str} profitability"
    ],
    "analysis": {{
        "climate_suitability": "Explain why {location} and {season if season else 'this season'} is suitable for {crops_str}. Mention optimal temperature range ({crops_str}) and expected rainfall.",
        "soil_prep": "Step-by-step soil prep for {soil_type}: depth of ploughing, FYM/compost dose per acre, harrowing, leveling.",
        "manure_fertilizer": "Exact NPK dose for {crops_str}: basal dose at sowing, first top-dressing (timing + quantity), second top-dressing. pH {soil_ph if soil_ph else 'neutral'} amendment advice.",
        "water_management": "Number of irrigations for {crops_str}, critical stages (e.g., crown root, tillering, flowering), total water needed in acre-feet.",
        "pest_disease": "Top 3 pests/diseases of {crops_str} in {location}: name, symptoms, organic + chemical control measures."
    }},
    "tasks": [
        {{
            "day_number": 1,
            "task_name": "Specific task name for {crops_str} (e.g., 'Deep Ploughing for {crops_str}')",
            "description": "Detailed reason why this task is needed at this stage for {crops_str}",
            "resources_needed": ["specific item 1", "specific item 2"],
            "instructions": "Step-by-step instructions specific to {crops_str} growing",
            "task_type": "soil_preparation|sowing|irrigation|fertilization|protection|monitoring|harvesting|storage",
            "deep_link": "rental|market|schemes|disease_detection or null"
        }}
    ]
}}

STRICT RULES FOR tasks ARRAY:
- Cover Day 1 through Day {lifecycle_days} (full lifecycle of {crops_str}).
- EVERY task must be specific to {crops_str}. No generic names.
- Include at least one task every 2-3 days = minimum {lifecycle_days // 3} tasks.
- Key milestones to include for {crops_str}: field prep, seed treatment, sowing, first irrigation, weeding (2x), fertilizer top-dress (2-3x), disease spray schedule, knee-high/tillering/heading stage monitoring, pre-harvest check, harvest, threshing, storage.
- deep_link rules: rental for equipment tasks, market for buying seeds or selling, schemes for subsidies/insurance, disease_detection for pest/disease tasks.
- Output ALL tasks in correct chronological order.
"""

            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": f"You are an expert agronomist. Create a complete farming plan ONLY for {crops_str}. Never mention other crops. Output only JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=self.model,
                temperature=0.2,
                max_tokens=8000,
                top_p=1,
                stop=None,
                stream=False,
                response_format={"type": "json_object"}
            )

            response_content = chat_completion.choices[0].message.content
            parsed_content = json.loads(response_content)
            return parsed_content

        except Exception as e:
            logger.error(f"Error generating plan from Groq: {e}")
            return {
                "tasks": [],
                "intercropping_strategy": f"Error generating plan: {str(e)}",
                "analysis": {},
                "best_practices": []
            }

# Singleton instance
groq_service = GroqService()
