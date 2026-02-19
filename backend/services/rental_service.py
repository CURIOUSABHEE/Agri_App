import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List, Optional
from models.rental_models import Equipment, BookingRequest

logger = logging.getLogger(__name__)

class RentalService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.equipments

    async def initialize_indexes(self):
        """Create 2dsphere index for geospatial queries"""
        try:
            await self.collection.create_index([("location", "2dsphere")])
            logger.info("Created 2dsphere index for equipments collection")
        except Exception as e:
            logger.error(f"Error creating index: {e}")

    async def add_equipment(self, equipment_data: dict) -> str:
        """Add new equipment to the database"""
        result = await self.collection.insert_one(equipment_data)
        return str(result.inserted_id)

    async def get_nearby_equipment(self, lat: float, lng: float, radius_km: float = 50.0, category: str = None) -> List[dict]:
        """Find equipment within radius using geospatial query with optional category filter"""
        try:
            # MongoDB expects coordinates in [longitude, latitude] order
            query = {
                "location": {
                    "$near": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [lng, lat]
                        },
                        "$maxDistance": radius_km * 1000  # Convert km to meters
                    }
                }
            }
            
            if category:
                query["category"] = category

            
            cursor = self.collection.find(query)
            equipments = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                equipments.append(doc)
            
            return equipments
        except Exception as e:
            logger.error(f"Error finding nearby equipment: {e}")
            return []

    async def get_equipment_by_id(self, equipment_id: str) -> Optional[dict]:
        try:
            doc = await self.collection.find_one({"_id": ObjectId(equipment_id)})
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        except Exception:
            return None

    async def book_slot(self, booking_request: BookingRequest) -> dict:
        """
        Atomically book a slot.
        Returns:
            - success: boolean
            - message: str
            - owner_contact: str (if successful)
            - slot_details: dict
        """
        try:
            equipment_id = ObjectId(booking_request.equipment_id)
            date = booking_request.date
            slot_id = booking_request.slot_id

            # Atomic update: set is_booked=True ONLY IF it is currently False
            result = await self.collection.update_one(
                {
                    "_id": equipment_id,
                    "availability": {
                        "$elemMatch": {
                            "date": date,
                            "slots.id": slot_id,
                            "slots.is_booked": False
                        }
                    }
                },
                {
                    "$set": {
                        "availability.$[outer].slots.$[inner].is_booked": True,
                        "availability.$[outer].slots.$[inner].booked_by": booking_request.user_id
                    }
                },
                array_filters=[
                    {"outer.date": date},
                    {"inner.id": slot_id}
                ]
            )

            if result.modified_count == 1:
                # Booking successful, retrieve owner contact
                equipment = await self.collection.find_one({"_id": equipment_id})
                return {
                    "success": True, 
                    "message": "Booking confirmed!",
                    "owner_contact": equipment.get("owner_contact"),
                    "equipment_name": equipment.get("name"),
                    "owner_name": equipment.get("owner_name")
                }
            else:
                return {
                    "success": False, 
                    "message": "Slot already booked or unavailable."
                }

        except Exception as e:
            logger.error(f"Booking error: {e}")
            return {"success": False, "message": str(e)}

    async def get_equipment_by_owner(self, owner_id: str) -> List[dict]:
        """Get all equipment listed by a specific owner"""
        try:
            cursor = self.collection.find({"owner_id": owner_id})
            equipments = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                equipments.append(doc)
            return equipments
        except Exception as e:
            logger.error(f"Error fetching owner equipment: {e}")
            return []

    async def get_bookings_by_user(self, user_id: str) -> List[dict]:
        """Get all bookings made by a specific user"""
        try:
            # tailored query to find where user has booked a slot
            query = {
                "availability": {
                    "$elemMatch": {
                        "slots": {
                            "$elemMatch": {
                                "booked_by": user_id
                            }
                        }
                    }
                }
            }
            cursor = self.collection.find(query)
            bookings = []
            async for doc in cursor:
                # We need to extract the specific slots booked by this user
                equipment_info = {
                    "equipment_id": str(doc["_id"]),
                    "name": doc["name"],
                    "owner_name": doc["owner_name"],
                    "owner_contact": doc["owner_contact"],
                    "location": doc["location"],
                    "images": doc.get("images", []),
                    "district": doc.get("district"),
                    "village": doc.get("village")
                }
                
                for day in doc["availability"]:
                    for slot in day["slots"]:
                        if slot.get("booked_by") == user_id:
                            bookings.append({
                                **equipment_info,
                                "date": day["date"],
                                "slot": slot
                            })
            return bookings
        except Exception as e:
            logger.error(f"Error fetching user bookings: {e}")
            return []

    async def delete_equipment(self, equipment_id: str, owner_id: str) -> bool:
        """Delete equipment listing (only if owned by requester)"""
        try:
            result = await self.collection.delete_one({
                "_id": ObjectId(equipment_id),
                "owner_id": owner_id
            })
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting equipment: {e}")
            return False
