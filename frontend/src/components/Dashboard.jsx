import React, { useState, useEffect } from "react";
import { dashboardService } from "../services/api";
import { Card } from "../components/ui/Card";

const StatCard = ({ label, value, icon, gradient, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {/* Gradient top bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

      <div className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800 group-hover:scale-105 transition-transform duration-200 origin-left">
            {value ?? <span className="text-gray-300">—</span>}
          </p>
        </div>
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg shadow-black/10 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
          {icon}
        </div>
      </div>

      {/* Subtle shimmer on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
    </div>
  );
};

const QuickActionCard = ({ icon, label, color, bgColor, hoverBg, onClick }) => (
  <button
    onClick={onClick}
    className={`p-5 ${bgColor} hover:${hoverBg} rounded-2xl transition-all duration-300 text-left group hover:-translate-y-1 hover:shadow-lg border border-white/60 hover:border-white active:scale-95`}
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-3 text-2xl shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
      {icon}
    </div>
    <h3 className="font-semibold text-gray-800 text-sm">{label}</h3>
  </button>
);

const Dashboard = ({ language = "en", setActiveItem }) => {
  const [farmerData, setFarmerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarkedSchemes, setBookmarkedSchemes] = useState([]);

  useEffect(() => {
    const loadBookmarks = () => {
      const saved = localStorage.getItem("bookmarkedSchemes");
      if (saved) {
        setBookmarkedSchemes(JSON.parse(saved));
      }
    };
    loadBookmarks();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        let lat = null;
        let lon = null;

        try {
          if (navigator.geolocation) {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            lat = position.coords.latitude;
            lon = position.coords.longitude;
          }
        } catch (locError) {
          console.log("Location access denied:", locError.message);
        }

        const response = await dashboardService.getDashboardData(lat, lon);
        if (response.success) {
          setFarmerData(response.farmer);
        } else {
          throw new Error(response.message || "API returned success: false");
        }
      } catch (err) {
        setError(`Failed to load dashboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const removeBookmark = (schemeId) => {
    const updatedBookmarks = bookmarkedSchemes.filter((scheme) => scheme.id !== schemeId);
    setBookmarkedSchemes(updatedBookmarks);
    localStorage.setItem("bookmarkedSchemes", JSON.stringify(updatedBookmarks));
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-8 animate-pulse">
          <div className="h-9 bg-gray-200 rounded-xl w-72 mb-3" />
          <div className="h-4 bg-gray-100 rounded-lg w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
                  <div className="h-8 bg-gray-300 rounded w-16" />
                </div>
                <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-3xl">⚠️</div>
        <div className="text-base text-red-600 font-medium text-center max-w-sm">
          {language === "ml" ? "ഡാഷ്ബോർഡ് ഡാറ്റ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല"
            : language === "hi" ? "डैशबोर्ड डेटा लोड नहीं कर सका"
              : error}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: language === "ml" ? "മൊത്തം ഫാമുകൾ" : language === "hi" ? "कुल फार्म" : "Total Farms",
      value: farmerData?.farm_count,
      icon: "🏡",
      gradient: "from-green-400 to-emerald-500",
      delay: 0,
    },
    {
      label: language === "ml" ? "മൊത്തം ഏരിയ" : language === "hi" ? "कुल क्षेत्र" : "Total Area",
      value: farmerData?.total_area,
      icon: "🌾",
      gradient: "from-blue-400 to-cyan-500",
      delay: 100,
    },
    {
      label: language === "ml" ? "സജീവ സീസൺ" : language === "hi" ? "सक्रिय मौसम" : "Active Season",
      value: farmerData?.active_season,
      icon: "🌱",
      gradient: "from-yellow-400 to-orange-500",
      delay: 200,
    },
    {
      label: language === "ml" ? "കാലാവസ്ഥ" : language === "hi" ? "मौसम" : "Weather",
      value: farmerData?.weather?.temperature ? `${farmerData.weather.temperature}°C` : null,
      icon: "☀️",
      gradient: "from-purple-400 to-pink-500",
      delay: 300,
    },
  ];

  const quickActions = [
    {
      icon: "📋",
      label: language === "ml" ? "വിളകൾ കാണുക" : language === "hi" ? "फसलें देखें" : "View Crops",
      color: "bg-green-100",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
      hoverBg: "bg-green-100",
      action: "crops",
    },
    {
      icon: "📊",
      label: language === "ml" ? "വിശകലനം" : language === "hi" ? "विश्लेषण" : "Analytics",
      color: "bg-blue-100",
      bgColor: "bg-gradient-to-br from-blue-50 to-sky-50",
      hoverBg: "bg-blue-100",
      action: "analytics",
    },
    {
      icon: "💰",
      label: language === "ml" ? "വിപണി വിലകൾ" : language === "hi" ? "बाजार भाव" : "Market Prices",
      color: "bg-yellow-100",
      bgColor: "bg-gradient-to-br from-yellow-50 to-amber-50",
      hoverBg: "bg-yellow-100",
      action: "analytics",
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 rounded-3xl p-6 shadow-xl shadow-green-200">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 right-12 w-20 h-20 bg-green-500/30 rounded-full -translate-y-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl animate-wave inline-block">👋</span>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {language === "ml"
                ? `സ്വാഗതം, ${farmerData?.name || "കർഷകൻ"}!`
                : language === "hi"
                  ? `स्वागत है, ${farmerData?.name || "किसान"}!`
                  : `Welcome back, ${farmerData?.name || "Farmer"}!`}
            </h1>
          </div>
          <p className="text-green-200 text-sm mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            {farmerData?.location || "Your farm dashboard is ready"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1">
              🌿 Kharif Season Active
            </span>
            <span className="bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1">
              ✅ All Systems Normal
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} delay={stat.delay} />
        ))}
      </div>

      {/* Bookmarked Schemes */}
      {bookmarkedSchemes.length > 0 && (
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-amber-50 to-yellow-50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl">🔖</span>
                {language === "ml" ? "ബുക്ക്മാർക്ക് ചെയ്ത പദ്ധതികൾ"
                  : language === "hi" ? "बुकमार्क की गई योजनाएं"
                    : "Bookmarked Schemes"}
              </h2>
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                {bookmarkedSchemes.length} {bookmarkedSchemes.length === 1 ? "scheme" : "schemes"}
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarkedSchemes.slice(0, 4).map((scheme) => (
                <div
                  key={scheme.id}
                  className="border border-gray-100 rounded-xl p-4 hover:border-amber-200 hover:shadow-md transition-all duration-200 group bg-gray-50/50 hover:bg-amber-50/30"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-amber-700 transition-colors">
                      {scheme.scheme_name}
                    </h3>
                    <button
                      onClick={() => removeBookmark(scheme.id)}
                      className="text-gray-300 hover:text-red-400 ml-2 flex-shrink-0 transition-colors p-1 rounded-full hover:bg-red-50"
                      title="Remove bookmark"
                    >
                      ✖
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                      {scheme.level || "Government"}
                    </span>
                    {scheme.category && (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-medium">
                        {scheme.category}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                    {scheme.details && scheme.details.length > 120
                      ? scheme.details.substring(0, 120) + "..."
                      : scheme.details || "No details available"}
                  </p>

                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <button className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                      View Details <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {bookmarkedSchemes.length > 4 && (
              <div className="px-5 pb-5 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">
                  View all {bookmarkedSchemes.length} bookmarked schemes →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center text-base shadow">⚡</span>
            {language === "ml" ? "ദ്രുത പ്രവർത്തനങ്ങൾ"
              : language === "hi" ? "त्वरित कार्य"
                : "Quick Actions"}
          </h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action, idx) => (
              <QuickActionCard
                key={idx}
                icon={action.icon}
                label={action.label}
                color={action.color}
                bgColor={action.bgColor}
                hoverBg={action.hoverBg}
                onClick={() => setActiveItem && setActiveItem(action.action)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
