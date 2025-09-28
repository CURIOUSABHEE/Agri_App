import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Progress } from "./components/ui/progress";
import { Separator } from "./components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { ScrollArea } from "./components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { toast, Toaster } from "sonner";
import {
  MapPin,
  Cloud,
  Sprout,
  TrendingUp,
  Camera,
  Leaf,
  Sun,
  Droplets,
  Wind,
  ThermometerSun,
  MessageCircle,
  Send,
  Bot,
  ArrowRight,
  Menu,
  X,
  User,
  History,
  BarChart3,
  Settings,
  Home,
  MapPinIcon,
  FileText,
} from "lucide-react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Language Context
const LanguageContext = React.createContext();

// Location Context
const LocationContext = React.createContext();

const translations = {
  en: {
    title: "AgriAdvisor AI",
    subtitle: "Intelligent Farming Decisions for Maharashtra",
    soilAnalysis: "Soil Analysis",
    cropRecommendations: "Crop Recommendations",
    diseaseDetection: "Disease Detection",
    weatherForecast: "Weather Forecast",
    farmerManagement: "Farmer Management",
    governmentSchemes: "Government Schemes",
    dashboard: "Dashboard",
    profile: "Profile",
    history: "History",
    insights: "Insights",
    settings: "Settings",
    home: "Home",
    latitude: "Latitude",
    longitude: "Longitude",
    analyze: "Analyze",
    upload: "Upload Image",
    recommendations: "Recommendations",
    loading: "Loading...",
    error: "Error occurred",
    success: "Analysis complete",
    currentLocation: "Current Location",
    savedLocation: "Saved Location",
    farmName: "Farm Name",
    farmSize: "Farm Size (acres)",
    crops: "Crops",
    saveProfile: "Save Profile",
    recentActivity: "Recent Activity",
    soilReports: "Soil Reports",
    weatherReports: "Weather Reports",
    cropReports: "Crop Reports",
    diseaseReports: "Disease Reports",
  },
  hi: {
    title: "कृषि सलाहकार AI",
    subtitle: "महाराष्ट्र के लिए बुद्धिमान कृषि निर्णय",
    soilAnalysis: "मिट्टी विश्लेषण",
    cropRecommendations: "फसल सिफारिशें",
    diseaseDetection: "रोग का पता लगाना",
    weatherForecast: "मौसम पूर्वानुमान",
    farmerManagement: "किसान प्रबंधन",
    governmentSchemes: "सरकारी योजनाएं",
    dashboard: "डैशबोर्ड",
    profile: "प्रोफाइल",
    history: "इतिहास",
    insights: "अंतर्दृष्टि",
    settings: "सेटिंग्स",
    home: "होम",
    latitude: "अक्षांश",
    longitude: "देशांतर",
    analyze: "विश्लेषण करें",
    upload: "छवि अपलोड करें",
    recommendations: "सिफारिशें",
    loading: "लोड हो रहा है...",
    error: "त्रुटि हुई",
    success: "विश्लेषण पूर्ण",
    currentLocation: "वर्तमान स्थान",
    savedLocation: "सहेजा गया स्थान",
    farmName: "खेत का नाम",
    farmSize: "खेत का आकार (एकड़)",
    crops: "फसलें",
    saveProfile: "प्रोफाइल सेव करें",
    recentActivity: "हाल की गतिविधि",
    soilReports: "मिट्टी रिपोर्ट",
    weatherReports: "मौसम रिपोर्ट",
    cropReports: "फसल रिपोर्ट",
    diseaseReports: "रोग रिपोर्ट",
  },
  mr: {
    title: "कृषी सल्लागार AI",
    subtitle: "महाराष्ट्रासाठी हुशार शेती निर्णय",
    soilAnalysis: "मातीचे विश्लेषण",
    cropRecommendations: "पीक शिफारसी",
    diseaseDetection: "रोग शोध",
    weatherForecast: "हवामान अंदाज",
    farmerManagement: "शेतकरी व्यवस्थापन",
    governmentSchemes: "सरकारी योजना",
    dashboard: "डॅशबोर्ड",
    profile: "प्रोफाइल",
    history: "इतिहास",
    insights: "अंतर्दृष्टी",
    settings: "सेटिंग्ज",
    home: "होम",
    latitude: "अक्षांश",
    longitude: "रेखांश",
    analyze: "विश्लेषण करा",
    upload: "प्रतिमा अपलोड करा",
    recommendations: "शिफारसी",
    loading: "लोड होत आहे...",
    error: "त्रुटी झाली",
    success: "विश्लेषण पूर्ण",
    currentLocation: "सध्याचे स्थान",
    savedLocation: "सेव्ह केलेले स्थान",
    farmName: "शेताचे नाव",
    farmSize: "शेताचा आकार (एकर)",
    crops: "पिके",
    saveProfile: "प्रोफाइल सेव्ह करा",
    recentActivity: "अलीकडील क्रियाकलाप",
    soilReports: "माती अहवाल",
    weatherReports: "हवामान अहवाल",
    cropReports: "पीक अहवाल",
    diseaseReports: "रोग अहवाल",
  },
};

