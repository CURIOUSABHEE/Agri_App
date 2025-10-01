import React, { useState } from "react";
import Chatbot from "./Chatbot";

const FloatingChatbot = ({ language = "en" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const translations = {
    en: {
      openChat: "Open AgriBot",
      closeChat: "Close Chat",
    },
    hi: {
      openChat: "कृषि बॉट खोलें",
      closeChat: "चैट बंद करें",
    },
    ml: {
      openChat: "കൃഷി ബോട്ട് തുറക്കുക",
      closeChat: "ചാറ്റ് അടയ്ക്കുക",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse"
            title={t.openChat}
          >
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🤖</span>
              <span className="hidden sm:block font-bold text-lg">
                {language === "ml"
                  ? "കൃഷി സാഥി"
                  : language === "hi"
                  ? "कृषि साथी"
                  : "Krishi Saathi"}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Window - Responsive Sizing */}
      {isOpen && (
        <div
          className="fixed inset-4 md:bottom-6 md:right-6 md:top-auto md:left-auto z-50 
                        w-full h-full md:w-1/4 md:h-3/4 md:min-w-[400px] md:max-w-[500px]
                        bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden
                        rounded-none md:rounded-lg"
        >
          {/* Chat Header */}
          <div className="bg-green-500 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🤖</span>
              <div>
                <span className="font-bold text-lg">
                  {language === "ml"
                    ? "കൃഷി സാഥി"
                    : language === "hi"
                    ? "कृषि साथी"
                    : "Krishi Saathi"}
                </span>
                <p className="text-green-100 text-sm">
                  {language === "ml"
                    ? "കൃഷി സഹായി"
                    : language === "hi"
                    ? "कृषि सहायक"
                    : "Farming Assistant"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors text-xl font-bold p-1"
              title={t.closeChat}
            >
              ✕
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 min-h-0">
            <Chatbot language={language} />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
