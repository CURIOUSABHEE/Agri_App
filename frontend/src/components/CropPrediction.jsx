import React, { useState, useEffect, useCallback } from "react";
import { cropPredictionService } from "../services/api";

const CropPrediction = ({ language = "en" }) => {
  const [formData, setFormData] = useState({
    soil_type: "",
    season: "",
    state: "",
    ph_level: "",
    water_availability: "medium",
    experience_level: "intermediate",
    farm_size: "small",
  });

  const [predictions, setPredictions] = useState(null);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const loadOptions = useCallback(async () => {
    try {
      const response = await cropPredictionService.getPredictionOptions(language);
      if (response.success) setOptions(response.options);
    } catch (err) {
      console.error("Error loading options:", err);
      setError("Failed to load form options");
    }
  }, [language]);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!formData.soil_type || !formData.season || !formData.state) {
      setError(
        language === "hi"
          ? "कृपया सभी आवश्यक फ़ील्ड भरें"
          : language === "ml"
            ? "ദയവായി എല്ലാ ആവശ്യമായ ഫീൽഡുകളും പൂരിപ്പിക്കുക"
            : "Please fill all required fields"
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const predictionData = {
        ...formData,
        ph_level: formData.ph_level ? parseFloat(formData.ph_level) : null,
      };
      const response = await cropPredictionService.predictCrops(predictionData);
      if (response.success) {
        setPredictions(response);
      } else {
        throw new Error(response.error || "Prediction failed");
      }
    } catch (err) {
      setError(`${language === "hi" ? "फसल की भविष्यवाणी में त्रुटि" : language === "ml" ? "വിള പ്രവചനത്തിൽ പിശക്" : "Error predicting crops"}: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const viewCropDetails = async (cropKey) => {
    try {
      const response = await cropPredictionService.getCropDetails(cropKey);
      if (response.success) setSelectedCrop(response.crop_data);
    } catch (err) {
      console.error("Error fetching crop details:", err);
    }
  };

  const getSuitabilityGradient = (percentage) => {
    if (percentage >= 80) return "from-green-500 to-emerald-600";
    if (percentage >= 65) return "from-blue-500 to-cyan-600";
    if (percentage >= 50) return "from-yellow-500 to-amber-600";
    return "from-orange-500 to-red-500";
  };

  const getSuitabilityBg = (percentage) => {
    if (percentage >= 80) return "bg-green-50 border-green-200";
    if (percentage >= 65) return "bg-blue-50 border-blue-200";
    if (percentage >= 50) return "bg-yellow-50 border-yellow-200";
    return "bg-orange-50 border-orange-200";
  };

  const getSuitabilityText = (percentage) => {
    if (percentage >= 80) return "text-green-700";
    if (percentage >= 65) return "text-blue-700";
    if (percentage >= 50) return "text-yellow-700";
    return "text-orange-700";
  };

  const inputClass = "w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-0 focus:border-green-500 bg-white transition-colors duration-200 text-gray-800";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-6">

      {/* Hero Header */}
      <div className={`relative overflow-hidden bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 rounded-3xl p-6 mb-8 shadow-xl shadow-green-200 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl border border-white/20 shadow-lg">
            🌾
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {language === "hi" ? "फसल की भविष्यवाणी" : language === "ml" ? "വിള പ്രവചനം" : "Crop Prediction"}
            </h1>
            <p className="text-green-200 text-sm mt-1">
              {language === "hi" ? "अपनी भूमि के लिए सर्वोत्तम फसलें खोजें" : language === "ml" ? "നിങ്ങളുടെ ഭൂമിക്ക് ഏറ്റവും അനുയോജ്യമായ വിളകൾ" : "Discover the best crops for your land and conditions"}
            </p>
          </div>
        </div>
        {/* Data pills */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-5">
          {["🌱 AI-Powered", "📊 Real-time Data", "🗺️ State-specific"].map((pill) => (
            <span key={pill} className="bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">
              {pill}
            </span>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 mb-8 overflow-hidden transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">📝</span>
            {language === "hi" ? "खेती की जानकारी दें" : language === "ml" ? "കൃഷി വിവരങ്ങൾ നൽകുക" : "Provide Farming Information"}
          </h3>
        </div>

        <form onSubmit={handlePredict} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Soil Type */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === "hi" ? "मिट्टी का प्रकार" : language === "ml" ? "മണ്ണിന്റെ തരം" : "Soil Type"} <span className="text-red-500">*</span>
              </label>
              <select value={formData.soil_type} onChange={(e) => handleInputChange("soil_type", e.target.value)} className={inputClass} required>
                <option value="">{language === "hi" ? "चुनें" : language === "ml" ? "തിരഞ്ഞെടുക്കുക" : "Select"}</option>
                {options?.soil_types?.map((soil) => (<option key={soil.value} value={soil.value}>{soil.label}</option>))}
              </select>
            </div>

            {/* Season */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === "hi" ? "मौसम" : language === "ml" ? "സീസൺ" : "Season"} <span className="text-red-500">*</span>
              </label>
              <select value={formData.season} onChange={(e) => handleInputChange("season", e.target.value)} className={inputClass} required>
                <option value="">{language === "hi" ? "चुनें" : language === "ml" ? "തിരഞ്ഞെടുക്കുക" : "Select"}</option>
                {options?.seasons?.map((season) => (<option key={season.value} value={season.value}>{season.label}</option>))}
              </select>
            </div>

            {/* State */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === "hi" ? "राज्य" : language === "ml" ? "സംസ്ഥാനം" : "State"} <span className="text-red-500">*</span>
              </label>
              <select value={formData.state} onChange={(e) => handleInputChange("state", e.target.value)} className={inputClass} required>
                <option value="">{language === "hi" ? "चुनें" : language === "ml" ? "തിരഞ്ഞെടുക്കുക" : "Select"}</option>
                {options?.states?.map((state) => (<option key={state.value} value={state.value}>{state.label}</option>))}
              </select>
            </div>

            {/* pH Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === "hi" ? "मिट्टी का pH स्तर" : language === "ml" ? "മണ്ണിന്റെ pH ലെവൽ" : "Soil pH Level"}
                <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <input type="number" step="0.1" min="3.0" max="10.0" value={formData.ph_level} onChange={(e) => handleInputChange("ph_level", e.target.value)} placeholder={language === "hi" ? "उदा. 6.5" : language === "ml" ? "ഉദാ. 6.5" : "e.g. 6.5"} className={inputClass} />
            </div>

            {/* Water Availability */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === "hi" ? "पानी की उपलब्धता" : language === "ml" ? "ജല ലഭ്യത" : "Water Availability"}
              </label>
              <select value={formData.water_availability} onChange={(e) => handleInputChange("water_availability", e.target.value)} className={inputClass}>
                {options?.water_availability?.map((water) => (<option key={water.value} value={water.value}>{water.label}</option>))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === "hi" ? "अनुभव स्तर" : language === "ml" ? "അനുഭവ നില" : "Experience Level"}
              </label>
              <select value={formData.experience_level} onChange={(e) => handleInputChange("experience_level", e.target.value)} className={inputClass}>
                {options?.experience_levels?.map((exp) => (<option key={exp.value} value={exp.value}>{exp.label}</option>))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <span className="text-lg">⚠️</span>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{language === "hi" ? "भविष्यवाणी हो रही है..." : language === "ml" ? "പ്രവചിക്കുന്നു..." : "Predicting..."}</>
              ) : (
                <><span>🔮</span>{language === "hi" ? "फसल की भविष्यवाणी करें" : language === "ml" ? "വിള പ്രവചിക്കുക" : "Predict Crops"}</>
              )}
            </button>
            <button type="button" onClick={() => { setFormData({ soil_type: "", season: "", state: "", ph_level: "", water_availability: "medium", experience_level: "intermediate", farm_size: "small" }); setPredictions(null); setError(""); }} className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
              {language === "hi" ? "रीसेट करें" : language === "ml" ? "പുനഃസജ്ജമാക്കുക" : "Reset"}
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-green-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-green-500 rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-emerald-100 rounded-full" />
            <div className="absolute inset-2 border-4 border-t-emerald-400 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.7s" }} />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🌱</div>
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-semibold">
              {language === "hi" ? "सर्वोत्तम फसलों का विश्लेषण हो रहा है..." : language === "ml" ? "മികച്ച വിളകൾ വിശകലനം ചെയ്യുന്നു..." : "Analyzing the best crops for you..."}
            </p>
            <p className="text-gray-400 text-sm mt-1">Checking soil, season & market data</p>
          </div>
        </div>
      )}

      {/* Prediction Results */}
      {predictions && predictions.success && (
        <>
          {/* Summary Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-6 mb-6 shadow-lg shadow-green-200">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
            <div className="relative z-10">
              <div className="flex flex-wrap gap-3 mb-4">
                {predictions.real_time_data?.weather_integrated && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
                    ☀️ Real-time Weather
                  </span>
                )}
                {predictions.real_time_data?.market_prices_integrated && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
                    💰 Live Market Prices
                  </span>
                )}
                {!predictions.real_time_data?.weather_integrated && !predictions.real_time_data?.market_prices_integrated && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
                    📊 Historical Data
                  </span>
                )}
              </div>
              <p className="text-green-100 text-sm leading-relaxed mb-4">{predictions.summary}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: language === "hi" ? "मिट्टी" : "Soil", value: predictions.input_parameters.soil_type, icon: "🌍" },
                  { label: language === "hi" ? "मौसम" : "Season", value: predictions.input_parameters.season, icon: "🌦️" },
                  { label: language === "hi" ? "राज्य" : "State", value: predictions.input_parameters.state, icon: "🗺️" },
                  { label: language === "hi" ? "सुझाव" : "Recommended", value: predictions.predicted_crops.length + " crops", icon: "✅" },
                ].map((item) => (
                  <div key={item.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <p className="text-white/70 text-xs mb-1">{item.icon} {item.label}</p>
                    <p className="text-white font-bold text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Crops Grid */}
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-sm">🌿</span>
            {language === "hi" ? "सुझाई गई फसलें" : language === "ml" ? "നിർദ്ദേശിച്ച വിളകൾ" : "Recommended Crops"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {predictions.predicted_crops.map((crop, idx) => (
              <div key={crop.crop_key} className={`group bg-white rounded-2xl border-2 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${getSuitabilityBg(crop.suitability_percentage)}`}
                style={{ animationDelay: `${idx * 80}ms` }}>
                {/* Top suitability bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${getSuitabilityGradient(crop.suitability_percentage)}`} />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">{crop.crop_name}</h4>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${getSuitabilityText(crop.suitability_percentage)} bg-white/70`}>
                        {crop.recommendation_level}
                      </span>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 bg-gradient-to-br ${getSuitabilityGradient(crop.suitability_percentage)} shadow-sm group-hover:scale-110 transition-transform`}>
                      <span className="text-white font-black text-sm leading-none">{crop.suitability_percentage}%</span>
                      <span className="text-white/80 text-[9px]">match</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between items-center py-1.5 border-b border-black/5">
                      <span className="text-gray-500">⏱️ Growth Period</span>
                      <span className="font-semibold text-gray-700">{crop.details.growth_period_days} days</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-black/5">
                      <span className="text-gray-500">📦 Yield</span>
                      <span className="font-semibold text-gray-700">{crop.details.yield_per_acre}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-500">💰 Market Price</span>
                      <div className="text-right">
                        <span className={`font-semibold ${crop.details.price_status === "Real-time" ? "text-green-600" : "text-gray-700"}`}>
                          {crop.details.current_market_price || crop.details.market_price_range}
                        </span>
                        {crop.details.price_status && (
                          <div className="text-xs text-gray-400">{crop.details.price_status === "Real-time" ? "🔴 Live" : "📊 Avg"}</div>
                        )}
                      </div>
                    </div>
                    {crop.details.weather_suitability && (
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-gray-500">🌤️ Weather Match</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${crop.details.weather_suitability === "Ideal" ? "bg-green-100 text-green-700" : crop.details.weather_suitability === "Good" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                          {crop.details.weather_suitability}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Why it fits:</p>
                    <ul className="space-y-1">
                      {crop.reasons.slice(0, 3).map((reason, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button onClick={() => viewCropDetails(crop.crop_key)} className="w-full py-2 rounded-xl border-2 border-current text-sm font-semibold transition-all duration-200 hover:bg-white/50 hover:scale-[1.02] active:scale-[0.98]" style={{ borderColor: crop.suitability_percentage >= 80 ? '#16a34a' : crop.suitability_percentage >= 65 ? '#2563eb' : '#ca8a04', color: crop.suitability_percentage >= 80 ? '#16a34a' : crop.suitability_percentage >= 65 ? '#2563eb' : '#ca8a04' }}>
                    {language === "hi" ? "✦ विवरण देखें" : language === "ml" ? "✦ വിശദാംശങ്ങൾ" : "✦ View Full Details"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Farming Tips */}
          {predictions.farming_tips && predictions.farming_tips.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-200 rounded-3xl p-6 mb-6">
              <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">💡</span>
                {language === "hi" ? "खेती के सुझाव" : language === "ml" ? "കൃഷി നിർദ്ദേശങ്ങൾ" : "Farming Tips"}
              </h3>
              <ul className="space-y-3">
                {predictions.farming_tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{index + 1}</span>
                    <span className="text-sm text-amber-900">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Crop Details Modal */}
      {selectedCrop && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && setSelectedCrop(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-3xl sticky top-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedCrop.name}</h3>
                  <p className="text-green-200 text-sm mt-0.5">Detailed growing guide</p>
                </div>
                <button onClick={() => setSelectedCrop(null)} className="w-9 h-9 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors flex items-center justify-center font-bold">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Season", value: selectedCrop.season.join(", "), icon: "🌦️" },
                  { label: "Soil Types", value: selectedCrop.soil_types.join(", "), icon: "🌍" },
                  { label: "pH Range", value: selectedCrop.ph_range.join(" – "), icon: "🧪" },
                  { label: "Water Need", value: selectedCrop.water_requirement, icon: "💧" },
                  { label: "Temperature", value: selectedCrop.temperature_range.join(" – ") + "°C", icon: "🌡️" },
                  { label: "Rainfall", value: selectedCrop.rainfall_mm.join(" – ") + " mm", icon: "🌧️" },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{item.icon} {item.label}</p>
                    <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-2xl p-4">
                  <p className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">✅ Pros</p>
                  <ul className="space-y-2">
                    {selectedCrop.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded-2xl p-4">
                  <p className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">⚠️ Cons</p>
                  <ul className="space-y-2">
                    {selectedCrop.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                        <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4">
                <p className="text-sm font-bold text-blue-700 mb-2">🗺️ Suitable States</p>
                <p className="text-sm text-blue-900">{selectedCrop.states_suitable.join(", ")}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropPrediction;
