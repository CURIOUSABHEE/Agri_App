import React, { useState, useEffect } from "react";

const AppBar = ({
  activeItem,
  toggleSidebar,
  language,
  toggleLanguage,
  farmerData,
  onLogout,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Handle logout with confirmation
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Handle Escape key to close dialog
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && showLogoutConfirm) {
        cancelLogout();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showLogoutConfirm]);

  // Helper function to get farmer's initials
  const getFarmerInitials = () => {
    if (!farmerData?.name) return "F";
    const names = farmerData.name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].slice(0, 2).toUpperCase();
  };

  // Helper function to get farmer's display name
  const getFarmerDisplayName = () => {
    return farmerData?.name || "Farmer";
  };

  // Helper function to get farmer's location
  const getFarmerLocation = () => {
    const district = farmerData?.district;
    const state = farmerData?.state;

    if (!district && !state) return "India";
    if (!district && state) return `${state}, India`;
    if (district && !state) return `${district}, India`;

    return `${district}, ${state}, India`;
  };

  const getPageTitle = (item) => {
    const titles = {
      en: {
        dashboard: "Dashboard",
        crops: "Crop Prediction",
        weather: "Weather Forecast",
        analytics: "Market Prices",
        "disease-detector": "Disease Detector",
        chatbot: "AgriBot Assistant",
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
        "disease-detector": "रोग डिटेक्टर",
        chatbot: "कृषि सहायक",
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
        "disease-detector": "രോഗ നിർണയം",
        chatbot: "കൃഷി സഹായി",
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
      "disease-detector": "🔬",
      chatbot: "🤖",
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

          {/* User Profile Section */}
          <div className="border-l border-gray-300 pl-4">
            <div className="flex items-center space-x-3">
              {/* User Avatar and Info */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {getFarmerInitials()}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-800">
                    {getFarmerDisplayName()}
                  </p>
                  <p className="text-gray-500">{getFarmerLocation()}</p>
                </div>
              </div>

              {/* Logout Button */}
              {onLogout && (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-md transition-colors duration-200 border border-red-200"
                  title={
                    language === "ml"
                      ? "ലോഗ് ഔട്ട് ചെയ്യുക"
                      : language === "hi"
                      ? "लॉग आउट करें"
                      : "Logout"
                  }
                >
                  <span className="text-sm">🚪</span>
                  <span className="text-sm font-medium">
                    {language === "ml"
                      ? "ലോഗ് ഔട്ട്"
                      : language === "hi"
                      ? "लॉग आउट"
                      : "Logout"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="text-center">
              <div className="text-4xl mb-4">🚪</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === "ml"
                  ? "ലോഗ് ഔട്ട് ചെയ്യുക?"
                  : language === "hi"
                  ? "लॉग आउट करें?"
                  : "Logout?"}
              </h3>
              <p className="text-gray-600 mb-6">
                {language === "ml"
                  ? "നിങ്ങൾ ലോഗ് ഔട്ട് ചെയ്യാൻ ആഗ്രഹിക്കുന്നുണ്ടോ? നിങ്ങൾക്ക് വീണ്ടും ലോഗിൻ ചെയ്യേണ്ടതുണ്ട്."
                  : language === "hi"
                  ? "क्या आप लॉग आउट करना चाहते हैं? आपको फिर से लॉगिन करना होगा।"
                  : "Are you sure you want to logout? You'll need to login again to access the app."}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200"
                >
                  {language === "ml"
                    ? "റദ്ദാക്കുക"
                    : language === "hi"
                    ? "रद्द करें"
                    : "Cancel"}
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
                >
                  {language === "ml"
                    ? "ലോഗ് ഔട്ട്"
                    : language === "hi"
                    ? "लॉग आउट"
                    : "Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppBar;
