import React, { useState, useRef, useEffect } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

const Chatbot = ({ language = "en" }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Translations
  const translations = {
    en: {
      title: "Krishi Saathi",
      placeholder: "Ask me about Kerala farming...",
      send: "Send",
      listening: "Listening...",
      startVoice: "Start Voice",
      stopVoice: "Stop Voice",
      speak: "Speak",
      typing: "Krishi Saathi is typing...",
      welcomeMessage:
        "Hello! I'm Krishi Saathi, your trusted farming advisor for Kerala. Ask me about crops, weather, diseases, or any farming questions!",
      voiceNotSupported: "Voice recognition is not supported in your browser.",
      speakNotSupported: "Text-to-speech is not supported in your browser.",
      microphoneError: "Error accessing microphone. Please check permissions.",
      clear: "Clear Chat",
      suggestions: [
        "What crops should I plant this season?",
        "How do I identify plant diseases?",
        "What's the weather forecast for farming?",
        "Tell me about crop market prices",
      ],
      showContext: "Show Context",
      hideContext: "Hide Context",
      currentWeather: "Current Weather",
      marketPrices: "Market Prices",
      availableSchemes: "Available Schemes",
      farmStatus: "Farm Status",
    },
    hi: {
      title: "कृषि साथी",
      placeholder: "केरल की खेती के बारे में पूछें...",
      send: "भेजें",
      listening: "सुन रहा है...",
      startVoice: "आवाज़ शुरू करें",
      stopVoice: "आवाज़ बंद करें",
      speak: "बोलें",
      typing: "कृषि साथी टाइप कर रहे हैं...",
      welcomeMessage:
        "नमस्ते! मैं कृषि साथी हूँ, केरल के किसानों का भरोसेमंद सलाहकार। फसल, मौसम, रोग या खेती के बारे में कुछ भी पूछें!",
      voiceNotSupported: "आपके ब्राउज़र में वॉयस पहचान समर्थित नहीं है।",
      speakNotSupported: "आपके ब्राउज़र में टेक्स्ट-टू-स्पीच समर्थित नहीं है।",
      microphoneError:
        "माइक्रोफ़ोन एक्सेस करने में त्रुटि। कृपया अनुमतियाँ जाँचें।",
      clear: "चैट साफ़ करें",
      suggestions: [
        "इस मौसम में कौन सी फसल लगानी चाहिए?",
        "पौधों की बीमारियों की पहचान कैसे करें?",
        "खेती के लिए मौसम का पूर्वानुमान क्या है?",
        "फसल की बाज़ार कीमतों के बारे में बताएं",
      ],
      showContext: "जानकारी दिखाएं",
      hideContext: "जानकारी छुपाएं",
      currentWeather: "वर्तमान मौसम",
      marketPrices: "बाज़ार की कीमतें",
      availableSchemes: "उपलब्ध योजनाएं",
      farmStatus: "खेत की स्थिति",
    },
    ml: {
      title: "കൃഷി സാഥി",
      placeholder: "കേരള കൃഷിയെക്കുറിച്ച് ചോദിക്കൂ...",
      send: "അയയ്ക്കുക",
      listening: "കേൾക്കുന്നു...",
      startVoice: "ശബ്ദം ആരംഭിക്കുക",
      stopVoice: "ശബ്ദം നിർത്തുക",
      speak: "സംസാരിക്കുക",
      typing: "കൃഷി സാഥി ടൈപ്പ് ചെയ്യുന്നു...",
      welcomeMessage:
        "നമസ്കാരം! ഞാൻ കൃഷി സാഥിയാണ്, കേരള കർഷകരുടെ വിശ്വസ്ത ഉപദേശകൻ. വിള, കാലാവസ്ഥ, രോഗം അല്ലെങ്കിൽ കൃഷിയെക്കുറിച്ച് എന്തും ചോദിക്കുക!",
      voiceNotSupported:
        "നിങ്ങളുടെ ബ്രൗസറിൽ വോയിസ് തിരിച്ചറിയൽ പിന്തുണയ്ക്കുന്നില്ല.",
      speakNotSupported:
        "നിങ്ങളുടെ ബ്രൗസറിൽ ടെക്സ്റ്റ്-ടു-സ്പീച്ച് പിന്തുണയ്ക്കുന്നില്ല.",
      microphoneError:
        "മൈക്രോഫോൺ ആക്സസ് ചെയ്യുന്നതിൽ പിശക്. അനുമതികൾ പരിശോധിക്കുക.",
      clear: "ചാറ്റ് മായ്ക്കുക",
      suggestions: [
        "ഈ സീസണിൽ ഏതു വിളകൾ നടണം?",
        "ചെടികളിലെ രോഗങ്ങൾ എങ്ങനെ തിരിച്ചറിയാം?",
        "കൃഷിക്കുള്ള കാലാവസ്ഥ പ്രവചനം എന്താണ്?",
        "വിള വിപണി വിലകളെക്കുറിച്ച് പറയുക",
      ],
    },
  };

  const t = translations[language] || translations.en;

  // Initialize speech recognition
  useEffect(() => {
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
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        alert(t.microphoneError);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Add welcome message
    setMessages([
      {
        id: 1,
        text: t.welcomeMessage,
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  }, [language, t.welcomeMessage, t.microphoneError]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Call the actual API
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from server");
      }

      const data = await response.json();

      const botResponse = {
        id: Date.now() + 1,
        text: data.response,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error calling chat API:", error);

      // Fallback to mock response if API fails
      const botResponse = {
        id: Date.now() + 1,
        text: generateBotResponse(userMessage.text),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Generate Kerala-specific mock bot responses (fallback)
  const generateBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();

    if (language === "hi") {
      if (message.includes("फसल") || message.includes("खेती")) {
        return "केरल में धान, नारियल, मसाले और सब्जियों की खेती बहुत अच्छी होती है। मानसून के समय (जून-सितंबर) धान की बुआई सबसे अच्छी होती है। आपको कौन सी फसल के बारे में जानना है?";
      }
      if (message.includes("बीमारी") || message.includes("रोग")) {
        return "पौधों की बीमारियों से बचने के लिए नीम का तेल छिड़कें। संक्रमित पत्तियों को तुरंत हटा दें। हमारे रोग पहचान टूल का इस्तेमाल करें।";
      }
      if (message.includes("मौसम") || message.includes("बारिश")) {
        return "केरल में मानसून जून से सितंबर तक होता है। इस समय धान की रोपाई करना अच्छा है। बारिश के बाद नारियल और मसालों की देखभाल करें।";
      }
      return "नमस्ते! मैं कृषि साथी हूँ, केरल के किसानों का सहायक। आप मुझसे खेती, फसल, मौसम के बारे में पूछ सकते हैं।";
    }

    if (language === "ml") {
      if (message.includes("വിള") || message.includes("കൃഷി")) {
        return "കേരളത്തിൽ നെല്ല്, തെങ്ങ്, മസാല, പച്ചക്കറികൾ എന്നിവയുടെ കൃഷി വളരെ നല്ലതാണ്. മഴക്കാലത്ത് (ജൂൺ-സെപ്റ്റംബർ) നെൽകൃഷി ആരംഭിക്കുന്നത് ഏറ്റവും നല്ലതാണ്. ഏത് വിളയെക്കുറിച്ച് അറിയണം?";
      }
      if (message.includes("രോഗം") || message.includes("അസുഖം")) {
        return "ചെടികളിലെ രോഗങ്ങളിൽ നിന്ന് രക്ഷപ്പെടാൻ വേപ്പെണ്ണ തളിക്കുക. രോഗബാധിതമായ ഇലകൾ ഉടനെ നീക്കം ചെയ്യുക. ഞങ്ങളുടെ രോഗ കണ്ടെത്തൽ ഉപകരണം ഉപയോഗിക്കുക.";
      }
      if (message.includes("കാലാവസ്ഥ") || message.includes("മഴ")) {
        return "കേരളത്തിൽ മഴക്കാലം ജൂൺ മുതൽ സെപ്റ്റംബർ വരെയാണ്. ഈ സമയത്ത് നെല് നടുന്നത് നല്ലതാണ്. മഴയ്ക്ക് ശേഷം തെങ്ങിന്റെയും മസാലകളുടെയും പരിചരണം ചെയ്യുക.";
      }
      return "നമസ്കാരം! ഞാൻ കൃഷി സാഥിയാണ്, കേരള കർഷകരുടെ സഹായി. നിങ്ങൾക്ക് കൃഷി, വിള, കാലാവസ്ഥയെക്കുറിച്ച് എന്നോട് ചോദിക്കാം.";
    }

    // English responses for Kerala farming
    if (message.includes("crop") || message.includes("farming")) {
      return "In Kerala, rice, coconut, spices, and vegetables grow excellently! The monsoon season (June-September) is perfect for rice cultivation. Which crop would you like to know about?";
    }
    if (message.includes("disease") || message.includes("pest")) {
      return "To protect plants from diseases, spray neem oil regularly. Remove infected leaves immediately. Our Disease Detector can help identify plant problems accurately.";
    }
    if (
      message.includes("weather") ||
      message.includes("rain") ||
      message.includes("monsoon")
    ) {
      return "Kerala's monsoon season runs from June to September. This is the best time for rice planting. After rains, take good care of coconut and spice plants.";
    }
    if (message.includes("price") || message.includes("market")) {
      return "Check our Market Prices section for current rates. In Kerala, spices like cardamom and pepper often fetch good prices. Local markets usually offer better rates.";
    }
    if (message.includes("coconut")) {
      return "Coconut is Kerala's pride! Plant coconut palms 8 meters apart. They need good drainage and regular watering during dry periods. Harvest when coconuts are mature but not overripe.";
    }
    if (message.includes("rice") || message.includes("paddy")) {
      return "Rice is Kerala's staple crop. Plant during monsoon (June-July). Keep fields flooded but not waterlogged. Harvest when grains turn golden yellow.";
    }
    if (
      message.includes("spice") ||
      message.includes("pepper") ||
      message.includes("cardamom")
    ) {
      return "Kerala is famous for spices! Black pepper needs support structures and partial shade. Cardamom grows well in hill areas. Both need consistent moisture and good drainage.";
    }

    return "Hello! I'm Krishi Saathi, your farming assistant for Kerala. Ask me about crops, farming methods, weather, or any agricultural questions you have!";
  };

  // Handle voice input
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert(t.voiceNotSupported);
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

  // Handle text-to-speech
  const speakMessage = (text) => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);

      // Set language for speech
      const langCode =
        language === "hi" ? "hi-IN" : language === "ml" ? "ml-IN" : "en-US";
      utterance.lang = langCode;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    } else {
      alert(t.speakNotSupported);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  // Clear chat
  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: t.welcomeMessage,
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header - Compact for floating window */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">🤖</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-green-600 font-medium truncate">
              Online • Ready to help
            </p>
          </div>
        </div>
        <Button
          onClick={clearChat}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 font-medium ml-2"
        >
          {t.clear}
        </Button>
      </div>

      {/* Suggestions - Optimized for sidebar */}
      {messages.filter((m) => m.sender === "user").length === 0 && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <p className="text-base font-semibold text-gray-700 mb-3">
            Quick suggestions:
          </p>
          <div className="flex flex-col gap-2">
            {t.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg border border-blue-200 transition-colors font-medium shadow-sm text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages - Optimized for sidebar */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`w-full flex ${
                message.sender === "user" ? "flex-row-reverse" : "flex-row"
              } items-end space-x-2`}
            >
              {/* Avatar - Compact for sidebar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === "user"
                    ? "bg-blue-500 ml-2"
                    : "bg-green-500 mr-2"
                }`}
              >
                <span className="text-white text-sm">
                  {message.sender === "user" ? "👤" : "🤖"}
                </span>
              </div>

              {/* Message bubble - Optimized for sidebar */}
              <div className="flex flex-col flex-1 min-w-0">
                <div
                  className={`px-3 py-2 rounded-lg shadow-sm ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                  }`}
                >
                  <p className="text-base leading-relaxed font-medium break-words">
                    {message.text}
                  </p>
                </div>

                {/* Message actions - Larger and more accessible */}
                <div
                  className={`flex items-center mt-3 space-x-3 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <span className="text-sm text-gray-500 font-medium">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {message.sender === "bot" && (
                    <button
                      onClick={() => speakMessage(message.text)}
                      disabled={isSpeaking}
                      className="text-sm text-gray-600 hover:text-green-600 transition-colors px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center space-x-1"
                      title={t.speak}
                    >
                      <span className="text-base">🔊</span>
                      <span>{t.speak}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area - Better layout for floating chatbot */}
      <div className="border-t border-gray-200 bg-white p-3">
        <div className="flex items-center space-x-2">
          {/* Voice input button */}
          <Button
            onClick={toggleVoiceInput}
            className={`px-3 py-3 text-sm ${
              isListening
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white border-0 font-medium shadow-md flex-shrink-0 rounded-full`}
            disabled={isSpeaking}
            title={isListening ? t.stopVoice : t.startVoice}
          >
            <span className="text-lg">{isListening ? "🎙️" : "🎤"}</span>
          </Button>

          {/* Text input - Flexible width */}
          <div className="flex-1">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? t.listening : t.placeholder}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isListening || isTyping}
              className="w-full text-base px-4 py-3 rounded-full border-2 border-gray-300 focus:border-green-500 font-medium focus:outline-none"
            />
          </div>

          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isListening || isTyping}
            className="px-3 py-3 text-sm bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white border-0 font-medium shadow-md flex-shrink-0 rounded-full transition-all duration-200"
            title={t.send}
          >
            <span className="text-lg">📤</span>
          </Button>
        </div>

        {/* Status indicators */}
        {isListening && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200 animate-pulse">
              <span className="text-base">🎙️</span>
              <span className="text-sm font-medium">{t.listening}</span>
            </div>
          </div>
        )}

        {isTyping && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200 animate-pulse">
              <span className="text-base">🤖</span>
              <span className="text-sm font-medium">{t.typing}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
