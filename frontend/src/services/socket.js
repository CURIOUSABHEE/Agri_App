import { io } from "socket.io-client";

// Initialize socket connection
// Backend is running on port 8000
const SOCKET_URL = "http://localhost:8000";

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
});

export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export const joinRentalRoom = (district, village) => {
    if (socket.connected) {
        socket.emit("join_rental_room", { district, village });
    }
};

export const requestBooking = (bookingData) => {
    if (socket.connected) {
        socket.emit("request_booking", bookingData);
    }
};
