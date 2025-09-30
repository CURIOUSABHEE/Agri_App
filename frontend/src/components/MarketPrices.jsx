import { useState, useEffect } from "react";
import { marketService } from "../services/api";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";
import {
  getStatesNames,
  getTalukasByState,
  getMarketsByStateAndTaluka,
} from "../data/marketsData";

function MarketPrices({ language }) {
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    state: "",
    taluka: "",
    market: "",
    crop: "",
  });

  // Dynamic dropdown options
  const [availableStates] = useState(getStatesNames());
  const [availableTalukas, setAvailableTalukas] = useState([]);
  const [availableMarkets, setAvailableMarkets] = useState([]);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem("marketPricesFilters");
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setFilters(parsed);
      } catch (e) {
        console.error("Error loading saved filters:", e);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem("marketPricesFilters", JSON.stringify(filters));
    alert(
      language === "malayalam" ? "ക്രമീകരണങ്ങൾ സംരക്ഷിച്ചു!" : "Settings saved!"
    );
  };

  // Clear saved settings
  const clearSettings = () => {
    localStorage.removeItem("marketPricesFilters");
    setFilters({ state: "", taluka: "", market: "", crop: "" });
    alert(
      language === "malayalam" ? "ക്രമീകരണങ്ങൾ മായ്ച്ചു!" : "Settings cleared!"
    );
  };

  const searchMarketPrices = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await marketService.getMarketPrices(
        filters.state,
        filters.taluka,
        filters.market,
        filters.crop
      );
      setMarketPrices(data);
    } catch (err) {
      setError(
        language === "malayalam"
          ? "വിപണി വിലകൾ കണ്ടെത്താൻ കഴിഞ്ഞില്ല"
          : "Failed to fetch market prices"
      );
      console.error("Error fetching market prices:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };

      // Reset dependent dropdowns when parent changes
      if (field === "state") {
        newFilters.taluka = "";
        newFilters.market = "";
      } else if (field === "taluka") {
        newFilters.market = "";
      }

      return newFilters;
    });
  };

  // Update talukas when state changes
  useEffect(() => {
    if (filters.state) {
      const talukas = getTalukasByState(filters.state);
      setAvailableTalukas(talukas);
    } else {
      setAvailableTalukas([]);
    }
    setAvailableMarkets([]);
  }, [filters.state]);

  // Update markets when state and taluka change
  useEffect(() => {
    if (filters.state && filters.taluka) {
      const markets = getMarketsByStateAndTaluka(filters.state, filters.taluka);
      setAvailableMarkets(markets);
    } else {
      setAvailableMarkets([]);
    }
  }, [filters.state, filters.taluka]);

  const resetFilters = () => {
    setFilters({ state: "", taluka: "", market: "", crop: "" });
    setMarketPrices([]);
  };

  const getPrice = (price) => {
    return typeof price === "number" ? `₹${price}/quintal` : price;
  };

  const getPriceChangeColor = (current, yesterday) => {
    if (current > yesterday) return "text-green-600";
    if (current < yesterday) return "text-red-600";
    return "text-gray-600";
  };

  const getPriceChangeIcon = (current, yesterday) => {
    if (current > yesterday) return "↗";
    if (current < yesterday) return "↘";
    return "→";
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === "malayalam" ? "വിപണി വിലകൾ" : "Market Prices"}
        </h1>
        <p className="text-gray-600">
          {language === "malayalam"
            ? "വിവിധ വിളകളുടെ നിലവിലെ വിപണി വിലകൾ കണ്ടെത്തുക"
            : "Find current market prices for various crops"}
        </p>
      </div>

      {/* Filter Section */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === "malayalam" ? "ഫിൽട്ടർ ചെയ്യുക" : "Filter Options"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* State Filter */}
            <div>
              <Label htmlFor="state">
                {language === "malayalam" ? "സംസ്ഥാനം" : "State"}
              </Label>
              <select
                id="state"
                value={filters.state}
                onChange={(e) => handleFilterChange("state", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">
                  {language === "malayalam"
                    ? "സംസ്ഥാനം തിരഞ്ഞെടുക്കുക"
                    : "Select State"}
                </option>
                {availableStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* Taluka Filter */}
            <div>
              <Label htmlFor="taluka">
                {language === "malayalam" ? "താലൂക്ക്" : "Taluka"}
              </Label>
              <select
                id="taluka"
                value={filters.taluka}
                onChange={(e) => handleFilterChange("taluka", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!filters.state}
              >
                <option value="">
                  {language === "malayalam"
                    ? availableTalukas.length > 0
                      ? "താലൂക്ക് തിരഞ്ഞെടുക്കുക"
                      : "ആദ്യം സംസ്ഥാനം തിരഞ്ഞെടുക്കുക"
                    : availableTalukas.length > 0
                    ? "Select Taluka"
                    : "First select a state"}
                </option>
                {availableTalukas.map((taluka) => (
                  <option key={taluka} value={taluka}>
                    {taluka}
                  </option>
                ))}
              </select>
            </div>

            {/* Market Filter */}
            <div>
              <Label htmlFor="market">
                {language === "malayalam" ? "വിപണി" : "Market"}
              </Label>
              <select
                id="market"
                value={filters.market}
                onChange={(e) => handleFilterChange("market", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!filters.taluka}
              >
                <option value="">
                  {language === "malayalam"
                    ? availableMarkets.length > 0
                      ? "വിപണി തിരഞ്ഞെടുക്കുക"
                      : "ആദ്യം താലൂക്ക് തിരഞ്ഞെടുക്കുക"
                    : availableMarkets.length > 0
                    ? "Select Market"
                    : "First select a taluka"}
                </option>
                {availableMarkets.map((market) => (
                  <option key={market} value={market}>
                    {market}
                  </option>
                ))}
              </select>
            </div>

            {/* Crop Filter */}
            <div>
              <Label htmlFor="crop">
                {language === "malayalam" ? "വിള" : "Crop"}
              </Label>
              <Input
                type="text"
                id="crop"
                value={filters.crop}
                onChange={(e) => handleFilterChange("crop", e.target.value)}
                placeholder={
                  language === "malayalam" ? "വിള പേര്" : "Crop name"
                }
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={searchMarketPrices} disabled={loading}>
              {loading
                ? language === "malayalam"
                  ? "തിരയുന്നു..."
                  : "Searching..."
                : language === "malayalam"
                ? "തിരയുക"
                : "Search"}
            </Button>
            <Button onClick={resetFilters} variant="outline">
              {language === "malayalam" ? "പുനഃസജ്ജീകരിക്കുക" : "Reset"}
            </Button>
            <Button
              onClick={saveSettings}
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
              {language === "malayalam"
                ? "ക്രമീകരണങ്ങൾ സംരക്ഷിക്കുക"
                : "Save Settings"}
            </Button>
            <Button
              onClick={clearSettings}
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            >
              {language === "malayalam"
                ? "ക്രമീകരണങ്ങൾ മായ്ക്കുക"
                : "Clear Settings"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Results */}
      {marketPrices.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === "malayalam"
              ? `${marketPrices.length} വിപണി വിലകൾ കണ്ടെത്തി`
              : `Found ${marketPrices.length} market prices`}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketPrices.map((price, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {price.crop}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {price.market}, {price.taluka}
                      </p>
                      <p className="text-xs text-gray-500">{price.state}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">
                        {language === "malayalam" ? "ഇന്ന്" : "Today"}
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        {getPrice(price.current_price)}
                      </div>
                    </div>
                  </div>

                  {/* Price Comparison */}
                  <div className="flex justify-between items-center mb-3 p-2 bg-gray-50 rounded">
                    <div>
                      <div className="text-xs text-gray-500">
                        {language === "malayalam" ? "ഇന്നലെ" : "Yesterday"}
                      </div>
                      <div className="text-sm font-medium">
                        {getPrice(price.yesterday_price)}
                      </div>
                    </div>
                    <div
                      className={`flex items-center text-sm font-medium ${getPriceChangeColor(
                        price.current_price,
                        price.yesterday_price
                      )}`}
                    >
                      <span className="mr-1">
                        {getPriceChangeIcon(
                          price.current_price,
                          price.yesterday_price
                        )}
                      </span>
                      <span>
                        ₹{Math.abs(price.current_price - price.yesterday_price)}
                      </span>
                    </div>
                  </div>

                  {/* Price Trend */}
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">
                      {language === "malayalam" ? "ട്രെൻഡ്: " : "Trend: "}
                    </span>
                    {price.trend === "up" && (
                      <span className="text-green-600">
                        {language === "malayalam"
                          ? "വർദ്ധിച്ചുകൊണ്ടിരിക്കുന്നു"
                          : "Increasing"}
                      </span>
                    )}
                    {price.trend === "down" && (
                      <span className="text-red-600">
                        {language === "malayalam" ? "കുറയുന്നു" : "Decreasing"}
                      </span>
                    )}
                    {price.trend === "stable" && (
                      <span className="text-gray-600">
                        {language === "malayalam" ? "സ്ഥിരം" : "Stable"}
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-gray-400 mt-2 border-t pt-2">
                    {language === "malayalam"
                      ? "അപ്ഡേറ്റ് ചെയ്തത്: "
                      : "Updated: "}
                    {new Date(price.date).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {marketPrices.length === 0 && !loading && !error && (
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
            {language === "malayalam"
              ? "വിപണി വിലകൾ കണ്ടെത്താൻ മുകളിലുള്ള ഫിൽട്ടറുകൾ ഉപയോഗിക്കുക"
              : "Use the filters above to search for market prices"}
          </p>
        </div>
      )}
    </div>
  );
}

export default MarketPrices;
