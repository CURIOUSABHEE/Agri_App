import { useState, useEffect } from "react";
import { weatherService } from "../services/api";
import { getWeatherCityOptions } from "../utils/languageOptions";

function WeatherForecast({ language }) {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [location, setLocation] = useState({ city: "", lat: "", lon: "", useCurrentLocation: false });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { getCurrentLocationWeather(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentLocationWeather = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toString();
          const lon = position.coords.longitude.toString();
          setLocation((prev) => ({ ...prev, lat, lon, useCurrentLocation: true }));
          fetchWeatherData(lat, lon);
        },
        () => {
          setLocation((prev) => ({ ...prev, city: "Mumbai", useCurrentLocation: false }));
          fetchWeatherData("", "", "Mumbai");
        }
      );
    } else {
      setLocation((prev) => ({ ...prev, city: "Mumbai", useCurrentLocation: false }));
      fetchWeatherData("", "", "Mumbai");
    }
  };

  const fetchWeatherData = async (lat = "", lon = "", city = "") => {
    setLoading(true);
    setError("");
    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        weatherService.getCurrentWeather(lat, lon, city),
        weatherService.getForecast(lat, lon, city, 5),
      ]);
      if (currentResponse.success) setCurrentWeather(currentResponse.data);
      else setError(currentResponse.error || "Failed to fetch current weather");
      if (forecastResponse.success) setForecast(forecastResponse.data.forecast || []);
    } catch (err) {
      setError("Failed to fetch weather data");
      console.error("Weather fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearch = () => {
    if (location.city.trim()) {
      setLocation((prev) => ({ ...prev, lat: "", lon: "", useCurrentLocation: false }));
      fetchWeatherData("", "", location.city);
    }
  };

  const getWeatherIcon = (icon, isLarge = false) =>
    `https://openweathermap.org/img/wn/${icon}${isLarge ? "@4x" : "@2x"}.png`;

  const getWindDirection = (degree) => {
    const d = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return d[Math.round(degree / 45) % 8];
  };

  const formatTime = (ts) => new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getTempGradient = (temp) => {
    if (temp >= 35) return "from-red-500 to-orange-500";
    if (temp >= 25) return "from-orange-400 to-amber-400";
    if (temp >= 15) return "from-yellow-400 to-lime-400";
    return "from-blue-400 to-cyan-400";
  };

  const getTempColor = (temp) => {
    if (temp >= 35) return "text-red-600";
    if (temp >= 25) return "text-orange-500";
    if (temp >= 15) return "text-yellow-600";
    return "text-blue-600";
  };

  const inp = "w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-500 bg-white transition-colors text-gray-800";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4 md:p-6">

      {/* Hero Header */}
      <div className={`relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 rounded-3xl p-6 mb-8 shadow-xl shadow-blue-200 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl border border-white/20 shadow-lg">🌤️</div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {language === "ml" ? "കാലാവസ്ഥ പ്രവചനം" : language === "hi" ? "मौसम पूर्वानुमान" : "Weather Forecast"}
            </h1>
            <p className="text-sky-200 text-sm mt-1">
              {language === "ml" ? "നിങ്ങളുടെ പ്രദേശത്തെ കാലാവസ്ഥ" : language === "hi" ? "अपने क्षेत्र की मौसम जानकारी" : "Real-time weather for smart farming decisions"}
            </p>
          </div>
        </div>
      </div>

      {/* Location Search */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center">📍</span>
          {language === "ml" ? "സ്ഥലം തിരഞ്ഞെടുക്കുക" : language === "hi" ? "स्थान चुनें" : "Select Location"}
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              {language === "ml" ? "പ്രധാന നഗരങ്ങൾ" : language === "hi" ? "मुख्य शहर" : "Quick Select"}
            </label>
            <select onChange={(e) => { if (e.target.value) { setLocation(p => ({ ...p, city: e.target.value })); setTimeout(() => fetchWeatherData("", "", e.target.value), 50); } }} className={inp}>
              <option value="">{language === "ml" ? "നഗരം" : language === "hi" ? "शहर चुनें" : "Select City"}</option>
              {getWeatherCityOptions(language).map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              {language === "ml" ? "ടൈപ്പ് ചെയ്യുക" : language === "hi" ? "या टाइप करें" : "Or Type City"}
            </label>
            <input type="text" value={location.city} onChange={(e) => setLocation(p => ({ ...p, city: e.target.value }))} placeholder={language === "ml" ? "നഗരത്തിന്റെ പേര്" : language === "hi" ? "शहर का नाम" : "Enter city name"} onKeyPress={(e) => e.key === "Enter" && handleCitySearch()} className={inp} />
          </div>
          <div className="flex gap-2 items-end">
            <button onClick={handleCitySearch} disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-md shadow-blue-200 hover:-translate-y-0.5 disabled:opacity-60">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "🔍"}
              {loading ? (language === "hi" ? "खोज..." : "Searching...") : (language === "hi" ? "खोजें" : "Search")}
            </button>
            <button onClick={getCurrentLocationWeather} disabled={loading} className="flex items-center gap-1 border-2 border-sky-200 text-sky-700 font-semibold px-4 py-3 rounded-xl hover:bg-sky-50 transition-all">
              📍 {language === "hi" ? "वर्तमान" : "My Loc"}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 flex items-center gap-3">⚠️ {error}</div>}

      {/* Loading */}
      {loading && !currentWeather && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="text-5xl animate-bounce">🌤️</div>
          <p className="text-gray-500 font-medium">{language === "malayalam" ? "ലോഡ് ചെയ്യുന്നു..." : "Loading weather data..."}</p>
        </div>
      )}

      {/* Current Weather */}
      {currentWeather && (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
          <div className={`h-2 w-full bg-gradient-to-r ${getTempGradient(currentWeather.temperature)}`} />
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex items-center gap-5">
                <img src={currentWeather?.weather?.icon ? getWeatherIcon(currentWeather.weather.icon, true) : "https://openweathermap.org/img/wn/01d@4x.png"} alt="" className="w-24 h-24" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{currentWeather.location}{currentWeather.country && `, ${currentWeather.country}`}</h3>
                  <p className="text-gray-500 capitalize mb-1">{currentWeather?.weather?.description || ""}</p>
                  <p className={`text-5xl font-black ${getTempColor(currentWeather.temperature)}`}>{currentWeather.temperature}°C</p>
                  <p className="text-sm text-gray-400 mt-1">Feels like {currentWeather.feels_like}°C</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "💧", label: "Humidity", value: `${currentWeather.humidity}%`, bg: "bg-blue-50", color: "text-blue-700" },
                  { icon: "💨", label: "Wind", value: `${currentWeather.wind_speed} km/h ${getWindDirection(currentWeather.wind_direction)}`, bg: "bg-green-50", color: "text-green-700" },
                  { icon: "🌡️", label: "Pressure", value: `${currentWeather.pressure} hPa`, bg: "bg-yellow-50", color: "text-yellow-700" },
                  { icon: "👁️", label: "Visibility", value: `${currentWeather.visibility} km`, bg: "bg-purple-50", color: "text-purple-700" },
                ].map((item) => (
                  <div key={item.label} className={`${item.bg} rounded-2xl p-4 hover:scale-105 transition-transform`}>
                    <span className="text-xl">{item.icon}</span>
                    <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                    <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            {currentWeather.sunrise && currentWeather.sunset && (
              <div className="mt-5 pt-5 border-t border-gray-100 flex justify-around">
                <div className="text-center"><p className="text-3xl mb-1">🌅</p><p className="text-xs text-gray-500">Sunrise</p><p className="font-bold">{formatTime(currentWeather.sunrise)}</p></div>
                <div className="text-center"><p className="text-3xl mb-1">🌇</p><p className="text-xs text-gray-500">Sunset</p><p className="font-bold">{formatTime(currentWeather.sunset)}</p></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5-Day Forecast */}
      {forecast.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-sky-50 px-6 py-4 border-b border-indigo-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">📅</span>
              {language === "malayalam" ? "5 ദിവസത്തെ പ്രവചനം" : "5-Day Forecast"}
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {forecast.map((day, index) => (
                <div key={index} className="group relative bg-gradient-to-b from-gray-50 to-white border-2 border-gray-100 hover:border-sky-200 p-4 rounded-2xl text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  {index === 0 && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Today</div>}
                  <p className="font-bold text-gray-800 text-sm mt-1">{index === 0 ? (language === "ml" ? "ഇന്ന്" : language === "hi" ? "आज" : "Today") : day.day_name}</p>
                  <p className="text-xs text-gray-400 mb-2">{day.date}</p>
                  <img src={day?.weather?.icon ? getWeatherIcon(day.weather.icon) : "https://openweathermap.org/img/wn/01d@2x.png"} alt="" className="w-12 h-12 mx-auto group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-gray-500 capitalize mb-2 truncate">{day?.weather?.description || ""}</p>
                  <div className="flex justify-center items-center gap-1 font-bold text-sm">
                    <span className="text-red-500">{Math.round(day.temperature.max)}°</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-blue-500">{Math.round(day.temperature.min)}°</span>
                  </div>
                  <div className="flex justify-center gap-2 mt-1.5 text-xs text-gray-400">
                    <span>💧{day.humidity}%</span>
                    <span className="hidden md:inline">💨{Math.round(day.wind_speed)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !currentWeather && !error && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-7xl animate-pulse">🌤️</div>
          <h3 className="text-xl font-bold text-gray-600">Search for a city to see weather</h3>
        </div>
      )}
    </div>
  );
}

export default WeatherForecast;
