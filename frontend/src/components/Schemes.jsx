// Helper to safely render field values (string, object, array)
const renderField = (field, opts = {}) => {
  if (typeof field === "string") {
    // Optionally trim for benefits if opts.maxLen
    if (opts.maxLen && field.length > opts.maxLen) {
      return field.substring(0, opts.maxLen) + "...";
    }
    return field;
  } else if (Array.isArray(field)) {
    // Render array as comma separated string
    return field.join(", ");
  } else if (typeof field === "object" && field !== null) {
    // Render object as key: value pairs, arrays as comma separated
    return Object.entries(field)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        } else if (typeof value === "object" && value !== null) {
          // Nested object, flatten one level
          return `${key}: { ${Object.entries(value)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join(", ")} }`;
        } else {
          return `${key}: ${value}`;
        }
      })
      .join("; ");
  } else if (field !== undefined && field !== null) {
    // fallback for numbers etc.
    return String(field);
  }
  // If null/undefined
  return "";
};
import React, { useState, useEffect } from "react";
import { schemesService } from "../services/api";
import { Card } from "./ui/Card";
import { getMultilingualOptions } from "../utils/languageOptions";

const Schemes = ({ language = "en" }) => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSector, setSelectedSector] = useState("agriculture");
  const [totalSchemes, setTotalSchemes] = useState(0);
  const [bookmarkedSchemes, setBookmarkedSchemes] = useState([]);

  // Load bookmarked schemes from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("bookmarkedSchemes");
    if (saved) {
      setBookmarkedSchemes(JSON.parse(saved));
    }
  }, []);

  // Save bookmarked schemes to localStorage
  const saveBookmarksToStorage = (bookmarks) => {
    localStorage.setItem("bookmarkedSchemes", JSON.stringify(bookmarks));
  };

  // Toggle bookmark for a scheme
  const toggleBookmark = (scheme) => {
    const isBookmarked = bookmarkedSchemes.some((b) => b.id === scheme.id);
    let updatedBookmarks;

    if (isBookmarked) {
      updatedBookmarks = bookmarkedSchemes.filter((b) => b.id !== scheme.id);
    } else {
      updatedBookmarks = [...bookmarkedSchemes, scheme];
    }

    setBookmarkedSchemes(updatedBookmarks);
    saveBookmarksToStorage(updatedBookmarks);
  };

  // Check if a scheme is bookmarked
  const isSchemeBookmarked = (schemeId) => {
    return bookmarkedSchemes.some((b) => b.id === schemeId);
  };

  // Get multilingual options based on current language
  const languageOptions = getMultilingualOptions(language);
  const stateOptions = languageOptions.states;
  const sectorOptions = languageOptions.sectors;

  const fetchSchemes = async (
    search = searchQuery,
    state = selectedState,
    sector = selectedSector
  ) => {
    setLoading(true);
    try {
      const response = await schemesService.getSchemes(search, state, sector);
      if (response.success) {
        setSchemes(response.schemes);
        setTotalSchemes(response.total);
      }
    } catch (error) {
      console.error("Error fetching schemes:", error);
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSchemes();
  };

  const handleStateChange = (state) => {
    setSelectedState(state);
    fetchSchemes(searchQuery, state, selectedSector);
  };

  const handleSectorChange = (sector) => {
    setSelectedSector(sector);
    fetchSchemes(searchQuery, selectedState, sector);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedState("");
    setSelectedSector("agriculture");
    fetchSchemes("", "", "agriculture");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {language === "ml"
            ? "കാർഷിക പദ്ധതികൾ 🌾"
            : language === "hi"
            ? "कृषि योजनाएं 🌾"
            : "Agricultural Schemes 🌾"}
        </h1>
        <p className="text-gray-600">
          {language === "ml"
            ? "കർഷകർക്കും കാർഷിക പ്രവർത്തനങ്ങൾക്കുമുള്ള സർക്കാർ പദ്ധതികളും ആനുകൂല്യങ്ങളും കണ്ടെത്തുക"
            : language === "hi"
            ? "किसानों और कृषि गतिविधियों के लिए सरकारी योजनाएं और लाभ खोजें"
            : "Find government schemes and benefits for farmers and agricultural activities"}
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 mb-6 bg-white">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search Schemes
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by scheme name, benefits, or keywords..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                🔍 Search
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* State Filter */}
            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                State/UT
              </label>
              <select
                id="state"
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {stateOptions.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sector Filter */}
            <div>
              <label
                htmlFor="sector"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sector
              </label>
              <select
                id="sector"
                value={selectedSector}
                onChange={(e) => handleSectorChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {sectorOptions.map((sector) => (
                  <option key={sector.value} value={sector.value}>
                    {sector.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </form>
      </Card>

      {/* Bookmarked Schemes Section */}
      {bookmarkedSchemes.length > 0 && (
        <Card className="p-6 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              🔖{" "}
              {language === "ml"
                ? "ബുക്ക്മാർക്ക് ചെയ്ത പദ്ധതികൾ"
                : language === "hi"
                ? "बुकमार्क की गई योजनाएं"
                : "Your Bookmarked Schemes"}
            </h2>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {bookmarkedSchemes.length}{" "}
              {bookmarkedSchemes.length === 1 ? "scheme" : "schemes"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarkedSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight flex-1">
                    {scheme.scheme_name}
                  </h3>
                  <button
                    onClick={() => toggleBookmark(scheme)}
                    className="text-yellow-600 hover:text-red-500 ml-2 flex-shrink-0 text-lg"
                    title="Remove bookmark"
                  >
                    🔖
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-xs mb-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {scheme.level || "Government"}
                  </span>
                  {scheme.category && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      {scheme.category}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">
                  {scheme.details
                    ? renderField(scheme.details, { maxLen: 120 })
                    : "No details available"}
                </p>

                <div className="mt-3 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                      View Details →
                    </button>
                    <span className="text-xs text-gray-500">
                      {language === "ml"
                        ? "സംരക്ഷിച്ചത്"
                        : language === "hi"
                        ? "सहेजा गया"
                        : "Saved"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {language === "ml"
                ? "ബുക്ക്മാർക്ക് നീക്കം ചെയ്യാൻ 🔖 ക്ലിക്ക് ചെയ്യുക"
                : language === "hi"
                ? "बुकमार्क हटाने के लिए 🔖 पर क्लिक करें"
                : "Click 🔖 to remove bookmark"}
            </p>
          </div>
        </Card>
      )}

      {/* Results Summary */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            {language === "ml"
              ? "എല്ലാ പദ്ധതികളും"
              : language === "hi"
              ? "सभी योजनाएं"
              : "All Schemes"}
          </h2>
          <p className="text-gray-600 text-sm">
            {loading
              ? "Loading..."
              : `Found ${totalSchemes} agricultural schemes`}
            {selectedState && ` in ${selectedState}`}
          </p>
        </div>

        {bookmarkedSchemes.length > 0 && (
          <div className="text-xs text-gray-500">
            {language === "ml"
              ? "മുകളിൽ നിങ്ങളുടെ സേവ് ചെയ്ത പദ്ധതികൾ കാണുക"
              : language === "hi"
              ? "ऊपर अपनी सहेजी गई योजनाएं देखें"
              : "See your saved schemes above"}
          </div>
        )}
      </div>

      {/* Schemes List */}
      <div className="space-y-6">
        {loading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            <p className="text-gray-600">Loading schemes...</p>
          </Card>
        ) : schemes.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No schemes found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or clearing filters to see more
              results.
            </p>
          </Card>
        ) : (
          schemes.map((scheme) => (
            <Card
              key={scheme.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {scheme.scheme_name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {scheme.level || "Government"}
                    </span>
                    {scheme.category && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {scheme.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bookmark Button */}
                <button
                  onClick={() => toggleBookmark(scheme)}
                  className={`ml-4 p-2 rounded-full transition-colors ${
                    isSchemeBookmarked(scheme.id)
                      ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  }`}
                  title={
                    isSchemeBookmarked(scheme.id)
                      ? "Remove bookmark"
                      : "Add bookmark"
                  }
                >
                  {isSchemeBookmarked(scheme.id) ? "🔖" : "📌"}
                </button>
              </div>

              {/* Scheme Details */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">
                    Description:
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {renderField(scheme.details)}
                  </p>
                </div>

                {scheme.benefits && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">
                      Benefits:
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {renderField(scheme.benefits, { maxLen: 200 })}
                    </p>
                  </div>
                )}

                {scheme.eligibility && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">
                      Eligibility:
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {renderField(scheme.eligibility)}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {scheme.tags && scheme.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {scheme.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
                  View Full Details
                </button>
                <span className="text-xs text-gray-500">
                  {isSchemeBookmarked(scheme.id)
                    ? "Bookmarked"
                    : "Click 🔖 to bookmark"}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Schemes;
