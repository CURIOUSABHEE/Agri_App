import React, { useState, useRef } from "react";
import { Button } from "./ui/Button";

const VoiceChatButton = ({
  language = "en",
  onTranscript = null,
  className = "",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Translations
  const translations = {
    en: {
      startVoice: "Start Voice Input",
      stopVoice: "Stop Voice Input",
      listening: "Listening...",
      notSupported: "Voice recognition not supported in your browser",
      micError: "Microphone access denied or error occurred",
    },
    hi: {
      startVoice: "आवाज़ इनपुट शुरू करें",
      stopVoice: "आवाज़ इनपुट बंद करें",
      listening: "सुन रहा है...",
      notSupported: "आपके ब्राउज़र में वॉयस पहचान समर्थित नहीं है",
      micError: "माइक्रोफ़ोन एक्सेस अस्वीकृत या त्रुटि हुई",
    },
    ml: {
      startVoice: "വോയ്സ് ഇൻപുട്ട് ആരംഭിക്കുക",
      stopVoice: "വോയ്സ് ഇൻപുട്ട് നിർത്തുക",
      listening: "കേൾക്കുന്നു...",
      notSupported:
        "നിങ്ങളുടെ ബ്രൗസറിൽ വോയിസ് റെക്കഗ്നിഷൻ പിന്തുണയ്ക്കുന്നില്ല",
      micError: "മൈക്രോഫോൺ ആക്സസ് നിരസിച്ചു അല്ലെങ്കിൽ പിശക് സംഭവിച്ചു",
    },
  };

  const t = translations[language] || translations.en;

  React.useEffect(() => {
    // Initialize speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      // Set language based on current language
      const langCode =
        language === "hi" ? "hi-IN" : language === "ml" ? "ml-IN" : "en-US";
      recognitionRef.current.lang = langCode;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onTranscript) {
          onTranscript(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        alert(t.micError);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsSupported(false);
    }
  }, [language, onTranscript, t.micError]);

  const toggleVoiceInput = () => {
    if (!isSupported) {
      alert(t.notSupported);
      return;
    }

    if (!recognitionRef.current) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <Button
      onClick={toggleVoiceInput}
      disabled={!isSupported}
      className={`
        ${
          isListening
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : "bg-blue-500 hover:bg-blue-600"
        } 
        text-white border-0 flex items-center space-x-2 
        ${className}
      `}
      title={isListening ? t.stopVoice : t.startVoice}
    >
      <span className="text-lg">{isListening ? "🎙️" : "🎤"}</span>
      {isListening && <span className="text-sm">{t.listening}</span>}
    </Button>
  );
};

export default VoiceChatButton;
