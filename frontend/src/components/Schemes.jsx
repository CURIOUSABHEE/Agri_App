import React, { useState, useEffect } from "react";
import { schemesService } from "../services/api";
import { Card } from "./ui/Card";

const Schemes = ({ language = "en" }) => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSector, setSelectedSector] = useState("agriculture");
  const [totalSchemes, setTotalSchemes] = useState(0);

  // Indian states list
  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Puducherry",
    "Jammu and Kashmir",
    "Ladakh",
  ];

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
  }, []); 

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
          {language === "ml" ? "കാർഷിക പദ്ധതികൾ 🌾" : "Agricultural Schemes 🌾"}
        </h1>
        <p className="text-gray-600">
          {language === "ml"
            ? "കർഷകർക്കും കാർഷിക പ്രവർത്തനങ്ങൾക്കുമുള്ള സർക്കാർ പദ്ധതികളും ആനുകൂല്യങ്ങളും കണ്ടെത്തുക"
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
                <option value="">All States/UTs</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
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
                <option value="agriculture">Agriculture & Rural</option>
                <option value="all">All Sectors</option>
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

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-gray-600">
          {loading
            ? "Loading..."
            : `Found ${totalSchemes} agricultural schemes`}
          {selectedState && ` in ${selectedState}`}
        </p>
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
              </div>

              {/* Scheme Details */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">
                    Description:
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {scheme.details}
                  </p>
                </div>

                {scheme.benefits && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">
                      Benefits:
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {scheme.benefits.length > 200
                        ? scheme.benefits.substring(0, 200) + "..."
                        : scheme.benefits}
                    </p>
                  </div>
                )}

                {scheme.eligibility && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">
                      Eligibility:
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {scheme.eligibility}
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

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
                  View Full Details
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Schemes;
