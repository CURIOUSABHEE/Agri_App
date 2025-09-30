import React from "react";

const AppBar = ({ activeItem, toggleSidebar, language, toggleLanguage }) => {
  const getPageTitle = (item) => {
    const titles = {
      en: {
        dashboard: "Dashboard",
        crops: "Crop Prediction",
        weather: "Weather Forecast",
        analytics: "Market Prices",
        irrigation: "Irrigation",
        livestock: "Livestock Management",
        inventory: "Inventory Management",
        reports: "Schemes",
        settings: "Settings",
      },
      hi: {
        dashboard: "डैशबोर्ड",
        crops: "फसल भविष्यवाणी",
        weather: "मौसम पूर्वानुमान",
        analytics: "बाजार भाव",
        irrigation: "सिंचाई",
        livestock: "पशुधन प्रबंधन",
        inventory: "इन्वेंट्री प्रबंधन",
        reports: "योजनाएं",
        settings: "सेटिंग्स",
      },
      ml: {
        dashboard: "ഡാഷ്ബോർഡ്",
        crops: "വിള പ്രവചനം",
        weather: "കാലാവസ്ഥ പ്രവചനം",
        analytics: "വിപണി വിലകൾ",
        irrigation: "ജലസേചനം",
        livestock: "കന്നുകാലി പരിപാലനം",
        inventory: "ഇൻവെന്ററി മാനേജ്മെന്റ്",
        reports: "പദ്ധതികൾ",
        settings: "ക്രമീകരണങ്ങൾ",
      },
    };
    return (
      titles[language]?.[item] ||
      (language === "ml"
        ? "അഗ്രിഡാഷ്"
        : language === "hi"
        ? "एग्रीडैश"
        : "AgriDash")
    );
  };

  const getPageIcon = (item) => {
    const icons = {
      dashboard: "🏠",
      crops: "🌱",
      weather: "🌤️",
      analytics: "📊",
      irrigation: "💧",
      livestock: "🐄",
      inventory: "📦",
      reports: "📈",
      settings: "⚙️",
    };
    return icons[item] || "🌾";
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Toggle button and Page title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
            title="Toggle Sidebar"
          >
            <span className="text-xl">☰</span>
          </button>
          <span className="text-2xl">{getPageIcon(activeItem)}</span>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              {getPageTitle(activeItem)}
            </h1>
            <p className="text-sm text-gray-500">
              {language === "ml"
                ? `നിങ്ങളുടെ ${getPageTitle(activeItem)} കൈകാര്യം ചെയ്യുക`
                : language === "hi"
                ? `अपने ${getPageTitle(activeItem)} का प्रबंधन करें`
                : `Manage your ${getPageTitle(activeItem).toLowerCase()}`}
            </p>
          </div>
        </div>

        {/* Right side - User info and actions */}
        <div className="flex items-center space-x-4">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors duration-200"
            title={
              language === "en"
                ? "Switch to Hindi"
                : language === "hi"
                ? "Switch to Malayalam"
                : "Switch to English"
            }
          >
            <span className="text-sm font-medium">
              {language === "en"
                ? "🇮🇳 हिंदी"
                : language === "hi"
                ? "🇮🇳 മലയാളം"
                : "🇬🇧 English"}
            </span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="text-2xl">🔔</div>
            <span className="text-sm text-gray-600">
              {language === "ml"
                ? "അറിയിപ്പുകൾ"
                : language === "hi"
                ? "सूचनाएं"
                : "Notifications"}
            </span>
          </div>

          <div className="border-l border-gray-300 pl-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                JF
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-800">John Farmer</p>
                <p className="text-gray-500">Maharashtra, India</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppBar;
