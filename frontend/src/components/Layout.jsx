import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import AppBar from "./AppBar";
import Schemes from "./Schemes";
import MarketPrices from "./MarketPrices";
import WeatherForecast from "./WeatherForecast";
import InventoryManagement from "./InventoryManagement";
import DiseaseDetector from "./DiseaseDetector";
import CropPrediction from "./CropPrediction";
import Settings from "./Settings";
import FloatingChatbot from "./FloatingChatbot";

const Layout = ({ farmerData, onLogout }) => {
  const [activeItem, setActiveItem] = useState("dashboard");
  // Initialize collapsed state based on screen width
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 768);
  const [language, setLanguage] = useState("en");

  // Update effect to handle resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      if (prev === "en") return "hi";
      if (prev === "hi") return "ml";
      return "en";
    });
  };

  const renderContent = () => {
    switch (activeItem) {
      case "dashboard":
        return <Dashboard language={language} />;
      case "crops":
        return <CropPrediction language={language} />;
      case "reports":
        return <Schemes language={language} />;
      case "analytics":
        return <MarketPrices language={language} />;
      case "weather":
        return <WeatherForecast language={language} />;
      case "disease-detector":
        return <DiseaseDetector language={language} />;
      case "inventory":
        return <InventoryManagement language={language} />;
      case "settings":
        return <Settings language={language} />;
      default:
        return (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {language === "ml"
                  ? "ഉടൻ വരുന്നു"
                  : language === "hi"
                    ? "जल्द आ रहा है"
                    : "Coming Soon"}
              </h2>
              <p className="text-gray-600">
                {language === "ml"
                  ? "ഈ ഫീച്ചർ വികസിപ്പിച്ചുകൊണ്ടിരിക്കുന്നു, ഉടൻ ലഭ്യമാകും."
                  : language === "hi"
                    ? "यह सुविधा विकसित की जा रही है और जल्द ही उपलब्ध होगी।"
                    : "This feature is under development and will be available soon."}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Mobile Backdrop */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-30 h-full transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarCollapsed ? "-translate-x-full md:translate-x-0 md:w-16" : "translate-x-0 w-64"
          }`}
      >
        <Sidebar
          activeItem={activeItem}
          setActiveItem={(item) => {
            setActiveItem(item);
            // Close sidebar on mobile when item selected
            if (window.innerWidth < 768) {
              setIsSidebarCollapsed(true);
            }
          }}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={!isSidebarCollapsed}
          language={language}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
        <AppBar
          activeItem={activeItem}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          language={language}
          toggleLanguage={toggleLanguage}
          farmerData={farmerData}
          onLogout={onLogout}
        />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          {renderContent()}
        </div>
      </div>

      {/* Floating Chatbot - available on all pages */}
      <FloatingChatbot language={language} />
    </div>
  );
};

export default Layout;
