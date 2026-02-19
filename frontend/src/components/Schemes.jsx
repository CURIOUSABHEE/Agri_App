// Helper to safely render field values (string, object, array)
const renderField = (field, opts = {}) => {
  if (typeof field === "string") {
    if (opts.maxLen && field.length > opts.maxLen) return field.substring(0, opts.maxLen) + "...";
    return field;
  } else if (Array.isArray(field)) {
    return field.join(", ");
  } else if (typeof field === "object" && field !== null) {
    return Object.entries(field).map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: ${value.join(", ")}`;
      else if (typeof value === "object" && value !== null) return `${key}: { ${Object.entries(value).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(", ")} }`;
      else return `${key}: ${value}`;
    }).join("; ");
  } else if (field !== undefined && field !== null) {
    return String(field);
  }
  return "";
};

import React, { useState, useEffect } from "react";
import { schemesService } from "../services/api";
import { getMultilingualOptions } from "../utils/languageOptions";

const Schemes = ({ language = "en" }) => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSector, setSelectedSector] = useState("agriculture");
  const [totalSchemes, setTotalSchemes] = useState(0);
  const [bookmarkedSchemes, setBookmarkedSchemes] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("bookmarkedSchemes");
    if (saved) setBookmarkedSchemes(JSON.parse(saved));
  }, []);

  const saveBookmarksToStorage = (bookmarks) => localStorage.setItem("bookmarkedSchemes", JSON.stringify(bookmarks));

  const toggleBookmark = (scheme) => {
    const isBookmarked = bookmarkedSchemes.some((b) => b.id === scheme.id);
    const updated = isBookmarked ? bookmarkedSchemes.filter((b) => b.id !== scheme.id) : [...bookmarkedSchemes, scheme];
    setBookmarkedSchemes(updated);
    saveBookmarksToStorage(updated);
  };

  const isSchemeBookmarked = (schemeId) => bookmarkedSchemes.some((b) => b.id === schemeId);

  const languageOptions = getMultilingualOptions(language);

  const fetchSchemes = async (search = searchQuery, state = selectedState, sector = selectedSector) => {
    setLoading(true);
    try {
      const response = await schemesService.getSchemes(search, state, sector);
      if (response.success) { setSchemes(response.schemes); setTotalSchemes(response.total); }
    } catch (error) {
      console.error("Error fetching schemes:", error);
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchemes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => { e.preventDefault(); fetchSchemes(); };
  const handleStateChange = (state) => { setSelectedState(state); fetchSchemes(searchQuery, state, selectedSector); };
  const handleSectorChange = (sector) => { setSelectedSector(sector); fetchSchemes(searchQuery, selectedState, sector); };
  const clearFilters = () => { setSearchQuery(""); setSelectedState(""); setSelectedSector("agriculture"); fetchSchemes("", "", "agriculture"); };

  const inp = "w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 bg-white transition-colors text-gray-800";

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50 p-4 md:p-6">

      {/* Hero Header */}
      <div className={`relative overflow-hidden bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 rounded-3xl p-6 mb-8 shadow-xl shadow-green-200 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-12 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl border border-white/20 shadow-lg">🌾</div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {language === "ml" ? "കാർഷിക പദ്ധതികൾ" : language === "hi" ? "कृषि योजनाएं" : "Agricultural Schemes"}
            </h1>
            <p className="text-green-200 text-sm mt-1">
              {language === "ml" ? "സർക്കാർ പദ്ധതികൾ കണ്ടെത്തുക" : language === "hi" ? "किसानों के लिए सरकारी योजनाएं खोजें" : "Discover government schemes & benefits for farmers"}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2 mt-4">
          {[`📋 ${totalSchemes} Schemes`, "🔖 Bookmark & Save", "🔍 Smart Search"].map((p) => (
            <span key={p} className="bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">{p}</span>
          ))}
        </div>
      </div>

      {/* Search & Filter Card */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {language === "ml" ? "പദ്ധതി തിരയുക" : language === "hi" ? "योजना खोजें" : "Search Schemes"}
            </label>
            <div className="flex gap-2">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={language === "hi" ? "योजना का नाम..." : language === "ml" ? "പദ്ധതിയുടെ പേര്..." : "Search by scheme name, benefits or keywords..."} className={`${inp} flex-1`} />
              <button type="submit" className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-green-200 hover:-translate-y-0.5">
                🔍 {language === "hi" ? "खोजें" : language === "ml" ? "തിരയുക" : "Search"}
              </button>
            </div>
          </div>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{language === "hi" ? "राज्य" : language === "ml" ? "സംസ്ഥാനം" : "State/UT"}</label>
              <select value={selectedState} onChange={(e) => handleStateChange(e.target.value)} className={inp}>
                {languageOptions.states.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{language === "hi" ? "क्षेत्र" : language === "ml" ? "മേഖല" : "Sector"}</label>
              <select value={selectedSector} onChange={(e) => handleSectorChange(e.target.value)} className={inp}>
                {languageOptions.sectors.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="button" onClick={clearFilters} className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 font-semibold px-4 py-2.5 rounded-xl transition-all">
                ✕ {language === "hi" ? "फ़िल्टर साफ़ करें" : language === "ml" ? "ഫിൽട്ടർ മായ്‌ക്കുക" : "Clear Filters"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bookmarked Schemes */}
      {bookmarkedSchemes.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-amber-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">🔖</span>
              {language === "ml" ? "ബുക്ക്മാർക്ക് ചെയ്ത പദ്ധതികൾ" : language === "hi" ? "बुकमार्क की गई योजनाएं" : "Your Bookmarked Schemes"}
            </h2>
            <span className="bg-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
              {bookmarkedSchemes.length} saved
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarkedSchemes.map((scheme) => (
              <div key={scheme.id} className="bg-white border border-amber-100 rounded-2xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5 group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight flex-1">{scheme.scheme_name}</h3>
                  <button onClick={() => toggleBookmark(scheme)} className="text-amber-500 hover:text-red-400 ml-2 transition-colors text-lg" title="Remove">🔖</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">{scheme.level || "Government"}</span>
                  {scheme.category && <span className="bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">{scheme.category}</span>}
                </div>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{scheme.details ? renderField(scheme.details, { maxLen: 100 }) : "—"}</p>
                <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-[10px] text-green-600 font-semibold">✓ {language === "hi" ? "सहेजा" : language === "ml" ? "സംരക്ഷിച്ചത്" : "Saved"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">{language === "ml" ? "എല്ലാ പദ്ധതികളും" : language === "hi" ? "सभी योजनाएं" : "All Schemes"}</h2>
          <p className="text-sm text-gray-500">{loading ? "Loading..." : `Found ${totalSchemes} agricultural schemes${selectedState ? ` in ${selectedState}` : ""}`}</p>
        </div>
        {bookmarkedSchemes.length > 0 && (
          <span className="text-xs text-gray-400">🔖 {bookmarkedSchemes.length} bookmarked above</span>
        )}
      </div>

      {/* Schemes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 border-4 border-green-100 border-t-green-500 rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">{language === "hi" ? "योजनाएं लोड हो रही हैं..." : "Loading schemes..."}</p>
          </div>
        ) : schemes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">{language === "hi" ? "कोई योजना नहीं मिली" : "No schemes found"}</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search or clearing filters</p>
          </div>
        ) : (
          schemes.map((scheme, idx) => (
            <div key={scheme.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              style={{ animationDelay: `${idx * 50}ms` }}>
              {/* Left accent bar */}
              <div className="flex">
                <div className="w-1.5 flex-shrink-0 bg-gradient-to-b from-green-500 to-emerald-500 group-hover:from-green-400 group-hover:to-teal-500 transition-all" />
                <div className="flex-1 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors leading-tight">{scheme.scheme_name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100">{scheme.level || "Government"}</span>
                        {scheme.category && <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-100">{scheme.category}</span>}
                      </div>
                    </div>
                    <button onClick={() => toggleBookmark(scheme)} className={`ml-4 p-2.5 rounded-xl transition-all hover:scale-110 ${isSchemeBookmarked(scheme.id) ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"}`} title={isSchemeBookmarked(scheme.id) ? "Remove bookmark" : "Bookmark"}>
                      {isSchemeBookmarked(scheme.id) ? "🔖" : "📌"}
                    </button>
                  </div>

                  {/* Details */}
                  <div className={`space-y-3 ${expandedId === scheme.id ? "" : "line-clamp-none"}`}>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</h4>
                      <p className={`text-gray-600 text-sm leading-relaxed ${expandedId !== scheme.id ? "line-clamp-2" : ""}`}>{renderField(scheme.details)}</p>
                    </div>
                    {expandedId === scheme.id && (
                      <>
                        {scheme.benefits && (
                          <div>
                            <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">✨ Benefits</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{renderField(scheme.benefits, { maxLen: 200 })}</p>
                          </div>
                        )}
                        {scheme.eligibility && (
                          <div>
                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">✅ Eligibility</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{renderField(scheme.eligibility)}</p>
                          </div>
                        )}
                        {scheme.tags && scheme.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {scheme.tags.map((tag, i) => (
                              <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tag.trim()}</span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <button onClick={() => setExpandedId(expandedId === scheme.id ? null : scheme.id)} className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 transition-colors">
                      {expandedId === scheme.id ? "↑ Show Less" : "↓ View Full Details"}
                    </button>
                    <span className="text-xs text-gray-400">{isSchemeBookmarked(scheme.id) ? "🔖 Bookmarked" : "Click 📌 to save"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Schemes;
