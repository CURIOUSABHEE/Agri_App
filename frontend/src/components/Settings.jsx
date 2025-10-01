import React, { useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

const Settings = ({ language = "en" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [farmerData, setFarmerData] = useState({
    name: "Rajesh Nair",
    phone: "+91 9876543210",
    email: "rajesh.nair@gmail.com",
    state: "Kerala",
    district: "Kollam",
    taluka: "Kollam",
    village: "Parippally",
    pincode: "691574",
    farmSize: "2.5",
    farmSizeUnit: "acres",
    soilType: "Laterite",
    irrigationType: "Bore well",
    currentSeason: "Rabi",
    farmingExperience: "15",
    mainCrops: ["Rice", "Coconut", "Pepper"],
  });

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
      email: "Email",
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
    },
    hi: {
      title: "किसान सेटिंग्स",
      personalInfo: "व्यक्तिगत जानकारी",
      farmInfo: "खेत की जानकारी",
      farmer: "किसान",
      name: "नाम",
      phone: "फोन नंबर",
      email: "ईमेल",
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
    },
    ml: {
      title: "കർഷക ക്രമീകരണങ്ങൾ",
      personalInfo: "വ്യക്തിഗത വിവരങ്ങൾ",
      farmInfo: "കാർഷിക വിവരങ്ങൾ",
      farmer: "കർഷകൻ",
      name: "പേര്",
      phone: "ഫോൺ നമ്പർ",
      email: "ഇമെയിൽ",
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

  // Soil types for Kerala
  const soilTypes = [
    "Laterite",
    "Alluvial",
    "Red Soil",
    "Coastal Alluvium",
    "Hill Soil",
    "Black Cotton",
    "Sandy Loam",
  ];

  // Irrigation types
  const irrigationTypes = [
    "Rain-fed",
    "Bore well",
    "Canal",
    "Drip irrigation",
    "Sprinkler",
    "Tank irrigation",
    "River water",
  ];

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

  const handleSave = () => {
    setFarmerData({ ...editData });
    setIsEditing(false);
    // Here you would typically save to backend API
    alert(t.profileUpdated);
  };

  const handleCancel = () => {
    setEditData({ ...farmerData });
    setIsEditing(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">{t.title}</h1>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 text-white bg-blue-500 hover:bg-blue-600"
            >
              📝 {t.editProfile}
            </Button>
          ) : (
            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                className="px-6 py-2 text-white bg-green-500 hover:bg-green-600"
              >
                ✅ {t.saveChanges}
              </Button>
              <Button
                onClick={handleCancel}
                className="px-6 py-2 text-white bg-gray-500 hover:bg-gray-600"
              >
                ❌ {t.cancelEdit}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Personal Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              👤 {t.personalInfo}
            </h2>

            {/* Profile Picture */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-gray-500">👤</span>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 cursor-pointer hover:bg-blue-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800">
                  {farmerData.name}
                </h3>
                <p className="text-gray-600">{t.farmer}</p>
                <p className="text-sm text-gray-500">
                  {farmerData.district}, {farmerData.state}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Input
                    value={editData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.phone}
                  </p>
                )}
              </div>

              <div>
                <Label>{t.email}</Label>
                {isEditing ? (
                  <Input
                    value={editData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-700 font-medium">
                    {farmerData.email}
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
          </Card>
        </div>

        {/* Farm Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            🚜 {t.farmInfo}
          </h2>
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
                  />
                  <select
                    value={editData.farmSizeUnit}
                    onChange={(e) =>
                      handleInputChange("farmSizeUnit", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="acres">{t.acres}</option>
                    <option value="hectares">{t.hectares}</option>
                  </select>
                </div>
              ) : (
                <p className="mt-1 text-gray-700 font-medium">
                  {farmerData.farmSize} {farmerData.farmSizeUnit}
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
                  {soilTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
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
                  {irrigationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
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
                <Input
                  value={editData.currentSeason}
                  onChange={(e) =>
                    handleInputChange("currentSeason", e.target.value)
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-gray-700 font-medium">
                  {farmerData.currentSeason}
                </p>
              )}
            </div>

            <div>
              <Label>{t.farmingExperience}</Label>
              {isEditing ? (
                <Input
                  value={editData.farmingExperience}
                  onChange={(e) =>
                    handleInputChange("farmingExperience", e.target.value)
                  }
                  type="number"
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-gray-700 font-medium">
                  {farmerData.farmingExperience} years
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
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{crop}</span>
                      <button
                        onClick={() => handleCropRemove(crop)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Button
                  onClick={handleCropAdd}
                  className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2"
                >
                  + {t.addCrop}
                </Button>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {farmerData.mainCrops.map((crop, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    {crop}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
