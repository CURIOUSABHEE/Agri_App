/**
 * Centralized Agricultural Options for Consistency Across the Application
 * This file standardizes all farming-related dropdown options to ensure consistency
 */

// Farming Experience Options - Standardized across all components
export const FARMING_EXPERIENCE_OPTIONS = {
  beginner: {
    value: "beginner",
    label: "Beginner (0-2 years)",
    hiLabel: "नौसिखिया (0-2 साल)",
    mlLabel: "തുടക്കക്കാരൻ (0-2 വർഷം)",
  },
  intermediate: {
    value: "intermediate",
    label: "Intermediate (2-10 years)",
    hiLabel: "मध्यम (2-10 साल)",
    mlLabel: "ഇടത്തരം (2-10 വർഷം)",
  },
  expert: {
    value: "expert",
    label: "Expert (10+ years)",
    hiLabel: "विशेषज्ञ (10+ साल)",
    mlLabel: "വിദഗ്ധൻ (10+ വർഷം)",
  },
};

// Season Options - Standardized agricultural seasons
export const SEASON_OPTIONS = {
  kharif: {
    value: "kharif",
    label: "Kharif (June-October)",
    hiLabel: "खरीफ (जून-अक्टूबर)",
    mlLabel: "ഖരീഫ് (ജൂൺ-ഒക്ടോബർ)",
  },
  rabi: {
    value: "rabi",
    label: "Rabi (November-April)",
    hiLabel: "रबी (नवंबर-अप्रैल)",
    mlLabel: "റബി (നവംബർ-ഏപ്രിൽ)",
  },
  summer: {
    value: "summer",
    label: "Summer (March-June)",
    hiLabel: "गर्मी (मार्च-जून)",
    mlLabel: "വേനൽ (മാർച്ച്-ജൂൺ)",
  },
  winter: {
    value: "winter",
    label: "Winter (November-February)",
    hiLabel: "सर्दी (नवंबर-फरवरी)",
    mlLabel: "ശീതകാലം (നവംബർ-ഫെബ്രുവരി)",
  },
  monsoon: {
    value: "monsoon",
    label: "Monsoon (June-September)",
    hiLabel: "मानसून (जून-सितंबर)",
    mlLabel: "മൺസൂൺ (ജൂൺ-സെപ്റ്റംബർ)",
  },
  year_round: {
    value: "year_round",
    label: "Year Round",
    hiLabel: "साल भर",
    mlLabel: "വർഷം മുഴുവൻ",
  },
};

// Soil Type Options - Standardized soil classifications
export const SOIL_TYPE_OPTIONS = {
  clay: {
    value: "clay",
    label: "Clay",
    hiLabel: "चिकनी मिट्टी",
    mlLabel: "കളിമണ്ണ്",
  },
  loamy: {
    value: "loamy",
    label: "Loamy",
    hiLabel: "दोमट मिट्टी",
    mlLabel: "കളിമണ്ണ് മിശ്രിതം",
  },
  sandy: {
    value: "sandy",
    label: "Sandy",
    hiLabel: "रेतीली मिट्टी",
    mlLabel: "മണൽമണ്ണ്",
  },
  black: {
    value: "black",
    label: "Black Cotton",
    hiLabel: "काली मिट्टी",
    mlLabel: "കറുത്ത മണ്ണ്",
  },
  red: {
    value: "red",
    label: "Red Soil",
    hiLabel: "लाल मिट्टी",
    mlLabel: "ചുവന്ന മണ്ണ്",
  },
  alluvial: {
    value: "alluvial",
    label: "Alluvial",
    hiLabel: "जलोढ़ मिट्टी",
    mlLabel: "പുഴമുഖ മണ്ണ്",
  },
  laterite: {
    value: "laterite",
    label: "Laterite",
    hiLabel: "लेटराइट मिट्टी",
    mlLabel: "ലാറ്ററൈറ്റ് മണ്ണ്",
  },
};

// Farm Size Options - Standardized farm classifications
export const FARM_SIZE_OPTIONS = {
  small: {
    value: "small",
    label: "Small (< 2 acres)",
    hiLabel: "छोटा (< 2 एकड़)",
    mlLabel: "ചെറുതു് (< 2 ഏക്കർ)",
  },
  medium: {
    value: "medium",
    label: "Medium (2-10 acres)",
    hiLabel: "मध्यम (2-10 एकड़)",
    mlLabel: "ഇടത്തരം (2-10 ഏക്കർ)",
  },
  large: {
    value: "large",
    label: "Large (> 10 acres)",
    hiLabel: "बड़ा (> 10 एकड़)",
    mlLabel: "വലിയതു് (> 10 ഏക്കർ)",
  },
};

