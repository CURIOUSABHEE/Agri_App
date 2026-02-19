import React, { useState } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { MapPin, User, Clock, Star, Zap } from "lucide-react";

function RentalCard({ equipment, onViewSlots }) {
    const { name, category, price_per_hour, location, owner_name, images } = equipment;
    const [isHovered, setIsHovered] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    // Category Images Map
    const CATEGORY_IMAGES = {
        "Tractor": "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=1000&auto=format&fit=crop",
        "Harvester": "https://plus.unsplash.com/premium_photo-1661962692059-55d5a4319814?q=80&w=1000&auto=format&fit=crop",
        "Tiller": "https://tiimg.tistatic.com/fp/1/007/574/power-tiller-for-agriculture-use-852.jpg",
        "Sprayer": "https://m.media-amazon.com/images/I/71w+o9QFCLL.jpg",
        "Sowing": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Seed_drill.jpg/1200px-Seed_drill.jpg",
        "Fishing": "https://images.unsplash.com/photo-1534313314376-a72289b6181e?q=80&w=1000&auto=format&fit=crop",
        "Other": "https://images.unsplash.com/photo-1530267981375-f0de93fe1e91?q=80&w=1000&auto=format&fit=crop"
    };

    const CATEGORY_COLORS = {
        "Tractor": "from-amber-500 to-orange-600",
        "Harvester": "from-yellow-500 to-amber-600",
        "Tiller": "from-lime-500 to-green-600",
        "Sprayer": "from-blue-500 to-cyan-600",
        "Sowing": "from-green-500 to-teal-600",
        "Fishing": "from-cyan-500 to-blue-600",
        "Other": "from-gray-500 to-slate-600",
    };

    const CATEGORY_ICONS = {
        "Tractor": "🚜",
        "Harvester": "🌾",
        "Tiller": "⚙️",
        "Sprayer": "💧",
        "Sowing": "🌱",
        "Fishing": "🐟",
        "Other": "🔧",
    };

    const imageUrl = (images && images.length > 0)
        ? images[0]
        : (CATEGORY_IMAGES[category] || CATEGORY_IMAGES["Other"]);

    const colorGradient = CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"];
    const categoryIcon = CATEGORY_ICONS[category] || "🔧";

    return (
        <div
            className={`group relative bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 ease-out cursor-pointer
                ${isHovered ? "shadow-2xl shadow-green-100 -translate-y-2 border-green-200" : "hover:shadow-lg"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container */}
            <div className="aspect-video w-full relative overflow-hidden bg-gray-100">
                {/* Shimmer skeleton while loading */}
                {!imgLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
                )}
                <img
                    src={imageUrl}
                    alt={name}
                    onLoad={() => setImgLoaded(true)}
                    className={`w-full h-full object-cover transition-transform duration-500 ease-out ${isHovered ? "scale-110" : "scale-100"} ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                />

                {/* Overlay gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`} />

                {/* Price Badge */}
                <div className={`absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-all duration-300
                    ${isHovered ? "bg-green-600 text-white scale-105" : "text-green-700"}`}>
                    ₹{price_per_hour}<span className="font-normal text-xs opacity-80">/hr</span>
                </div>

                {/* Category Badge */}
                <div className={`absolute top-3 left-3 bg-gradient-to-r ${colorGradient} text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md flex items-center gap-1`}>
                    <span>{categoryIcon}</span>
                    <span>{category}</span>
                </div>

                {/* Availability indicator */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <Zap className="w-3 h-3" />
                    <span>Available Now</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="mb-3">
                    <h3 className="font-bold text-base text-gray-900 line-clamp-1 group-hover:text-green-700 transition-colors duration-200">
                        {name}
                    </h3>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <span className="truncate font-medium text-gray-700">{owner_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        <span className="truncate text-gray-500">
                            {equipment.village}, {equipment.district}
                        </span>
                    </div>
                </div>

                {/* Divider */}
                <div className="my-3 border-t border-gray-100" />

                {/* Action Button */}
                <button
                    onClick={() => onViewSlots(equipment)}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2
                        ${isHovered
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200 scale-[1.02]"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    View Available Slots
                </button>
            </div>

            {/* Animated border bottom on hover */}
            <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 ${isHovered ? "w-full" : "w-0"}`} />
        </div>
    );
}

export default RentalCard;