function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const t = (key) => translations[language][key] || key;
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

function LocationProvider({ children }) {
  const [savedLocation, setSavedLocation] = useState(null);
  const [farmerProfile, setFarmerProfile] = useState({
    name: "",
    farmName: "",
    farmSize: "",
    crops: [],
  });

  const saveLocation = React.useCallback((location) => {
    setSavedLocation(location);
    localStorage.setItem("agriadvisor_location", JSON.stringify(location));
  }, []);

  const saveProfile = React.useCallback((profile) => {
    setFarmerProfile(profile);
    localStorage.setItem("agriadvisor_profile", JSON.stringify(profile));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("agriadvisor_location");
    const profile = localStorage.getItem("agriadvisor_profile");
    if (saved) setSavedLocation(JSON.parse(saved));
    if (profile) setFarmerProfile(JSON.parse(profile));
  }, []);

  return (
    <LocationContext.Provider
      value={{
        savedLocation,
        saveLocation,
        farmerProfile,
        saveProfile,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

function useLocation() {
  const context = React.useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}

// Sidebar Component
function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  const { t } = useLanguage();
  const { savedLocation } = useLocation();

  const menuItems = [
    { id: "dashboard", icon: Home, label: t("dashboard") },
    { id: "soil", icon: Leaf, label: t("soilAnalysis") },
    { id: "crops", icon: Sprout, label: t("cropRecommendations") },
    { id: "disease", icon: Camera, label: t("diseaseDetection") },
    { id: "weather", icon: Cloud, label: t("weatherForecast") },
    { id: "schemes", icon: FileText, label: t("governmentSchemes") },
    { id: "farmer", icon: User, label: t("farmerManagement") },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Neumorphism Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 neu-sidebar
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
      `}
      >
        {/* Neumorphism Logo */}
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="neu-icon-button neu-success">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold neu-gradient-text">
                {t("title")}
              </h1>
              <p className="neu-text-secondary text-xs">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Neumorphism Saved Location */}
        {savedLocation && (
          <div className="p-4">
            <div className="neu-card-inset p-3 neu-rounded-md">
              <div className="flex items-center space-x-2 neu-text-secondary text-sm">
                <MapPinIcon className="w-4 h-4 neu-text-primary" />
                <span>
                  {t("savedLocation")}: {savedLocation.latitude.toFixed(4)},{" "}
                  {savedLocation.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 neu-rounded-md text-left transition-all duration-200 neu-focus
                  ${
                    activeTab === item.id
                      ? "neu-button-primary neu-animate-press"
                      : "neu-button hover:neu-shadow-md neu-text-secondary hover:neu-text-primary"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Neumorphism Footer */}
        <div className="p-4">
          <div className="neu-card-inset p-3 neu-rounded-md text-center">
            <div className="neu-text-muted text-xs">AgriAdvisor AI v1.0</div>
          </div>
        </div>
      </div>
    </>
  );
}

// Top Bar Component
function TopBar({ isOpen, setIsOpen }) {
  const { language, setLanguage, t } = useLanguage();
  const { farmerProfile } = useLocation();

  return (
    <header className="neu-topbar px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden neu-icon-button"
          >
            <Menu className="w-6 h-6 neu-text-primary" />
          </button>
          <h2 className="text-xl font-semibold neu-text-primary">
            {farmerProfile.farmName || t("dashboard")}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
              <SelectItem value="mr">मराठी</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                {farmerProfile.name ? farmerProfile.name[0].toUpperCase() : "F"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">
              {farmerProfile.name || "Farmer"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

// Dashboard Component
function Dashboard() {
  const { t } = useLanguage();
  const { savedLocation, farmerProfile } = useLocation();

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="neu-card animate-fade-in-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="neu-icon-button neu-success">
                <Leaf className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium neu-text-secondary">
                  {t("soilReports")}
                </p>
                <p className="text-2xl font-bold neu-text-primary">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card animate-fade-in-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="neu-icon-button neu-button-primary">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium neu-text-secondary">
                  {t("weatherReports")}
                </p>
                <p className="text-2xl font-bold neu-text-primary">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card animate-fade-in-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="neu-icon-button neu-warning">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium neu-text-secondary">
                  {t("cropReports")}
                </p>
                <p className="text-2xl font-bold neu-text-primary">15</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card animate-fade-in-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="neu-icon-button neu-danger">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium neu-text-secondary">
                  {t("diseaseReports")}
                </p>
                <p className="text-2xl font-bold neu-text-primary">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>{t("recentActivity")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Soil analysis completed</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Weather forecast updated
                  </p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Crop recommendations generated
                  </p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>{t("savedLocation")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savedLocation ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Latitude:</strong> {savedLocation.latitude.toFixed(6)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Longitude:</strong>{" "}
                  {savedLocation.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-gray-500">
                  This location will be used for all agricultural analysis
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No location saved yet. Use any tool to set your farm location.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Farmer Management Component
function FarmerManagement() {
  const { t } = useLanguage();
  const { farmerProfile, saveProfile } = useLocation();
  const [profile, setProfile] = useState(farmerProfile);

  const handleSaveProfile = () => {
    saveProfile(profile);
    toast.success("Profile saved successfully!");
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{t("profile")}</span>
          </CardTitle>
          <CardDescription>
            Manage your farmer profile and farm information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t("profile")} Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                placeholder="Enter your name"
              />
            </div>
            <div>
              <Label htmlFor="farmName">{t("farmName")}</Label>
              <Input
                id="farmName"
                value={profile.farmName}
                onChange={(e) =>
                  setProfile({ ...profile, farmName: e.target.value })
                }
                placeholder="Enter farm name"
              />
            </div>
            <div>
              <Label htmlFor="farmSize">{t("farmSize")}</Label>
              <Input
                id="farmSize"
                type="number"
                value={profile.farmSize}
                onChange={(e) =>
                  setProfile({ ...profile, farmSize: e.target.value })
                }
                placeholder="Enter farm size in acres"
              />
            </div>
            <div>
              <Label htmlFor="crops">{t("crops")}</Label>
              <Input
                id="crops"
                value={profile.crops.join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    crops: e.target.value.split(", ").filter((c) => c.trim()),
                  })
                }
                placeholder="Enter crops (comma separated)"
              />
            </div>
          </div>
          <Button
            onClick={handleSaveProfile}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {t("saveProfile")}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>{t("history")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Soil Analysis Report</p>
                <p className="text-xs text-gray-500">September 28, 2024</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Weather Forecast</p>
                <p className="text-xs text-gray-500">September 27, 2024</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Crop Recommendations</p>
                <p className="text-xs text-gray-500">September 26, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>{t("insights")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm font-medium text-emerald-800">
                  Soil Health Score
                </p>
                <p className="text-2xl font-bold text-emerald-600">8.5/10</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Weather Suitability
                </p>
                <p className="text-2xl font-bold text-blue-600">Good</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-800">
                  Crop Yield Potential
                </p>
                <p className="text-2xl font-bold text-orange-600">High</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Location Input Component
function LocationInput({
  onLocationSubmit,
  loading,
  showSavedLocation = true,
}) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const { t } = useLanguage();
  const { savedLocation } = useLocation();

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
          toast.error(
            "Location access denied. Please enter coordinates manually."
          );
        }
      );
    }
  };

  const useSavedLocation = () => {
    if (savedLocation) {
      onLocationSubmit(savedLocation.latitude, savedLocation.longitude);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto neu-card neu-animate-float">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center space-x-2 neu-gradient-text">
          <MapPin className="w-5 h-5" />
          <span>Farm Location</span>
        </CardTitle>
        <CardDescription className="neu-text-secondary">
          Enter your farm coordinates for personalized analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show saved location option if available */}
        {savedLocation && showSavedLocation && (
          <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  {t("savedLocation")}
                </p>
                <p className="text-xs text-emerald-600">
                  {savedLocation.latitude.toFixed(4)},{" "}
                  {savedLocation.longitude.toFixed(4)}
                </p>
              </div>
              <Button
                onClick={useSavedLocation}
                disabled={loading}
                size="sm"
                className="neu-button-secondary"
              >
                {loading ? t("loading") : "Use This Location"}
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="latitude" className="text-sm font-medium">
              {t("latitude")}
            </Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              placeholder="e.g., 19.0760"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="neu-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude" className="text-sm font-medium">
              {t("longitude")}
            </Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              placeholder="e.g., 72.8777"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="neu-input"
              required
            />
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              className="flex-1 neu-button"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Use Current Location
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 neu-button-primary"
            >
              {loading ? t("loading") : t("analyze")}
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
  const [showLocationInput, setShowLocationInput] = useState(false);
  const { t, language } = useLanguage();
  const { savedLocation, saveLocation } = useLocation();

  const analyzeSoil = React.useCallback(
    async (latitude, longitude) => {
      setLoading(true);
      const location = { latitude, longitude };
      saveLocation(location);
      try {
        const response = await axios.post(`${API}/analyze-soil`, {
          latitude,
          longitude,
          state: "Maharashtra",
          language,
        });
        setSoilData(response.data);
        setShowLocationInput(false);
        toast.success(t("success"));
      } catch (error) {
        console.error("Soil analysis error:", error);
        toast.error(t("error"));
      } finally {
        setLoading(false);
      }
    },
    [language, saveLocation, t]
  );

  // Auto-analyze with saved location if available
  useEffect(() => {
    if (savedLocation && !soilData && !loading) {
      analyzeSoil(savedLocation.latitude, savedLocation.longitude);
    }
  }, [savedLocation, soilData, loading, analyzeSoil]);

  const handleGetCropRecommendations = () => {
    if (soilData && savedLocation) {
      onNavigateToRecommendations({
        soilData,
        location: savedLocation,
        source: "soil_analysis",
      });
      toast.success("Navigating to crop recommendations with your soil data!");
    }
  };

  return (
    <div className="space-y-6">
      {(!savedLocation || showLocationInput) && (
        <LocationInput onLocationSubmit={analyzeSoil} loading={loading} />
      )}

      {savedLocation && !soilData && (
        <Card className="w-full max-w-lg mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <MapPin className="w-6 h-6 text-emerald-600" />
              <span className="text-lg font-semibold text-emerald-800">
                Using Saved Location
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {savedLocation.latitude.toFixed(4)},{" "}
              {savedLocation.longitude.toFixed(4)}
            </p>
            <div className="flex space-x-2 justify-center">
              <Button
                onClick={() =>
                  analyzeSoil(savedLocation.latitude, savedLocation.longitude)
                }
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? t("loading") : "Analyze Soil"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLocationInput(true)}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Change Location
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <Label className="text-sm font-medium text-amber-700">
                  pH Level
                </Label>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={(soilData.ph_level / 14) * 100}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">
                    {soilData.ph_level}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-700">
                  Moisture Content
                </Label>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={soilData.moisture_content}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">
                    {soilData.moisture_content}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-700">
                  Nitrogen (kg/ha)
                </Label>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={(soilData.nitrogen / 500) * 100}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">
                    {soilData.nitrogen}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-700">
                  Phosphorus (kg/ha)
                </Label>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={(soilData.phosphorus / 100) * 100}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">
                    {soilData.phosphorus}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-700">
                  Potassium (kg/ha)
                </Label>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={(soilData.potassium / 500) * 100}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">
                    {soilData.potassium}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-amber-700">
                  Organic Matter (%)
                </Label>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={(soilData.organic_matter / 10) * 100}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">
                    {soilData.organic_matter}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2">
                Soil Health Summary
              </h4>
              <p className="text-sm text-gray-700">
                Your soil shows{" "}
                {soilData.ph_level > 7
                  ? "alkaline"
                  : soilData.ph_level < 6.5
                  ? "acidic"
                  : "neutral"}{" "}
                pH levels.
                {soilData.moisture_content > 40
                  ? " Good moisture retention."
                  : " Consider irrigation planning."}
                {soilData.nitrogen > 150
                  ? " Adequate nitrogen levels."
                  : " May need nitrogen supplementation."}
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
  const { t, language } = useLanguage();
  const { savedLocation, saveLocation } = useLocation();

  const getRecommendations = React.useCallback(
    async (latitude, longitude, preloadedData = null) => {
      setLoading(true);
      const location = { latitude, longitude };
      saveLocation(location);
      try {
        const response = await axios.post(`${API}/crop-recommendations`, {
          latitude,
          longitude,
          state: "Maharashtra",
          language: language,
          preloaded_soil_data: preloadedData?.soilData || null,
          preloaded_weather_data: preloadedData?.weatherData || null,
        });
        setRecommendations(response.data);

        if (preloadedData?.source) {
          toast.success(
            `Recommendations generated using your ${preloadedData.source.replace(
              "_",
              " "
            )} data!`
          );
        } else {
          toast.success("Recommendations generated successfully!");
        }
      } catch (error) {
        console.error("Recommendations error:", error);
        toast.error(t("error"));
      } finally {
        setLoading(false);
      }
    },
    [saveLocation, language, t]
  );

  // Auto-load recommendations if shared data is available or if we have saved location
  useEffect(() => {
    if (sharedData && sharedData.location && sharedData.source) {
      getRecommendations(
        sharedData.location.latitude,
        sharedData.location.longitude,
        sharedData
      );
    } else if (savedLocation && !sharedData && !loading) {
      getRecommendations(savedLocation.latitude, savedLocation.longitude);
    }
  }, [sharedData, savedLocation, loading, getRecommendations]);

  return (
    <div className="space-y-6">
      {!sharedData?.location && (
        <LocationInput
          onLocationSubmit={getRecommendations}
          loading={loading}
        />
      )}

      {sharedData?.location && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">
                  Using data from {sharedData.source?.replace("_", " ")}
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
                <div
                  key={index}
                  className="p-4 bg-white rounded-lg shadow-sm border border-green-200"
                  data-testid={`crop-${crop.crop.toLowerCase()}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-green-800 text-lg">
                      {crop.crop}
                    </h3>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700"
                    >
                      Suitability: {crop.suitability}/10
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-green-600 font-medium">
                        EXPECTED YIELD
                      </div>
                      <div className="text-2xl font-bold text-green-800">
                        {crop.expected_yield}
                      </div>
                      <div className="text-xs text-green-600">
                        quintals per hectare
                      </div>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-lg">
                      <div className="text-xs text-emerald-600 font-medium">
                        PROFIT POTENTIAL
                      </div>
                      <div className="text-2xl font-bold text-emerald-800">
                        ₹{crop.profit_per_hectare.toLocaleString()}
                      </div>
                      <div className="text-xs text-emerald-600">
                        per hectare
                      </div>
                    </div>

                    <div className="bg-teal-50 p-3 rounded-lg">
                      <div className="text-xs text-teal-600 font-medium">
                        MARKET TREND
                      </div>
                      <div className="text-lg font-bold text-teal-800">
                        {crop.suitability >= 8.5
                          ? "Excellent"
                          : crop.suitability >= 7.5
                          ? "Good"
                          : "Fair"}
                      </div>
                      <div className="text-xs text-teal-600">
                        demand forecast
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    <strong>Production Estimate:</strong> For 1 hectare, you can
                    expect approximately {crop.expected_yield} quintals,
                    generating an estimated profit of ₹
                    {crop.profit_per_hectare.toLocaleString()} based on current
                    market conditions.
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h4 className="font-semibold text-green-800">
                Production Planning Insights
              </h4>
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>Soil Suitability:</strong> Based on your soil analysis
                  (pH {recommendations.soil_analysis.ph_level}), the top
                  recommended crops show optimal compatibility with your soil
                  conditions.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>Yield Optimization:</strong> With proper irrigation
                  and fertilization, you can achieve the projected yields.
                  Consider crop rotation to maintain soil fertility and maximize
                  long-term productivity.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Market Strategy:</strong> Cotton and soybean show
                  highest profit margins. Diversifying with 2-3 crops can reduce
                  risk while maintaining good returns.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>
                    Sustainability Score: {recommendations.sustainability_score}
                    /10
                  </span>
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
  const { t, language } = useLanguage();

  const analyzeDisease = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("language", language);

      const response = await axios.post(
        `${API}/analyze-crop-disease`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setAnalysis(response.data);
      toast.success("Disease analysis complete!");
    } catch (error) {
      console.error("Disease analysis error:", error);
      toast.error(t("error"));
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
          <CardDescription>
            Upload a photo of your crop for AI-powered disease analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crop-image" className="text-sm font-medium">
              Select Crop Image
            </Label>
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
              <p className="text-sm text-red-700">
                Selected: {selectedFile.name}
              </p>
            </div>
          )}

          <Button
            onClick={analyzeDisease}
            disabled={loading || !selectedFile}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Camera className="w-4 h-4 mr-2" />
            {loading ? t("loading") : "Analyze Disease"}
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
                  <h3 className="font-semibold text-red-800">
                    {analysis.analysis.disease_detected}
                  </h3>
                  <Badge
                    variant={
                      analysis.analysis.severity_level === "High"
                        ? "destructive"
                        : "outline"
                    }
                    className={
                      analysis.analysis.severity_level === "High"
                        ? ""
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {analysis.analysis.severity_level} Severity
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Confidence: {analysis.analysis.confidence_score}%
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">
                      Treatment Recommendations:
                    </h4>
                    <ul className="text-sm space-y-1">
                      {analysis.analysis.treatment_recommendations.map(
                        (treatment, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <span className="text-red-500 mt-1">•</span>
                            <span>{treatment}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-700 mb-2">
                      Prevention Tips:
                    </h4>
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
  const { t, language } = useLanguage();
  const { savedLocation, saveLocation } = useLocation();

  const getWeather = React.useCallback(
    async (latitude, longitude) => {
      setLoading(true);
      const location = { latitude, longitude };
      saveLocation(location);
      try {
        const response = await axios.post(`${API}/weather-forecast`, {
          latitude,
          longitude,
          state: "Maharashtra",
          language,
        });
        setWeatherData(response.data);
        toast.success("Weather data updated!");
      } catch (error) {
        console.error("Weather error:", error);
        toast.error(t("error"));
      } finally {
        setLoading(false);
      }
    },
    [language, saveLocation, t]
  );

  // Auto-load weather with saved location if available
  useEffect(() => {
    if (savedLocation && !weatherData && !loading) {
      getWeather(savedLocation.latitude, savedLocation.longitude);
    }
  }, [savedLocation, weatherData, loading, getWeather]);

  const handleGetCropRecommendations = () => {
    if (weatherData && savedLocation) {
      onNavigateToRecommendations({
        weatherData,
        location: savedLocation,
        source: "weather_analysis",
      });
      toast.success("Navigating to crop recommendations with weather data!");
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
            <CardDescription>
              Current conditions and farming recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                <ThermometerSun className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-xl font-semibold text-blue-800">
                    {weatherData.temperature}°C
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                <Droplets className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Humidity</p>
                  <p className="text-xl font-semibold text-blue-800">
                    {weatherData.humidity}%
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                <Cloud className="w-8 h-8 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Rainfall</p>
                  <p className="text-xl font-semibold text-blue-800">
                    {weatherData.rainfall}mm
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                <Wind className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Wind Speed</p>
                  <p className="text-xl font-semibold text-blue-800">
                    {weatherData.wind_speed} m/s
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Current Condition
                </h4>
                <p className="text-gray-700 capitalize mb-3">
                  {weatherData.weather_condition}
                </p>

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

// Government Schemes Component
function GovernmentSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { t, language } = useLanguage();

  const categories = [
    { id: "all", label: "All Schemes" },
    { id: "subsidy", label: "Subsidies" },
    { id: "loan", label: "Loans" },
    { id: "insurance", label: "Insurance" },
    { id: "technology", label: "Technology" },
  ];

  const fetchSchemes = React.useCallback(
    async (category = "all") => {
      setLoading(true);
      try {
        const response = await axios.post(`${API}/government-schemes`, {
          state: "Maharashtra",
          language,
          category,
        });
        setSchemes(response.data.schemes || []);
        toast.success(`Loaded ${response.data.total_count} schemes`);
      } catch (error) {
        console.error("Government schemes error:", error);
        toast.error("Failed to load government schemes");
      } finally {
        setLoading(false);
      }
    },
    [language]
  );

  useEffect(() => {
    fetchSchemes(selectedCategory);
  }, [selectedCategory, fetchSchemes]);

  const filteredSchemes = schemes.filter(
    (scheme) =>
      (scheme.name &&
        scheme.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (scheme.description &&
        scheme.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="neumorphic-container">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neumorphic-text-primary mb-2">
            🏛️ Government Schemes for Farmers
          </h2>
          <p className="text-neumorphic-text-secondary">
            Latest government schemes, subsidies, and support programs
          </p>
        </div>

        {/* Search and Filters */}
        <div className="neumorphic-card p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search schemes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neumorphic-input"
              />
            </div>

            {/* Category Filter */}
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="neumorphic-select w-full"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={() => fetchSchemes(selectedCategory)}
              disabled={loading}
              className="neumorphic-button-primary"
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Schemes List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-neumorphic-accent border-t-transparent rounded-full mx-auto"></div>
            <p className="text-neumorphic-text-secondary mt-4">
              Loading schemes...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSchemes.length === 0 ? (
              <div className="neumorphic-card p-8 text-center">
                <FileText className="w-16 h-16 text-neumorphic-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neumorphic-text-primary mb-2">
                  No Schemes Found
                </h3>
                <p className="text-neumorphic-text-secondary">
                  Try adjusting your search or category filter
                </p>
              </div>
            ) : (
              filteredSchemes.map((scheme, index) => (
                <div key={index} className="neumorphic-card p-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      {/* Scheme Header */}
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-semibold text-neumorphic-text-primary">
                          {scheme.name || "Scheme Name Not Available"}
                        </h3>
                        <Badge
                          className={`ml-4 ${
                            scheme.status &&
                            (scheme.status.includes("Active") ||
                              scheme.status.includes("Available") ||
                              scheme.status.includes("Ongoing"))
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {scheme.status || "Status Unknown"}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-neumorphic-text-secondary mb-4">
                        {scheme.description || "Description not available"}
                      </p>

                      {/* Key Details */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-neumorphic-text-primary mb-2">
                            💰 Benefit:
                          </h4>
                          <p className="text-sm text-neumorphic-text-secondary">
                            {scheme.benefits || scheme.benefit}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-neumorphic-text-primary mb-2">
                            ✅ Eligibility:
                          </h4>
                          <p className="text-sm text-neumorphic-text-secondary">
                            {scheme.eligibility ||
                              "Eligibility criteria not specified"}
                          </p>
                        </div>
                      </div>

                      {/* Application Process */}
                      <div className="mb-4">
                        <h4 className="font-medium text-neumorphic-text-primary mb-2">
                          📝 How to Apply:
                        </h4>
                        <p className="text-sm text-neumorphic-text-secondary">
                          {scheme.application ||
                            "Application process not specified"}
                        </p>
                      </div>

                      {/* Required Documents */}
                      <div>
                        <h4 className="font-medium text-neumorphic-text-primary mb-2">
                          📄 Required Documents:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(scheme.documents || []).map((doc, docIndex) => (
                            <Badge
                              key={docIndex}
                              variant="outline"
                              className="text-xs"
                            >
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="lg:ml-4">
                      <Button
                        className="neumorphic-button-accent w-full lg:w-auto"
                        onClick={() => {
                          toast.success(
                            "Please visit the official government portal to apply"
                          );
                        }}
                      >
                        Learn More
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Important Note */}
        <div className="neumorphic-card p-4 border-l-4 border-yellow-400 bg-yellow-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-600 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">
                Important Note
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please verify eligibility criteria and current status from
                official government portals before applying. This information is
                updated regularly but schemes may change.
              </p>
            </div>
          </div>
        </div>

        {/* Helpful Links */}
        <div className="neumorphic-card p-6">
          <h3 className="text-lg font-semibold text-neumorphic-text-primary mb-4">
            🔗 Helpful Resources
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Maharashtra Agriculture</div>
                <div className="text-sm text-neumorphic-text-secondary">
                  State Portal
                </div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">PM-KISAN Portal</div>
                <div className="text-sm text-neumorphic-text-secondary">
                  Central Scheme
                </div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Kisan Call Center</div>
                <div className="text-sm text-neumorphic-text-secondary">
                  1800-180-1551
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chatbot Component
function FarmingChatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "नमस्ते! मैं आपका कृषि सहायक हूं। मैं फसल, मिट्टी, मौसम और कृषि तकनीकों के बारे में आपकी मदद कर सकता हूं।",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t, language } = useLanguage();

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/farming-chat`, {
        message: inputMessage,
        context: "Maharashtra farming assistant",
        language,
      });

      const botMessage = {
        id: messages.length + 2,
        text: response.data.response,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: messages.length + 2,
        text: "क्षमा करें, मुझे कुछ तकनीकी समस्या हो रही है। कृपया दोबारा कोशिश करें।",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
            Ask me about crops, soil, weather, and farming techniques in
            Maharashtra
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 border rounded-lg">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-800"
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
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
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
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
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
function MainDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sharedData, setSharedData] = useState({});

  const navigateToRecommendations = (data) => {
    setSharedData(data);
    setActiveTab("crops");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "soil":
        return (
          <SoilAnalysis
            onNavigateToRecommendations={navigateToRecommendations}
          />
        );
      case "crops":
        return <CropRecommendations sharedData={sharedData} />;
      case "disease":
        return <DiseaseDetection />;
      case "weather":
        return (
          <WeatherForecast
            onNavigateToRecommendations={navigateToRecommendations}
          />
        );
      case "schemes":
        return <GovernmentSchemes />;
      case "farmer":
        return <FarmerManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen neu-bg-primary flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col lg:ml-0">
        <TopBar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>

      <FarmingChatbot />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <LocationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainDashboard />} />
          </Routes>
          <Toaster position="top-right" expand={true} richColors />
        </BrowserRouter>
      </LocationProvider>
    </LanguageProvider>
  );
}

export default App;
