import React, { useState, useEffect } from "react";
import { dashboardService } from "../services/api";
import { Card } from "../components/ui/Card";

const Dashboard = ({ language = "en" }) => {
  const [farmerData, setFarmerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getDashboardData();
        if (response.success) {
          setFarmerData(response.farmer);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">
          {language === "ml"
            ? "ഡാഷ്ബോർഡ് ലോഡ് ചെയ്യുന്നു..."
            : language === "hi"
            ? "डैशबोर्ड लोड हो रहा है..."
            : "Loading dashboard..."}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">
          {language === "ml"
            ? "ഡാഷ്ബോർഡ് ഡാറ്റ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല"
            : language === "hi"
            ? "डैशबोर्ड डेटा लोड नहीं कर सका"
            : error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {language === "ml"
            ? `സ്വാഗതം, ${farmerData?.name || "കർഷകൻ"}! 👋`
            : language === "hi"
            ? `स्वागत है, ${farmerData?.name || "किसान"}! 👋`
            : `Welcome, ${farmerData?.name || "Farmer"}! 👋`}
        </h1>
        <p className="text-gray-600 mt-2">
          {farmerData?.location || "Location not specified"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                {language === "ml"
                  ? "മൊത്തം ഫാമുകൾ"
                  : language === "hi"
                  ? "कुल फार्म"
                  : "Total Farms"}
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {farmerData?.farm_count || 0}
              </p>
            </div>
            <div className="text-3xl">🏡</div>
          </div>
        </Card>

        <Card className="p-6 bg-white rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                {language === "ml"
                  ? "മൊത്തം ഏരിയ"
                  : language === "hi"
                  ? "कुल क्षेत्र"
                  : "Total Area"}
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {farmerData?.total_area || "0 acres"}
              </p>
            </div>
            <div className="text-3xl">🌾</div>
          </div>
        </Card>

        <Card className="p-6 bg-white rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                {language === "ml"
                  ? "സജീവ സീസൺ"
                  : language === "hi"
                  ? "सक्रिय मौसम"
                  : "Active Season"}
              </p>
              <p className="text-2xl font-bold text-gray-800">Kharif</p>
            </div>
            <div className="text-3xl">🌱</div>
          </div>
        </Card>

        <Card className="p-6 bg-white rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                {language === "ml"
                  ? "കാലാവസ്ഥ"
                  : language === "hi"
                  ? "मौसम"
                  : "Weather"}
              </p>
              <p className="text-2xl font-bold text-gray-800">28°C</p>
            </div>
            <div className="text-3xl">☀️</div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {language === "ml"
              ? "ദ്രുത പ്രവർത്തനങ്ങൾ"
              : language === "hi"
              ? "त्वरित कार्य"
              : "Quick Actions"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-green-100 hover:bg-green-200 rounded-lg transition-colors duration-200 text-left">
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-medium text-gray-800">
                {language === "ml"
                  ? "വിളകൾ കാണുക"
                  : language === "hi"
                  ? "फसलें देखें"
                  : "View Crops"}
              </h3>
              <p className="text-sm text-gray-600">
                {language === "ml"
                  ? "നിങ്ങളുടെ വിള ഡാറ്റ നിയന്ത്രിക്കുക"
                  : language === "hi"
                  ? "अपना फसल डेटा प्रबंधित करें"
                  : "Manage your crop data"}
              </p>
            </button>

            <button className="p-4 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors duration-200 text-left">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-medium text-gray-800">
                {language === "ml"
                  ? "വിശകലനം"
                  : language === "hi"
                  ? "विश्लेषण"
                  : "Analytics"}
              </h3>
              <p className="text-sm text-gray-600">
                {language === "ml"
                  ? "ഫാം അനലിറ്റിക്സ് കാണുക"
                  : language === "hi"
                  ? "फार्म विश्लेषण देखें"
                  : "View farm analytics"}
              </p>
            </button>

            <button className="p-4 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors duration-200 text-left">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-medium text-gray-800">
                {language === "ml"
                  ? "വിപണി വിലകൾ"
                  : language === "hi"
                  ? "बाजार भाव"
                  : "Market Prices"}
              </h3>
              <p className="text-sm text-gray-600">
                {language === "ml"
                  ? "നിലവിലെ വിലകൾ പരിശോധിക്കുക"
                  : language === "hi"
                  ? "वर्तमान कीमतें जांचें"
                  : "Check current prices"}
              </p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
