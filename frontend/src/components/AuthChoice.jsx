import React from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

const AuthChoice = ({ onChoice, language = "en" }) => {
  const translations = {
    en: {
      welcome: "Welcome to Krishi Saathi",
      subtitle: "Your Agricultural Companion",
      newUser: "New User",
      newUserDesc: "Create a new account",
      existingUser: "Existing User",
      existingUserDesc: "Login to your account",
      passkeyUser: "Passkey Login",
      passkeyUserDesc: "Use biometric authentication",
      changeLanguage: "Change Language",
    },
    hi: {
      welcome: "कृषि साथी में आपका स्वागत है",
      subtitle: "आपका कृषि साथी",
      newUser: "नया उपयोगकर्ता",
      newUserDesc: "नया खाता बनाएं",
      existingUser: "मौजूदा उपयोगकर्ता",
      existingUserDesc: "अपने खाते में लॉगिन करें",
      passkeyUser: "पासकी लॉगिन",
      passkeyUserDesc: "बायोमेट्रिक प्रमाणीकरण का उपयोग करें",
      changeLanguage: "भाषा बदलें",
    },
    ml: {
      welcome: "കൃഷി സാഥിയിലേക്ക് സ്വാഗതം",
      subtitle: "നിങ്ങളുടെ കാർഷിക കൂട്ടുകാരൻ",
      newUser: "പുതിയ ഉപയോക്താവ്",
      newUserDesc: "പുതിയ അക്കൗണ്ട് സൃഷ്ടിക്കുക",
      existingUser: "നിലവിലുള്ള ഉപയോക്താവ്",
      existingUserDesc: "നിങ്ങളുടെ അക്കൗണ്ടിലേക്ക് ലോഗിൻ ചെയ്യുക",
      changeLanguage: "ഭാഷ മാറ്റുക",
    },
    ta: {
      welcome: "கிருஷி சாத்திக்கு வரவேற்கிறோம்",
      subtitle: "உங்கள் விவசாய துணை",
      newUser: "புதிய பயனர்",
      newUserDesc: "புதிய கணக்கை உருவாக்கவும்",
      existingUser: "ஏற்கனவே உள்ள பயனர்",
      existingUserDesc: "உங்கள் கணக்கில் உள்நுழைக",
      changeLanguage: "மொழியை மாற்று",
    },
    te: {
      welcome: "కృషి సాథికి స్వాగతం",
      subtitle: "మీ వ్యవసాయ సహచరుడు",
      newUser: "కొత్త వినియోగదారు",
      newUserDesc: "కొత్త ఖాతాను సృష్టించండి",
      existingUser: "ఇప్పటికే ఉన్న వినియోగదారు",
      existingUserDesc: "మీ ఖాతాలోకి లాగిన్ అవ్వండి",
      changeLanguage: "భాషను మార్చండి",
    },
    kn: {
      welcome: "ಕೃಷಿ ಸಾಥಿಗೆ ಸ್ವಾಗತ",
      subtitle: "ನಿಮ್ಮ ಕೃಷಿ ಸಹಚರ",
      newUser: "ಹೊಸ ಬಳಕೆದಾರ",
      newUserDesc: "ಹೊಸ ಖಾತೆಯನ್ನು ರಚಿಸಿ",
      existingUser: "ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ಬಳಕೆದಾರ",
      existingUserDesc: "ನಿಮ್ಮ ಖಾತೆಗೆ ಲಾಗಿನ್ ಮಾಡಿ",
      changeLanguage: "ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌾</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t.welcome}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Choice Buttons */}
        <div className="space-y-4">
          {/* New User / Signup */}
          <Button
            onClick={() => onChoice("signup")}
            variant="default"
            className="w-full h-auto p-8 flex flex-col items-center space-y-3 bg-green-600 hover:bg-green-700 text-white"
          >
            <span className="text-5xl">👤➕</span>
            <div className="text-center">
              <p className="text-2xl font-bold">{t.newUser}</p>
              <p className="text-sm opacity-90 mt-1">{t.newUserDesc}</p>
            </div>
          </Button>

          {/* Existing User / Login */}
          <Button
            onClick={() => onChoice("login")}
            variant="outline"
            className="w-full h-auto p-8 flex flex-col items-center space-y-3 border-2 hover:bg-blue-50 hover:border-blue-500"
          >
            <span className="text-5xl">🔑</span>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {t.existingUser}
              </p>
              <p className="text-sm text-gray-600 mt-1">{t.existingUserDesc}</p>
            </div>
          </Button>

          {/* Passkey Login */}
          <Button
            onClick={() => onChoice("passkey")}
            variant="outline"
            className="w-full h-auto p-8 flex flex-col items-center space-y-3 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-500"
          >
            <span className="text-5xl">🔐</span>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-800">
                {t.passkeyUser}
              </p>
              <p className="text-sm text-blue-600 mt-1">{t.passkeyUserDesc}</p>
            </div>
          </Button>
        </div>

        {/* Change Language */}
        <div className="mt-6 text-center">
          <Button
            onClick={() => onChoice("language")}
            variant="ghost"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            🌐 {t.changeLanguage}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AuthChoice;
