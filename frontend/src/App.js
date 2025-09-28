import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Separator } from './components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { ScrollArea } from './components/ui/scroll-area';
import { toast, Toaster } from 'sonner';
import { MapPin, Cloud, Sprout, TrendingUp, Camera, Leaf, Sun, Droplets, Wind, ThermometerSun, MessageCircle, Send, Bot, ArrowRight } from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Language Context
const LanguageContext = React.createContext();

const translations = {
  en: {
    title: "AgriAdvisor AI",
    subtitle: "Intelligent Farming Decisions for Maharashtra",
    soilAnalysis: "Soil Analysis",
    cropRecommendations: "Crop Recommendations",
    diseaseDetection: "Disease Detection",
    weatherForecast: "Weather Forecast", 
    latitude: "Latitude",
    longitude: "Longitude",
    analyze: "Analyze",
    upload: "Upload Image",
    recommendations: "Recommendations",
    loading: "Loading...",
    error: "Error occurred",
    success: "Analysis complete"
  },
  hi: {
    title: "कृषि सलाहकार AI",
    subtitle: "महाराष्ट्र के लिए बुद्धिमान कृषि निर्णय",
    soilAnalysis: "मिट्टी विश्लेषण",
    cropRecommendations: "फसल सिफारिशें",
    diseaseDetection: "रोग का पता लगाना",
    weatherForecast: "मौसम पूर्वानुमान",
    latitude: "अक्षांश",
    longitude: "देशांतर",
    analyze: "विश्लेषण करें",
    upload: "छवि अपलोड करें",
    recommendations: "सिफारिशें",
    loading: "लोड हो रहा है...",
    error: "त्रुटि हुई",
    success: "विश्लेषण पूर्ण"
  },
  mr: {
    title: "कृषी सल्लागार AI",
    subtitle: "महाराष्ट्रासाठी हुशार शेती निर्णय",
    soilAnalysis: "मातीचे विश्लेषण",
    cropRecommendations: "पीक शिफारसी",
    diseaseDetection: "रोग शोध",
    weatherForecast: "हवामान अंदाज",
    latitude: "अक्षांश",
    longitude: "रेखांश", 
    analyze: "विश्लेषण करा",
    upload: "प्रतिमा अपलोड करा",
    recommendations: "शिफारसी",
    loading: "लोड होत आहे...",
    error: "त्रुटी झाली",
    success: "विश्लेषण पूर्ण"
  }
};

