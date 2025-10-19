import React, { useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

const PostLoginPasskeySetup = ({
  onSetupComplete,
  onSkip,
  language = "en",
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const translations = {
    en: {
      title: "Setup Secure Login",
      subtitle: "Create a passkey for faster, secure access",
      benefits: [
        "🚀 Lightning fast login",
        "🔐 No passwords to remember",
        "🛡️ Military-grade security",
        "📱 Use Touch/Face ID",
      ],
      setupNow: "Setup Passkey Now",
      skipForNow: "Skip for Now",
      setting: "Setting up passkey...",
      successTitle: "Passkey Created Successfully!",
      successMessage: "You can now login using biometric authentication",
      continue: "Continue to App",
      errorTitle: "Setup Failed",
      tryAgain: "Try Again",
    },
    hi: {
      title: "सुरक्षित लॉगिन सेटअप करें",
      subtitle: "तेज़ और सुरक्षित पहुंच के लिए पासकी बनाएं",
      benefits: [
        "🚀 बिजली की तरह तेज़ लॉगिन",
        "🔐 पासवर्ड याद रखने की जरूरत नहीं",
        "🛡️ सैन्य-ग्रेड सुरक्षा",
        "📱 Touch/Face ID का उपयोग करें",
      ],
      setupNow: "अभी पासकी सेटअप करें",
      skipForNow: "अभी के लिए छोड़ें",
      setting: "पासकी सेटअप की जा रही है...",
      successTitle: "पासकी सफलतापूर्वक बनाई गई!",
      successMessage:
        "अब आप बायोमेट्रिक प्रमाणीकरण का उपयोग करके लॉगिन कर सकते हैं",
      continue: "ऐप पर जारी रखें",
      errorTitle: "सेटअप असफल",
      tryAgain: "पुनः प्रयास करें",
    },
  };

  const t = translations[language] || translations.en;

  // Convert ArrayBuffer to base64 (URL-safe, no padding)
  const arrayBufferToBase64 = (buffer) => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  };

  // Convert base64 to ArrayBuffer (handles both regular and URL-safe base64)
  const base64ToArrayBuffer = (base64) => {
    try {
      // Convert URL-safe base64 to regular base64
      let regularBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
      // Add padding if needed
      while (regularBase64.length % 4) {
        regularBase64 += "=";
      }
      const binaryString = atob(regularBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error("❌ Error decoding base64:", error);
      throw new Error(`Invalid base64 string: ${error.message}`);
    }
  };

  const setupPasskey = async () => {
    setLoading(true);
    setError("");

    try {
      // Check WebAuthn support
      if (!window.PublicKeyCredential || !navigator.credentials) {
        throw new Error("Passkeys are not supported on this device/browser");
      }

      // Generate challenge from server
      const challengeResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/passkey/challenge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const challengeData = await challengeResponse.json();
      if (!challengeResponse.ok) {
        throw new Error(challengeData.detail || "Failed to get challenge");
      }

      const challenge = base64ToArrayBuffer(challengeData.challenge);

      // Get current farmer data for userId
      const farmerData = JSON.parse(localStorage.getItem("farmerData") || "{}");
      const userIdString = farmerData.farmer_id || "farmer_" + Date.now();
      const userId = new TextEncoder().encode(userIdString);

      const createOptions = {
        publicKey: {
          challenge: challenge,
          rp: {
            name: "Krishi Saathi",
            id: "localhost", // In production, use your domain
          },
          user: {
            id: userId,
            name: farmerData.phone || "farmer@krishisaathi.com",
            displayName: farmerData.name || "Krishi Saathi Farmer",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
            requireResidentKey: false,
          },
          timeout: 60000,
        },
      };

      console.log("🔐 Creating passkey with options:", createOptions);

      const credential = await navigator.credentials.create(createOptions);

      if (credential) {
        // Prepare registration data
        const registrationData = {
          credentialId: arrayBufferToBase64(credential.rawId),
          publicKey: arrayBufferToBase64(credential.response.publicKey),
          challenge: challengeData.challenge,
          userId: arrayBufferToBase64(userId),
        };

        console.log("✅ Passkey created, registering with server...");

        // Register with server
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/passkey/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(registrationData),
          }
        );

        const data = await response.json();

        if (response.ok) {
          console.log("✅ Passkey registered successfully");
          setSuccess(true);
        } else {
          throw new Error(data.detail || "Failed to register passkey");
        }
      }
    } catch (error) {
      console.error("❌ Passkey setup error:", error);
      if (error.name === "NotAllowedError") {
        setError("Passkey creation was cancelled or not allowed");
      } else if (error.name === "NotSupportedError") {
        setError("Passkeys are not supported on this device");
      } else {
        setError(`Setup failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            {t.successTitle}
          </h2>
          <p className="text-gray-600 mb-6">{t.successMessage}</p>
          <Button
            onClick={onSetupComplete}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white"
          >
            {t.continue}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-8">
          {t.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-3">
              <span className="text-lg">{benefit.split(" ")[0]}</span>
              <span className="text-gray-700">{benefit.substring(2)}</span>
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">{t.errorTitle}</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={setupPasskey}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? t.setting : t.setupNow}
          </Button>

          <Button
            onClick={onSkip}
            variant="outline"
            className="w-full py-3 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            {t.skipForNow}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PostLoginPasskeySetup;
