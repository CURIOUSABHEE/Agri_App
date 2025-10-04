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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [language, setLanguage] = useState("en");

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
        return <Settings language={language} farmerData={farmerData} />;
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeItem={activeItem}
        setActiveItem={setActiveItem}
        isCollapsed={isSidebarCollapsed}
        language={language}
      />
      <div className="flex-1 flex flex-col">
        <AppBar
          activeItem={activeItem}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          language={language}
          toggleLanguage={toggleLanguage}
          farmerData={farmerData}
          onLogout={onLogout}
        />
        <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      </div>

      {/* Floating Chatbot - available on all pages */}
      <FloatingChatbot language={language} />
    </div>
  );
};

export default Layout;
