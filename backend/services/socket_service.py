import socketio
import logging
from services.rental_service import RentalService
from models.rental_models import BookingRequest

logger = logging.getLogger(__name__)

# Initialize Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

class SocketService:
    def __init__(self, rental_service: RentalService):
        self.rental_service = rental_service
        self.setup_handlers()

    def setup_handlers(self):
        @sio.event
        async def connect(sid, environ):
            logger.info(f"Client connected: {sid}")

        @sio.event
        async def disconnect(sid):
            logger.info(f"Client disconnected: {sid}")

        @sio.event
        async def join_rental_room(sid, data):
            """
            Join a room based on district/village.
            Data: {'district': '...', 'village': '...'}
            """
            district = data.get('district')
            village = data.get('village')
            
            if district:
                room_name = f"rental_{district}"
                sio.enter_room(sid, room_name)
                logger.info(f"Client {sid} joined room: {room_name}")
                await sio.emit('room_joined', {'room': room_name}, to=sid)

        @sio.event
        async def request_booking(sid, data):
            """
            Handle booking request.
            Data: {
                'equipment_id': '...',
                'date': 'YYYY-MM-DD',
                'slot_id': '...',
                'user_id': '...',
                'user_name': '...',
                'user_contact': '...'
            }
            """
            try:
                # Validate and convert data to Pydantic model
                booking_request = BookingRequest(**data)
                
                # Call rental service to attempt booking
                result = await self.rental_service.book_slot(booking_request)

                if result['success']:
                    # Emit confirmation to the requester
                    await sio.emit('booking_confirmed', {
                        'message': 'Booking successful!',
                        'owner_contact': result['owner_contact'],
                        'owner_name': result.get('owner_name', 'Owner'),
                        'equipment_name': result.get('equipment_name', 'Equipment'),
                        'slot_id': data['slot_id']
                    }, to=sid)

                    # Broadcast update to everyone in the same area/room
                    # We need to know which room to broadcast to. 
                    # Ideally, the client sends context or we look it up.
                    # For simplicity, we can broadcast to all rooms the equipment belongs to.
                    # But simpler approach: client sends location context in request_booking too.
                    # Or we fetch the equipment to know its location.
                    
                    equipment = await self.rental_service.get_equipment_by_id(data['equipment_id'])
                    if equipment:
                        district = equipment.get('district')
                        room_name = f"rental_{district}"
                        
                        # Emit to room EXCLUDING the sender (or including, handled by frontend state)
                        await sio.emit('slot_updated', {
                            'equipment_id': data['equipment_id'],
                            'date': data['date'],
                            'slot_id': data['slot_id'],
                            'status': 'booked'
                        }, room=room_name, skip_sid=sid)
                        
                else:
                    await sio.emit('booking_failed', {'message': result['message']}, to=sid)

            except Exception as e:
                logger.error(f"Socket booking error: {e}")
                await sio.emit('booking_error', {'message': str(e)}, to=sid)
