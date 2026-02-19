import React, { useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import PasskeySetup from "./PasskeySetup";
import PasskeyManagement from "./PasskeyManagement";
import {
  FARMING_EXPERIENCE_OPTIONS,
  SEASON_OPTIONS,
  SOIL_TYPE_OPTIONS,
  FARM_SIZE_OPTIONS,
  IRRIGATION_TYPE_OPTIONS,
  FARM_SIZE_UNITS,
} from "../constants/agriculturalOptions";

const Settings = ({ language = "en" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Initialize farmer data - start with empty/loading state
  const [farmerData, setFarmerData] = useState({
    name: "",
    phone: "",
    state: "",
    district: "",
    taluka: "",
    village: "",
    pincode: "",
    farmSize: "",
    farmSizeUnit: "acres",
    farmCategory: "",
    soilType: "",
    irrigationType: "",
    currentSeason: "",
    farmingExperience: "",
    mainCrops: [],
    farmer_id: "",
    language: language,
    registration_date: null,
  });

  const [dataLoading, setDataLoading] = useState(true);

  // Fetch actual farmer data from backend API
  const fetchFarmerData = async () => {
    setDataLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setDataLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const profileData = await response.json();

        // Parse total_area from backend (e.g., "4.5 acres" -> {size: "4.5", unit: "acres"})
        let parsedFarmSize = "";
        let parsedFarmUnit = "acres";
        if (profileData.total_area) {
          const areaMatch = profileData.total_area.match(/^([\d.]+)\s*(\w+)$/);
          if (areaMatch) {
            parsedFarmSize = areaMatch[1];
            parsedFarmUnit = areaMatch[2];
          }
        }

        // Map backend data to frontend state
        setFarmerData({
          name: profileData.name || "",
          phone: profileData.phone || "",
          state: profileData.state || "",
          district: profileData.district || "",
          taluka: profileData.taluka || "",
          village: profileData.village || "",
          pincode: profileData.pincode || "",
          farmSize: parsedFarmSize,
          farmSizeUnit: parsedFarmUnit,
          farmCategory: profileData.farm_category || "",
          soilType: profileData.soil_type || "",
          irrigationType: profileData.irrigation_type || "",
          currentSeason: profileData.current_season || "",
          farmingExperience: profileData.farming_experience || "",
          mainCrops: profileData.main_crops || [],
          farmer_id: profileData.farmer_id,
          language: profileData.language || language,
          registration_date: profileData.registration_date,
        });
      } else {
        console.error("Failed to fetch farmer data");
      }
    } catch (error) {
      console.error("Error fetching farmer data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch farmer data on component mount
  React.useEffect(() => {
    fetchFarmerData();
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  const [editData, setEditData] = useState({ ...farmerData });

  // Translations
  const translations = {
    en: {
      title: "Farmer Settings",
      personalInfo: "Personal Information",
      farmInfo: "Farm Information",
      farmer: "Farmer",
      name: "Name",
      phone: "Phone Number",
      state: "State",
      district: "District",
      taluka: "Taluka/Tehsil",
      village: "Village/Town",
      pincode: "Pincode",
      farmSize: "Farm Size",
      farmSizeUnit: "Unit",
      acres: "Acres",
      hectares: "Hectares",
      soilType: "Soil Type",
      irrigationType: "Irrigation Type",
      currentSeason: "Current Season",
      farmingExperience: "Farming Experience (Years)",
      mainCrops: "Main Crops",
      addCrop: "Add Crop",
      editProfile: "Edit Profile",
      saveChanges: "Save Changes",
      cancel: "Cancel",
      cancelEdit: "Cancel",
      profileUpdated: "Profile updated successfully!",
      selectSeason: "Select Season",
      selectExperience: "Select Experience",
      selectSoilType: "Select soil type",
      selectIrrigation: "Select irrigation type",
      farmCategory: "Farm Category",
      selectFarmCategory: "Select category",
    },
    hi: {
      title: "किसान सेटिंग्स",
      personalInfo: "व्यक्तिगत जानकारी",
      farmInfo: "खेत की जानकारी",
      farmer: "किसान",
      name: "नाम",
      phone: "फोन नंबर",
      state: "राज्य",
      district: "जिला",
      taluka: "तालुका/तहसील",
      village: "गाँव/शहर",
      pincode: "पिनकोड",
      farmSize: "खेत का आकार",
      farmSizeUnit: "इकाई",
      acres: "एकड़",
      hectares: "हेक्टेयर",
      soilType: "मिट्टी का प्रकार",
      irrigationType: "सिंचाई का प्रकार",
      currentSeason: "वर्तमान मौसम",
      farmingExperience: "कृषि अनुभव (वर्ष)",
      mainCrops: "मुख्य फसलें",
      addCrop: "फसल जोड़ें",
      editProfile: "प्रोफाइल संपादित करें",
      saveChanges: "परिवर्तन सहेजें",
      cancel: "रद्द करें",
      cancelEdit: "रद्द करें",
      profileUpdated: "प्रोफाइल सफलतापूर्वक अपडेट हो गया!",
      selectSeason: "मौसम चुनें",
      selectExperience: "अनुभव चुनें",
      selectSoilType: "मिट्टी का प्रकार चुनें",
      selectIrrigation: "सिंचाई का प्रकार चुनें",
      farmCategory: "खेत की श्रेणी",
      selectFarmCategory: "श्रेणी चुनें",
    },
    ml: {
      title: "കർഷക ക്രമീകരണങ്ങൾ",
      personalInfo: "വ്യക്തിഗത വിവരങ്ങൾ",
      farmInfo: "കാർഷിക വിവരങ്ങൾ",
      farmer: "കർഷകൻ",
      name: "പേര്",
      phone: "ഫോൺ നമ്പർ",
      state: "സംസ്ഥാനം",
      district: "ജില്ല",
      taluka: "താലൂക്ക്/തഹസീൽ",
      village: "ഗ്രാമം/പട്ടണം",
      pincode: "പിൻകോഡ്",
      farmSize: "കൃഷിഭൂമിയുടെ വിസ്തീർണ്ണം",
      farmSizeUnit: "യൂണിറ്റ്",
      acres: "ഏക്കർ",
      hectares: "ഹെക്ടർ",
      soilType: "മണ്ണിന്റെ തരം",
      irrigationType: "ജലസേചന തരം",
      currentSeason: "നിലവിലെ സീസൺ",
      farmingExperience: "കൃഷി അനുഭവം (വർഷങ്ങൾ)",
      mainCrops: "പ്രധാന വിളകൾ",
      addCrop: "വിള ചേർക്കുക",
      editProfile: "പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക",
      saveChanges: "മാറ്റങ്ങൾ സേവ് ചെയ്യുക",
      cancel: "റദ്ദാക്കുക",
      cancelEdit: "റദ്ദാക്കുക",
      profileUpdated: "പ്രൊഫൈൽ വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു!",
      selectSeason: "സീസൺ തിരഞ്ഞെടുക്കുക",
      selectExperience: "അനുഭവം തിരഞ്ഞെടുക്കുക",
      selectSoilType: "മണ്ണിന്റെ തരം തിരഞ്ഞെടുക്കുക",
      selectIrrigation: "ജലസേചന തരം തിരഞ്ഞെടുക്കുക",
      farmCategory: "ഫാം വിഭാഗം",
      selectFarmCategory: "വിഭാഗം തിരഞ്ഞെടുക്കുക",
    },
  };

  const t = translations[language] || translations.en;

  // Indian States
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
    "Jammu and Kashmir",
    "Ladakh",
    "Puducherry",
    "Chandigarh",
    "Andaman and Nicobar Islands",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep",
  ];

  // Talukas/Districts based on selected state
  const getDistrictsAndTalukas = (state) => {
    const locationData = {
      Kerala: {
        districts: [
          "Thiruvananthapuram",
          "Kollam",
          "Pathanamthitta",
          "Alappuzha",
          "Kottayam",
          "Idukki",
          "Ernakulam",
          "Thrissur",
          "Palakkad",
          "Malappuram",
          "Kozhikode",
          "Wayanad",
          "Kannur",
          "Kasaragod",
        ],
        talukas: {
          Kollam: ["Kollam", "Karunagappally", "Kunnathur", "Kottarakkara"],
          Thiruvananthapuram: [
            "Thiruvananthapuram",
            "Chirayinkeezhu",
            "Neyyattinkara",
          ],
          Ernakulam: ["Kochi", "Aluva", "Kanayannur", "Paravur", "Kunnathunad"],
          Thrissur: ["Thrissur", "Mukundapuram", "Chavakkad", "Thalappilly"],
          Palakkad: ["Palakkad", "Chittur", "Alathur", "Ottappalam"],
          Kozhikode: ["Kozhikode", "Vatakara", "Koyilandy", "Thamarassery"],
          Kannur: ["Kannur", "Thalassery", "Iritty", "Taliparamba"],
          Kottayam: [
            "Kottayam",
            "Vaikom",
            "Meenachil",
            "Changanassery",
            "Kanjirappally",
          ],
        },
      },
      "Tamil Nadu": {
        districts: [
          "Chennai",
          "Coimbatore",
          "Madurai",
          "Tiruchirappalli",
          "Salem",
          "Tirunelveli",
          "Tiruppur",
          "Vellore",
          "Erode",
          "Thanjavur",
          "Dindigul",
          "Cuddalore",
        ],
        talukas: {
          Chennai: ["Chennai North", "Chennai South", "Chennai Central"],
          Coimbatore: [
            "Coimbatore North",
            "Coimbatore South",
            "Pollachi",
            "Mettupalayam",
          ],
          Madurai: ["Madurai North", "Madurai South", "Melur", "Usilampatti"],
        },
      },
      Karnataka: {
        districts: [
          "Bengaluru Urban",
          "Bengaluru Rural",
          "Mysuru",
          "Tumakuru",
          "Kolar",
          "Chikkaballapura",
          "Hassan",
          "Dakshina Kannada",
          "Udupi",
          "Uttara Kannada",
          "Shivamogga",
        ],
        talukas: {
          "Bengaluru Urban": ["Bengaluru North", "Bengaluru South", "Anekal"],
          Mysuru: ["Mysuru", "Nanjangud", "Hunsur", "Piriyapatna"],
          Hassan: ["Hassan", "Arsikere", "Holenarasipur", "Sakleshpur"],
        },
      },
      Maharashtra: {
        districts: [
          "Mumbai",
          "Pune",
          "Nagpur",
          "Nashik",
          "Aurangabad",
          "Solapur",
          "Amravati",
          "Kolhapur",
          "Satara",
          "Sangli",
          "Ahmednagar",
          "Latur",
        ],
        talukas: {
          Pune: ["Pune City", "Haveli", "Mulshi", "Maval", "Bhor", "Purandar"],
          Mumbai: ["Mumbai City", "Mumbai Suburban"],
          Nashik: ["Nashik", "Malegaon", "Sinnar", "Niphad", "Dindori"],
        },
      },
      Gujarat: {
        districts: [
          "Ahmedabad",
          "Surat",
          "Vadodara",
          "Rajkot",
          "Bhavnagar",
          "Jamnagar",
          "Junagadh",
          "Gandhinagar",
          "Anand",
          "Bharuch",
          "Mehsana",
        ],
        talukas: {
          Ahmedabad: [
            "Ahmedabad City",
            "Ahmedabad Rural",
            "Daskroi",
            "Detroj-Rampura",
          ],
          Surat: ["Surat City", "Chorasi", "Palsana", "Kamrej", "Olpad"],
          Vadodara: ["Vadodara", "Savli", "Vaghodia", "Padra"],
        },
      },
    };
    return locationData[state] || { districts: [], talukas: {} };
  };

  // Get available districts for selected state
  const availableDistricts = getDistrictsAndTalukas(
    editData.state || farmerData.state
  ).districts;

  // Get available talukas for selected district
  const availableTalukas =
    getDistrictsAndTalukas(editData.state || farmerData.state).talukas[
    editData.district || farmerData.district
    ] || [];

  // Get standardized options based on language
  const soilTypeOptions = Object.values(SOIL_TYPE_OPTIONS).map((option) => ({
    value: option.value,
    label:
      language === "hi"
        ? option.hiLabel
        : language === "ml"
          ? option.mlLabel
          : option.label,
  }));

  const irrigationTypeOptions = Object.values(IRRIGATION_TYPE_OPTIONS).map(
    (option) => ({
      value: option.value,
      label:
        language === "hi"
          ? option.hiLabel
          : language === "ml"
            ? option.mlLabel
            : option.label,
    })
  );

  const currentSeasonOptions = Object.values(SEASON_OPTIONS).map((option) => ({
    value: option.value,
    label:
      language === "hi"
        ? option.hiLabel
        : language === "ml"
          ? option.mlLabel
          : option.label,
  }));

  const farmingExperienceOptions = Object.values(
    FARMING_EXPERIENCE_OPTIONS
  ).map((option) => ({
    value: option.value,
    label:
      language === "hi"
        ? option.hiLabel
        : language === "ml"
          ? option.mlLabel
          : option.label,
  }));

  const farmSizeOptions = Object.values(FARM_SIZE_OPTIONS).map((option) => ({
    value: option.value,
    label:
      language === "hi"
        ? option.hiLabel
        : language === "ml"
          ? option.mlLabel
          : option.label,
  }));

  const farmSizeUnitOptions = Object.values(FARM_SIZE_UNITS).map((option) => ({
    value: option.value,
    label:
      language === "hi"
        ? option.hiLabel
        : language === "ml"
          ? option.mlLabel
          : option.label,
  }));

  // Handle profile image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCropAdd = () => {
    const newCrop = prompt("Enter crop name:");
    if (newCrop && !editData.mainCrops.includes(newCrop)) {
      setEditData((prev) => ({
        ...prev,
        mainCrops: [...prev.mainCrops, newCrop],
      }));
    }
  };

  const handleCropRemove = (cropToRemove) => {
    setEditData((prev) => ({
      ...prev,
      mainCrops: prev.mainCrops.filter((crop) => crop !== cropToRemove),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveMessage("");

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setSaveMessage("❌ Please login first");
        setLoading(false);
        return;
      }

      // Update profile via API
      const response = await fetch("http://localhost:8000/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editData.name,
          district: editData.district,
          village: editData.village,
          state: editData.state,
          taluka: editData.taluka,
          pincode: editData.pincode,
          farm_size: editData.farmSize,
          farm_size_unit: editData.farmSizeUnit,
          farm_category: editData.farmCategory,
          soil_type: editData.soilType,
          irrigation_type: editData.irrigationType,
          current_season: editData.currentSeason,
          farming_experience: editData.farmingExperience,
          main_crops: editData.mainCrops,
        }),
      });

      if (response.ok) {
        await response.json(); // Response processed successfully
        setFarmerData({ ...editData });
        setIsEditing(false);
        setSaveMessage("✅ " + t.profileUpdated);

        // Update localStorage with new data
        const storedData = localStorage.getItem("farmerData");
        if (storedData) {
          const parsed = JSON.parse(storedData);
          localStorage.setItem(
            "farmerData",
            JSON.stringify({
              ...parsed,
              name: editData.name,
              district: editData.district,
            })
          );
        }
      } else {
        const errorData = await response.json();
        setSaveMessage(
          "❌ Failed to update: " + (errorData.detail || "Unknown error")
        );
      }
    } catch (error) {
      setSaveMessage("❌ Network error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({ ...farmerData });
    setIsEditing(false);
  };

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Skeleton hero */}
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-3xl p-6 mb-8 shadow-xl">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-7 w-48 bg-white/20 rounded-xl animate-pulse" />
                <div className="h-4 w-64 bg-white/10 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
          {/* Spinner */}
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-green-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-green-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">⚙️</div>
            </div>
            <p className="text-gray-600 font-medium">
              {language === "hi" ? "आपकी प्रोफ़ाइल लोड हो रही है..." : language === "ml" ? "നിങ്ങളുടെ പ്രൊഫൈൽ ലോഡ് ചെയ്യുന്നു..." : "Loading your profile..."}
            </p>
            {/* Skeleton cards */}
            <div className="w-full max-w-2xl space-y-4 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse shadow-sm">
                  <div className="h-5 w-40 bg-gray-200 rounded-lg mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 bg-gray-100 rounded-lg" />
                    <div className="h-4 bg-gray-100 rounded-lg" />
                    <div className="h-4 bg-gray-100 rounded-lg" />
                    <div className="h-4 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-6">

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 rounded-3xl p-6 mb-8 shadow-xl shadow-green-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-12 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl border border-white/20 shadow-lg">⚙️</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{t.title}</h1>
              {farmerData.farmer_id && (
                <p className="text-green-200 text-sm mt-1">ID: {farmerData.farmer_id}</p>
              )}
            </div>
          </div>
          {/* Action Buttons */}
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-5 py-2.5 rounded-xl border border-white/30 transition-all hover:-translate-y-0.5">
              ✏️ {t.editProfile}
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 bg-white text-green-700 font-bold px-5 py-2.5 rounded-xl transition-all hover:bg-green-50 hover:-translate-y-0.5 shadow-lg disabled:opacity-60">
                {loading ? <><div className="w-4 h-4 border-2 border-green-300 border-t-green-700 rounded-full animate-spin" /> Saving...</> : <>✅ {t.saveChanges}</>}
              </button>
              <button onClick={handleCancel} disabled={loading} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-xl border border-white/30 transition-all disabled:opacity-60">
                ✕ {t.cancelEdit}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Save Message */}
        {saveMessage && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${saveMessage.startsWith("✅")
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
            }`}>
            {saveMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">👤</span>
                {t.personalInfo}
              </h2>
            </div>

            {/* Profile Picture */}
            <div className="flex items-center gap-5 mx-6 mt-6 mb-6 pb-6 border-b border-gray-100">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center overflow-hidden ring-4 ring-green-200 ring-offset-2 shadow-xl">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute -bottom-1 -right-1 bg-green-500 hover:bg-green-600 text-white rounded-full p-1.5 cursor-pointer transition-colors shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{farmerData.name}</h3>
                <p className="text-gray-500 text-sm">{t.farmer}</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {farmerData.district || "District"}, {farmerData.state}
                </p>
                {farmerData.registration_date && (
                  <p className="text-xs text-gray-400 mt-1">
                    Member since: {new Date(farmerData.registration_date).toLocaleDateString()}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                    {farmerData.language?.toUpperCase() || "EN"}
                  </span>
                  {farmerData.phone && (
                    <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 pt-0">
              <div>
                <Label>{t.name}</Label>
                {isEditing ? (
                  <Input
                    value={editData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.name}
                  </p>
                )}
              </div>

              <div>
                <Label>{t.phone}</Label>
                {isEditing ? (
                  <div>
                    <Input
                      value={editData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="mt-1 bg-gray-100"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Phone number cannot be changed after registration
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.phone}
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Verified
                    </span>
                  </p>
                )}
              </div>

              <div>
                <Label>{t.village}</Label>
                {isEditing ? (
                  <Input
                    value={editData.village}
                    onChange={(e) =>
                      handleInputChange("village", e.target.value)
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.village}
                  </p>
                )}
              </div>

              <div>
                <Label>{t.state}</Label>
                {isEditing ? (
                  <select
                    value={editData.state}
                    onChange={(e) => {
                      handleInputChange("state", e.target.value);
                      // Reset district and taluka when state changes
                      handleInputChange("district", "");
                      handleInputChange("taluka", "");
                    }}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.state}
                  </p>
                )}
              </div>

              <div>
                <Label>{t.district}</Label>
                {isEditing ? (
                  <select
                    value={editData.district}
                    onChange={(e) => {
                      handleInputChange("district", e.target.value);
                      // Reset taluka when district changes
                      handleInputChange("taluka", "");
                    }}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!editData.state}
                  >
                    <option value="">Select District</option>
                    {availableDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.district}
                  </p>
                )}
              </div>

              <div>
                <Label>{t.taluka}</Label>
                {isEditing ? (
                  <select
                    value={editData.taluka}
                    onChange={(e) =>
                      handleInputChange("taluka", e.target.value)
                    }
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!editData.district}
                  >
                    <option value="">Select Taluka/Tehsil</option>
                    {availableTalukas.map((taluka) => (
                      <option key={taluka} value={taluka}>
                        {taluka}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.taluka}
                  </p>
                )}
              </div>

              <div>
                <Label>{t.pincode}</Label>
                {isEditing ? (
                  <Input
                    value={editData.pincode}
                    onChange={(e) =>
                      handleInputChange("pincode", e.target.value)
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.pincode}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Security Settings - Passkey Setup */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">🔐</span>
                Security Settings
              </h2>
            </div>
            <div className="p-6">
              <PasskeySetup
                onPasskeyCreated={(data) => {
                  console.log("Passkey created successfully:", data);
                  window.location.reload();
                }}
                language={language}
              />
              <div className="my-6 border-t border-gray-100"></div>
              <PasskeyManagement language={language} />
            </div>
          </div>
        </div>

        {/* Farm Information */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-amber-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">🚜</span>
              {t.farmInfo}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>{t.farmSize}</Label>
                {isEditing ? (
                  <div className="flex mt-1 space-x-2">
                    <Input
                      value={editData.farmSize}
                      onChange={(e) =>
                        handleInputChange("farmSize", e.target.value)
                      }
                      type="number"
                      className="flex-1"
                      placeholder="Enter area"
                    />
                    <select
                      value={editData.farmSizeUnit}
                      onChange={(e) =>
                        handleInputChange("farmSizeUnit", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {farmSizeUnitOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.farmSize} {farmerData.farmSizeUnit}
                  </p>
                )}
              </div>

              <div>
                <Label>{t.farmCategory}</Label>
                {isEditing ? (
                  <select
                    value={editData.farmCategory || ""}
                    onChange={(e) =>
                      handleInputChange("farmCategory", e.target.value)
                    }
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t.selectFarmCategory}</option>
                    {farmSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.farmCategory || "-"}
                  </p>
                )}
              </div>

              <div>
                <Label>{t.soilType}</Label>
                {isEditing ? (
                  <select
                    value={editData.soilType}
                    onChange={(e) =>
                      handleInputChange("soilType", e.target.value)
                    }
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t.selectSoilType}</option>
                    {soilTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.soilType}
                  </p>
                )}
              </div>

              <div>
                <Label>{t.irrigationType}</Label>
                {isEditing ? (
                  <select
                    value={editData.irrigationType}
                    onChange={(e) =>
                      handleInputChange("irrigationType", e.target.value)
                    }
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t.selectIrrigation}</option>
                    {irrigationTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.irrigationType}
                  </p>
                )}
              </div>

              <div>
                <Label>{t.currentSeason}</Label>
                {isEditing ? (
                  <select
                    value={editData.currentSeason}
                    onChange={(e) =>
                      handleInputChange("currentSeason", e.target.value)
                    }
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t.selectSeason}</option>
                    {currentSeasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.currentSeason}
                  </p>
                )}
              </div>

              <div>
                <Label>{t.farmingExperience}</Label>
                {isEditing ? (
                  <select
                    value={editData.farmingExperience}
                    onChange={(e) =>
                      handleInputChange("farmingExperience", e.target.value)
                    }
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t.selectExperience}</option>
                    {farmingExperienceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.farmingExperience}
                  </p>
                )}
              </div>
            </div>

            {/* Main Crops */}
            <div className="mt-6">
              <Label>{t.mainCrops}</Label>
              {isEditing ? (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editData.mainCrops.map((crop, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 border border-green-200 hover:bg-green-200 transition-colors"
                      >
                        <span>🌱 {crop}</span>
                        <button
                          onClick={() => handleCropRemove(crop)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={handleCropAdd}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all shadow-md shadow-green-200 hover:-translate-y-0.5"
                  >
                    + {t.addCrop}
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {farmerData.mainCrops.length > 0 ? farmerData.mainCrops.map((crop, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm border border-green-200 flex items-center gap-1.5"
                    >
                      🌱 {crop}
                    </span>
                  )) : <span className="text-gray-400 text-sm italic">No crops added yet</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
