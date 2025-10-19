"""Location and mapping utilities"""

# Comprehensive Indian states and districts database
STATES_AND_DISTRICTS = {
    "Andhra Pradesh": [
        "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", 
        "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", 
        "West Godavari", "YSR Kadapa"
    ],
    "Arunachal Pradesh": [
        "Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", 
        "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", 
        "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", 
        "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", 
        "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"
    ],
    "Assam": [
        "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", 
        "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Goalpara", 
        "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", 
        "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", 
        "Morigaon", "Nagaon", "Nalbari", "Dima Hasao", "Sivasagar", "Sonitpur", 
        "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"
    ],
    "Bihar": [
        "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", 
        "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", 
        "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", 
        "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", 
        "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", 
        "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", 
        "Vaishali", "West Champaran"
    ],
    "Chhattisgarh": [
        "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", 
        "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela Pendra Marwahi", 
        "Janjgir Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", 
        "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", 
        "Rajnandgaon", "Sukma", "Surajpur", "Surguja"
    ],
    "Goa": [
        "North Goa", "South Goa"
    ],
    "Gujarat": [
        "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", 
        "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", 
        "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", 
        "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", 
        "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", 
        "Tapi", "Vadodara", "Valsad"
    ],
    "Haryana": [
        "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", 
        "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", 
        "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", 
        "Sonipat", "Yamunanagar"
    ],
    "Himachal Pradesh": [
        "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul Spiti", 
        "Mandi", "Shimla", "Sirmaur", "Solan", "Una"
    ],
    "Jharkhand": [
        "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", 
        "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", 
        "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", 
        "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"
    ],
    "Karnataka": [
        "Bagalkot", "Bangalore Rural", "Bangalore Urban", "Belgaum", "Bellary", 
        "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru", "Chitradurga", 
        "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", 
        "Kodagu", "Kolar", "Koppal", "Mandya", "Mysore", "Raichur", "Ramanagara", 
        "Shimoga", "Tumkur", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"
    ],
    "Kerala": [
        "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", 
        "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", 
        "Thiruvananthapuram", "Thrissur", "Wayanad"
    ],
    "Madhya Pradesh": [
        "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", 
        "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", 
        "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", 
        "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", 
        "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", 
        "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", 
        "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", 
        "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"
    ],
    "Maharashtra": [
        "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", 
        "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", 
        "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", 
        "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", 
        "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", 
        "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
    ],
    "Manipur": [
        "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", 
        "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", 
        "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"
    ],
    "Meghalaya": [
        "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", 
        "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", 
        "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"
    ],
    "Mizoram": [
        "Aizawl", "Champhai", "Hnahthial", "Kolasib", "Khawzawl", "Lawngtlai", 
        "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"
    ],
    "Nagaland": [
        "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", 
        "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"
    ],
    "Odisha": [
        "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", 
        "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", 
        "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", 
        "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", 
        "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"
    ],
    "Punjab": [
        "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", 
        "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", 
        "Mansa", "Moga", "Muktsar", "Nawanshahr", "Pathankot", "Patiala", "Rupnagar", 
        "Sangrur", "Tarn Taran"
    ],
    "Rajasthan": [
        "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", 
        "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", 
        "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", 
        "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", 
        "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"
    ],
    "Sikkim": [
        "East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"
    ],
    "Tamil Nadu": [
        "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", 
        "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", 
        "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", 
        "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", 
        "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", 
        "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", 
        "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
    ],
    "Telangana": [
        "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", 
        "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", 
        "Khammam", "Komaram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", 
        "Medak", "Medchal Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", 
        "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", 
        "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", 
        "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"
    ],
    "Tripura": [
        "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", 
        "Unakoti", "West Tripura"
    ],
    "Uttar Pradesh": [
        "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", 
        "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", 
        "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", 
        "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", 
        "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", 
        "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", 
        "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", 
        "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", 
        "Lakhimpur Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", 
        "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", 
        "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", 
        "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", 
        "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", 
        "Sultanpur", "Unnao", "Varanasi"
    ],
    "Uttarakhand": [
        "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", 
        "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", 
        "Udham Singh Nagar", "Uttarkashi"
    ],
    "West Bengal": [
        "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", 
        "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", 
        "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", 
        "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", 
        "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"
    ],
    "Union Territories": {
        "Andaman and Nicobar Islands": [
            "Nicobar", "North and Middle Andaman", "South Andaman"
        ],
        "Chandigarh": [
            "Chandigarh"
        ],
        "Dadra and Nagar Haveli and Daman and Diu": [
            "Dadra and Nagar Haveli", "Daman", "Diu"
        ],
        "Delhi": [
            "Central Delhi", "East Delhi", "New Delhi", "North Delhi", 
            "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", 
            "South East Delhi", "South West Delhi", "West Delhi"
        ],
        "Jammu and Kashmir": [
            "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", 
            "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", 
            "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", 
            "Srinagar", "Udhampur"
        ],
        "Ladakh": [
            "Kargil", "Leh"
        ],
        "Lakshadweep": [
            "Lakshadweep"
        ],
        "Puducherry": [
            "Karaikal", "Mahe", "Puducherry", "Yanam"
        ]
    }
}

