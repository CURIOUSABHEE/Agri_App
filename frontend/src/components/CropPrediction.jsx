import React, { useState, useEffect, useCallback } from "react";
import { cropPredictionService } from "../services/api";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

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

  const loadOptions = useCallback(async () => {
    try {
      const response = await cropPredictionService.getPredictionOptions(
        language
      );
      if (response.success) {
        setOptions(response.options);
      }
    } catch (err) {
      console.error("Error loading options:", err);
      setError("Failed to load form options");
    }
  }, [language]);

  // Load prediction options on component mount and when language changes
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(""); // Clear error when user makes changes
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
      // Convert pH to number if provided
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
      console.error("Error predicting crops:", err);
      setError(
        `${
          language === "hi"
            ? "फसल की भविष्यवाणी में त्रुटि"
            : language === "ml"
            ? "വിള പ്രവചനത്തിൽ പിശക്"
            : "Error predicting crops"
        }: ${err.message || err}`
      );
    } finally {
      setLoading(false);
    }
  };

  const viewCropDetails = async (cropKey) => {
    try {
      const response = await cropPredictionService.getCropDetails(cropKey);
      if (response.success) {
        setSelectedCrop(response.crop_data);
      }
    } catch (err) {
      console.error("Error fetching crop details:", err);
    }
  };

  const getSuitabilityColor = (percentage) => {
    if (percentage >= 80) return "bg-green-100 text-green-800";
    if (percentage >= 65) return "bg-blue-100 text-blue-800";
    if (percentage >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-orange-100 text-orange-800";
  };

  const getSuitabilityIcon = (percentage) => {
    if (percentage >= 80) return "🟢";
    if (percentage >= 65) return "🔵";
    if (percentage >= 50) return "🟡";
    return "🟠";
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === "hi"
            ? "फसल की भविष्यवाणी"
            : language === "ml"
            ? "വിള പ്രവചനം"
            : "Crop Prediction"}
        </h1>
        <p className="text-gray-600">
          {language === "hi"
            ? "अपनी भूमि और स्थितियों के लिए सर्वोत्तम फसलों की खोज करें"
            : language === "ml"
            ? "നിങ്ങളുടെ ഭൂമിക്കും സാഹചര്യങ്ങൾക്കും അനുയോജ്യമായ മികച്ച വിളകൾ കണ്ടെത്തുക"
            : "Discover the best crops for your land and conditions"}
        </p>
      </div>

      {/* Prediction Form */}
      <Card className="mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {language === "hi"
              ? "खेती की जानकारी दें"
              : language === "ml"
              ? "കൃഷി വിവരങ്ങൾ നൽകുക"
              : "Provide Farming Information"}
          </h3>

          <form onSubmit={handlePredict} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Soil Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "hi"
                    ? "मिट्टी का प्रकार *"
                    : language === "ml"
                    ? "മണ്ണിന്റെ തരം *"
                    : "Soil Type *"}
                </label>
                <select
                  value={formData.soil_type}
                  onChange={(e) =>
                    handleInputChange("soil_type", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">
                    {language === "hi"
                      ? "चुनें"
                      : language === "ml"
                      ? "തിരഞ്ഞെടുക്കുക"
                      : "Select"}
                  </option>
                  {options?.soil_types?.map((soil) => (
                    <option key={soil.value} value={soil.value}>
                      {soil.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "hi"
                    ? "मौसम *"
                    : language === "ml"
                    ? "സീസൺ *"
                    : "Season *"}
                </label>
                <select
                  value={formData.season}
                  onChange={(e) => handleInputChange("season", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">
                    {language === "hi"
                      ? "चुनें"
                      : language === "ml"
                      ? "തിരഞ്ഞെടുക്കുക"
                      : "Select"}
                  </option>
                  {options?.seasons?.map((season) => (
                    <option key={season.value} value={season.value}>
                      {season.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "hi"
                    ? "राज्य *"
                    : language === "ml"
                    ? "സംസ്ഥാനം *"
                    : "State *"}
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">
                    {language === "hi"
                      ? "चुनें"
                      : language === "ml"
                      ? "തിരഞ്ഞെടുക്കുക"
                      : "Select"}
                  </option>
                  {options?.states?.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* pH Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "hi"
                    ? "मिट्टी का pH स्तर"
                    : language === "ml"
                    ? "മണ്ണിന്റെ pH ലെവൽ"
                    : "Soil pH Level"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="3.0"
                  max="10.0"
                  value={formData.ph_level}
                  onChange={(e) =>
                    handleInputChange("ph_level", e.target.value)
                  }
                  placeholder={
                    language === "hi"
                      ? "उदा. 6.5"
                      : language === "ml"
                      ? "ഉദാ. 6.5"
                      : "e.g. 6.5"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Water Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "hi"
                    ? "पानी की उपलब्धता"
                    : language === "ml"
                    ? "ജല ലഭ്യത"
                    : "Water Availability"}
                </label>
                <select
                  value={formData.water_availability}
                  onChange={(e) =>
                    handleInputChange("water_availability", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {options?.water_availability?.map((water) => (
                    <option key={water.value} value={water.value}>
                      {water.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "hi"
                    ? "अनुभव स्तर"
                    : language === "ml"
                    ? "അനുഭവ നില"
                    : "Experience Level"}
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) =>
                    handleInputChange("experience_level", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {options?.experience_levels?.map((exp) => (
                    <option key={exp.value} value={exp.value}>
                      {exp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading
                  ? language === "hi"
                    ? "भविष्यवाणी हो रही है..."
                    : language === "ml"
                    ? "പ്രവചിക്കുന്നു..."
                    : "Predicting..."
                  : language === "hi"
                  ? "फसल की भविष्यवाणी करें"
                  : language === "ml"
                  ? "വിള പ്രവചിക്കുക"
                  : "Predict Crops"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    soil_type: "",
                    season: "",
                    state: "",
                    ph_level: "",
                    water_availability: "medium",
                    experience_level: "intermediate",
                    farm_size: "small",
                  });
                  setPredictions(null);
                  setError("");
                }}
              >
                {language === "hi"
                  ? "रीसेट करें"
                  : language === "ml"
                  ? "പുനഃസജ്ജമാക്കുക"
                  : "Reset"}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Prediction Results */}
      {predictions && predictions.success && (
        <>
          {/* Summary */}
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === "hi"
                  ? "भविष्यवाणी सारांश"
                  : language === "ml"
                  ? "പ്രവചന സംഗ്രഹം"
                  : "Prediction Summary"}
              </h3>
              <p className="text-gray-700 mb-4">{predictions.summary}</p>

              {/* Real-time Data Indicators */}
              {predictions.real_time_data && (
                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  {predictions.real_time_data.weather_integrated && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      ☀️ Real-time Weather
                    </span>
                  )}
                  {predictions.real_time_data.market_prices_integrated && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      💰 Live Market Prices
                    </span>
                  )}
                  {!predictions.real_time_data.weather_integrated &&
                    !predictions.real_time_data.market_prices_integrated && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        📊 Historical Data
                      </span>
                    )}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">
                    {language === "hi"
                      ? "मिट्टी:"
                      : language === "ml"
                      ? "മണ്ണ്:"
                      : "Soil:"}
                  </span>
                  <br />
                  {predictions.input_parameters.soil_type}
                </div>
                <div>
                  <span className="font-medium">
                    {language === "hi"
                      ? "मौसम:"
                      : language === "ml"
                      ? "സീസൺ:"
                      : "Season:"}
                  </span>
                  <br />
                  {predictions.input_parameters.season}
                </div>
                <div>
                  <span className="font-medium">
                    {language === "hi"
                      ? "राज्य:"
                      : language === "ml"
                      ? "സംസ്ഥാനം:"
                      : "State:"}
                  </span>
                  <br />
                  {predictions.input_parameters.state}
                </div>
                <div>
                  <span className="font-medium">
                    {language === "hi"
                      ? "सुझाई गई फसलें:"
                      : language === "ml"
                      ? "നിർദ്ദേശിച്ച വിളകൾ:"
                      : "Recommended:"}
                  </span>
                  <br />
                  {predictions.predicted_crops.length}
                </div>
              </div>
            </div>
          </Card>

          {/* Recommended Crops */}
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {language === "hi"
                  ? "सुझाई गई फसलें"
                  : language === "ml"
                  ? "നിർദ്ദേശിച്ച വിളകൾ"
                  : "Recommended Crops"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictions.predicted_crops.map((crop) => (
                  <div
                    key={crop.crop_key}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-800">
                        {crop.crop_name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span>
                          {getSuitabilityIcon(crop.suitability_percentage)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${getSuitabilityColor(
                            crop.suitability_percentage
                          )}`}
                        >
                          {crop.suitability_percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex justify-between">
                        <span>
                          {language === "hi"
                            ? "विकास अवधि:"
                            : language === "ml"
                            ? "വളർച്ചാ കാലം:"
                            : "Growth Period:"}
                        </span>
                        <span>{crop.details.growth_period_days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          {language === "hi"
                            ? "उत्पादन:"
                            : language === "ml"
                            ? "വിളവ്:"
                            : "Yield:"}
                        </span>
                        <span>{crop.details.yield_per_acre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          {language === "hi"
                            ? "बाजार मूल्य:"
                            : language === "ml"
                            ? "വിപണി വില:"
                            : "Market Price:"}
                        </span>
                        <div className="text-right">
                          <span
                            className={`${
                              crop.details.price_status === "Real-time"
                                ? "text-green-600 font-semibold"
                                : "text-gray-600"
                            }`}
                          >
                            {crop.details.current_market_price ||
                              crop.details.market_price_range}
                          </span>
                          {crop.details.price_status && (
                            <div className="text-xs text-gray-500">
                              {crop.details.price_status === "Real-time"
                                ? "🔴 Live"
                                : "📊 Avg"}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Weather Suitability Indicator */}
                      {crop.details.weather_suitability && (
                        <div className="flex justify-between">
                          <span>
                            {language === "hi"
                              ? "मौसम अनुकूलता:"
                              : language === "ml"
                              ? "കാലാവസ്ഥാ അനുകൂലത:"
                              : "Weather Match:"}
                          </span>
                          <div className="text-right">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                crop.details.weather_suitability === "Ideal"
                                  ? "bg-green-100 text-green-800"
                                  : crop.details.weather_suitability === "Good"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {crop.details.weather_suitability}
                            </span>
                            {crop.details.current_temperature && (
                              <div className="text-xs text-gray-500 mt-1">
                                {crop.details.current_temperature}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        {language === "hi"
                          ? "कारण:"
                          : language === "ml"
                          ? "കാരണങ്ങൾ:"
                          : "Reasons:"}
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {crop.reasons.slice(0, 3).map((reason, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs px-2 py-1 rounded ${getSuitabilityColor(
                          crop.suitability_percentage
                        )}`}
                      >
                        {crop.recommendation_level}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewCropDetails(crop.crop_key)}
                      >
                        {language === "hi"
                          ? "विवरण"
                          : language === "ml"
                          ? "വിശദാംശങ്ങൾ"
                          : "Details"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Farming Tips */}
          {predictions.farming_tips && predictions.farming_tips.length > 0 && (
            <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-green-50">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {language === "hi"
                    ? "खेती के सुझाव"
                    : language === "ml"
                    ? "കൃഷി നിർദ്ദേശങ്ങൾ"
                    : "Farming Tips"}
                </h3>
                <ul className="space-y-2">
                  {predictions.farming_tips.map((tip, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start"
                    >
                      <span className="mr-2">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Crop Details Modal */}
      {selectedCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedCrop.name}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCrop(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Season:</span>
                  <p>{selectedCrop.season.join(", ")}</p>
                </div>
                <div>
                  <span className="font-medium">Soil Types:</span>
                  <p>{selectedCrop.soil_types.join(", ")}</p>
                </div>
                <div>
                  <span className="font-medium">pH Range:</span>
                  <p>{selectedCrop.ph_range.join(" - ")}</p>
                </div>
                <div>
                  <span className="font-medium">Water Requirement:</span>
                  <p>{selectedCrop.water_requirement}</p>
                </div>
                <div>
                  <span className="font-medium">Temperature Range:</span>
                  <p>{selectedCrop.temperature_range.join(" - ")}°C</p>
                </div>
                <div>
                  <span className="font-medium">Rainfall:</span>
                  <p>{selectedCrop.rainfall_mm.join(" - ")} mm</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-green-600">Pros:</span>
                  <ul className="text-sm mt-1">
                    {selectedCrop.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-1">✓</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium text-red-600">Cons:</span>
                  <ul className="text-sm mt-1">
                    {selectedCrop.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-red-500 mr-1">✗</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <span className="font-medium">Suitable States:</span>
                <p className="text-sm mt-1">
                  {selectedCrop.states_suitable.join(", ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-green-400 mb-4">
            <svg
              className="mx-auto h-12 w-12 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p className="text-gray-600">
            {language === "hi"
              ? "आपके लिए सर्वोत्तम फसलों का विश्लेषण कर रहे हैं..."
              : language === "ml"
              ? "നിങ്ങൾക്കായി മികച്ച വിളകൾ വിശകലനം ചെയ്യുന്നു..."
              : "Analyzing the best crops for you..."}
          </p>
        </div>
      )}
    </div>
  );
};

export default CropPrediction;
