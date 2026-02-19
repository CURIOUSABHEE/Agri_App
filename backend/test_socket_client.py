import socketio
import asyncio

async def test_socket():
    sio = socketio.AsyncClient()
    
    @sio.event
    async def connect():
        print("✅ Connected to Socket.IO server!")
        
    @sio.event
    async def disconnect():
        print("❌ Disconnected from server")

    @sio.event
    async def room_joined(data):
        print(f"✅ Joined room: {data}")

    try:
        await sio.connect('http://localhost:8000')
        print("⏳ Waiting for connection...")
        
        # Test joining a room
        await sio.emit('join_rental_room', {'district': 'Ernakulam', 'village': 'Kochi'})
        
        await sio.sleep(2)
        await sio.disconnect()
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_socket())