function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const t = (key) => translations[language][key] || key;
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Header Component
function Header() {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <header className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 text-white p-6 shadow-2xl">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <Sprout className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-emerald-100 text-sm">{t('subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="en" className="text-gray-800">English</option>
            <option value="hi" className="text-gray-800">हिंदी</option>
            <option value="mr" className="text-gray-800">मराठी</option>
          </select>
        </div>
      </div>
    </header>
  );
}

// Location Input Component
function LocationInput({ onLocationSubmit, loading }) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const { t } = useLanguage();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (latitude && longitude) {
      onLocationSubmit(parseFloat(latitude), parseFloat(longitude));
    }
  };
  
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
        },
        (error) => {
          toast.error('Location access denied. Please enter coordinates manually.');
        }
      );
    }
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center space-x-2 text-emerald-700">
          <MapPin className="w-5 h-5" />
          <span>Farm Location</span>
        </CardTitle>
        <CardDescription>Enter your farm coordinates for personalized analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="latitude" className="text-sm font-medium">{t('latitude')}</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              placeholder="e.g., 19.0760"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="border-emerald-200 focus:border-emerald-400"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude" className="text-sm font-medium">{t('longitude')}</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              placeholder="e.g., 72.8777"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="border-emerald-200 focus:border-emerald-400"
              required
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={getCurrentLocation}
              className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Use Current Location
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? t('loading') : t('analyze')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Soil Analysis Component
function SoilAnalysis({ onNavigateToRecommendations }) {
  const [soilData, setSoilData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const { t } = useLanguage();
  
  const analyzeSoil = async (latitude, longitude) => {
    setLoading(true);
    setCurrentLocation({ latitude, longitude });
    try {
      const response = await axios.post(`${API}/analyze-soil`, {
        latitude,
        longitude,
        state: "Maharashtra"
      });
      setSoilData(response.data);
      toast.success(t('success'));
    } catch (error) {
      console.error('Soil analysis error:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGetCropRecommendations = () => {
    if (soilData && currentLocation) {
      onNavigateToRecommendations({
        soilData,
        location: currentLocation,
        source: 'soil_analysis'
      });
      toast.success('Navigating to crop recommendations with your soil data!');
    }
  };
  
  return (
    <div className="space-y-6">
      <LocationInput onLocationSubmit={analyzeSoil} loading={loading} />
      
      {soilData && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-amber-800">
              <div className="flex items-center space-x-2">
                <Leaf className="w-5 h-5" />
                <span>Soil Analysis Results</span>
              </div>
              <Button 
                onClick={handleGetCropRecommendations}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="get-crop-recommendations-btn"
              >
                <Sprout className="w-4 h-4 mr-2" />
                Get Crop Recommendations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-700">pH Level</Label>
                <div className="flex items-center space-x-2">
                  <Progress value={(soilData.ph_level / 14) * 100} className="flex-1" />
                  <span className="text-sm font-medium">{soilData.ph_level}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-700">Moisture Content</Label>
                <div className="flex items-center space-x-2">
                  <Progress value={soilData.moisture_content} className="flex-1" />
                  <span className="text-sm font-medium">{soilData.moisture_content}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-700">Nitrogen (kg/ha)</Label>
                <div className="flex items-center space-x-2">
                  <Progress value={(soilData.nitrogen / 500) * 100} className="flex-1" />
                  <span className="text-sm font-medium">{soilData.nitrogen}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-700">Phosphorus (kg/ha)</Label>
                <div className="flex items-center space-x-2">
                  <Progress value={(soilData.phosphorus / 100) * 100} className="flex-1" />
                  <span className="text-sm font-medium">{soilData.phosphorus}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-700">Potassium (kg/ha)</Label>
                <div className="flex items-center space-x-2">
                  <Progress value={(soilData.potassium / 500) * 100} className="flex-1" />
                  <span className="text-sm font-medium">{soilData.potassium}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-700">Organic Matter (%)</Label>
                <div className="flex items-center space-x-2">
                  <Progress value={(soilData.organic_matter / 10) * 100} className="flex-1" />
                  <span className="text-sm font-medium">{soilData.organic_matter}%</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2">Soil Health Summary</h4>
              <p className="text-sm text-gray-700">
                Your soil shows {soilData.ph_level > 7 ? 'alkaline' : soilData.ph_level < 6.5 ? 'acidic' : 'neutral'} pH levels. 
                {soilData.moisture_content > 40 ? ' Good moisture retention.' : ' Consider irrigation planning.'} 
                {soilData.nitrogen > 150 ? ' Adequate nitrogen levels.' : ' May need nitrogen supplementation.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Crop Recommendations Component
function CropRecommendations({ sharedData }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  
  // Auto-load recommendations if shared data is available
  useEffect(() => {
    if (sharedData && sharedData.location && sharedData.source) {
      getRecommendations(sharedData.location.latitude, sharedData.location.longitude, sharedData);
    }
  }, [sharedData]);
  
  const getRecommendations = async (latitude, longitude, preloadedData = null) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/crop-recommendations`, {
        latitude,
        longitude,
        state: "Maharashtra",
        preloaded_soil_data: preloadedData?.soilData || null,
        preloaded_weather_data: preloadedData?.weatherData || null
      });
      setRecommendations(response.data);
      
      if (preloadedData?.source) {
        toast.success(`Recommendations generated using your ${preloadedData.source.replace('_', ' ')} data!`);
      } else {
        toast.success('Recommendations generated successfully!');
      }
    } catch (error) {
      console.error('Recommendations error:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {!sharedData?.location && (
        <LocationInput onLocationSubmit={getRecommendations} loading={loading} />
      )}
      
      {sharedData?.location && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">
                  Using data from {sharedData.source?.replace('_', ' ')} 
                </span>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                Smart Analysis
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      {recommendations && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Sprout className="w-5 h-5" />
              <span>Crop Recommendations & Yield Predictions</span>
            </CardTitle>
            <CardDescription>
              AI-powered suggestions with detailed yield and profit projections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {recommendations.recommended_crops.map((crop, index) => (
                <div key={index} className="p-4 bg-white rounded-lg shadow-sm border border-green-200" data-testid={`crop-${crop.crop.toLowerCase()}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-green-800 text-lg">{crop.crop}</h3>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      Suitability: {crop.suitability}/10
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-green-600 font-medium">EXPECTED YIELD</div>
                      <div className="text-2xl font-bold text-green-800">{crop.expected_yield}</div>
                      <div className="text-xs text-green-600">quintals per hectare</div>
                    </div>
                    
                    <div className="bg-emerald-50 p-3 rounded-lg">
                      <div className="text-xs text-emerald-600 font-medium">PROFIT POTENTIAL</div>
                      <div className="text-2xl font-bold text-emerald-800">₹{crop.profit_per_hectare.toLocaleString()}</div>
                      <div className="text-xs text-emerald-600">per hectare</div>
                    </div>
                    
                    <div className="bg-teal-50 p-3 rounded-lg">
                      <div className="text-xs text-teal-600 font-medium">MARKET TREND</div>
                      <div className="text-lg font-bold text-teal-800">
                        {crop.suitability >= 8.5 ? 'Excellent' : crop.suitability >= 7.5 ? 'Good' : 'Fair'}
                      </div>
                      <div className="text-xs text-teal-600">demand forecast</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <strong>Production Estimate:</strong> For 1 hectare, you can expect approximately {crop.expected_yield} quintals, 
                    generating an estimated profit of ₹{crop.profit_per_hectare.toLocaleString()} based on current market conditions.
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h4 className="font-semibold text-green-800">Production Planning Insights</h4>
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>Soil Suitability:</strong> Based on your soil analysis (pH {recommendations.soil_analysis.ph_level}), 
                  the top recommended crops show optimal compatibility with your soil conditions.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>Yield Optimization:</strong> With proper irrigation and fertilization, you can achieve the projected yields. 
                  Consider crop rotation to maintain soil fertility and maximize long-term productivity.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Market Strategy:</strong> Cotton and soybean show highest profit margins. Diversifying with 2-3 crops 
                  can reduce risk while maintaining good returns.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Sustainability Score: {recommendations.sustainability_score}/10</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Market Trend: Favorable</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sprout className="w-4 h-4" />
                  <span>Best Planting: Nov-Dec</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Disease Detection Component
function DiseaseDetection() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const { t } = useLanguage();
  
  const analyzeDisease = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await axios.post(`${API}/analyze-crop-disease`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setAnalysis(response.data);
      toast.success('Disease analysis complete!');
    } catch (error) {
      console.error('Disease analysis error:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="w-full max-w-lg mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center space-x-2 text-red-700">
            <Camera className="w-5 h-5" />
            <span>Crop Disease Detection</span>
          </CardTitle>
          <CardDescription>Upload a photo of your crop for AI-powered disease analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crop-image" className="text-sm font-medium">Select Crop Image</Label>
            <Input
              id="crop-image"
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="border-red-200 focus:border-red-400"
            />
          </div>
          
          {selectedFile && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">Selected: {selectedFile.name}</p>
            </div>
          )}
          
          <Button 
            onClick={analyzeDisease}
            disabled={loading || !selectedFile}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Camera className="w-4 h-4 mr-2" />
            {loading ? t('loading') : 'Analyze Disease'}
          </Button>
        </CardContent>
      </Card>
      
      {analysis && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <Camera className="w-5 h-5" />
              <span>Disease Analysis Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-red-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-red-800">{analysis.analysis.disease_detected}</h3>
                  <Badge 
                    variant={analysis.analysis.severity_level === 'High' ? 'destructive' : 'outline'}
                    className={analysis.analysis.severity_level === 'High' ? '' : 'bg-yellow-100 text-yellow-700'}
                  >
                    {analysis.analysis.severity_level} Severity
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Confidence: {analysis.analysis.confidence_score}%
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">Treatment Recommendations:</h4>
                    <ul className="text-sm space-y-1">
                      {analysis.analysis.treatment_recommendations.map((treatment, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{treatment}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">Prevention Tips:</h4>
                    <ul className="text-sm space-y-1">
                      {analysis.analysis.prevention_tips.map((tip, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Weather Component 
function WeatherForecast({ onNavigateToRecommendations }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const { t } = useLanguage();
  
  const getWeather = async (latitude, longitude) => {
    setLoading(true);
    setCurrentLocation({ latitude, longitude });
    try {
      const response = await axios.post(`${API}/weather-forecast`, {
        latitude,
        longitude,
        state: "Maharashtra"
      });
      setWeatherData(response.data);
      toast.success('Weather data updated!');
    } catch (error) {
      console.error('Weather error:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGetCropRecommendations = () => {
    if (weatherData && currentLocation) {
      onNavigateToRecommendations({
        weatherData,
        location: currentLocation,
        source: 'weather_analysis'
      });
      toast.success('Navigating to crop recommendations with weather data!');
    }
  };
  
  return (
    <div className="space-y-6">
      <LocationInput onLocationSubmit={getWeather} loading={loading} />
      
      {weatherData && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-sky-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-blue-800">
              <div className="flex items-center space-x-2">
                <Cloud className="w-5 h-5" />
                <span>Weather Forecast</span>
              </div>
              <Button 
                onClick={handleGetCropRecommendations}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="weather-crop-recommendations-btn"
              >
                <Sprout className="w-4 h-4 mr-2" />
                Crop Recommendations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardTitle>
            <CardDescription>Current conditions and farming recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                <ThermometerSun className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-xl font-semibold text-blue-800">{weatherData.temperature}°C</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                <Droplets className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Humidity</p>
                  <p className="text-xl font-semibold text-blue-800">{weatherData.humidity}%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                <Cloud className="w-8 h-8 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Rainfall</p>
                  <p className="text-xl font-semibold text-blue-800">{weatherData.rainfall}mm</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                <Wind className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Wind Speed</p>
                  <p className="text-xl font-semibold text-blue-800">{weatherData.wind_speed} m/s</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Current Condition</h4>
                <p className="text-gray-700 capitalize mb-3">{weatherData.weather_condition}</p>
                
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    <strong>Farming Recommendations:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {weatherData.temperature > 30 ? (
                      <li>Consider irrigation due to high temperature</li>
                    ) : (
                      <li>Temperature suitable for most crops</li>
                    )}
                    {weatherData.humidity > 70 ? (
                      <li>High humidity - monitor for fungal diseases</li>
                    ) : (
                      <li>Good humidity levels for crop growth</li>
                    )}
                    {weatherData.rainfall > 200 ? (
                      <li>Sufficient rainfall - reduce irrigation frequency</li>
                    ) : (
                      <li>Plan supplemental irrigation</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Chatbot Component
function FarmingChatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "नमस्ते! मैं आपका कृषि सहायक हूं। मैं फसल, मिट्टी, मौसम और कृषि तकनीकों के बारे में आपकी मदद कर सकता हूं।",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API}/farming-chat`, {
        message: inputMessage,
        context: "Maharashtra farming assistant"
      });
      
      const botMessage = {
        id: messages.length + 2,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: "क्षमा करें, मुझे कुछ तकनीकी समस्या हो रही है। कृपया दोबारा कोशिश करें।",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-2xl z-50"
          data-testid="chatbot-trigger"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-emerald-600" />
            <span>कृषि सहायक / Farming Assistant</span>
          </DialogTitle>
          <DialogDescription>
            Ask me about crops, soil, weather, and farming techniques in Maharashtra
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4 border rounded-lg">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex space-x-2 pt-4">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="कृषि के बारे में पूछें... Ask about farming..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
            data-testid="chat-input"
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !inputMessage.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
            data-testid="send-message-btn"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Dashboard Component
function Dashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("soil");
  const [sharedData, setSharedData] = useState({});
  
  const navigateToRecommendations = (data) => {
    setSharedData(data);
    setActiveTab("crops");
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Header />
      
      <main className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/60 backdrop-blur-sm">
            <TabsTrigger value="soil" className="flex items-center space-x-2">
              <Leaf className="w-4 h-4" />
              <span className="hidden sm:inline">{t('soilAnalysis')}</span>
            </TabsTrigger>
            <TabsTrigger value="crops" className="flex items-center space-x-2">
              <Sprout className="w-4 h-4" />
              <span className="hidden sm:inline">{t('cropRecommendations')}</span>
            </TabsTrigger>
            <TabsTrigger value="disease" className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">{t('diseaseDetection')}</span>
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center space-x-2">
              <Cloud className="w-4 h-4" />
              <span className="hidden sm:inline">{t('weatherForecast')}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="soil">
            <SoilAnalysis onNavigateToRecommendations={navigateToRecommendations} />
          </TabsContent>
          
          <TabsContent value="crops">
            <CropRecommendations sharedData={sharedData} />
          </TabsContent>
          
          <TabsContent value="disease">
            <DiseaseDetection />
          </TabsContent>
          
          <TabsContent value="weather">
            <WeatherForecast onNavigateToRecommendations={navigateToRecommendations} />
          </TabsContent>
        </Tabs>
      </main>
      
      <FarmingChatbot />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
        <Toaster position="top-right" expand={true} richColors />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
