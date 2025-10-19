import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";

const PasskeySetup = ({ onPasskeyCreated, language = "en" }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const translations = {
    en: {
      createPasskey: "Create Passkey",
      passkeyNotSupported: "Passkeys are not supported on this device/browser",
      passkeySetup: "Passkey Setup",
      passkeyDescription:
        "Set up a passkey for faster and more secure login using your device's biometric authentication.",
      biometricAuth: "🔐 Biometric Authentication",
      touchId: "Touch ID / Face ID / Fingerprint",
      secureLogin: "Secure & Fast Future Logins",
      passkeyCreated:
        "Passkey created successfully! You can now use it for quick sign-in.",
    },
    hi: {
      createPasskey: "पासकी बनाएं",
      passkeyNotSupported: "यह डिवाइस/ब्राउज़र पासकी समर्थित नहीं करता",
      passkeySetup: "पासकी सेटअप",
      passkeyDescription:
        "अपने डिवाइस की बायोमेट्रिक प्रमाणीकरण का उपयोग करके तेज़ और अधिक सुरक्षित लॉगिन के लिए पासकी सेट करें।",
      biometricAuth: "🔐 बायोमेट्रिक प्रमाणीकरण",
      touchId: "Touch ID / Face ID / फिंगरप्रिंट",
      secureLogin: "सुरक्षित और तेज़ भविष्य लॉगिन",
      passkeyCreated:
        "पासकी सफलतापूर्वक बनाई गई! अब आप इसका उपयोग त्वरित साइन-इन के लिए कर सकते हैं।",
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    // Check if WebAuthn is supported
    if (
      window.PublicKeyCredential &&
      navigator.credentials &&
      navigator.credentials.create &&
      navigator.credentials.get
    ) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  // Convert ArrayBuffer to base64 (URL-safe, no padding)
  const arrayBufferToBase64 = (buffer) => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  };

  const createPasskey = async () => {
    if (!isSupported) {
      setError(t.passkeyNotSupported);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Get authentication token from localStorage
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Please login first to set up passkey");
      }

      // Generate a random challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Generate a random user ID
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      // Get farmer data from localStorage to use actual user info
      const farmerData = JSON.parse(localStorage.getItem("farmerData") || "{}");

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
            authenticatorAttachment: "platform", // Prefer platform authenticators (Touch ID, Face ID, Windows Hello)
            userVerification: "preferred",
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "direct",
        },
      };

      console.log("🔐 Creating passkey...");
      const credential = await navigator.credentials.create(createOptions);

      if (credential) {
        // Save credential info to backend
        const credentialData = {
          credentialId: arrayBufferToBase64(credential.rawId),
          publicKey: arrayBufferToBase64(credential.response.getPublicKey()),
          challenge: arrayBufferToBase64(challenge),
          userId: arrayBufferToBase64(userId),
        };

        console.log("✅ Passkey created:", credentialData);

        // Send to backend for storage
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/passkey/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(credentialData),
          }
        );

        const data = await response.json();

        if (response.ok) {
          console.log("✅ Passkey registered successfully");
          setSuccess(t.passkeyCreated);
          if (onPasskeyCreated) {
            onPasskeyCreated(data);
          }
        } else {
          throw new Error(data.detail || "Failed to register passkey");
        }
      }
    } catch (error) {
      console.error("❌ Passkey creation error:", error);
      if (error.name === "NotAllowedError") {
        setError("Passkey creation was cancelled or not allowed");
      } else if (error.name === "NotSupportedError") {
        setError("Passkeys are not supported on this device");
      } else {
        setError(`Failed to create passkey: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="w-full p-6 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {t.passkeySetup}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{t.passkeyNotSupported}</p>
        <p className="text-xs text-gray-500">
          Please use Chrome 67+, Safari 14+, or Firefox 60+
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {t.passkeySetup}
      </h3>
      <p className="text-sm text-gray-600 mb-4">{t.passkeyDescription}</p>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
          {success}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Create Passkey Button */}
      <Button
        onClick={createPasskey}
        variant="default"
        className="w-full flex items-center justify-center gap-2 py-4 text-base font-medium bg-green-600 hover:bg-green-700 text-white transition-all mb-4"
        type="button"
        disabled={loading}
      >
        <span className="text-xl">🔐</span>
        <span>{loading ? "Creating..." : t.createPasskey}</span>
      </Button>

      {/* Info Section */}
      <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-blue-800">{t.biometricAuth}</p>
        <p className="text-xs text-blue-600">{t.touchId}</p>
        <p className="text-xs text-blue-600">{t.secureLogin}</p>
      </div>
    </div>
  );
};

export default PasskeySetup;
