import { useState, useRef } from "react";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";

function DiseaseDetector({ language }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedImage(file);
        setError("");

        // Create image preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setError(
          language === "ml"
            ? "ദയവായി ഒരു ചിത്രം ഫയൽ തിരഞ്ഞെടുക്കുക"
            : language === "hi"
            ? "कृपया एक छवि फाइल चुनें"
            : "Please select an image file"
        );
      }
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError(
        language === "ml"
          ? "ദയവായി ഒരു ചിത്രം അപ്ലോഡ് ചെയ്യുക"
          : language === "hi"
          ? "कृपया एक छवि अपलोड करें"
          : "Please upload an image"
      );
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", selectedImage);
      // Optional: Add crop type if we have it (could add a dropdown for this)
      // formData.append("crop_type", "tomato");
      // Optional: Add symptoms if we have them
      // formData.append("symptoms", "brown spots");

      // Call the disease detection API
      const response = await fetch(
        "http://localhost:8000/api/disease-detection/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to analyze image");
      }

      const data = await response.json();

      if (data.success) {
        setResult(data.analysis);
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Disease detection error:", error);
      setError(
        language === "ml"
          ? "ചിത്രം വിശകലനം ചെയ്യുന്നതിൽ പിശക്: " + error.message
          : language === "hi"
          ? "छवि विश्लेषण में त्रुटि: " + error.message
          : "Error analyzing image: " + error.message
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const resetDetector = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "severe":
        return "text-red-600 bg-red-50 border-red-200";
      case "moderate":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "mild":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "none":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case "severe":
        return language === "ml"
          ? "ഗുരുതരം"
          : language === "hi"
          ? "गंभीर"
          : "Severe";
      case "moderate":
        return language === "ml"
          ? "മാധ്യമിക"
          : language === "hi"
          ? "मध्यम"
          : "Moderate";
      case "mild":
        return language === "ml"
          ? "നേരിയ"
          : language === "hi"
          ? "हल्का"
          : "Mild";
      case "none":
        return language === "ml"
          ? "ഇല്ല"
          : language === "hi"
          ? "कोई नहीं"
          : "None";
      default:
        return severity;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === "ml"
            ? "വിള രോഗ നിർണയം 🔬"
            : language === "hi"
            ? "फसल रोग डिटेक्टर 🔬"
            : "Crop Disease Detector 🔬"}
        </h1>
        <p className="text-gray-600">
          {language === "ml"
            ? "വിള രോഗങ്ങൾ തിരിച്ചറിയാനും ചികിത്സാ നിർദ്ദേശങ്ങൾ നേടാനും AI ഉപയോഗിക്കുക"
            : language === "hi"
            ? "फसल रोगों की पहचान और उपचार सुझाव पाने के लिए AI का उपयोग करें"
            : "Use AI to identify crop diseases and get treatment recommendations"}
        </p>
      </div>

      {/* Image Upload Section */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === "ml"
              ? "ചിത्र अपलोड करें"
              : language === "hi"
              ? "छवि अपलोड करें"
              : "Upload Image"}
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="image-upload">
                {language === "ml"
                  ? "വിള/ഇലയുടെ ഫോട്ടോ തിരഞ്ഞെടുക്കുക"
                  : language === "hi"
                  ? "फसल/पत्ती की फोटो चुनें"
                  : "Select Crop/Leaf Photo"}
              </Label>
              <Input
                ref={fileInputRef}
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                {language === "ml"
                  ? "JPG, PNG, या WEBP (പരമാവധി 10MB)"
                  : language === "hi"
                  ? "JPG, PNG, या WEBP (अधिकतम 10MB)"
                  : "JPG, PNG, or WEBP (Max 10MB)"}
              </p>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {language === "ml"
                    ? "പ്രിവ്യൂ:"
                    : language === "hi"
                    ? "पूर्वावलोकन:"
                    : "Preview:"}
                </p>
                <div className="relative w-full max-w-md">
                  <img
                    src={imagePreview}
                    alt="Uploaded crop"
                    className="w-full h-64 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={analyzeImage}
                disabled={!selectedImage || analyzing}
                className="flex-1"
              >
                {analyzing ? (
                  <>
                    <span className="animate-spin mr-2">🔄</span>
                    {language === "ml"
                      ? "വിശകലനം ചെയ്യുന്നു..."
                      : language === "hi"
                      ? "विश्लेषण कर रहे हैं..."
                      : "Analyzing..."}
                  </>
                ) : language === "ml" ? (
                  "രോഗം കണ്ടെത്തുക"
                ) : language === "hi" ? (
                  "रोग का पता लगाएं"
                ) : (
                  "Detect Disease"
                )}
              </Button>

              <Button onClick={resetDetector} variant="outline">
                {language === "ml"
                  ? "പുനഃസജ്ജീകരിക്കുക"
                  : language === "hi"
                  ? "रीसेट"
                  : "Reset"}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Results Section */}
      {result && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === "ml"
                ? "നിർണയ ഫലം"
                : language === "hi"
                ? "निदान परिणाम"
                : "Detection Results"}
            </h2>

            <div className="space-y-4">
              {/* Disease Name & Confidence */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {result.disease}
                  </h3>
                  {result.crop && (
                    <p className="text-sm text-gray-500">
                      {language === "ml"
                        ? "വിള: "
                        : language === "hi"
                        ? "फसल: "
                        : "Crop: "}
                      {result.crop}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    {language === "ml"
                      ? "വിശ്വാസ്യത: "
                      : language === "hi"
                      ? "विश्वसनीयता: "
                      : "Confidence: "}
                    {result.confidence}%
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(
                    result.severity
                  )}`}
                >
                  {getSeverityText(result.severity)}
                </div>
              </div>

              {/* Treatment Recommendations */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {language === "ml"
                    ? "ചികിത്സാ നിർദ്ദേശങ്ങൾ:"
                    : language === "hi"
                    ? "उपचार सुझाव:"
                    : "Treatment Recommendations:"}
                </h4>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-gray-700">{result.treatment}</p>
                </div>
              </div>

              {/* Prevention Tips */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {language === "ml"
                    ? "പ্রতিরোধ നুറুങ্ങുকൾ:"
                    : language === "hi"
                    ? "रोकथाम के सुझाव:"
                    : "Prevention Tips:"}
                </h4>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-gray-700">{result.prevention}</p>
                </div>
              </div>

              {/* Model Status */}
              {result.model_available === false && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>
                      {language === "ml"
                        ? "ശ്രദ്ധിക്കുക: "
                        : language === "hi"
                        ? "ध्यान दें: "
                        : "Note: "}
                    </strong>
                    {language === "ml"
                      ? "AI മോഡൽ ലോഡ് ചെയ്തിട്ടില്ല, ഡെമോ ഫലം കാണിക്കുന്നു."
                      : language === "hi"
                      ? "AI मॉडल लोड नहीं है, डेमो परिणाम दिख रहा है।"
                      : "AI model not loaded, showing demo result."}
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>
                    {language === "ml"
                      ? "അറിയിപ്പ്: "
                      : language === "hi"
                      ? "अस्वीकरण: "
                      : "Disclaimer: "}
                  </strong>
                  {language === "ml"
                    ? "ഈ AI നിർണയം ഒരു പ്രാഥമിക വിലയിരുത്തൽ മാത്രമാണ്. ഗുരുതരമായ പ്രശ്നങ്ങൾക്ക് കാർഷിക വിദഗ്ധനെ സമീപിക്കുക."
                    : language === "hi"
                    ? "यह AI निदान केवल एक प्रारंभिक मूल्यांकन है। गंभीर समस्याओं के लिए कृषि विशेषज्ञ से संपर्क करें।"
                    : "This AI diagnosis is only a preliminary assessment. For serious issues, consult with agricultural experts."}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* How it Works */}
      <Card className="mt-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === "ml"
              ? "എങ്ങനെ ഉപയോഗിക്കാം"
              : language === "hi"
              ? "इसका उपयोग कैसे करें"
              : "How to Use"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-4xl mb-2">📸</div>
              <h3 className="font-semibold mb-2">
                {language === "ml"
                  ? "1. ഫോട്ടോ എടുക്കുക"
                  : language === "hi"
                  ? "1. फोटो लें"
                  : "1. Take Photo"}
              </h3>
              <p className="text-sm text-gray-600">
                {language === "ml"
                  ? "രോഗബാധിതമായ ഇലയുടെയോ ചെടിയുടെയോ വ്യക്തമായ ഫോട്ടോ എടുക്കുക"
                  : language === "hi"
                  ? "संक्रमित पत्ती या पौधे की स्पष्ट तस्वीर लें"
                  : "Take clear photo of affected leaf or plant"}
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-2">🤖</div>
              <h3 className="font-semibold mb-2">
                {language === "ml"
                  ? "2. AI വിശകലനം"
                  : language === "hi"
                  ? "2. AI विश्लेषण"
                  : "2. AI Analysis"}
              </h3>
              <p className="text-sm text-gray-600">
                {language === "ml"
                  ? "നമ്മുടെ AI സിസ്റ്റം ചിത്രം വിശകലനം ചെയ്ത് രോഗം തിരിച്ചറിയുന്നു"
                  : language === "hi"
                  ? "हमारा AI सिस्टम छवि का विश्लेषण करके रोग की पहचान करता है"
                  : "Our AI system analyzes the image and identifies diseases"}
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-2">💊</div>
              <h3 className="font-semibold mb-2">
                {language === "ml"
                  ? "3. ചികിത്സ നേടുക"
                  : language === "hi"
                  ? "3. उपचार प्राप्त करें"
                  : "3. Get Treatment"}
              </h3>
              <p className="text-sm text-gray-600">
                {language === "ml"
                  ? "വിശദമായ ചികിത്സാ നിർദ്ദേശങ്ങളും പ്രതിരോധ നുറുങ്ങുകളും നേടുക"
                  : language === "hi"
                  ? "विस्तृत उपचार सुझाव और रोकथाम युक्तियां प्राप्त करें"
                  : "Get detailed treatment recommendations and prevention tips"}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DiseaseDetector;
