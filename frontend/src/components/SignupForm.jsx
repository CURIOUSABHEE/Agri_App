import React, { useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { authService } from "../services/api";

const SignupForm = ({ onSignupComplete, onBack, language = "en" }) => {
  const [step, setStep] = useState(1); // 1: Basic, 2: Personal, 3: Farm
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Real-time validation states
  const [phoneValidation, setPhoneValidation] = useState({
    isValid: false,
    isChecking: false,
    message: "",
    isAvailable: null,
  });

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    phone: "",
    password: "",
    confirmPassword: "",

    // Step 2: Personal Details
    name: "",
    state: "",
    district: "",
    village: "",

    // Step 3: Farm Details
    numberOfFarms: "1",
    farms: [{ size: "", unit: "acres" }],
  });

  const translations = {
    en: {
      // Step 1
      step1Title: "Create Account",
      step1Subtitle: "Basic Information",
      phone: "Phone Number",
      phonePlaceholder: "10-digit mobile number",
      phoneValidating: "Checking availability...",
      phoneValid: "Valid phone number ✓",
      phoneInvalid: "Invalid phone format",
      phoneNotAvailable: "Phone number already registered",
      phoneAvailable: "Phone number available ✓",
      password: "Password",
      passwordPlaceholder: "Min 6 characters",
      confirmPassword: "Confirm Password",
      confirmPasswordPlaceholder: "Re-enter password",

      // Step 2
      step2Title: "Personal Details",
      step2Subtitle: "Tell us about yourself",
      name: "Full Name",
      namePlaceholder: "Enter your name",
      state: "State",
      selectState: "Select your state",
      district: "District",
      selectDistrict: "Select your district",
      village: "Village/Town",
      villagePlaceholder: "Enter village or town name",
      selectTown: "Select your town/village",

      // Step 3
      step3Title: "Farm Details",
      step3Subtitle: "Information about your farm",
      numberOfFarms: "Number of Farms",
      farmSize: "Farm Size",
      farmSizePlaceholder: "Enter size",
      unit: "Unit",
      acres: "Acres",
      hectares: "Hectares",
      addFarm: "Add Another Farm",
      removeFarm: "Remove",

      // Buttons
      next: "Next",
      back: "Back",
      submit: "Complete Registration",

      // Messages
      phoneRequired: "Phone number is required",
      phoneInvalidFormat: "Invalid phone format (use 10 digits)",
      passwordRequired: "Password is required",
      passwordShort: "Password must be at least 6 characters",
      passwordMismatch: "Passwords do not match",
      nameRequired: "Name is required",
      stateRequired: "Please select a state",
      districtRequired: "Please select a district",
      villageRequired: "Village/Town is required",
      farmSizeRequired: "Please enter farm size",

      // Progress
      stepOf: "Step {current} of 3",
    },
    hi: {
      step1Title: "खाता बनाएं",
      step1Subtitle: "बुनियादी जानकारी",
      phone: "फोन नंबर",
      phonePlaceholder: "10 अंकों का मोबाइल नंबर",
      phoneValidating: "उपलब्धता जांची जा रही है...",
      phoneValid: "वैध फोन नंबर ✓",
      phoneInvalid: "गलत फोन फॉर्मेट",
      phoneNotAvailable: "फोन नंबर पहले से पंजीकृत है",
      phoneAvailable: "फोन नंबर उपलब्ध है ✓",
      password: "पासवर्ड",
      passwordPlaceholder: "कम से कम 6 अक्षर",
      confirmPassword: "पासवर्ड की पुष्टि करें",
      confirmPasswordPlaceholder: "पासवर्ड फिर से दर्ज करें",

      step2Title: "व्यक्तिगत विवरण",
      step2Subtitle: "अपने बारे में बताएं",
      name: "पूरा नाम",
      namePlaceholder: "अपना नाम दर्ज करें",
      state: "राज्य",
      selectState: "अपना राज्य चुनें",
      district: "जिला",
      selectDistrict: "अपना जिला चुनें",
      village: "गाँव/शहर",
      villagePlaceholder: "गाँव या शहर का नाम दर्ज करें",
      selectTown: "अपना शहर/गाँव चुनें",

      step3Title: "खेत का विवरण",
      step3Subtitle: "अपने खेत के बारे में जानकारी",
      numberOfFarms: "खेतों की संख्या",
      farmSize: "खेत का आकार",
      farmSizePlaceholder: "आकार दर्ज करें",
      unit: "इकाई",
      acres: "एकड़",
      hectares: "हेक्टेयर",
      addFarm: "और खेत जोड़ें",
      removeFarm: "हटाएं",

      next: "अगला",
      back: "पीछे",
      submit: "पंजीकरण पूरा करें",

      phoneRequired: "फोन नंबर आवश्यक है",
      phoneInvalidFormat: "गलत फोन फॉर्मेट (10 अंक का उपयोग करें)",
      passwordRequired: "पासवर्ड आवश्यक है",
      passwordShort: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए",
      passwordMismatch: "पासवर्ड मेल नहीं खाते",
      nameRequired: "नाम आवश्यक है",
      stateRequired: "कृपया एक राज्य चुनें",
      districtRequired: "कृपया एक जिला चुनें",
      villageRequired: "गाँव/शहर आवश्यक है",
      farmSizeRequired: "कृपया खेत का आकार दर्ज करें",

      stepOf: "चरण {current} का 3",
    },
  };

  const t = translations[language] || translations.en;

  // Indian States
  const states = [
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
  ];

  // Kerala-centric districts data
  const districts = {
    Kerala: [
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
    // All 38 districts of Tamil Nadu
    "Tamil Nadu": [
      "Ariyalur",
      "Chengalpattu",
      "Chennai",
      "Coimbatore",
      "Cuddalore",
      "Dharmapuri",
      "Dindigul",
      "Erode",
      "Kallakurichi",
      "Kanchipuram",
      "Kanyakumari",
      "Karur",
      "Krishnagiri",
      "Madurai",
      "Mayiladuthurai",
      "Nagapattinam",
      "Namakkal",
      "Nilgiris",
      "Perambalur",
      "Pudukkottai",
      "Ramanathapuram",
      "Ranipet",
      "Salem",
      "Sivaganga",
      "Tenkasi",
      "Thanjavur",
      "Theni",
      "Thoothukudi",
      "Tiruchirappalli",
      "Tirunelveli",
      "Tirupathur",
      "Tiruppur",
      "Tiruvallur",
      "Tiruvannamalai",
      "Tiruvarur",
      "Vellore",
      "Viluppuram",
      "Virudhunagar",
    ],
    // All 31 districts of Karnataka
    Karnataka: [
      "Bagalkot",
      "Ballari",
      "Belagavi",
      "Bengaluru Rural",
      "Bengaluru Urban",
      "Bidar",
      "Chamarajanagar",
      "Chikballapur",
      "Chikkamagaluru",
      "Chitradurga",
      "Dakshina Kannada",
      "Davanagere",
      "Dharwad",
      "Gadag",
      "Hassan",
      "Haveri",
      "Kalaburagi",
      "Kodagu",
      "Kolar",
      "Koppal",
      "Mandya",
      "Mysuru",
      "Raichur",
      "Ramanagara",
      "Shivamogga",
      "Tumakuru",
      "Udupi",
      "Uttara Kannada",
      "Vijayapura",
      "Yadgir",
    ],
    // All 36 districts of Maharashtra
    Maharashtra: [
      "Ahmednagar",
      "Akola",
      "Amravati",
      "Aurangabad (Chhatrapati Sambhaji Nagar)",
      "Beed",
      "Bhandara",
      "Buldhana",
      "Chandrapur",
      "Dhule",
      "Gadchiroli",
      "Gondia",
      "Hingoli",
      "Jalgaon",
      "Jalna",
      "Kolhapur",
      "Latur",
      "Mumbai City",
      "Mumbai Suburban",
      "Nagpur",
      "Nanded",
      "Nandurbar",
      "Nashik",
      "Osmanabad (Dharashiv)",
      "Palghar",
      "Parbhani",
      "Pune",
      "Raigad",
      "Ratnagiri",
      "Sangli",
      "Satara",
      "Sindhudurg",
      "Solapur",
      "Thane",
      "Wardha",
      "Washim",
      "Yavatmal",
    ],
    // All 33 districts of Gujarat
    Gujarat: [
      "Ahmedabad",
      "Amreli",
      "Anand",
      "Aravalli",
      "Banaskantha",
      "Bharuch",
      "Bhavnagar",
      "Botad",
      "Chhota Udaipur",
      "Dahod",
      "Dang",
      "Devbhoomi Dwarka",
      "Gandhinagar",
      "Gir Somnath",
      "Jamnagar",
      "Junagadh",
      "Kheda",
      "Kutch",
      "Mahisagar",
      "Mehsana",
      "Morbi",
      "Narmada",
      "Navsari",
      "Panchmahal",
      "Patan",
      "Porbandar",
      "Rajkot",
      "Sabarkantha",
      "Surat",
      "Surendranagar",
      "Tapi",
      "Vadodara",
      "Valsad",
    ],
    // All 26 districts of Andhra Pradesh (as of 2022)
    "Andhra Pradesh": [
      "Alluri Sitharama Raju",
      "Anakapalli",
      "Ananthapuramu",
      "Annamayya",
      "Bapatla",
      "Chittoor",
      "East Godavari",
      "Eluru",
      "Guntur",
      "Kakinada",
      "Konaseema",
      "Krishna",
      "Kurnool",
      "Nandyal",
      "Nellore",
      "NTR",
      "Palnadu",
      "Parvathipuram Manyam",
      "Prakasam",
      "Srikakulam",
      "Sri Sathya Sai",
      "Tirupati",
      "Visakhapatnam",
      "Vizianagaram",
      "West Godavari",
      "YSR",
    ],
    // All 33 districts of Telangana
    Telangana: [
      "Adilabad",
      "Bhadradri Kothagudem",
      "Hyderabad",
      "Jagtial",
      "Jangaon",
      "Jayashankar Bhupalpally",
      "Jogulamba Gadwal",
      "Kamareddy",
      "Karimnagar",
      "Khammam",
      "Komaram Bheem Asifabad",
      "Mahabubabad",
      "Mahabubnagar",
      "Mancherial",
      "Medak",
      "Medchal–Malkajgiri",
      "Mulugu",
      "Nagarkurnool",
      "Nalgonda",
      "Narayanpet",
      "Nirmal",
      "Nizamabad",
      "Peddapalli",
      "Rajanna Sircilla",
      "Ranga Reddy",
      "Sangareddy",
      "Siddipet",
      "Suryapet",
      "Vikarabad",
      "Wanaparthy",
      "Warangal Rural",
      "Warangal Urban",
      "Yadadri Bhuvanagiri",
    ],
    // All 75 districts of Uttar Pradesh
    "Uttar Pradesh": [
      "Agra",
      "Aligarh",
      "Ambedkar Nagar",
      "Amethi",
      "Amroha",
      "Auraiya",
      "Ayodhya",
      "Azamgarh",
      "Baghpat",
      "Bahraich",
      "Ballia",
      "Balrampur",
      "Banda",
      "Barabanki",
      "Bareilly",
      "Basti",
      "Bhadohi",
      "Bijnor",
      "Budaun",
      "Bulandshahr",
      "Chandauli",
      "Chitrakoot",
      "Deoria",
      "Etah",
      "Etawah",
      "Farrukhabad",
      "Fatehpur",
      "Firozabad",
      "Gautam Buddha Nagar",
      "Ghaziabad",
      "Ghazipur",
      "Gonda",
      "Gorakhpur",
      "Hamirpur",
      "Hapur",
      "Hardoi",
      "Hathras",
      "Jalaun",
      "Jaunpur",
      "Jhansi",
      "Kannauj",
      "Kanpur Dehat",
      "Kanpur Nagar",
      "Kasganj",
      "Kaushambi",
      "Kheri",
      "Kushinagar",
      "Lalitpur",
      "Lucknow",
      "Maharajganj",
      "Mahoba",
      "Mainpuri",
      "Mathura",
      "Mau",
      "Meerut",
      "Mirzapur",
      "Moradabad",
      "Muzaffarnagar",
      "Pilibhit",
      "Pratapgarh",
      "Prayagraj",
      "Raebareli",
      "Rampur",
      "Saharanpur",
      "Sambhal",
      "Sant Kabir Nagar",
      "Shahjahanpur",
      "Shamli",
      "Shravasti",
      "Siddharthnagar",
      "Sitapur",
      "Sonbhadra",
      "Sultanpur",
      "Unnao",
      "Varanasi",
    ],
    // All 23 districts of West Bengal
    "West Bengal": [
      "Alipurduar",
      "Bankura",
      "Birbhum",
      "Cooch Behar",
      "Dakshin Dinajpur",
      "Darjeeling",
      "Hooghly",
      "Howrah",
      "Jalpaiguri",
      "Jhargram",
      "Kalimpong",
      "Kolkata",
      "Malda",
      "Murshidabad",
      "Nadia",
      "North 24 Parganas",
      "Paschim Bardhaman",
      "Paschim Medinipur",
      "Purba Bardhaman",
      "Purba Medinipur",
      "Purulia",
      "South 24 Parganas",
      "Uttar Dinajpur",
    ],
    // All 33 districts of Rajasthan
    Rajasthan: [
      "Ajmer",
      "Alwar",
      "Banswara",
      "Baran",
      "Barmer",
      "Bharatpur",
      "Bhilwara",
      "Bikaner",
      "Bundi",
      "Chittorgarh",
      "Churu",
      "Dausa",
      "Dholpur",
      "Dungarpur",
      "Hanumangarh",
      "Jaipur",
      "Jaisalmer",
      "Jalore",
      "Jhalawar",
      "Jhunjhunu",
      "Jodhpur",
      "Karauli",
      "Kota",
      "Nagaur",
      "Pali",
      "Pratapgarh",
      "Rajsamand",
      "Sawai Madhopur",
      "Sikar",
      "Sirohi",
      "Sri Ganganagar",
      "Tonk",
      "Udaipur",
    ],
    // All 52 districts of Madhya Pradesh
    "Madhya Pradesh": [
      "Agar Malwa",
      "Alirajpur",
      "Anuppur",
      "Ashoknagar",
      "Balaghat",
      "Barwani",
      "Betul",
      "Bhind",
      "Bhopal",
      "Burhanpur",
      "Chhatarpur",
      "Chhindwara",
      "Damoh",
      "Datia",
      "Dewas",
      "Dhar",
      "Dindori",
      "Guna",
      "Gwalior",
      "Harda",
      "Hoshangabad",
      "Indore",
      "Jabalpur",
      "Jhabua",
      "Katni",
      "Khandwa",
      "Khargone",
      "Mandla",
      "Mandsaur",
      "Morena",
      "Narsinghpur",
      "Neemuch",
      "Panna",
      "Raisen",
      "Rajgarh",
      "Ratlam",
      "Rewa",
      "Sagar",
      "Satna",
      "Sehore",
      "Seoni",
      "Shahdol",
      "Shajapur",
      "Sheopur",
      "Shivpuri",
      "Sidhi",
      "Singrauli",
      "Tikamgarh",
      "Ujjain",
      "Umaria",
      "Vidisha",
    ],
    // All 23 districts of Punjab
    Punjab: [
      "Amritsar",
      "Barnala",
      "Bathinda",
      "Faridkot",
      "Fatehgarh Sahib",
      "Fazilka",
      "Ferozepur",
      "Gurdaspur",
      "Hoshiarpur",
      "Jalandhar",
      "Kapurthala",
      "Ludhiana",
      "Malerkotla",
      "Mansa",
      "Moga",
      "Mohali (SAS Nagar)",
      "Muktsar",
      "Pathankot",
      "Patiala",
      "Rupnagar",
      "Sangrur",
      "Shahid Bhagat Singh Nagar",
      "Tarn Taran",
    ],
    // All 22 districts of Haryana
    Haryana: [
      "Ambala",
      "Bhiwani",
      "Charkhi Dadri",
      "Faridabad",
      "Fatehabad",
      "Gurugram",
      "Hisar",
      "Jhajjar",
      "Jind",
      "Kaithal",
      "Karnal",
      "Kurukshetra",
      "Mahendragarh",
      "Nuh",
      "Palwal",
      "Panchkula",
      "Panipat",
      "Rewari",
      "Rohtak",
      "Sirsa",
      "Sonipat",
      "Yamunanagar",
    ],
    // All 38 districts of Bihar
    Bihar: [
      "Araria",
      "Arwal",
      "Aurangabad",
      "Banka",
      "Begusarai",
      "Bhagalpur",
      "Bhojpur",
      "Buxar",
      "Darbhanga",
      "East Champaran",
      "Gaya",
      "Gopalganj",
      "Jamui",
      "Jehanabad",
      "Kaimur",
      "Katihar",
      "Khagaria",
      "Kishanganj",
      "Lakhisarai",
      "Madhepura",
      "Madhubani",
      "Munger",
      "Muzaffarpur",
      "Nalanda",
      "Nawada",
      "Patna",
      "Purnia",
      "Rohtas",
      "Saharsa",
      "Samastipur",
      "Saran",
      "Sheikhpura",
      "Sheohar",
      "Sitamarhi",
      "Siwan",
      "Supaul",
      "Vaishali",
      "West Champaran",
    ],
  };

  // Comprehensive Kerala Towns/Villages by District
  const keralaTowns = {
    Thiruvananthapuram: [
      "Thiruvananthapuram City",
      "Neyyattinkara",
      "Attingal",
      "Varkala",
      "Nedumangad",
      "Kazhakoottam",
      "Technopark",
      "Kovalam",
      "Poovar",
      "Vizhinjam",
      "Pulluvila",
      "Anchuthengu",
      "Balaramapuram",
      "Chirayinkeezhu",
      "Kadakampally",
      "Kadinamkulam",
      "Karumkulam",
      "Malayinkeezhu",
      "Mangalapuram",
      "Maruthoorkonam",
      "Ottasekharamangalam",
      "Pallichal",
      "Parassala",
      "Parasuvaikkal",
      "Perumkadavila",
      "Pothencode",
      "Sreekaryam",
      "Thumba",
      "Ulloor",
      "Vamanapuram",
      "Venganoor",
      "Vilappil",
      "Aryanad",
      "Kattakada",
      "Vellarada",
      "Palode",
    ],
    Kollam: [
      "Kollam City",
      "Karunagappally",
      "Punalur",
      "Paravur",
      "Kottarakkara",
      "Anchal",
      "Kunnathur",
      "Sasthamcotta",
      "Chavara",
      "Clappana",
      "Perinad",
      "Pathanapuram",
      "Kundara",
      "Mayyanad",
      "Oachira",
      "Kulathupuzha",
      "Thazhava",
      "Velinalloor",
      "Chithara",
      "Kadakkal",
      "Kalluvathukkal",
      "Panmana",
      "Poruvazhy",
      "Thrikkadavoor",
      "Elamad",
      "Elampalloor",
      "Eravipuram",
      "Kilikolloor",
      "Pooyappally",
      "Sakthikulangara",
      "Thenmala",
      "Vallikeezhu",
      "West Kallada",
    ],
    Pathanamthitta: [
      "Pathanamthitta Town",
      "Adoor",
      "Pandalam",
      "Thiruvalla",
      "Mallappally",
      "Kozhencherry",
      "Ranni",
      "Konni",
      "Seethathodu",
      "Anicad",
      "Aranmula",
      "Cherukole",
      "Chittar",
      "Eraviperoor",
      "Ezhamkulam",
      "Kadapra",
      "Kadammanitta",
      "Kalanjoor",
      "Kallooppara",
      "Kodumon",
      "Kumbakonam",
      "Kuttoor",
      "Mallapuzhassery",
      "Naranganam",
      "Nariyapuram",
      "Niranam",
      "Omalloor",
      "Pallickal",
      "Peringara",
      "Puramattom",
      "Thottappuzhassery",
      "Vechoochira",
      "Vadasserikkara",
    ],
    Alappuzha: [
      "Alappuzha Town",
      "Cherthala",
      "Kayamkulam",
      "Mavelikkara",
      "Haripad",
      "Ambalappuzha",
      "Kuttanad",
      "Kummakonam",
      "Mannancherry",
      "Muttar",
      "Puliyoor",
      "Thakazhy",
      "Veeyapuram",
      "Arattupuzha",
      "Budhanoor",
      "Champakulam",
      "Chenganassery",
      "Ennakkad",
      "Harippad",
      "Kandalloor",
      "Karuvatta",
      "Kavaalam",
      "Krishnapuram",
      "Kumarapuram",
      "Mulakkuzha",
      "Muthukulam",
      "Neerettupuram",
      "Palamel",
      "Pandanad",
      "Panavally",
      "Pathiyoor",
      "Pulinkunnu",
      "Ramankary",
      "Thaicattussery",
      "Thannermukkom",
      "Thuravoor",
      "Vallikunnam",
      "Vandanam",
      "Venmoney",
    ],
    Kottayam: [
      "Kottayam Town",
      "Changanassery",
      "Pala",
      "Ettumanoor",
      "Vaikom",
      "Erattupetta",
      "Mundakayam",
      "Kanjirappally",
      "Kaduthuruthy",
      "Kumarakom",
      "Ayarkunnam",
      "Chirakkadavu",
      "Elikulam",
      "Kadanad",
      "Karoor",
      "Koruthodu",
      "Kozhuvanal",
      "Madappally",
      "Manarcaud",
      "Manjoor",
      "Meenadom",
      "Melukavu",
      "Mulakulam",
      "Neendoor",
      "Pallom",
      "Panachikkad",
      "Parampuzha",
      "Teekoy",
      "Thalayazham",
      "Thalayolaparambu",
      "Thannicodu",
      "Thiruvarppu",
      "Uzhavoor",
      "Vakathanam",
      "Veliyannoor",
      "Vijayapuram",
    ],
    Idukki: [
      "Painavu",
      "Thodupuzha",
      "Kumily",
      "Munnar",
      "Devikulam",
      "Udumbanchola",
      "Peermade",
      "Kattappana",
      "Nedumkandam",
      "Rajakumari",
      "Vannappuram",
      "Vazhathope",
      "Vathikudy",
      "Santhanpara",
      "Purappuzha",
      "Peerumade",
      "Pallivasal",
      "Pampadumpara",
      "Kanjikkuzhi",
      "Kokkayar",
      "Mariyapuram",
      "Mullaringad",
      "Suryanelli",
      "Thekkady",
      "Top Station",
      "Vagamon",
      "Vandiperiyar",
      "Vellathooval",
      "Ayyappancoil",
      "Bisonvalley",
      "Calvary Mount",
      "Chakkupallam",
      "Chinnakanal",
      "Elappara",
      "Kamakshy",
      "Karimala",
      "Keezhanthoor",
      "Konnathady",
      "Kulamavu",
      "Manakkad",
      "Mankulam",
      "Mariapuram",
    ],
    Ernakulam: [
      "Kochi",
      "Aluva",
      "Perumbavoor",
      "Angamaly",
      "Kothamangalam",
      "Muvattupuzha",
      "North Paravur",
      "Thrikkakara",
      "Kalamassery",
      "Edappally",
      "Kakkanad",
      "Palarivattom",
      "Vyttila",
      "Fort Kochi",
      "Mattancherry",
      "Kumbakonam",
      "Malayattoor",
      "Maneed",
      "Maradu",
      "Mulavukad",
      "Nedumbassery",
      "Palluruthy",
      "Piravom",
      "Puthencruz",
      "Rayamangalam",
      "Thuravoor",
      "Tripunithura",
      "Vazhakulam",
      "Vypin",
      "Cherai",
      "Cherthala",
      "Chellanam",
      "Chendamangalam",
      "Cheranalloor",
      "Choornikkara",
      "Elamakkara",
      "Eloor",
      "Karukutty",
      "Keerampara",
      "Keezhmad",
      "Kinfra",
      "Koovappady",
      "Koothattukulam",
      "Kuzhippilly",
      "Manakkappady",
      "Mudakkuzha",
      "Nayarambalam",
      "Nellikuzhi",
      "Okkal",
      "Pallipuram",
      "Paingottoor",
      "Parakkadavu",
      "Pindimana",
      "Ramamangalam",
      "Sreemoolanagaram",
      "Vadakkekkara",
      "Vadavucode",
      "Varapuzha",
      "Vengola",
      "Vengoor",
    ],
    Thrissur: [
      "Thrissur City",
      "Chalakudy",
      "Kodungallur",
      "Irinjalakuda",
      "Kunnamkulam",
      "Guruvayur",
      "Chavakkad",
      "Wadakkanchery",
      "Ollur",
      "Puzhakkal",
      "Anthikad",
      "Avinissery",
      "Choondal",
      "Desamangalam",
      "Dharmadam",
      "Eriyad",
      "Kadangode",
      "Kadavallur",
      "Kadukutty",
      "Kaipamangalam",
      "Kandanassery",
      "Karalam",
      "Kathikkudam",
      "Kattur",
      "Koratty",
      "Kuttanallur",
      "Lakkidi",
      "Madakkathara",
      "Mathilakam",
      "Meloor",
      "Mullassery",
      "Mundoor",
      "Muringoor",
      "Nadathara",
      "Nenmanikkara",
      "Orumanayur",
      "Padiyur",
      "Pananchery",
      "Pavaratty",
      "Peechi",
      "Perinjanam",
      "Poyya",
      "Pudukad",
      "Puranattukara",
      "Puthenchira",
      "Sakthan Nagar",
      "Sreenarayanapuram",
      "Taliparamba",
      "Thiruvambady",
      "Thriprayar",
      "Thuneri",
      "Tikkodi",
      "Valappad",
      "Vallachira",
      "Varavoor",
      "Velookkara",
      "Venkitangu",
    ],
    Palakkad: [
      "Palakkad Town",
      "Ottappalam",
      "Chittur",
      "Mannarkkad",
      "Shoranur",
      "Pattambi",
      "Cherpulassery",
      "Kongad",
      "Nemmara",
      "Malampuzha",
      "Kanjikode",
      "Sreekrishnapuram",
      "Thrithala",
      "Alathur",
      "Agali",
      "Attappady",
      "Ayilur",
      "Elapully",
      "Karakurissi",
      "Karimpuzha",
      "Kuzhalmannam",
      "Lakkidi",
      "Meenakshipuram",
      "Muthalamada",
      "Nagalassery",
      "Nattukal",
      "Nelliampathy",
      "Nenmeni",
      "Olappamanna",
      "Parali",
      "Peringottukurissi",
      "Pudunagaram",
      "Puduppariyaram",
      "Thachanattukara",
      "Thariyode",
      "Vadakkenchery",
      "Vadavanoor",
      "Vandazhi",
      "Vazhenkada",
      "Vilayur",
      "Walayar",
      "Kodumbu",
      "Pudussery",
    ],
    Malappuram: [
      "Malappuram Town",
      "Manjeri",
      "Perinthalmanna",
      "Tirur",
      "Tanur",
      "Ponnani",
      "Nilambur",
      "Kondotty",
      "Wandoor",
      "Karuvarakundu",
      "Edappal",
      "Tirurangadi",
      "Kottakkal",
      "Valanchery",
      "Areekode",
      "Cherukavu",
      "Chokkad",
      "Edakkara",
      "Edarikode",
      "Kadampuzha",
      "Kalikavu",
      "Karulai",
      "Keezhattur",
      "Kizhakkencheri",
      "Kodur",
      "Kuruva",
      "Makkaraparamba",
      "Mankada",
      "Melattur",
      "Moorkkanad",
      "Moothedam",
      "Naduvattom",
      "Oorakam",
      "Ozhur",
      "Pandikkad",
      "Ponmundam",
      "Pulamanthole",
      "Purathur",
      "Puthanathani",
      "Tanalur",
      "Tenhipalam",
      "Thirunavaya",
      "Thuvvur",
      "Vazhayur",
      "Vengara",
      "Vettom",
    ],
    Kozhikode: [
      "Kozhikode City",
      "Vadakara",
      "Koyilandy",
      "Ramanattukara",
      "Feroke",
      "Balussery",
      "Thamarassery",
      "Kalpetta",
      "Perambra",
      "Koduvally",
      "Thiruvambady",
      "Mukkom",
      "Kunnamangalam",
      "Panthalayani",
      "Nadapuram",
      "Quilandy",
      "Atholi",
      "Chelannur",
      "Chorod",
      "Edachery",
      "Eramala",
      "Farook",
      "Iringal",
      "Kadampuzha",
      "Karassery",
      "Kattippara",
      "Kayanna",
      "Keezhariyur",
      "Kizhakkoth",
      "Koothali",
      "Kumaranellur",
      "Madavoor",
      "Maruthonkara",
      "Mavoor",
      "Melady",
      "Meppayur",
      "Mudadi",
      "Nanminda",
      "Narippatta",
      "Nochad",
      "Omassery",
      "Payyoli",
      "Purameri",
      "Puthuppadi",
      "Sivapuram",
      "Thurayur",
      "Thodannur",
      "Ulliyeri",
      "Unnikulam",
      "Vadakkekad",
      "Valayam",
      "Villiappally",
      "Vanimel",
    ],
    Wayanad: [
      "Kalpetta",
      "Sultan Bathery",
      "Mananthavady",
      "Vythiri",
      "Meppadi",
      "Ambalavayal",
      "Thirunelli",
      "Pulpally",
      "Panamaram",
      "Vellamunda",
      "Meenangady",
      "Poothadi",
      "Edakkal",
      "Noolpuzha",
      "Thondernad",
      "Vengappally",
      "Thariyode",
      "Tavinjal",
      "Sulthan Bathery",
      "Pozhuthana",
      "Pazhassi",
      "Nadavayal",
      "Mullankolli",
      "Moopainad",
      "Mittapalli",
      "Mambra",
      "Lakkidi",
      "Kummanam",
      "Krishnagiri",
      "Kotathara",
      "Kenichira",
      "Kaniyaram",
      "Irulam",
      "Bathery",
    ],
    Kannur: [
      "Kannur City",
      "Thalassery",
      "Payyanur",
      "Iritty",
      "Kuthuparamba",
      "Panoor",
      "Peravoor",
      "Mattannur",
      "Kanhangad",
      "Hosdurg",
      "Cheruthazham",
      "Chirakkal",
      "Dharmadam",
      "Irikkur",
      "Kadachira",
      "Kalliassery",
      "Kannapuram",
      "Kottiyoor",
      "Mangattuparamba",
      "Mayyil",
      "Mokeri",
      "Muzhappilangad",
      "Naduvil",
      "Narath",
      "New Mahe",
      "Palakkode",
      "Pappinisseri",
      "Pattiom",
      "Pilathara",
      "Puzhathi",
      "Thripangottur",
      "Valapattanam",
      "Anthoor",
      "Aralam",
      "Ayyankunnu",
      "Cherupuzha",
      "Chokli",
      "Eranholi",
      "Kadirur",
      "Kelakam",
      "Kolachery",
      "Madayi",
      "Maloor",
      "Manantheri",
      "Munderi",
      "Pathiriyad",
      "Peringome",
      "Pulingome",
      "Sreekandapuram",
      "Thillenkeri",
      "Ulikkal",
    ],
    Kasaragod: [
      "Kasaragod Town",
      "Kanhangad",
      "Nileshwar",
      "Bekal",
      "Uppala",
      "Manjeshwar",
      "Hosdurg",
      "Kumble",
      "Vidyanagar",
      "Bedadka",
      "Bellur",
      "Chemnad",
      "Cherkala",
      "East Eleri",
      "Enmakaje",
      "Karadka",
      "Kumbla",
      "Madikai",
      "Mogral Puthur",
      "Muliyar",
      "Pallikere",
      "Pilicode",
      "Trikaripur",
      "Vorkady",
      "West Eleri",
      "Ajanur",
      "Badiadka",
      "Balal",
      "Badiyadka",
      "Chengala",
      "Delampady",
      "Kayyur Cheemeni",
      "Kumbdaje",
      "Meenja",
      "Panathady",
      "Paival",
      "Periye",
      "Puthige",
      "Ranipuram",
      "Udma",
      "Valiyaparamba",
    ],
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleFarmChange = (index, field, value) => {
    const updatedFarms = [...formData.farms];
    updatedFarms[index] = { ...updatedFarms[index], [field]: value };
    setFormData((prev) => ({ ...prev, farms: updatedFarms }));
  };

  const addFarm = () => {
    setFormData((prev) => ({
      ...prev,
      farms: [...prev.farms, { size: "", unit: "acres" }],
    }));
  };

  const removeFarm = (index) => {
    if (formData.farms.length > 1) {
      const updatedFarms = formData.farms.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, farms: updatedFarms }));
    }
  };

  // Real-time phone validation
  const validatePhoneRealTime = async (phone) => {
    // Reset validation state
    setPhoneValidation({
      isValid: false,
      isChecking: false,
      message: "",
      isAvailable: null,
    });

    // Check if phone is empty
    if (!phone) {
      return;
    }

    // Check format first
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
    if (!phoneRegex.test(phone)) {
      setPhoneValidation({
        isValid: false,
        isChecking: false,
        message: t.phoneInvalid,
        isAvailable: null,
      });
      return;
    }

    // Format is valid, now check availability
    setPhoneValidation({
      isValid: true,
      isChecking: true,
      message: t.phoneValidating,
      isAvailable: null,
    });

    try {
      // Check if phone is already registered
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/check-phone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPhoneValidation({
          isValid: true,
          isChecking: false,
          message: data.available ? t.phoneAvailable : t.phoneNotAvailable,
          isAvailable: data.available,
        });
      } else {
        // Assume available if check fails
        setPhoneValidation({
          isValid: true,
          isChecking: false,
          message: t.phoneValid,
          isAvailable: true,
        });
      }
    } catch {
      // On network error, assume format is valid but don't check availability
      setPhoneValidation({
        isValid: true,
        isChecking: false,
        message: t.phoneValid,
        isAvailable: true,
      });
    }
  };

  const validateStep1 = () => {
    if (!formData.phone) {
      setError(t.phoneRequired);
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setError(t.phoneInvalid);
      return false;
    }
    if (!formData.password) {
      setError(t.passwordRequired);
      return false;
    }
    if (formData.password.length < 6) {
      setError(t.passwordShort);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t.passwordMismatch);
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.name.trim()) {
      setError(t.nameRequired);
      return false;
    }
    if (!formData.state) {
      setError(t.stateRequired);
      return false;
    }
    if (!formData.district) {
      setError(t.districtRequired);
      return false;
    }
    if (!formData.village.trim()) {
      setError(t.villageRequired);
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    for (let farm of formData.farms) {
      if (!farm.size || parseFloat(farm.size) <= 0) {
        setError(t.farmSizeRequired);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setError("");

    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    console.log("🚀 Registration button clicked!");
    console.log("📝 Form data:", formData);

    if (!validateStep3()) {
      console.log("❌ Step 3 validation failed");
      return;
    }

    console.log("✅ Step 3 validation passed");
    setLoading(true);
    setError("");

    try {
      const requestBody = {
        phone: formData.phone,
        password: formData.password,
        name: formData.name,
        state: formData.state,
        district: formData.district,
        village: formData.village,
        farms: formData.farms,
        language: language,
      };

      console.log("📤 Request body:", requestBody);

      const data = await authService.signup(requestBody);
      console.log("📥 Response data:", data);

      console.log("✅ Signup successful!");
      // Save auth data
      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("farmerData", JSON.stringify(data.farmer_data));

      // Call success callback
      onSignupComplete(data);
    } catch (error) {
      console.error("❌ Signup error:", error);
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        setError(
          "Cannot connect to server. Please make sure the backend server is running on http://localhost:8000"
        );
      } else {
        setError(`Network error: ${error.message}`);
      }
    } finally {
      setLoading(false);
      console.log("🏁 Registration process completed");
    }
  };

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">
          {t.stepOf.replace("{current}", step)}
        </span>
        <span className="text-sm font-medium text-green-600">
          {Math.round((step / 3) * 100)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌾</div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            {step === 1 && t.step1Title}
            {step === 2 && t.step2Title}
            {step === 3 && t.step3Title}
          </h2>
          <p className="text-gray-600 mt-1">
            {step === 1 && t.step1Subtitle}
            {step === 2 && t.step2Subtitle}
            {step === 3 && t.step3Subtitle}
          </p>
        </div>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-lg flex items-center gap-2">
                📱 {t.phone}
              </Label>
              <div className="relative">
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const phoneValue = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    handleInputChange("phone", phoneValue);
                    // Trigger real-time validation
                    validatePhoneRealTime(phoneValue);
                  }}
                  placeholder={t.phonePlaceholder}
                  className={`mt-2 text-lg p-6 pr-12 ${
                    phoneValidation.isAvailable === false
                      ? "border-red-500 focus:border-red-500"
                      : phoneValidation.isAvailable === true
                      ? "border-green-500 focus:border-green-500"
                      : ""
                  }`}
                  maxLength={10}
                />
                {/* Validation Icon */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  {phoneValidation.isChecking && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                  {!phoneValidation.isChecking &&
                    phoneValidation.isAvailable === true && (
                      <span className="text-green-600 text-xl">✓</span>
                    )}
                  {!phoneValidation.isChecking &&
                    phoneValidation.isAvailable === false && (
                      <span className="text-red-600 text-xl">✗</span>
                    )}
                  {!phoneValidation.isChecking &&
                    phoneValidation.isValid &&
                    phoneValidation.isAvailable === null && (
                      <span className="text-green-600 text-xl">✓</span>
                    )}
                  {!phoneValidation.isChecking &&
                    !phoneValidation.isValid &&
                    formData.phone.length > 0 && (
                      <span className="text-red-600 text-xl">✗</span>
                    )}
                </div>
              </div>
              {/* Validation Message */}
              {phoneValidation.message && (
                <p
                  className={`mt-1 text-sm ${
                    phoneValidation.isAvailable === false
                      ? "text-red-600"
                      : phoneValidation.isAvailable === true
                      ? "text-green-600"
                      : phoneValidation.isValid
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {phoneValidation.message}
                </p>
              )}
            </div>

            <div>
              <Label className="text-lg flex items-center gap-2">
                🔒 {t.password}
              </Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="mt-2 text-lg p-6"
              />
            </div>

            <div>
              <Label className="text-lg flex items-center gap-2">
                ✓ {t.confirmPassword}
              </Label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                placeholder={t.confirmPasswordPlaceholder}
                className="mt-2 text-lg p-6"
              />
            </div>
          </div>
        )}

        {/* Step 2: Personal Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-lg flex items-center gap-2">
                👤 {t.name}
              </Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t.namePlaceholder}
                className="mt-2 text-lg p-6"
              />
            </div>

            <div>
              <Label className="text-lg flex items-center gap-2">
                🗺️ {t.state}
              </Label>
              <select
                value={formData.state}
                onChange={(e) => {
                  handleInputChange("state", e.target.value);
                  handleInputChange("district", "");
                  handleInputChange("village", "");
                }}
                className="mt-2 w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">{t.selectState}</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-lg flex items-center gap-2">
                📍 {t.district}
              </Label>
              <select
                value={formData.district}
                onChange={(e) => {
                  handleInputChange("district", e.target.value);
                  handleInputChange("village", "");
                }}
                className="mt-2 w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={!formData.state}
              >
                <option value="">{t.selectDistrict}</option>
                {formData.state &&
                  districts[formData.state]?.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label className="text-lg flex items-center gap-2">
                🏘️ {t.village}
              </Label>
              {formData.state === "Kerala" && formData.district ? (
                <select
                  value={formData.village}
                  onChange={(e) => handleInputChange("village", e.target.value)}
                  className="mt-2 w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{t.selectTown}</option>
                  {keralaTowns[formData.district]?.map((town) => (
                    <option key={town} value={town}>
                      {town}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type="text"
                  value={formData.village}
                  onChange={(e) => handleInputChange("village", e.target.value)}
                  placeholder={t.villagePlaceholder}
                  className="mt-2 text-lg p-6"
                />
              )}
            </div>
          </div>
        )}

        {/* Step 3: Farm Details */}
        {step === 3 && (
          <div className="space-y-6">
            {formData.farms.map((farm, index) => (
              <div
                key={index}
                className="p-4 border-2 border-green-200 rounded-lg bg-green-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-lg font-bold flex items-center gap-2">
                    🚜 {t.farmSize} {index + 1}
                  </Label>
                  {formData.farms.length > 1 && (
                    <Button
                      onClick={() => removeFarm(index)}
                      variant="outline"
                      className="text-red-600 border-red-300"
                    >
                      {t.removeFarm}
                    </Button>
                  )}
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={farm.size}
                      onChange={(e) =>
                        handleFarmChange(index, "size", e.target.value)
                      }
                      placeholder={t.farmSizePlaceholder}
                      className="text-lg p-4"
                      step="0.1"
                      min="0"
                    />
                  </div>
                  <div className="w-32">
                    <select
                      value={farm.unit}
                      onChange={(e) =>
                        handleFarmChange(index, "unit", e.target.value)
                      }
                      className="w-full p-4 text-lg border border-gray-300 rounded-lg"
                    >
                      <option value="acres">{t.acres}</option>
                      <option value="hectares">{t.hectares}</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <Button
              onClick={addFarm}
              variant="outline"
              className="w-full p-4 border-2 border-dashed border-green-400 text-green-700 hover:bg-green-50"
            >
              ➕ {t.addFarm}
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex-1 p-4 text-lg"
            disabled={loading}
          >
            ← {t.back}
          </Button>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              className="flex-1 p-4 text-lg bg-green-600 hover:bg-green-700 text-white"
            >
              {t.next} →
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 p-4 text-lg bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
            >
              {loading ? "⏳ " + t.submit : "✓ " + t.submit}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SignupForm;
