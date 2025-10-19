import React, { useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import PasskeyAuth from "./PasskeyAuth";

const Authentication = ({ onLogin, language = "en" }) => {
  const [step, setStep] = useState("phone"); // 'phone' or 'otp'
  const [phone, setPhone] = useState("");

  const handlePhoneInput = (value) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, "");

    // Limit to 10 digits
    const limited = digits.slice(0, 10);

    setPhone(limited);
  };
  const [otp, setOtp] = useState("");
  const [farmerName, setFarmerName] = useState("");
  const [district, setDistrict] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [farmSizeUnit, setFarmSizeUnit] = useState("acres");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState(""); // For development

  // Translations
  const translations = {
    en: {
      title: "Farmer Login",
      phone: "Phone Number",
      phonePlaceholder: "Enter 10-digit mobile number",
      name: "Your Name",
      namePlaceholder: "Enter your name",
      district: "District",
      districtPlaceholder: "Select your district",
      farmSize: "Farm Size",
      farmSizePlaceholder: "Enter farm area",
      farmSizeUnit: "Unit",
      acres: "Acres",
      hectares: "Hectares",
      sendOtp: "Send OTP",
      otp: "Enter OTP",
      otpPlaceholder: "6-digit OTP",
      verify: "Verify & Login",
      otpSent: "OTP sent successfully!",
      devNote: "Development Mode - OTP:",
      back: "Back",
      loading: "Please wait...",
      loginSuccess: "Login successful!",
      welcome: "Welcome to Krishi Saathi",
    },
    hi: {
      title: "किसान लॉगिन",
      phone: "फोन नंबर",
      phonePlaceholder: "10-अंकीय मोबाइल नंबर दर्ज करें",
      name: "आपका नाम",
      namePlaceholder: "अपना नाम दर्ज करें",
      district: "जिला",
      districtPlaceholder: "अपना जिला चुनें",
      sendOtp: "OTP भेजें",
      otp: "OTP दर्ज करें",
      otpPlaceholder: "6-अंकीय OTP",
      verify: "सत्यापित करें और लॉगिन करें",
      otpSent: "OTP सफलतापूर्वक भेजा गया!",
      devNote: "डेवलपमेंट मोड - OTP:",
      back: "वापस",
      loading: "कृपया प्रतीक्षा करें...",
      loginSuccess: "लॉगिन सफल!",
      welcome: "कृषि साथी में आपका स्वागत है",
    },
    ml: {
      title: "കർഷക ലോഗിൻ",
      phone: "ഫോൺ നമ്പർ",
      phonePlaceholder: "10-അക്ക മൊബൈൽ നമ്പർ എഴുതുക",
      name: "നിങ്ങളുടെ പേര്",
      namePlaceholder: "നിങ്ങളുടെ പേര് എഴുതുക",
      district: "ജില്ല",
      districtPlaceholder: "നിങ്ങളുടെ ജില്ല തിരഞ്ഞെടുക്കുക",
      sendOtp: "OTP അയയ്ക്കുക",
      otp: "OTP എൻറർ ചെയ്യുക",
      otpPlaceholder: "6-അക്ക OTP",
      verify: "സ്ഥിരീകരിച്ച് ലോഗിൻ ചെയ്യുക",
      otpSent: "OTP വിജയകരമായി അയച്ചു!",
      devNote: "ഡെവലപ്‌മെന്റ് മോഡ് - OTP:",
      back: "തിരികെ",
      loading: "ദയവായി കാത്തിരിക്കുക...",
      loginSuccess: "ലോഗിൻ വിജയകരം!",
      welcome: "കൃഷി സാഥിയിലേക്ക് സ്വാഗതം",
    },
  };

  const t = translations[language] || translations.en;

  // Kerala districts
  const districts = [
    "Thiruvananthapuram",
    "Kollam",
    "Pathanamthitta",
    "Alappuzha",
    "Kottayam",
    "Idukki",
    "Ernakulam",
    "Thrissur",
    "Palakkad",
    "Malappuram",
    "Kozhikode",
    "Wayanad",
    "Kannur",
    "Kasaragod",
  ];

  const validatePhone = (phoneNumber) => {
    // Remove any spaces, dashes, or special characters
    const cleaned = phoneNumber.replace(/[\s\-()]/g, "");

    // Check if it's a 10-digit number (without +91)
    const tenDigitRegex = /^[6-9]\d{9}$/;
    if (tenDigitRegex.test(cleaned)) {
      return true;
    }

    // Check if it's already in +91 format
    const fullFormatRegex = /^\+91[6-9]\d{9}$/;
    return fullFormatRegex.test(cleaned);
  };

  const formatPhoneForAPI = (phoneNumber) => {
    // Remove any spaces, dashes, or special characters
    const cleaned = phoneNumber.replace(/[\s\-()]/g, "");

    // If it's 10 digits starting with 6-9, add +91
    const tenDigitRegex = /^[6-9]\d{9}$/;
    if (tenDigitRegex.test(cleaned)) {
      return `+91${cleaned}`;
    }

    // If it already has +91, return as is
    return cleaned;
  };

  const sendOTP = async () => {
    if (!validatePhone(phone)) {
      setError(
        "Please enter a valid Indian phone number (10 digits starting with 6-9)"
      );
      return;
    }

    setLoading(true);
    setError("");

    const formattedPhone = formatPhoneForAPI(phone);

    try {
      const response = await fetch("http://localhost:8000/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setStep("otp");
        setDevOtp(data.dev_otp); // For development
      } else {
        setError(data.detail || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create farms array if farm size is provided
      const farms = [];
      if (farmSize && parseFloat(farmSize) > 0) {
        farms.push({
          size: farmSize,
          unit: farmSizeUnit,
        });
      }

      const response = await fetch(
        "http://localhost:8000/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: formatPhoneForAPI(phone),
            otp,
            farmer_name: farmerName,
            district,
            language,
            farms: farms,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Save authentication data
        localStorage.setItem("authToken", data.access_token);
        localStorage.setItem("farmerData", JSON.stringify(data.farmer_data));

        // Call parent login handler
        onLogin(data);
      } else {
        setError(data.detail || "OTP verification failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep("phone");
    setOtp("");
    setError("");
    setOtpSent(false);
    setDevOtp("");
    // Reset farm size fields when going back
    setFarmSize("");
    setFarmSizeUnit("acres");
  };

  const handlePasskeyLogin = async (passkeyData) => {
    try {
      // Save authentication data
      localStorage.setItem("authToken", passkeyData.access_token);
      localStorage.setItem(
        "farmerData",
        JSON.stringify(passkeyData.farmer_data)
      );

      // Call parent login handler
      onLogin(passkeyData);
    } catch (error) {
      console.error("Passkey login error:", error);
      setError("Passkey authentication failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🌾</div>
            <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
            <p className="text-gray-600 mt-2">{t.welcome}</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.phone} *
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneInput(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="w-full"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.name}
                </label>
                <Input
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.district}
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{t.districtPlaceholder}</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.farmSize} (Optional)
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    placeholder={t.farmSizePlaceholder}
                    className="flex-1"
                    min="0"
                    step="0.1"
                  />
                  <select
                    value={farmSizeUnit}
                    onChange={(e) => setFarmSizeUnit(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="acres">{t.acres}</option>
                    <option value="hectares">{t.hectares}</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={sendOTP}
                disabled={loading || !phone}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? t.loading : t.sendOtp}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {language === "ml"
                      ? "അല്ലെങ്കിൽ"
                      : language === "hi"
                      ? "या"
                      : "or"}
                  </span>
                </div>
              </div>

              {/* Passkey Authentication */}
              <PasskeyAuth
                onPasskeyLogin={handlePasskeyLogin}
                language={language}
              />
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              {otpSent && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {t.otpSent}
                  <br />
                  <small>{phone}</small>
                </div>
              )}

              {devOtp && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                  <strong>{t.devNote}</strong> {devOtp}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.otp} *
                </label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder={t.otpPlaceholder}
                  className="w-full text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-3">
                <Button onClick={goBack} variant="outline" className="flex-1">
                  {t.back}
                </Button>
                <Button
                  onClick={verifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading ? t.loading : t.verify}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Authentication;
