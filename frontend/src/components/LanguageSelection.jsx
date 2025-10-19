import React from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

const LanguageSelection = ({ onLanguageSelect }) => {
  const languages = [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: "🇬🇧",
      greeting: "Welcome",
    },
    {
      code: "hi",
      name: "Hindi",
      nativeName: "हिंदी",
      flag: "🇮🇳",
      greeting: "स्वागत है",
    },
    {
      code: "ml",
      name: "Malayalam",
      nativeName: "മലയാളം",
      flag: "🌴",
      greeting: "സ്വാഗതം",
    },
    {
      code: "ta",
      name: "Tamil",
      nativeName: "தமிழ்",
      flag: "🎭",
      greeting: "வரவேற்கிறோம்",
    },
    {
      code: "te",
      name: "Telugu",
      nativeName: "తెలుగు",
      flag: "💐",
      greeting: "స్వాగతం",
    },
    {
      code: "kn",
      name: "Kannada",
      nativeName: "ಕನ್ನಡ",
      flag: "🏛️",
      greeting: "ಸ್ವಾಗತ",
    },
  ];

  const handleLanguageSelect = (language) => {
    // Save language preference
    localStorage.setItem("preferredLanguage", language.code);
    onLanguageSelect(language.code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        {/* App Logo/Icon */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌾</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Krishi Saathi
          </h1>
          <p className="text-gray-600 text-lg">
            Select Your Language / अपनी भाषा चुनें
          </p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.map((language) => (
            <Button
              key={language.code}
              onClick={() => handleLanguageSelect(language)}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-3 hover:bg-green-50 hover:border-green-500 transition-all transform hover:scale-105"
            >
              <span className="text-5xl">{language.flag}</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {language.nativeName}
                </p>
                <p className="text-sm text-gray-500">{language.name}</p>
                <p className="text-lg text-green-600 mt-2 font-medium">
                  {language.greeting}
                </p>
              </div>
            </Button>
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Choose your preferred language to continue
          </p>
          <p className="text-xs text-gray-400 mt-1">
            आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LanguageSelection;
