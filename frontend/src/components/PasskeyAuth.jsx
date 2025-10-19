import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";

const PasskeyAuth = ({ onPasskeyLogin, language = "en" }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const translations = {
    en: {
      signInWithPasskey: "Sign in with Passkey",
      passkeyNotSupported: "Passkeys are not supported on this device/browser",
      biometricAuth: "🔐 Use Biometric Authentication",
      touchId: "Touch ID / Face ID / Fingerprint",
      secureLogin: "Secure & Fast Login",
      noPasskeySetup:
        "No passkey found? Login with phone/OTP and set up a passkey in Settings.",
    },
    hi: {
      signInWithPasskey: "पासकी से साइन इन करें",
      passkeyNotSupported: "यह डिवाइस/ब्राउज़र पासकी समर्थित नहीं करता",
      biometricAuth: "🔐 बायोमेट्रिक प्रमाणीकरण का उपयोग करें",
      touchId: "Touch ID / Face ID / फिंगरप्रिंट",
      secureLogin: "सुरक्षित और तेज़ लॉगिन",
      noPasskeySetup:
        "कोई पासकी नहीं मिली? फोन/OTP से लॉगिन करें और सेटिंग्स में पासकी सेट करें।",
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
      console.error("❌ Error decoding base64:", error, "Input:", base64);
      throw new Error(`Invalid base64 string: ${error.message}`);
    }
  };

  const signInWithPasskey = async () => {
    if (!isSupported) {
      setError(t.passkeyNotSupported);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First, get challenge from server
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
      console.log("🔍 Challenge response:", challengeData);

      if (!challengeResponse.ok) {
        throw new Error(
          challengeData.detail || "Failed to get authentication challenge"
        );
      }

      console.log("🔍 Received challenge:", challengeData.challenge);
      const challenge = base64ToArrayBuffer(challengeData.challenge);
      console.log("✅ Decoded challenge buffer:", challenge);

      const getOptions = {
        publicKey: {
          challenge: challenge,
          timeout: 60000,
          rpId: "localhost", // In production, use your domain
          userVerification: "preferred",
        },
      };

      console.log("🔐 Authenticating with passkey...");
      const credential = await navigator.credentials.get(getOptions);

      if (credential) {
        // Prepare authentication data
        const authData = {
          credentialId: arrayBufferToBase64(credential.rawId),
          clientDataJSON: arrayBufferToBase64(
            credential.response.clientDataJSON
          ),
          authenticatorData: arrayBufferToBase64(
            credential.response.authenticatorData
          ),
          signature: arrayBufferToBase64(credential.response.signature),
          challenge: challengeData.challenge,
        };

        console.log("✅ Passkey authentication data:", authData);

        // Send to backend for verification
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/passkey/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(authData),
          }
        );

        const data = await response.json();

        if (response.ok) {
          console.log("✅ Passkey authentication successful");
          onPasskeyLogin(data);
        } else {
          throw new Error(data.detail || "Passkey authentication failed");
        }
      }
    } catch (error) {
      console.error("❌ Passkey authentication error:", error);
      if (error.name === "NotAllowedError") {
        setError("Authentication was cancelled or not allowed");
      } else if (error.name === "NotSupportedError") {
        setError("Passkeys are not supported on this device");
      } else if (error.message.includes("Passkey not found")) {
        setError(
          "No passkey found. Please login with phone/OTP first, then create a passkey in Settings."
        );
      } else if (error.message.includes("Invalid or expired challenge")) {
        setError("Session expired. Please try again.");
      } else {
        setError(`Authentication failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="w-full p-4 bg-gray-100 rounded-lg text-center">
        <p className="text-sm text-gray-600">{t.passkeyNotSupported}</p>
        <p className="text-xs text-gray-500 mt-1">
          Please use Chrome 67+, Safari 14+, or Firefox 60+
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Passkey Sign In Button */}
      <Button
        onClick={signInWithPasskey}
        variant="default"
        className="w-full flex items-center justify-center gap-2 py-6 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all"
        type="button"
        disabled={loading}
      >
        <span className="text-2xl">🔐</span>
        <span>{loading ? "Authenticating..." : t.signInWithPasskey}</span>
      </Button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Info Section */}
      <div className="text-center space-y-2 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-blue-800">{t.biometricAuth}</p>
        <p className="text-xs text-blue-600">{t.touchId}</p>
        <p className="text-xs text-blue-600">{t.secureLogin}</p>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-gray-600">{t.noPasskeySetup}</p>
        </div>
      </div>
    </div>
  );
};

export default PasskeyAuth;
