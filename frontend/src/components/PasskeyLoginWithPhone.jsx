import React, { useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

const PasskeyLoginWithPhone = ({ onPasskeyLogin, onBack, language = "en" }) => {
  const [step, setStep] = useState(1); // 1: Enter phone, 2: Select passkey & authenticate
  const [phone, setPhone] = useState("");
  const [availablePasskeys, setAvailablePasskeys] = useState([]);

  const [farmerInfo, setFarmerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const translations = {
    en: {
      title: "Passkey Login",
      subtitle: "Sign in with biometric authentication",
      step1Title: "Enter Your Phone Number",
      step1Subtitle: "We'll find your passkeys",
      phone: "Phone Number",
      phonePlaceholder: "Enter your 10-digit phone number",
      findPasskeys: "Find My Passkeys",
      step2Title: "Choose Passkey",
      step2Subtitle: "Select a passkey to authenticate with",
      authenticateWith: "Authenticate with Passkey",
      createdOn: "Created on",
      back: "Back",
      noPasskeysFound: "No passkeys found for this phone number",
      createPasskeyFirst:
        "Please login with password first and create a passkey",
      phoneRequired: "Please enter your phone number",
      invalidPhone: "Please enter a valid 10-digit phone number",
      authenticating: "Authenticating...",
      findingPasskeys: "Finding passkeys...",
    },
    hi: {
      title: "पासकी लॉगिन",
      subtitle: "बायोमेट्रिक प्रमाणीकरण के साथ साइन इन करें",
      step1Title: "अपना फोन नंबर दर्ज करें",
      step1Subtitle: "हम आपकी पासकी खोजेंगे",
      phone: "फोन नंबर",
      phonePlaceholder: "अपना 10-अंकीय फोन नंबर दर्ज करें",
      findPasskeys: "मेरी पासकी खोजें",
      step2Title: "पासकी चुनें",
      step2Subtitle: "प्रमाणीकरण के लिए एक पासकी का चयन करें",
      authenticateWith: "पासकी के साथ प्रमाणित करें",
      createdOn: "बनाया गया",
      back: "पीछे",
      noPasskeysFound: "इस फोन नंबर के लिए कोई पासकी नहीं मिली",
      createPasskeyFirst: "कृपया पहले पासवर्ड से लॉगिन करें और पासकी बनाएं",
      phoneRequired: "कृपया अपना फोन नंबर दर्ज करें",
      invalidPhone: "कृपया एक वैध 10-अंकीय फोन नंबर दर्ज करें",
      authenticating: "प्रमाणीकरण हो रहा है...",
      findingPasskeys: "पासकी खोजी जा रही है...",
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
      let regularBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
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

  // Phone number validation
  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
    return phoneRegex.test(phone);
  };

  const findPasskeys = async () => {
    if (!phone.trim()) {
      setError(t.phoneRequired);
      return;
    }

    if (!validatePhone(phone)) {
      setError(t.invalidPhone);
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("🔍 Finding passkeys for phone:", phone);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/passkey/find`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ identifier: phone }),
        }
      );

      const data = await response.json();
      console.log("📥 Passkey search response:", data);

      if (response.ok) {
        setAvailablePasskeys(data.passkeys);
        setFarmerInfo({ name: data.name, farmer_id: data.farmer_id });
        setStep(2);
      } else {
        setError(data.detail || t.noPasskeysFound);
      }
    } catch (error) {
      console.error("❌ Error finding passkeys:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const authenticateWithPasskey = async (passkeyCredentialId) => {
    setLoading(true);
    setError("");

    try {
      console.log("🔐 Authenticating with passkey:", passkeyCredentialId);

      // Get challenge from server
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

      console.log("🔍 Received challenge for auth:", challengeData.challenge);
      const challenge = base64ToArrayBuffer(challengeData.challenge);

      // Create authentication options with specific credential
      const getOptions = {
        publicKey: {
          challenge: challenge,
          timeout: 60000,
          rpId: "localhost",
          allowCredentials: [
            {
              type: "public-key",
              id: base64ToArrayBuffer(passkeyCredentialId),
            },
          ],
          userVerification: "preferred",
        },
      };

      console.log("🔐 Starting biometric authentication...");
      const credential = await navigator.credentials.get(getOptions);

      if (credential) {
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

        console.log("✅ Biometric auth completed, verifying...");

        // Verify with server
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
          console.log("✅ Passkey authentication successful!");
          onPasskeyLogin(data);
        } else {
          throw new Error(data.detail || "Authentication failed");
        }
      }
    } catch (error) {
      console.error("❌ Passkey authentication error:", error);
      if (error.name === "NotAllowedError") {
        setError("Authentication was cancelled or denied");
      } else if (error.name === "InvalidStateError") {
        setError("The selected passkey is no longer valid");
      } else {
        setError(`Authentication failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setAvailablePasskeys([]);
      setFarmerInfo(null);
      setError("");
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Step 1: Enter Phone Number */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {t.step1Title}
              </h3>
              <p className="text-gray-600 text-sm">{t.step1Subtitle}</p>
            </div>

            <div>
              <Label className="text-lg flex items-center gap-2 mb-2">
                📱 {t.phone}
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                className="text-lg p-6"
                maxLength="10"
                onKeyPress={(e) => e.key === "Enter" && findPasskeys()}
              />
            </div>

            <Button
              onClick={findPasskeys}
              disabled={loading}
              className="w-full p-6 text-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? t.findingPasskeys : t.findPasskeys}
            </Button>

            <Button
              onClick={handleBack}
              variant="outline"
              className="w-full p-4 text-lg"
              disabled={loading}
            >
              ← {t.back}
            </Button>
          </div>
        )}

        {/* Step 2: Select and Authenticate with Passkey */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {t.step2Title}
              </h3>
              <p className="text-gray-600 text-sm">{t.step2Subtitle}</p>
              {farmerInfo && (
                <p className="text-green-600 font-medium mt-2">
                  Welcome back, {farmerInfo.name}!
                </p>
              )}
            </div>

            <div className="space-y-3">
              {availablePasskeys.map((passkey, index) => (
                <div
                  key={passkey.credential_id}
                  className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🔐</span>
                      <div>
                        <p className="font-semibold text-gray-800">
                          Passkey {index + 1}
                        </p>
                        <p className="text-xs text-gray-600">
                          {t.createdOn}:{" "}
                          {new Date(passkey.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      authenticateWithPasskey(passkey.credential_id)
                    }
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    {loading ? t.authenticating : t.authenticateWith}
                  </Button>
                </div>
              ))}
            </div>

            <Button
              onClick={handleBack}
              variant="outline"
              className="w-full p-4 text-lg"
              disabled={loading}
            >
              ← {t.back}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PasskeyLoginWithPhone;
