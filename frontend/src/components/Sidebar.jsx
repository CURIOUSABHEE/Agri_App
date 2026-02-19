import React from "react";

const Sidebar = ({
  activeItem,
  setActiveItem,
  isCollapsed,
  language = "en",
}) => {
  const [location, setLocation] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState(null);

  const fetchLocation = () => {
    setIsLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          setIsLoading(false);
          console.log("Location:", { latitude, longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation({ error: "Unable to fetch location" });
          setIsLoading(false);
        }
      );
    } else {
      setLocation({ error: "Geolocation not supported" });
      setIsLoading(false);
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      name:
        language === "ml"
          ? "ഡാഷ്ബോർഡ്"
          : language === "hi"
            ? "डैशबोर्ड"
            : "Dashboard",
      icon: "🏠",
      color: "from-green-400 to-emerald-500",
    },
    {
      id: "smart-cultivation",
      name:
        language === "ml"
          ? "സ്മാർട്ട് കൃഷി"
          : language === "hi"
            ? "स्मार्ट खेती"
            : "Smart Cultivation",
      icon: "📅",
      color: "from-teal-400 to-cyan-500",
    },
    {
      id: "crops",
      name:
        language === "ml"
          ? "വിള പ്രവചനം"
          : language === "hi"
            ? "फसल भविष्यवाणी"
            : "Crop Prediction",
      icon: "🌱",
      color: "from-lime-400 to-green-500",
    },
    {
      id: "weather",
      name:
        language === "ml"
          ? "കാലാവസ്ഥ പ്രവചനം"
          : language === "hi"
            ? "मौसम पूर्वानुमान"
            : "Weather Forecast",
      icon: "🌤️",
      color: "from-sky-400 to-blue-500",
    },
    {
      id: "analytics",
      name:
        language === "ml"
          ? "വിപണി വിലകൾ"
          : language === "hi"
            ? "बाजार भाव"
            : "Market Prices",
      icon: "📊",
      color: "from-indigo-400 to-purple-500",
    },
    {
      id: "disease-detector",
      name:
        language === "ml"
          ? "രോഗ നിർണയം"
          : language === "hi"
            ? "रोग डिटेक्टर"
            : "Disease Detector",
      icon: "🔬",
      color: "from-rose-400 to-red-500",
    },
    {
      id: "inventory",
      name:
        language === "ml"
          ? "ഇൻവെന്ററി മാനേജ്മെന്റ്"
          : language === "hi"
            ? "इन्वेंट्री प्रबंधन"
            : "Inventory Management",
      icon: "📦",
      color: "from-orange-400 to-amber-500",
    },
    {
      id: "reports",
      name:
        language === "ml"
          ? "പദ്ധതികൾ"
          : language === "hi"
            ? "योजनाएं"
            : "Schemes",
      icon: "📈",
      color: "from-violet-400 to-purple-500",
    },
    {
      id: "rental",
      name:
        language === "ml"
          ? "ഉപകരണ വാടക"
          : language === "hi"
            ? "उपकरण किराया"
            : "Equipment Rental",
      icon: "🚜",
      color: "from-yellow-400 to-orange-500",
    },
    {
      id: "settings",
      name:
        language === "ml"
          ? "ക്രമീകരണങ്ങൾ"
          : language === "hi"
            ? "सेटिंग्स"
            : "Settings",
      icon: "⚙️",
      color: "from-gray-400 to-slate-500",
    },
  ];

  return (
    <div
      className={`h-full bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white shadow-2xl transition-all duration-300 ease-in-out flex flex-col ${isCollapsed ? "w-16" : "w-64"}`}
    >
      {/* Logo Section */}
      {!isCollapsed && (
        <div className="p-5 border-b border-green-700/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-green-900/40">
              🌾
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {language === "ml"
                  ? "അഗ്രിഡാഷ്"
                  : language === "hi"
                    ? "एग्रीडैश"
                    : "AgriDash"}
              </h2>
              <p className="text-xs text-green-300 font-medium">
                {language === "ml"
                  ? "കർഷക പോർട്ടൽ"
                  : language === "hi"
                    ? "किसान पोर्टल"
                    : "Farmer Portal"}
              </p>
            </div>
          </div>

          {/* Location Button */}
          <button
            onClick={fetchLocation}
            disabled={isLoading}
            className="mt-4 w-full bg-green-700/60 hover:bg-green-600/80 disabled:bg-green-800/40 text-white px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-green-600/40 hover:border-green-400/60 group"
          >
            {isLoading ? (
              <>
                <span className="animate-spin text-sm">🌍</span>
                <span className="text-green-200">
                  {language === "ml"
                    ? "എടുക്കുന്നു..."
                    : language === "hi"
                      ? "लाया जा रहा है..."
                      : "Fetching..."}
                </span>
              </>
            ) : (
              <>
                <span className="text-sm group-hover:animate-bounce">📍</span>
                <span>
                  {language === "ml"
                    ? "ലൊക്കേഷൻ എടുക്കുക"
                    : language === "hi"
                      ? "स्थान प्राप्त करें"
                      : "Fetch Location"}
                </span>
              </>
            )}
          </button>

          {location && (
            <div className="mt-3 text-xs text-green-200 bg-green-700/30 rounded-lg p-2 border border-green-600/30">
              {location.error ? (
                <p className="text-red-300 flex items-center gap-1">
                  <span>⚠️</span>
                  {language === "ml"
                    ? "ലൊക്കേഷൻ എടുക്കാൻ കഴിഞ്ഞില്ല"
                    : language === "hi"
                      ? "स्थान प्राप्त नहीं कर सका"
                      : location.error}
                </p>
              ) : (
                <div className="space-y-0.5">
                  <p className="flex items-center gap-1">
                    <span className="text-green-400">↕</span>
                    <span className="text-green-300">{language === "ml" ? "അക്ഷാംശം" : language === "hi" ? "अक्षांश" : "Lat"}:</span>
                    <span className="text-white font-medium">{location.latitude?.toFixed(4)}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="text-green-400">↔</span>
                    <span className="text-green-300">{language === "ml" ? "രേഖാംശം" : language === "hi" ? "देशांतर" : "Lng"}:</span>
                    <span className="text-white font-medium">{location.longitude?.toFixed(4)}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsed logo */}
      {isCollapsed && (
        <div className="p-4 flex justify-center border-b border-green-700/50">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center text-sm shadow-md">
            🌾
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto scrollbar-hide ${isCollapsed ? "mt-2 px-2" : "mt-3 px-3"} space-y-0.5`}>
        {menuItems.map((item, index) => {
          const isActive = activeItem === item.id;
          const isItemHovered = hoveredItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              title={isCollapsed ? item.name : ""}
              style={{ animationDelay: `${index * 30}ms` }}
              className={`
                w-full text-left transition-all duration-200 ease-out flex items-center rounded-xl relative overflow-hidden
                ${isCollapsed ? "p-3 justify-center" : "px-3 py-2.5 gap-3"}
                ${isActive
                  ? "bg-white/15 shadow-lg shadow-black/20 border border-white/20"
                  : "hover:bg-white/10 border border-transparent"
                }
              `}
            >
              {/* Active left indicator */}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-300 rounded-r-full" />
              )}

              {/* Icon bubble */}
              <div className={`
                flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-200 text-base
                ${isCollapsed ? "w-9 h-9" : "w-8 h-8"}
                ${isActive
                  ? `bg-gradient-to-br ${item.color} shadow-md`
                  : isItemHovered
                    ? "bg-white/15"
                    : "bg-white/5"
                }
              `}>
                <span>{item.icon}</span>
              </div>

              {/* Label */}
              {!isCollapsed && (
                <span className={`text-sm font-medium whitespace-nowrap transition-colors duration-200
                  ${isActive ? "text-white" : "text-green-100 group-hover:text-white"}`}>
                  {item.name}
                </span>
              )}

              {/* Active dot for collapsed */}
              {isActive && isCollapsed && (
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-green-300 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom decoration */}
      {!isCollapsed && (
        <div className="p-4 border-t border-green-700/30">
          <div className="bg-gradient-to-r from-green-700/40 to-emerald-700/40 rounded-xl p-3 border border-green-600/20">
            <p className="text-xs text-green-300 font-medium text-center">🌿 AgriDash v2.0</p>
            <p className="text-xs text-green-400/70 text-center mt-0.5">Smart Farming Portal</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
