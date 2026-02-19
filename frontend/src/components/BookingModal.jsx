import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "./ui/Button";

function BookingModal({ equipment, onClose, onConfirm }) {
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Extract available dates
    const availableDates = equipment.availability?.map(a => a.date) || [];

    // Set default first date
    useEffect(() => {
        if (availableDates.length > 0 && !selectedDate) {
            setSelectedDate(availableDates[0]);
        }
    }, [availableDates, selectedDate]);

    // get slots for selected date
    const currentSlots = equipment.availability?.find(a => a.date === selectedDate)?.slots || [];

    const handleBooking = () => {
        if (selectedDate && selectedSlot) {
            onConfirm(selectedDate, selectedSlot);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>

                <h2 className="text-xl font-bold mb-4">Book {equipment.name}</h2>

                {/* Date Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {availableDates.map(date => (
                            <button
                                key={date}
                                onClick={() => {
                                    setSelectedDate(date);
                                    setSelectedSlot(null);
                                }}
                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors
                  ${selectedDate === date
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {format(new Date(date), "MMM d, EEE")}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Slot Selection */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot</label>
                    {currentSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                            {currentSlots.map(slot => (
                                <button
                                    key={slot.id}
                                    disabled={slot.is_booked}
                                    onClick={() => setSelectedSlot(slot.id)}
                                    className={`p-3 rounded-lg border text-sm transition-all
                    ${slot.is_booked
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                                            : selectedSlot === slot.id
                                                ? "border-green-600 bg-green-50 text-green-700 font-medium ring-1 ring-green-600"
                                                : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                                        }
                  `}
                                >
                                    <div className="flex justify-between items-center">
                                        <span>{slot.start_time} - {slot.end_time}</span>
                                        {slot.is_booked && <span className="text-xs">Booked</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No slots available for this date.</p>
                    )}
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleBooking}
                        disabled={!selectedSlot}
                        className="flex-1"
                    >
                        Confirm Booking
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default BookingModal;
