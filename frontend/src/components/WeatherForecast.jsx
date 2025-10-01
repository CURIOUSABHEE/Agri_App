import { useState, useEffect } from "react";
import { weatherService } from "../services/api";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";

function WeatherForecast({ language }) {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState({
    city: "",
    lat: "",
    lon: "",
    useCurrentLocation: false,
  });

  // Load weather data on component mount
  useEffect(() => {
    // Try to get user's current location first
    getCurrentLocationWeather();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentLocationWeather = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toString();
          const lon = position.coords.longitude.toString();
          setLocation((prev) => ({
            ...prev,
            lat,
            lon,
            useCurrentLocation: true,
          }));
          fetchWeatherData(lat, lon);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to default city (Mumbai)
          setLocation((prev) => ({
            ...prev,
            city: "Mumbai",
            useCurrentLocation: false,
          }));
          fetchWeatherData("", "", "Mumbai");
        }
      );
    } else {
      // Fallback to default city
      setLocation((prev) => ({
        ...prev,
        city: "Mumbai",
        useCurrentLocation: false,
      }));
      fetchWeatherData("", "", "Mumbai");
    }
  };

  const fetchWeatherData = async (lat = "", lon = "", city = "") => {
    setLoading(true);
    setError("");

    try {
      // Fetch current weather and forecast in parallel
      const [currentResponse, forecastResponse] = await Promise.all([
        weatherService.getCurrentWeather(lat, lon, city),
        weatherService.getForecast(lat, lon, city, 5),
      ]);

      if (currentResponse.success) {
        setCurrentWeather(currentResponse.data);
      } else {
        setError(currentResponse.error || "Failed to fetch current weather");
      }

      if (forecastResponse.success) {
        setForecast(forecastResponse.data.forecast || []);
      } else {
        setError(forecastResponse.error || "Failed to fetch weather forecast");
      }
    } catch (err) {
      setError(
        language === "malayalam"
          ? "കാലാവസ്ഥ വിവരങ്ങൾ കണ്ടെത്താൻ കഴിഞ്ഞില്ല"
          : "Failed to fetch weather data"
      );
      console.error("Weather fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearch = () => {
    if (location.city.trim()) {
      setLocation((prev) => ({
        ...prev,
        lat: "",
        lon: "",
        useCurrentLocation: false,
      }));
      fetchWeatherData("", "", location.city);
    }
  };

  const handleLocationChange = (value) => {
    setLocation((prev) => ({ ...prev, city: value }));
  };

  const getWeatherIcon = (icon, isLarge = false) => {
    const baseUrl = "https://openweathermap.org/img/wn/";
    const size = isLarge ? "@4x" : "@2x";
    return `${baseUrl}${icon}${size}.png`;
  };

  const getWindDirection = (degree) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return directions[Math.round(degree / 45) % 8];
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTemperatureColor = (temp) => {
    if (temp >= 35) return "text-red-600";
    if (temp >= 25) return "text-orange-500";
    if (temp >= 15) return "text-yellow-600";
    return "text-blue-600";
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === "ml"
            ? "കാലാവസ്ഥ പ്രവചനം"
            : language === "hi"
            ? "मौसम पूर्वानुमान"
            : "Weather Forecast"}
        </h1>
        <p className="text-gray-600">
          {language === "ml"
            ? "നിങ്ങളുടെ പ്രദേശത്തെ കാലാവസ്ഥ വിവരങ്ങൾ കാണുക"
            : language === "hi"
            ? "अपने क्षेत्र की मौसम जानकारी प्राप्त करें"
            : "Get weather information for your area"}
        </p>
      </div>

      {/* Location Search */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === "ml"
              ? "സ്ഥലം തിരഞ്ഞെടുക്കുക"
              : language === "hi"
              ? "स्थान चुनें"
              : "Select Location"}
          </h2>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="city">
                {language === "ml"
                  ? "നഗരം"
                  : language === "hi"
                  ? "शहर"
                  : "City"}
              </Label>
              <Input
                type="text"
                id="city"
                value={location.city}
                onChange={(e) => handleLocationChange(e.target.value)}
                placeholder={
                  language === "ml"
                    ? "നഗരത്തിന്റെ പേര്"
                    : language === "hi"
                    ? "शहर का नाम दर्ज करें"
                    : "Enter city name"
                }
                onKeyPress={(e) => e.key === "Enter" && handleCitySearch()}
              />
            </div>
            <Button onClick={handleCitySearch} disabled={loading}>
              {loading
                ? language === "ml"
                  ? "തിരയുന്നു..."
                  : language === "hi"
                  ? "खोजा जा रहा है..."
                  : "Searching..."
                : language === "ml"
                ? "തിരയുക"
                : language === "hi"
                ? "खोजें"
                : "Search"}
            </Button>
            <Button
              onClick={getCurrentLocationWeather}
              variant="outline"
              disabled={loading}
            >
              📍{" "}
              {language === "ml"
                ? "നിലവിലെ സ്ഥലം"
                : language === "hi"
                ? "वर्तमान स्थान"
                : "Current Location"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Current Weather */}
      {currentWeather && (
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === "malayalam"
                ? "നിലവിലെ കാലാവസ്ഥ"
                : "Current Weather"}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Weather Info */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={getWeatherIcon(currentWeather.weather.icon, true)}
                    alt={currentWeather.weather.description}
                    className="w-20 h-20"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {currentWeather.location}
                    {currentWeather.country && `, ${currentWeather.country}`}
                  </h3>
                  <p className="text-gray-600 capitalize">
                    {currentWeather.weather.description}
                  </p>
                  <p
                    className={`text-4xl font-bold ${getTemperatureColor(
                      currentWeather.temperature
                    )}`}
                  >
                    {currentWeather.temperature}°C
                  </p>
                  <p className="text-gray-500">
                    {language === "malayalam"
                      ? "അനുഭവപ്പെടുന്നത്"
                      : "Feels like"}
                    : {currentWeather.feels_like}°C
                  </p>
                </div>
              </div>

              {/* Weather Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600">💧</span>
                    <div>
                      <p className="text-sm text-gray-600">
                        {language === "malayalam" ? "ആർദ്രത" : "Humidity"}
                      </p>
                      <p className="font-semibold">
                        {currentWeather.humidity}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">💨</span>
                    <div>
                      <p className="text-sm text-gray-600">
                        {language === "malayalam"
                          ? "കാറ്റിന്റെ വേഗത"
                          : "Wind Speed"}
                      </p>
                      <p className="font-semibold">
                        {currentWeather.wind_speed} km/h{" "}
                        {getWindDirection(currentWeather.wind_direction)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600">🌡️</span>
                    <div>
                      <p className="text-sm text-gray-600">
                        {language === "malayalam" ? "വായുമർദ്ദം" : "Pressure"}
                      </p>
                      <p className="font-semibold">
                        {currentWeather.pressure} hPa
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-600">👁️</span>
                    <div>
                      <p className="text-sm text-gray-600">
                        {language === "malayalam" ? "ദൃശ്യത" : "Visibility"}
                      </p>
                      <p className="font-semibold">
                        {currentWeather.visibility} km
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sun Times */}
            {currentWeather.sunrise && currentWeather.sunset && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-sm text-gray-600">
                      {language === "malayalam" ? "സൂര്യോദയം" : "Sunrise"}
                    </p>
                    <p className="font-semibold">
                      🌅 {formatTime(currentWeather.sunrise)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {language === "malayalam" ? "സൂര്യാസ്തമയം" : "Sunset"}
                    </p>
                    <p className="font-semibold">
                      🌇 {formatTime(currentWeather.sunset)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 5-Day Forecast */}
      {forecast.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === "malayalam"
                ? "5 ദിവസത്തെ പ്രവചനം"
                : "5-Day Forecast"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {forecast.map((day, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors"
                >
                  <div className="mb-2">
                    <p className="font-semibold text-gray-900">
                      {index === 0
                        ? language === "malayalam"
                          ? "ഇന്ന്"
                          : "Today"
                        : day.day_name}
                    </p>
                    <p className="text-xs text-gray-600">{day.date}</p>
                  </div>

                  <div className="mb-3">
                    <img
                      src={getWeatherIcon(day.weather.icon)}
                      alt={day.weather.description}
                      className="w-12 h-12 mx-auto"
                    />
                    <p className="text-xs text-gray-600 capitalize">
                      {day.weather.description}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-semibold">
                      <span className="text-red-500">
                        {day.temperature.max}°
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-blue-500">
                        {day.temperature.min}°
                      </span>
                    </p>

                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-600">
                      <span>💧 {day.humidity}%</span>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-600">
                      <span>💨 {day.wind_speed} km/h</span>
                    </div>

                    {day.precipitation > 0 && (
                      <div className="flex items-center justify-center space-x-2 text-xs text-blue-600">
                        <span>🌧️ {day.precipitation}mm</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && !currentWeather && (
        <Card>
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">
              {language === "malayalam"
                ? "കാലാവസ്ഥ വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു..."
                : "Loading weather data..."}
            </p>
          </div>
        </Card>
      )}

      {/* No Data State */}
      {!loading && !currentWeather && !error && (
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <span className="text-6xl">🌤️</span>
            </div>
            <p className="text-gray-500">
              {language === "malayalam"
                ? "കാലാവസ്ഥ വിവരങ്ങൾ കാണാൻ ഒരു നഗരം തിരഞ്ഞെടുക്കുക"
                : "Search for a city to see weather information"}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default WeatherForecast;