// Water Availability Options - Standardized water access levels
export const WATER_AVAILABILITY_OPTIONS = {
  low: {
    value: "low",
    label: "Low (Rain-fed only)",
    hiLabel: "कम (केवल बारिश पर निर्भर)",
    mlLabel: "കുറവ് (മഴയെ ആശ്രയിച്ച് മാത്രം)",
  },
  medium: {
    value: "medium",
    label: "Medium (Limited irrigation)",
    hiLabel: "मध्यम (सीमित सिंचाई)",
    mlLabel: "ഇടത്തരം (പരിമിത ജലസേചനം)",
  },
  high: {
    value: "high",
    label: "High (Good irrigation)",
    hiLabel: "अच्छी (अच्छी सिंचाई)",
    mlLabel: "ഉയർന്നത് (നല്ല ജലസേചനം)",
  },
  very_high: {
    value: "very_high",
    label: "Very High (Abundant water)",
    hiLabel: "बहुत अच्छी (भरपूर पानी)",
    mlLabel: "വളരെ ഉയർന്നത് (സമൃദ്ധമായ വെള്ളം)",
  },
};

// Irrigation Type Options - Specific irrigation methods
export const IRRIGATION_TYPE_OPTIONS = {
  rainfed: {
    value: "rainfed",
    label: "Rain-fed",
    hiLabel: "बारिश पर निर्भर",
    mlLabel: "മഴയെ ആശ്രയിക്കുന്ന",
    waterLevel: "low",
  },
  borewell: {
    value: "borewell",
    label: "Bore well",
    hiLabel: "बोरवेल",
    mlLabel: "ബോർവെൽ",
    waterLevel: "medium",
  },
  canal: {
    value: "canal",
    label: "Canal",
    hiLabel: "नहर",
    mlLabel: "കനാൽ",
    waterLevel: "high",
  },
  drip: {
    value: "drip",
    label: "Drip irrigation",
    hiLabel: "ड्रिप सिंचाई",
    mlLabel: "തുള്ളി ജലസേചനം",
    waterLevel: "medium",
  },
  sprinkler: {
    value: "sprinkler",
    label: "Sprinkler",
    hiLabel: "स्प्रिंकलर",
    mlLabel: "സ്പ്രിങ്ക്ലർ",
    waterLevel: "medium",
  },
  tank: {
    value: "tank",
    label: "Tank irrigation",
    hiLabel: "तालाब सिंचाई",
    mlLabel: "ടാങ്ക് ജലസേചനം",
    waterLevel: "medium",
  },
  river: {
    value: "river",
    label: "River water",
    hiLabel: "नदी का पानी",
    mlLabel: "നദീജലം",
    waterLevel: "high",
  },
};

// Farm Size Unit Options
export const FARM_SIZE_UNITS = {
  acres: {
    value: "acres",
    label: "Acres",
    hiLabel: "एकड़",
    mlLabel: "ഏക്കർ",
  },
  hectares: {
    value: "hectares",
    label: "Hectares",
    hiLabel: "हेक्टेयर",
    mlLabel: "ഹെക്ടർ",
  },
};

// Helper functions to get options in different formats
export const getOptionsArray = (optionsObject, language = "en") => {
  return Object.values(optionsObject).map((option) => ({
    value: option.value,
    label:
      language === "hi"
        ? option.hiLabel
        : language === "ml"
        ? option.mlLabel
        : option.label,
  }));
};

export const getOptionLabel = (optionsObject, value, language = "en") => {
  const option = optionsObject[value];
  if (!option) return value;

  return language === "hi"
    ? option.hiLabel
    : language === "ml"
    ? option.mlLabel
    : option.label;
};

// Map irrigation type to water availability level
export const getWaterLevelFromIrrigation = (irrigationType) => {
  const irrigation = Object.values(IRRIGATION_TYPE_OPTIONS).find(
    (option) => option.value === irrigationType
  );
  return irrigation?.waterLevel || "medium";
};

// Convert farming experience years to level
export const getExperienceLevelFromYears = (yearsString) => {
  if (!yearsString) return "intermediate";

  if (yearsString.includes("1-2") || yearsString.includes("0-2")) {
    return "beginner";
  } else if (
    yearsString.includes("10+") ||
    yearsString.includes("21-30") ||
    yearsString.includes("30+")
  ) {
    return "expert";
  } else {
    return "intermediate";
  }
};

// Convert experience level to years format
export const getYearsFromExperienceLevel = (level) => {
  const mapping = {
    beginner: "1-2 years",
    intermediate: "3-10 years",
    expert: "10+ years",
  };
  return mapping[level] || "3-10 years";
};
