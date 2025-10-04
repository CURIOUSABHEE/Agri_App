import { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function MarketPrices({ language }) {
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [availableCrops, setAvailableCrops] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [tips, setTips] = useState([]);
  const [vegetableColumn, setVegetableColumn] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [nearbyMarkets, setNearbyMarkets] = useState(null);
  const [farmerLocation, setFarmerLocation] = useState("");
  const [marketSearchLoading, setMarketSearchLoading] = useState(false);
  const [showMarkets, setShowMarkets] = useState(false);

  // Fetch vegetable price data using backend API
  const fetchMarketDataFromBackend = async (
    startDate,
    endDate,
    cropFilter = ""
  ) => {
    try {
      let url = `http://localhost:8000/api/kerala-market/data?start_date=${startDate}&end_date=${
        endDate || startDate
      }`;

      if (cropFilter && cropFilter.trim() !== "") {
        url += `&crop_filter=${encodeURIComponent(cropFilter)}`;
      }

      console.log("🔍 Fetching from URL:", url);
      const response = await fetch(url);
      console.log("📊 Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("📈 API Response:", result);
        if (result.success) {
          return {
            data: result.data,
            crops: result.crops,
            vegetableColumn: result.vegetable_column,
          };
        } else {
          throw new Error(
            result.error || result.message || "Failed to fetch data"
          );
        }
      } else {
        const errorText = await response.text();
        console.error("❌ HTTP Error Response:", errorText);
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}. Details: ${errorText}`
        );
      }
    } catch (error) {
      console.error("❌ Error fetching data from backend:", error);
      throw error;
    }
  };

  // Fetch data for date range using backend API
  const fetchDataForDateRange = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;

    setLoading(true);
    setError("");

    try {
      const result = await fetchMarketDataFromBackend(
        dateRange.startDate,
        dateRange.endDate
      );

      if (result.data.length > 0) {
        // Filter out header-like crop names
        const validCrops = result.crops.filter(
          (crop) =>
            crop &&
            crop.toLowerCase() !== "vegetablename" &&
            crop.toLowerCase() !== "crop" &&
            crop.toLowerCase() !== "name" &&
            crop.trim() !== ""
        );

        console.log("🌾 Valid crops after filtering:", validCrops);

        setPriceData(result.data);
        setAvailableCrops(validCrops);
        setVegetableColumn(result.vegetableColumn);
      } else {
        setError(
          language === "ml"
            ? "ഈ തീയതിയിൽ ഡാറ്റ ലഭ്യമല്ല"
            : language === "hi"
            ? "इस तारीख के लिए कोई डेटा उपलब्ध नहीं"
            : "No data available for this date"
        );
      }
    } catch (error) {
      console.error("Error loading market data:", error);
      setError(
        `${
          language === "ml"
            ? "ഡാറ്റ ലോഡ് ചെയ്യുന്നതിൽ പിശക്"
            : language === "hi"
            ? "डेटा लोड करने में त्रुटि"
            : "Error loading data"
        }: ${error.message || error}`
      );
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate, language]);

  // Auto-load data when component mounts or dates change
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchDataForDateRange();
    }
  }, [dateRange.startDate, dateRange.endDate, fetchDataForDateRange]);

  // Load data on initial page load
  useEffect(() => {
    fetchDataForDateRange();
  }, [fetchDataForDateRange]);

  // Analyze filtered data using backend
  const analyzeDataWithBackend = async (
    allData,
    selectedCrops,
    vegetableColumn
  ) => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/kerala-market/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: allData,
            selectedCrops: selectedCrops,
            vegetableColumn: vegetableColumn,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result;
        } else {
          throw new Error(result.error || "Analysis failed");
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error analyzing data:", error);
      throw error;
    }
  };

  // Parse price from string like "₹45-50" or "₹40" (handled by backend now)
  /* const parsePrice = (priceStr) => {
    try {
      if (!priceStr || priceStr.toString().toLowerCase() === "none")
        return null;

      const cleanStr = priceStr.toString().replace("₹", "").trim();
      if (cleanStr.includes("-")) {
        const nums = cleanStr
          .split("-")
          .map((x) => parseFloat(x.trim()))
          .filter((x) => !isNaN(x));
        return nums.length > 0
          ? nums.reduce((a, b) => a + b) / nums.length
          : null;
      }
      const parsed = parseFloat(cleanStr);
      return isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  }; */

  // Fetch nearby markets for selected crops
  const fetchNearbyMarkets = async () => {
    if (selectedCrops.length === 0) {
      setError(
        language === "ml"
          ? "വിളകൾ തിരഞ്ഞെടുക്കുക"
          : language === "hi"
          ? "फसलें चुनें"
          : "Please select crops first"
      );
      return;
    }

    setMarketSearchLoading(true);
    setError("");

    try {
      const cropsParam = selectedCrops.join(",");
      let url = `http://localhost:8000/api/markets/nearby-markets?crops=${encodeURIComponent(
        cropsParam
      )}`;

      if (farmerLocation.trim()) {
        url += `&location=${encodeURIComponent(farmerLocation)}`;
      }

      const response = await fetch(url);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNearbyMarkets(result);
          setShowMarkets(true);
        } else {
          throw new Error(result.error || "Failed to fetch markets");
        }
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("Error fetching nearby markets:", error);
      setError(
        `${
          language === "ml"
            ? "അടുത്തുള്ള മാർക്കറ്റുകൾ കണ്ടെത്തുന്നതിൽ പിശക്"
            : language === "hi"
            ? "निकटतम बाज़ारों को खोजने में त्रुटि"
            : "Error finding nearby markets"
        }: ${error.message || error}`
      );
    } finally {
      setMarketSearchLoading(false);
    }
  };

  // Generate farmer tips (commented out as it's handled by backend)
  /* const generateTips = (filteredData) => {
    const newTips = [];

    if (filteredData.length === 0) return [];

    // Calculate average prices
    const wholesalePrices = filteredData
      .map((item) => parsePrice(item.price))
      .filter((p) => p !== null);
    const retailPrices = filteredData
      .map((item) => parsePrice(item.retailprice))
      .filter((p) => p !== null);

    const avgWholesale =
      wholesalePrices.reduce((a, b) => a + b, 0) / wholesalePrices.length;
    const avgRetail =
      retailPrices.reduce((a, b) => a + b, 0) / retailPrices.length;

    // Tip 1: Retail vs Wholesale margin
    if (avgRetail && avgWholesale) {
      const margin = avgRetail - avgWholesale;
      if (margin > 10) {
        newTips.push(
          "🟢 Retail prices are much higher than wholesale. Consider direct selling to maximize profit."
        );
      } else if (margin > 0) {
        newTips.push(
          "🟡 Retail is slightly higher than wholesale. You can still gain by targeting consumers."
        );
      } else {
        newTips.push(
          "🔴 Wholesale market is more favorable now. Direct selling may not add much benefit."
        );
      }
    }

    // Tip 2: Price volatility
    if (retailPrices.length > 1) {
      const variance =
        retailPrices.reduce(
          (acc, price) => acc + Math.pow(price - avgRetail, 2),
          0
        ) / retailPrices.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > 10) {
        newTips.push(
          "⚠️ Prices are very volatile. Be cautious and diversify your crop sales."
        );
      }
    }

    // Tip 3: Best crop recommendation
    if (filteredData.length > 1) {
      const vegCol = Object.keys(filteredData[0]).find(
        (key) => key !== "Date" && key !== "price" && key !== "retailprice"
      );
      if (vegCol) {
        const cropPrices = {};
        filteredData.forEach((item) => {
          const crop = item[vegCol];
          const price = parsePrice(item.retailprice);
          if (price) {
            if (!cropPrices[crop]) cropPrices[crop] = [];
            cropPrices[crop].push(price);
          }
        });

        const cropAvgs = {};
        Object.keys(cropPrices).forEach((crop) => {
          cropAvgs[crop] =
            cropPrices[crop].reduce((a, b) => a + b) / cropPrices[crop].length;
        });

        const bestCrop = Object.keys(cropAvgs).reduce((a, b) =>
          cropAvgs[a] > cropAvgs[b] ? a : b
        );
        if (bestCrop) {
          newTips.push(
            `🌾 '${bestCrop}' gave the best retail price on average. Focus more on this crop for profit.`
          );
        }
      }
    }

    setTips(newTips);
  }; */

  // Apply filters and analyze data using backend
  const applyFilters = async () => {
    if (selectedCrops.length === 0) {
      setError(
        language === "ml"
          ? "ദയവായി വിളകൾ തിരഞ്ഞെടുക്കുക"
          : language === "hi"
          ? "कृपया फसलें चुनें"
          : "Please select crops"
      );
      return;
    }

    if (!vegetableColumn) {
      setError("Vegetable column not found in data");
      return;
    }

    try {
      setLoading(true);
      const result = await analyzeDataWithBackend(
        priceData,
        selectedCrops,
        vegetableColumn
      );

      if (result.success) {
        setAnalysisData(result.filtered_data);
        // Handle both string and object formats for tips
        console.log("🔍 Raw tips from backend:", result.tips);
        setTips(
          result.tips.map((tip) => {
            if (typeof tip === "string") {
              return tip;
            } else if (typeof tip === "object") {
              console.log("🔍 Processing object tip:", tip);
              return (
                tip.message ||
                tip.text ||
                tip.tip ||
                "Tip available - check console for details"
              );
            }
            return String(tip);
          })
        );
        setError(""); // Clear any previous errors
        return result.filtered_data;
      } else {
        throw new Error(result.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Error analyzing data:", error);
      setError(
        language === "ml"
          ? "ഡാറ്റ വിശകലനത്തിൽ പിശക്"
          : language === "hi"
          ? "डेटा विश्लेषण में त्रुटि"
          : "Error analyzing data"
      );
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    return analysisData || [];
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === "ml"
            ? "കേരള വെജിറ്റബിൾ മാർക്കറ്റ് പ്രൈസ്"
            : language === "hi"
            ? "केरल सब्जी बाजार भाव"
            : "Kerala Vegetable Market Prices"}
        </h1>
        <p className="text-gray-600">
          {language === "ml"
            ? "കേരളത്തിലെ വെജിറ്റബിൾ മാർക്കറ്റിന്റെ ദൈനിക വിലകൾ"
            : language === "hi"
            ? "केरल की सब्जी मार्केट के दैनिक भाव"
            : "Daily vegetable market prices from Kerala"}
        </p>
      </div>
      {/* Date Range and Filters */}
      <Card className="mb-4 p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-4">
          🗓️{" "}
          {language === "hi"
            ? "दिनांक सीमा और फिल्टर"
            : language === "ml"
            ? "തീയതി പരിധിയും ഫിൽറ്ററും"
            : "Date Range and Filters"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === "hi"
                ? "आरंभ दिनांक"
                : language === "ml"
                ? "ആരംഭ തീയതി"
                : "Start Date"}
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === "hi"
                ? "समाप्ति दिनांक"
                : language === "ml"
                ? "അവസാന തീയതി"
                : "End Date"}
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <Button
              onClick={fetchDataForDateRange}
              disabled={!dateRange.startDate || !dateRange.endDate || loading}
              className="w-full"
              variant={priceData.length > 0 ? "outline" : "default"}
            >
              {loading
                ? language === "hi"
                  ? "लोड हो रहा है..."
                  : language === "ml"
                  ? "ലോഡ് ചെയ്യുന്നു..."
                  : "Loading..."
                : priceData.length > 0
                ? language === "hi"
                  ? "रीफ्रेश करें"
                  : language === "ml"
                  ? "പുതുക्कുക"
                  : "Refresh Data"
                : language === "hi"
                ? "डेटा लोड करें"
                : language === "ml"
                ? "ഡാറ്റ ലോഡ് ചെയ്യുക"
                : "Load Data"}
            </Button>
          </div>
        </div>
      </Card>{" "}
      {/* Crop Selection */}
      {availableCrops.length > 0 && (
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {language === "ml"
                ? "വിളകൾ തിരഞ്ഞെടുക്കുക"
                : language === "hi"
                ? "फसलें चुनें"
                : "Select Crops to Display"}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
              {availableCrops.map((crop) => (
                <label
                  key={crop}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCrops.includes(crop)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCrops((prev) => [...prev, crop]);
                      } else {
                        setSelectedCrops((prev) =>
                          prev.filter((c) => c !== crop)
                        );
                      }
                    }}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{crop}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => applyFilters()}
                disabled={selectedCrops.length === 0 || loading}
              >
                {loading
                  ? language === "ml"
                    ? "വിശകലനം ചെയ്യുന്നു..."
                    : language === "hi"
                    ? "विश्लेषण हो रहा है..."
                    : "Analyzing..."
                  : language === "ml"
                  ? "പ്രയോഗിക്കുക"
                  : language === "hi"
                  ? "लागू करें"
                  : "Apply"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCrops([]);
                  setAnalysisData(null);
                  setTips([]);
                  setError("");
                }}
              >
                {language === "ml"
                  ? "ക്ലിയർ ചെയ്യുക"
                  : language === "hi"
                  ? "साफ करें"
                  : "Clear Selection"}
              </Button>
            </div>
          </div>
        </Card>
      )}
      {/* Market Locator Section */}
      {selectedCrops.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📍</span>
              {language === "ml"
                ? "അടുത്തുള്ള മാർക്കറ്റുകൾ കണ്ടെത്തുക"
                : language === "hi"
                ? "निकटतम बाज़ार खोजें"
                : "Find Nearby Markets"}
            </h3>

            <p className="text-gray-600 mb-4">
              {language === "ml"
                ? "നിങ്ങളുടെ വിളകൾ വിൽക്കാൻ അടുത്തുള്ള D-Mart, റീട്ടെയിൽ, മൊത്തവ്യാപാര മാർക്കറ്റുകൾ കണ്ടെത്തുക"
                : language === "hi"
                ? "अपनी फसलों को बेचने के लिए निकटतम D-Mart, खुदरा और थोक बाजारों को खोजें"
                : "Find nearby D-Mart, retail, and wholesale markets to sell your crops"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "hi"
                    ? "आपका स्थान (जिला/शहर)"
                    : language === "ml"
                    ? "നിങ്ങളുടെ സ്ഥലം (ജില്ല/പട്ടണം)"
                    : "Your Location (District/City)"}
                </label>
                <input
                  type="text"
                  value={farmerLocation}
                  onChange={(e) => setFarmerLocation(e.target.value)}
                  placeholder={
                    language === "hi"
                      ? "उदा. कोच्चि, त्रिशूर"
                      : language === "ml"
                      ? "ഉദാ. കൊച്ചി, തൃശ്ശൂർ"
                      : "e.g. Kochi, Thrissur"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <Button
                  onClick={fetchNearbyMarkets}
                  disabled={selectedCrops.length === 0 || marketSearchLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {marketSearchLoading
                    ? language === "hi"
                      ? "खोज रहे हैं..."
                      : language === "ml"
                      ? "തിരയുന്നു..."
                      : "Searching..."
                    : language === "hi"
                    ? "बाज़ार खोजें"
                    : language === "ml"
                    ? "മാർക്കറ്റുകൾ കണ്ടെത്തുക"
                    : "Find Markets"}
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <strong>
                  {language === "hi"
                    ? "चुनी गई फसलें: "
                    : language === "ml"
                    ? "തിരഞ്ഞെടുത്ത വിളകൾ: "
                    : "Selected Crops: "}
                </strong>
                {selectedCrops.join(", ")}
              </p>
              <p className="text-xs">
                {language === "hi"
                  ? "* यदि स्थान खाली छोड़ा जाए तो डिफ़ॉल्ट रूप से कोच्चि का उपयोग होगा"
                  : language === "ml"
                  ? "* സ്ഥലം ശൂന്യമായി വിട്ടാൽ കൊച്ചി ഡിഫോൾട്ട് ആയി ഉപയോഗിക്കും"
                  : "* If location is left empty, Kochi will be used as default"}
              </p>
            </div>
          </div>
        </Card>
      )}
      {/* Nearby Markets Display */}
      {showMarkets && nearbyMarkets && nearbyMarkets.success && (
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {language === "ml"
                  ? `${nearbyMarkets.total_markets} അടുത്തുള്ള മാർക്കറ്റുകൾ`
                  : language === "hi"
                  ? `${nearbyMarkets.total_markets} निकटतम बाज़ार`
                  : `${nearbyMarkets.total_markets} Nearby Markets`}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMarkets(false)}
              >
                {language === "hi"
                  ? "बंद करें"
                  : language === "ml"
                  ? "അടയ്ക്കുക"
                  : "Close"}
              </Button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>
                  {language === "hi"
                    ? "खोज स्थान: "
                    : language === "ml"
                    ? "തിരയൽ സ്ഥാനം: "
                    : "Search Location: "}
                </strong>
                {nearbyMarkets.farmer_location.input_location}
              </p>
            </div>

            {/* Markets by Category */}
            {Object.entries(nearbyMarkets.markets_by_category).map(
              ([category, markets]) =>
                markets.length > 0 && (
                  <div key={category} className="mb-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="mr-2">
                        {category === "DMart"
                          ? "🏪"
                          : category === "Retail Chain"
                          ? "🏬"
                          : category === "Wholesale Market"
                          ? "🏭"
                          : "🏢"}
                      </span>
                      {category}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {markets.map((market) => (
                        <div
                          key={market.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-gray-800">
                              {market.name}
                            </h5>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {market.distance_km} km
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {market.address}
                          </p>

                          <div className="mb-2">
                            <p className="text-xs text-gray-500">
                              {language === "hi"
                                ? "समय: "
                                : language === "ml"
                                ? "സമയം: "
                                : "Hours: "}
                              {market.operating_hours}
                            </p>
                          </div>

                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">
                              {language === "hi"
                                ? "स्वीकार की जाने वाली फसलें:"
                                : language === "ml"
                                ? "സ്വീകരിക്കുന്ന വിളകൾ:"
                                : "Accepted Crops:"}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {market.matching_crops.map((crop, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                                >
                                  {crop}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                              {language === "hi"
                                ? "संपर्क: "
                                : language === "ml"
                                ? "ബന്ധപ്പെടുക: "
                                : "Contact: "}
                              {market.contact_person}
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-yellow-600 mr-1">
                                ⭐
                              </span>
                              <span className="text-xs text-gray-600">
                                {market.rating}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-gray-100">
                            <a
                              href={`tel:${market.phone}`}
                              className="text-xs text-blue-600 hover:text-blue-800 mr-4"
                            >
                              📞 {market.phone}
                            </a>
                          </div>

                          <div className="mt-2">
                            <p className="text-xs text-gray-500 italic">
                              {market.procurement_process}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}

            {nearbyMarkets.total_markets === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500">
                  {language === "ml"
                    ? "ഈ വിളകൾക്കും സ്ഥലത്തിനും അടുത്തുള്ള മാർക്കറ്റുകൾ കണ്ടെത്തിയില്ല"
                    : language === "hi"
                    ? "इन फसलों और स्थान के लिए कोई निकटतम बाज़ार नहीं मिला"
                    : "No nearby markets found for these crops and location"}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {/* Results Display */}
      {getFilteredData().length > 0 && (
        <>
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {dateRange.startDate === dateRange.endDate
                ? language === "ml"
                  ? `${dateRange.startDate} ലെ തിരഞ്ഞെടുത്ത വിളകളുടെ വില`
                  : language === "hi"
                  ? `${dateRange.startDate} के चुने गए फसलों की कीमतें`
                  : `Showing prices for selected crops on ${dateRange.startDate}`
                : language === "ml"
                ? `${dateRange.startDate} മുതൽ ${dateRange.endDate} വരെയുള്ള വിളകളുടെ വില`
                : language === "hi"
                ? `${dateRange.startDate} से ${dateRange.endDate} तक चुने गए फसलों की कीमतें`
                : `Showing prices for selected crops from ${dateRange.startDate} to ${dateRange.endDate}`}
            </h2>
          </div>

          {/* Price Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {getFilteredData().map((item, index) => {
              const vegCol = Object.keys(item).find(
                (key) =>
                  key !== "Date" &&
                  key !== "price" &&
                  key !== "retailprice" &&
                  key !== "Wholesale_Avg" &&
                  key !== "Retail_Avg"
              );
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {item[vegCol]}
                        </h3>
                        <p className="text-sm text-gray-600">{item.Date}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {item.Wholesale_Avg && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            {language === "ml"
                              ? "മൊത്തവില"
                              : language === "hi"
                              ? "थोक मूल्य"
                              : "Wholesale"}
                          </span>
                          <span className="font-medium text-blue-600">
                            ₹{item.Wholesale_Avg.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {item.Retail_Avg && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            {language === "ml"
                              ? "റീട്ടെയിൽ വില"
                              : language === "hi"
                              ? "खुदरा मूल्य"
                              : "Retail"}
                          </span>
                          <span className="font-medium text-green-600">
                            ₹{item.Retail_Avg.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {item.Wholesale_Avg && item.Retail_Avg && (
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm text-gray-600">
                            {language === "ml"
                              ? "മാർജിൻ"
                              : language === "hi"
                              ? "मार्जिन"
                              : "Margin"}
                          </span>
                          <span className="font-medium text-purple-600">
                            ₹{(item.Retail_Avg - item.Wholesale_Avg).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Price Trend Chart */}
          {getFilteredData().length > 0 && (
            <Card className="mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {language === "ml"
                    ? "വില ട്രെൻഡ് ചാർട്ട്"
                    : language === "hi"
                    ? "मूल्य ट्रेंड चार्ट"
                    : "Price Trend Chart"}
                </h3>

                <div style={{ width: "100%", height: 400 }}>
                  <ResponsiveContainer>
                    {/* Show Line Chart for multiple dates, Bar Chart for single date */}
                    {getFilteredData().some(
                      (item) =>
                        getFilteredData().filter((d) => d.Date === item.Date)
                          .length < getFilteredData().length
                    ) ? (
                      <LineChart data={getFilteredData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="Date"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          label={{
                            value:
                              language === "ml"
                                ? "വില (₹ per kg)"
                                : language === "hi"
                                ? "मूल्य (₹ प्रति किग्रा)"
                                : "Price (₹ per kg)",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            `₹${value?.toFixed(2)}`,
                            name === "Wholesale_Avg"
                              ? language === "ml"
                                ? "മൊത്തവില"
                                : language === "hi"
                                ? "थोक मूल्य"
                                : "Wholesale"
                              : language === "ml"
                              ? "റീട്ടെയിൽ വില"
                              : language === "hi"
                              ? "खुदरा मूल्य"
                              : "Retail",
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Wholesale_Avg"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name={
                            language === "ml"
                              ? "മൊത്തവില"
                              : language === "hi"
                              ? "थोक मूल्य"
                              : "Wholesale"
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="Retail_Avg"
                          stroke="#10b981"
                          strokeWidth={2}
                          name={
                            language === "ml"
                              ? "റീട്ടെയിൽ വില"
                              : language === "hi"
                              ? "खुदरा मूल्य"
                              : "Retail"
                          }
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={getFilteredData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey={(() => {
                            const firstItem = getFilteredData()[0];
                            return Object.keys(firstItem).find(
                              (key) =>
                                key !== "Date" &&
                                key !== "Wholesale_Avg" &&
                                key !== "Retail_Avg" &&
                                key !== "price" &&
                                key !== "retailprice"
                            );
                          })()}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          label={{
                            value:
                              language === "ml"
                                ? "വില (₹ per kg)"
                                : language === "hi"
                                ? "मूल्य (₹ प्रति किग्रा)"
                                : "Price (₹ per kg)",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            `₹${value?.toFixed(2)}`,
                            name === "Wholesale_Avg"
                              ? language === "ml"
                                ? "മൊത്തവില"
                                : language === "hi"
                                ? "थोक मूल्य"
                                : "Wholesale"
                              : language === "ml"
                              ? "റീട്ടെയിൽ വില"
                              : language === "hi"
                              ? "खुदरा मूल्य"
                              : "Retail",
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="Wholesale_Avg"
                          fill="#3b82f6"
                          name={
                            language === "ml"
                              ? "മൊത്തവില"
                              : language === "hi"
                              ? "थोक मूल्य"
                              : "Wholesale"
                          }
                        />
                        <Bar
                          dataKey="Retail_Avg"
                          fill="#10b981"
                          name={
                            language === "ml"
                              ? "റീട്ടെയിൽ വില"
                              : language === "hi"
                              ? "खुदरा मूल्य"
                              : "Retail"
                          }
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    {language === "ml"
                      ? "* ചാർട്ട് തിരഞ്ഞെടുത്ത വിളകളുടെ മൊത്ത വിലയും റീട്ടെയിൽ വിലയും കാണിക്കുന്നു"
                      : language === "hi"
                      ? "* चार्ट चुनी गई फसलों की थोक और खुदरा कीमतें दिखाता है"
                      : "* Chart shows wholesale and retail prices for selected crops"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Farmer Tips */}
          {tips.length > 0 && (
            <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-400">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {language === "ml"
                    ? "കർഷകർക്കുള്ള പ്രായോഗിക ടിപ്പുകൾ:"
                    : language === "hi"
                    ? "किसानों के लिए व्यावहारिक सुझाव:"
                    : "Practical Tips for Farmers:"}
                </h3>
                <ul className="space-y-2">
                  {tips.map((tip, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start"
                    >
                      <span className="mr-2">•</span>
                      <span>
                        {typeof tip === "object"
                          ? tip.message || tip.text || JSON.stringify(tip)
                          : tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </>
      )}
      {/* Loading Message */}
      {loading && priceData.length === 0 && (
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
            {language === "ml"
              ? "കേരള മാർക്കറ്റ് വിലകൾ ലോഡ് ചെയ്യുന്നു..."
              : language === "hi"
              ? "केरल मार्केट दरें लोड हो रही हैं..."
              : "Loading Kerala market prices..."}
          </p>
        </div>
      )}
      {/* No Data Message */}
      {priceData.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-500">
            {language === "ml"
              ? "ഈ തീയതിക്ക് വിപണി വിവരങ്ങൾ ലഭ്യമല്ല. മറ്റൊരു തീയതി ശ്രമിക്കുക."
              : language === "hi"
              ? "इस दिनांक के लिए बाजार की जानकारी उपलब्ध नहीं है। अन्य तारीख आज़माएं।"
              : "No market data available for this date. Try a different date."}
          </p>
        </div>
      )}
    </div>
  );
}

export default MarketPrices;