# Kerala districts for location-based weather (using API-friendly names)
KERALA_DISTRICTS = [
    "Trivandrum", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
    "Idukki", "Kochi", "Thrissur", "Palakkad", "Malappuram", 
    "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
]

# District name mapping for API compatibility
DISTRICT_NAME_MAPPING = {
    "thiruvananthapuram": "Trivandrum",
    "ernakulam": "Kochi",
    "calicut": "Kozhikode",
    "trichur": "Thrissur"
}

def detect_kerala_location(message: str) -> str:
    """Detect Kerala district/location from user message"""
    message_lower = message.lower()
    
    # First check if there's a mapped name
    for local_name, api_friendly in DISTRICT_NAME_MAPPING.items():
        if local_name in message_lower:
            return f"{api_friendly}, Kerala, India"
    
    # Check for Kerala districts mentioned in the message
    for district in KERALA_DISTRICTS:
        if district.lower() in message_lower:
            return f"{district}, Kerala, India"
    
    # Default to Kochi if no specific location found
    return "Kochi, Kerala, India"

def get_api_friendly_location(location_name: str) -> str:
    """Convert location name to API-friendly format"""
    location_lower = location_name.lower()
    
    # Check mapping first
    if location_lower in DISTRICT_NAME_MAPPING:
        return DISTRICT_NAME_MAPPING[location_lower]
    
    # Check if it's already a valid district
    for district in KERALA_DISTRICTS:
        if district.lower() == location_lower:
            return district
    
    # Default fallback
    return "Kochi"

def get_all_states() -> list:
    """Get list of all Indian states"""
    states = []
    for state in STATES_AND_DISTRICTS:
        if state != "Union Territories":
            states.append(state)
    return sorted(states)

def get_union_territories() -> dict:
    """Get all Union Territories and their districts"""
    return STATES_AND_DISTRICTS.get("Union Territories", {})

def get_districts_by_state(state_name: str) -> list:
    """Get all districts for a given state"""
    if state_name in STATES_AND_DISTRICTS:
        return STATES_AND_DISTRICTS[state_name]
    
    # Check in Union Territories
    uts = get_union_territories()
    if state_name in uts:
        return uts[state_name]
    
    return []

def get_all_locations() -> dict:
    """Get complete states and districts mapping"""
    result = {}
    
    # Add states
    for state, districts in STATES_AND_DISTRICTS.items():
        if state != "Union Territories":
            result[state] = districts
    
    # Add Union Territories
    uts = get_union_territories()
    for ut, districts in uts.items():
        result[ut] = districts
    
    return result