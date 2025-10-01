import React from "react";

const Sidebar = ({
  activeItem,
  setActiveItem,
  isCollapsed,
  language = "en",
}) => {
  const [location, setLocation] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

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
    },
  ];

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-green-800 text-white min-h-screen shadow-lg transition-all duration-300`}
    >
      {!isCollapsed && (
        <div className="p-6 border-b border-green-700">
          <h2 className="text-xl font-bold text-white">
            🌾{" "}
            {language === "ml"
              ? "അഗ്രിഡാഷ്"
              : language === "hi"
              ? "एग्रीडैश"
              : "AgriDash"}
          </h2>
          <p className="text-sm text-green-200">
            {language === "ml"
              ? "കർഷക പോർട്ടൽ"
              : language === "hi"
              ? "किसान पोर्टल"
              : "Farmer Portal"}
          </p>

          <button
            onClick={fetchLocation}
            disabled={isLoading}
            className="mt-4 w-full bg-green-600 hover:bg-green-500 disabled:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">🌍</span>
                <span>
                  {language === "ml"
                    ? "എടുക്കുന്നു..."
                    : language === "hi"
                    ? "लाया जा रहा है..."
                    : "Fetching..."}
                </span>
              </>
            ) : (
              <>
                <span>📍</span>
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
            <div className="mt-3 text-xs text-green-200">
              {location.error ? (
                <p className="text-red-300">
                  {language === "ml"
                    ? "ലൊക്കേഷൻ എടുക്കാൻ കഴിഞ്ഞില്ല"
                    : language === "hi"
                    ? "स्थान प्राप्त नहीं कर सका"
                    : location.error}
                </p>
              ) : (
                <div>
                  <p>
                    {language === "ml"
                      ? "അക്ഷാംശം"
                      : language === "hi"
                      ? "अक्षांश"
                      : "Lat"}
                    : {location.latitude?.toFixed(4)}
                  </p>
                  <p>
                    {language === "ml"
                      ? "രേഖാംശം"
                      : language === "hi"
                      ? "देशांतर"
                      : "Lng"}
                    : {location.longitude?.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <nav className={isCollapsed ? "mt-4" : "mt-6"}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveItem(item.id)}
            className={`w-full text-left hover:bg-green-700 transition-colors duration-200 flex items-center ${
              isCollapsed ? "px-4 py-4 justify-center" : "px-6 py-3 space-x-3"
            } ${
              activeItem === item.id
                ? "bg-green-700 border-r-4 border-green-300"
                : ""
            }`}
            title={isCollapsed ? item.name : ""}
          >
            <span className="text-lg">{item.icon}</span>
            {!isCollapsed && <span>{item.name}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
