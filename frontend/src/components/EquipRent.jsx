import React, { useState, useEffect } from "react";
import { rentalService, authService } from "../services/api";
import { socket, connectSocket, disconnectSocket, joinRentalRoom, requestBooking } from "../services/socket";
import RentalCard from "./RentalCard";
import BookingModal from "./BookingModal";
import { toast } from "react-hot-toast";
import { MapPin, Tractor, Plus, Search, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";

function EquipRent({ language = "en" }) {
    const [activeTab, setActiveTab] = useState("rent");
    const [equipmentList, setEquipmentList] = useState([]);
    const [myListings, setMyListings] = useState([]);
    const [myBookings, setMyBookings] = useState([]);

    // Missing States Restored
    const [loading, setLoading] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        category: "",
        radius: 3 // Default 3km
    });

    // Lend Form State
    const [lendForm, setLendForm] = useState({
        name: "",
        category: "",
        description: "",
        price_per_hour: "",
        address: "",
        location: null, // {lat, lng}
        district: "",
        village: "",
        availability: []
    });

    // Tools Selection State
    const [selectedTools, setSelectedTools] = useState([]);

    const TOOL_CATEGORIES = {
        "Sowing": ["Seed Drill", "Planter", "Broadcaster", "Transplanter"],
        "Harvesting": ["Combine Harvester", "Thresher", "Reaper", "Sickle", "Mower"],
        "Tiller": ["Rotavator", "Plough", "Cultivator", "Harrow", "Leveler"],
        "Sprayer": ["Boom Sprayer", "Mist Blower", "Knapsack Sprayer", "Drone Sprayer"],
        "Fishing": ["Fishing Net", "Boat", "Fish Trap", "Aerator"],
        "Other": ["Tractor", "Generator", "Water Pump", "Trailer", "Chaff Cutter"]
    };

    // Availability Builder State
    const [availDate, setAvailDate] = useState("");
    const [availStartTime, setAvailStartTime] = useState("09:00");
    const [availEndTime, setAvailEndTime] = useState("17:00");

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await authService.getCurrentUser();
                setCurrentUser(user);

                // Connect Socket & Join Room
                connectSocket();
                if (user.district) {
                    joinRentalRoom(user.district, user.village);
                }

                // Initial Fetch
                if (user.farmer_id) {
                    fetchMyListings(user.farmer_id);
                    fetchMyBookings(user.farmer_id);
                }

                // Socket Listeners
                socket.on("booking_confirmed", (data) => {
                    toast.success(
                        <div>
                            <p className="font-bold">Booking Confirmed! ✅</p>
                            <p>Owner: {data.owner_name}</p>
                            <p>Contact: {data.owner_contact}</p>
                        </div>,
                        { duration: 5000 }
                    );
                    setSelectedEquipment(null); // Close modal
                    refreshEquipment();
                    if (currentUser) fetchMyBookings(currentUser.farmer_id);
                });

                socket.on("booking_failed", (data) => {
                    toast.error(`Booking Failed: ${data.message}`);
                });

                socket.on("slot_updated", (data) => {
                    // Update all lists
                    const updateList = (list) => list.map(eq => {
                        if (eq._id === data.equipment_id) {
                            return updateEquipmentSlot(eq, data.date, data.slot_id, data.status);
                        }
                        return eq;
                    });

                    setEquipmentList(prev => updateList(prev));
                    setMyListings(prev => updateList(prev));

                    // Also update selected equipment if open
                    setSelectedEquipment(prev => {
                        if (prev && prev._id === data.equipment_id) {
                            return updateEquipmentSlot(prev, data.date, data.slot_id, data.status);
                        }
                        return prev;
                    });
                });

            } catch (err) {
                console.error("Failed to load user or socket", err);
            }
        };

        fetchUser();

        return () => {
            socket.off("booking_confirmed");
            socket.off("booking_failed");
            socket.off("slot_updated");
            disconnectSocket();
        };
    }, []);

    const fetchMyListings = async (ownerId) => {
        try {
            const data = await rentalService.getMyListings(ownerId);
            setMyListings(data);
        } catch (err) {
            console.error("Failed to fetch listings", err);
        }
    };

    const fetchMyBookings = async (userId) => {
        try {
            const data = await rentalService.getMyBookings(userId);
            setMyBookings(data);
        } catch (err) {
            console.error("Failed to fetch bookings", err);
        }
    };

    const handleDeleteEquipment = async (equipmentId) => {
        if (!window.confirm("Are you sure you want to delete this listing?")) return;
        try {
            await rentalService.deleteEquipment(equipmentId, currentUser.farmer_id);
            toast.success("Listing deleted");
            fetchMyListings(currentUser.farmer_id);
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    // ... (updateEquipmentSlot remains same)

    const refreshEquipment = () => {
        if (userLocation) {
            handleFindNearMe();
        }
        if (currentUser) {
            fetchMyListings(currentUser.farmer_id);
            fetchMyBookings(currentUser.farmer_id);
        }
    };

    const handleFindNearMe = () => {
        setLoading(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                try {
                    // Pass category and radius to backend
                    const categoryParam = filters.category || undefined;
                    const data = await rentalService.getNearbyEquipment(latitude, longitude, filters.radius, categoryParam);

                    // Filter out own equipment
                    const filteredData = currentUser
                        ? data.filter(item => item.owner_id !== currentUser.farmer_id)
                        : data;

                    setEquipmentList(filteredData);
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to fetch nearby equipment");
                } finally {
                    setLoading(false);
                }
            }, (error) => {
                toast.error("Location access denied");
                setLoading(false);
            });
        } else {
            toast.error("Geolocation not supported");
            setLoading(false);
        }
    };

    const handleAddressSearch = async () => {
        if (!lendForm.address) return;
        try {
            setLoading(true);
            // Using Nominatim for demo purposes
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(lendForm.address)}`);
            if (response.data && response.data.length > 0) {
                const { lat, lon, address } = response.data[0];
                const district = address.county || address.district || address.city || "Unknown";
                const village = address.village || address.town || address.suburb || "Unknown";

                setLendForm(prev => ({
                    ...prev,
                    location: { lat: parseFloat(lat), lng: parseFloat(lon) },
                    district,
                    village
                }));
                toast.success(`Location found: ${village}, ${district}`);
            } else {
                toast.error("Address not found");
            }
        } catch (error) {
            console.error(error);
            toast.error("Geocoding failed");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = () => {
        if (!availDate || !availStartTime || !availEndTime) {
            toast.error("Please fill date and time range");
            return;
        }

        if (availStartTime >= availEndTime) {
            toast.error("Start time must be before end time");
            return;
        }

        setLendForm(prev => {
            const newAvailability = [...prev.availability];
            let dayIndex = newAvailability.findIndex(d => d.date === availDate);

            // Convert time to minutes for comparison
            const getMinutes = (timeStr) => {
                const [h, m] = timeStr.split(':').map(Number);
                return h * 60 + m;
            };

            const newStart = getMinutes(availStartTime);
            const newEnd = getMinutes(availEndTime);

            // Check for overlaps in existing slots for this date
            if (dayIndex >= 0) {
                const existingSlots = newAvailability[dayIndex].slots;
                const hasOverlap = existingSlots.some(slot => {
                    const slotStart = getMinutes(slot.start_time);
                    const slotEnd = getMinutes(slot.end_time);
                    return (newStart < slotEnd && newEnd > slotStart);
                });

                if (hasOverlap) {
                    toast.error("This time slot overlaps with an existing one");
                    return prev; // Return previous state without changes
                }

                newAvailability[dayIndex].slots.push({
                    id: `${availDate}_${Date.now()}`,
                    start_time: availStartTime,
                    end_time: availEndTime,
                    is_booked: false
                });

                // Sort slots chronologically
                newAvailability[dayIndex].slots.sort((a, b) => getMinutes(a.start_time) - getMinutes(b.start_time));

            } else {
                newAvailability.push({
                    date: availDate,
                    slots: [{
                        id: `${availDate}_${Date.now()}`,
                        start_time: availStartTime,
                        end_time: availEndTime,
                        is_booked: false
                    }]
                });
            }

            toast.success("Slot added!");
            return { ...prev, availability: newAvailability };
        });
    };

    const handleLendSubmit = async (e) => {
        e.preventDefault();
        if (!lendForm.location) {
            toast.error("Please set location (Address or GPS)");
            return;
        }
        if (lendForm.availability.length === 0) {
            toast.error("Please add at least one availability slot");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                owner_id: currentUser?.farmer_id || "unknown",
                owner_name: currentUser?.name || "Unknown Owner",
                owner_contact: currentUser?.phone || "",
                ...lendForm,
                // GeoJSON Point
                location: {
                    type: "Point",
                    coordinates: [lendForm.location.lng, lendForm.location.lat]
                },
                district: lendForm.district || currentUser?.district || "Unknown",
                village: lendForm.village || currentUser?.village || "Unknown",
            };

            await rentalService.addEquipment(payload);
            toast.success("Equipment listed successfully!");
            setActiveTab("rent");
            handleFindNearMe();
            setLendForm({
                name: "", category: "Tractor", description: "", price_per_hour: "",
                address: "", location: null, availability: []
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to list equipment: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmBooking = (date, slotId) => {
        if (!currentUser) {
            toast.error("Please login to book");
            return;
        }

        requestBooking({
            equipment_id: selectedEquipment._id,
            date: date,
            slot_id: slotId,
            user_id: currentUser.farmer_id,
            user_name: currentUser.name,
            user_contact: currentUser.phone
        });
    };

    const renderFilters = () => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6 transition-all duration-300">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 border p-2.5 text-sm bg-gray-50 focus:bg-white transition-all duration-200"
                    >
                        <option value="">🌐 All Categories</option>
                        <option value="Sowing">🌱 Sowing</option>
                        <option value="Harvesting">🌾 Harvesting</option>
                        <option value="Tiller">⚙️ Tiller</option>
                        <option value="Sprayer">💧 Sprayer</option>
                        <option value="Fishing">🐟 Fishing</option>
                        <option value="Other">🔧 Other</option>
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Search Radius: <span className="text-green-600 font-bold normal-case">{filters.radius} km</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={filters.radius}
                        onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-green-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>1 km</span>
                        <span>25 km</span>
                        <span>50 km</span>
                    </div>
                </div>
                <button
                    onClick={handleFindNearMe}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-2.5 rounded-xl shadow-md shadow-green-200 hover:shadow-lg hover:shadow-green-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2 font-semibold text-sm"
                >
                    {loading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                    {loading ? "Searching..." : "Search Nearby"}
                </button>
            </div>
        </div>
    );

    const renderMyListings = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-md">🚜</div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">My Equipment Listings</h2>
                    <p className="text-xs text-gray-500">{myListings.length} listing{myListings.length !== 1 ? 's' : ''} active</p>
                </div>
            </div>
            {myListings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
                    <div className="text-5xl mb-3">🚜</div>
                    <h3 className="font-semibold text-gray-600 mb-1">No listings yet</h3>
                    <p className="text-sm text-gray-400">Switch to "Lend Equipment" tab to add your first listing</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myListings.map(item => (
                        <div key={item._id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="h-44 bg-gray-100 relative overflow-hidden">
                                <img
                                    src={item.images[0] || "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=1000&auto=format&fit=crop"}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <button
                                    onClick={() => handleDeleteEquipment(item._id)}
                                    className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                                    title="Delete Listing"
                                >
                                    <span className="sr-only">Delete</span>
                                    🗑️
                                </button>
                                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                    ₹{item.price_per_hour}/hr
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-base text-gray-900 group-hover:text-green-700 transition-colors mb-0.5">{item.name}</h3>
                                <p className="text-xs text-gray-500 mb-3">{item.category}</p>

                                <div className="border-t border-gray-100 pt-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Upcoming Bookings</p>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                        {item.availability.flatMap(d => d.slots.filter(s => s.is_booked)).length === 0 && (
                                            <p className="text-xs text-gray-400 italic py-1">No bookings yet.</p>
                                        )}
                                        {item.availability.map(day =>
                                            day.slots.filter(s => s.is_booked).map(slot => (
                                                <div key={slot.id} className="text-xs bg-green-50 p-2 rounded-lg border border-green-100 flex items-center gap-2">
                                                    <span className="text-green-500">✅</span>
                                                    <div>
                                                        <p className="font-semibold text-gray-700">{day.date}</p>
                                                        <p className="text-green-700">{slot.start_time} – {slot.end_time}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderMyBookings = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-xl shadow-md">📋</div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">My Rental History</h2>
                    <p className="text-xs text-gray-500">{myBookings.length} booking{myBookings.length !== 1 ? 's' : ''} total</p>
                </div>
            </div>
            {myBookings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
                    <div className="text-5xl mb-3">📋</div>
                    <h3 className="font-semibold text-gray-600 mb-1">No rentals yet</h3>
                    <p className="text-sm text-gray-400">Browse equipment and book your first rental</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {myBookings.map((booking, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200 flex flex-col md:flex-row justify-between gap-4 group">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                                    🚜
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-700 transition-colors">{booking.name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                                            📅 {booking.date}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                                            ⏰ {booking.slot.start_time} – {booking.slot.end_time}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <span>📍</span> {booking.location?.district}, {booking.location?.village}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl min-w-[200px] border border-blue-100">
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Lender Details</p>
                                <p className="text-sm font-bold text-gray-800">{booking.owner_name}</p>
                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                                    <span>📞</span> {booking.owner_contact}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const TAB_CONFIG = [
        { id: "rent", label: "Rent Equipment", icon: "🔍" },
        { id: "lend", label: "Lend Equipment", icon: "➕" },
        { id: "my-listings", label: "My Listings", icon: "📋" },
        { id: "my-bookings", label: "My Bookings", icon: "📅" },
    ];

    return (
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 min-h-screen bg-gray-50">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 rounded-3xl p-6 mb-6 shadow-xl shadow-green-200">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
                <div className="absolute bottom-0 left-12 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                            <Tractor className="text-white h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {language === 'ml' ? 'ഉപകരണ വാടക' : 'Equip-Rent'}
                            </h1>
                            <p className="text-green-200 text-sm">Rent & lend farm equipment near you</p>
                        </div>
                    </div>

                    {/* Tab Pills */}
                    <div className="flex flex-wrap gap-1.5 bg-black/20 backdrop-blur-sm p-1.5 rounded-2xl w-full sm:w-auto border border-white/10">
                        {TAB_CONFIG.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id === "my-listings" && currentUser) fetchMyListings(currentUser.farmer_id);
                                    if (tab.id === "my-bookings" && currentUser) fetchMyBookings(currentUser.farmer_id);
                                }}
                                className={`px-3 py-2 rounded-xl font-medium transition-all duration-200 whitespace-nowrap text-sm flex items-center gap-1.5 flex-1 sm:flex-none justify-center ${activeTab === tab.id
                                        ? "bg-white text-green-700 shadow-md font-bold"
                                        : "text-white/80 hover:text-white hover:bg-white/10"
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeTab === "rent" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {renderFilters()}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {equipmentList.map(item => (
                            <RentalCard
                                key={item._id}
                                equipment={item}
                                onViewSlots={setSelectedEquipment}
                            />
                        ))}
                    </div>

                    {loading && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4">
                            <div className="w-14 h-14 border-4 border-green-100 border-t-green-500 rounded-full animate-spin" />
                            <p className="text-gray-500 font-medium">Finding equipment near you...</p>
                        </div>
                    )}
                    {equipmentList.length === 0 && !loading && (
                        <div className="col-span-full text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
                            <Tractor className="mx-auto h-14 w-14 text-gray-300 mb-3" />
                            <h3 className="font-semibold text-gray-500 mb-1">No equipment found nearby</h3>
                            <p className="text-sm text-gray-400">Try adjusting the radius or category filter, then click Search Nearby</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "lend" && (
                <div className="w-full max-w-2xl mx-auto bg-white p-4 sm:p-6 rounded-2xl shadow-md border border-gray-100 animate-in fade-in duration-300">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Plus className="text-green-600" /> List Your Equipment
                    </h2>
                    <form onSubmit={handleLendSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.keys(TOOL_CATEGORIES).map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                setLendForm({ ...lendForm, category: cat, name: "" });
                                                setSelectedTools([]);
                                            }}
                                            className={`p-2 text-sm rounded-md border transition-all ${lendForm.category === cat
                                                ? "bg-green-100 border-green-500 text-green-700 font-bold"
                                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {lendForm.category && (
                                <div className="bg-gray-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Tools for {lendForm.category}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TOOL_CATEGORIES[lendForm.category].map(tool => (
                                            <label key={tool} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTools.includes(tool)}
                                                    onChange={(e) => {
                                                        const newTools = e.target.checked
                                                            ? [...selectedTools, tool]
                                                            : selectedTools.filter(t => t !== tool);
                                                        setSelectedTools(newTools);
                                                        // Auto-generate name
                                                        const generatedName = newTools.length > 0
                                                            ? `${lendForm.category} with ${newTools.join(", ")}`
                                                            : "";
                                                        setLendForm(prev => ({ ...prev, name: generatedName }));
                                                    }}
                                                    className="rounded text-green-600 focus:ring-green-500"
                                                />
                                                <span>{tool}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Equipment Name (Auto-generated)</label>
                                <input
                                    type="text"
                                    value={lendForm.name}
                                    readOnly
                                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed shadow-sm border p-2"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price per Hour (₹)</label>
                            <input
                                type="number"
                                value={lendForm.price_per_hour}
                                onChange={e => setLendForm({ ...lendForm, price_per_hour: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                                required
                            />
                        </div>

                        {/* Location Section */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Location</label>

                            {/* Address Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter address (e.g. Village, District)"
                                    value={lendForm.address}
                                    onChange={e => setLendForm({ ...lendForm, address: e.target.value })}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm border p-2"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddressSearch}
                                    className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
                                >
                                    Find Address
                                </button>
                            </div>

                            <div className="text-center text-sm text-gray-500">- OR -</div>

                            {/* GPS Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.geolocation.getCurrentPosition((pos) => {
                                        setLendForm(prev => ({ ...prev, location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }));
                                        toast.success("GPS Location set!");
                                    });
                                }}
                                className="w-full flex justify-center items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700"
                            >
                                <MapPin className="w-4 h-4 text-red-500" /> Use Current GPS Location
                            </button>

                            {lendForm.location && (
                                <div className="text-xs text-green-600 font-medium flex items-center gap-1 mt-2">
                                    ✅ Location Selected: {lendForm.location.lat.toFixed(4)}, {lendForm.location.lng.toFixed(4)}
                                </div>
                            )}
                        </div>

                        {/* Availability Section */}
                        <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Set Availability
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                                <input
                                    type="date"
                                    value={availDate}
                                    onChange={e => setAvailDate(e.target.value)}
                                    className="rounded-md border-gray-300 border p-2 text-sm"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <input
                                    type="time"
                                    value={availStartTime}
                                    onChange={e => setAvailStartTime(e.target.value)}
                                    className="rounded-md border-gray-300 border p-2 text-sm"
                                />
                                <input
                                    type="time"
                                    value={availEndTime}
                                    onChange={e => setAvailEndTime(e.target.value)}
                                    className="rounded-md border-gray-300 border p-2 text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddSlot}
                                className="w-full bg-green-600 text-white py-1 rounded-md text-sm hover:bg-green-700"
                            >
                                + Add Slot
                            </button>

                            {/* Added Slots Preview */}
                            <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                                {lendForm.availability.length === 0 && <p className="text-xs text-gray-500">No slots added yet.</p>}
                                {lendForm.availability.map((day, idx) => (
                                    <div key={idx} className="text-xs bg-white p-2 rounded border border-green-100">
                                        <span className="font-bold block">{format(new Date(day.date), "MMM d, yyyy")}</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {day.slots.map(s => (
                                                <span key={s.id} className="bg-gray-100 px-1 rounded border">
                                                    {s.start_time}-{s.end_time}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-700 text-white py-3 rounded-lg font-bold hover:bg-green-800 transition shadow-lg mt-4"
                        >
                            {loading ? "Listing..." : "List Equipment Now"}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === "my-listings" && renderMyListings()}
            {activeTab === "my-bookings" && renderMyBookings()}

            {selectedEquipment && (
                <BookingModal
                    equipment={selectedEquipment}
                    onClose={() => setSelectedEquipment(null)}
                    onConfirm={confirmBooking}
                />
            )}
        </div>
    );
}

export default EquipRent;
