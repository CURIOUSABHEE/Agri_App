import { useState, useRef, useEffect } from "react";

function DiseaseDetector({ language }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const handleImageUpload = (file) => {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      setSelectedImage(file);
      setError("");
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setError(language === "ml" ? "ദയവായി ഒരു ചിത്രം ഫയൽ" : language === "hi" ? "कृपया एक छवि फाइल चुनें" : "Please select an image file");
    }
  };

  const handleFileChange = (event) => handleImageUpload(event.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files[0]);
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError(language === "ml" ? "ദയവായി ഒരു ചിത്രം അപ്ലോഡ് ചെയ്യുക" : language === "hi" ? "कृपया एक छवि अपलोड करें" : "Please upload an image");
      return;
    }
    setAnalyzing(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      const response = await fetch("http://localhost:8000/api/disease-detection/analyze", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to analyze image");
      }
      const data = await response.json();
      if (data.success) setResult(data.analysis);
      else throw new Error(data.error || "Analysis failed");
    } catch (error) {
      setError((language === "ml" ? "ചിത്രം വിശകലനം ചെയ്യുന്നതിൽ പിശക്: " : language === "hi" ? "छवि विश्लेषण में त्रुटि: " : "Error analyzing image: ") + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetDetector = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case "severe": return { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", badge: "bg-red-100 text-red-700 border-red-200", icon: "🔴", barColor: "bg-red-500" };
      case "moderate": return { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "🟡", barColor: "bg-yellow-500" };
      case "mild": return { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", badge: "bg-orange-100 text-orange-700 border-orange-200", icon: "🟠", barColor: "bg-orange-500" };
      case "none": return { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", badge: "bg-green-100 text-green-700 border-green-200", icon: "🟢", barColor: "bg-green-500" };
      default: return { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-700", badge: "bg-gray-100 text-gray-700 border-gray-200", icon: "⚪", barColor: "bg-gray-400" };
    }
  };

  const getSeverityText = (severity) => {
    const map = { severe: ["Severe", "गंभीर", "ഗുരുതരം"], moderate: ["Moderate", "मध्यम", "മাധ്യമിക"], mild: ["Mild", "हल्का", "നേരിയ"], none: ["None", "कोई नहीं", "ഇല്ല"] };
    const idx = language === "hi" ? 1 : language === "ml" ? 2 : 0;
    return (map[severity] || [severity])[idx] || severity;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 md:p-6">

      {/* Hero Header */}
      <div className={`relative overflow-hidden bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 rounded-3xl p-6 mb-8 shadow-xl shadow-emerald-200 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-12 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl border border-white/20 shadow-lg">🔬</div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {language === "ml" ? "വിള രോഗ നിർണയം" : language === "hi" ? "फसल रोग डिटेक्टर" : "Crop Disease Detector"}
            </h1>
            <p className="text-emerald-200 text-sm mt-1">
              {language === "ml" ? "AI ഉപയോഗിച്ച് രോഗം തിരിച്ചറിയുക" : language === "hi" ? "AI से रोग पहचानें और उपचार पाएं" : "AI-powered crop disease detection & treatment guidance"}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2 mt-4">
          {["🤖 AI-Powered", "⚡ Instant Results", "💊 Treatment Tips"].map((p) => (
            <span key={p} className="bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">{p}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upload Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">📸</span>
              {language === "ml" ? "ചിത്രം അപ്ലോഡ്" : language === "hi" ? "छवि अपलोड" : "Upload Image"}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragging ? "border-emerald-400 bg-emerald-50 scale-[1.02]" : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"}`}
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className="flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all ${isDragging ? "bg-emerald-100 scale-110" : "bg-gray-100"}`}>
                  {isDragging ? "📂" : "📁"}
                </div>
                <div>
                  <p className="font-semibold text-gray-700">
                    {language === "ml" ? "ചിത്രം ഇവിടെ ഇടുക" : language === "hi" ? "फोटो यहाँ खींचें" : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {language === "ml" ? "JPG, PNG, WEBP (10MB)" : language === "hi" ? "JPG, PNG, WEBP (10MB)" : "JPG, PNG, or WEBP (max 10MB)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                <img src={imagePreview} alt="Uploaded crop" className="w-full h-56 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg">{selectedImage?.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); resetDetector(); }} className="bg-red-500/80 text-white text-xs px-2 py-1 rounded-lg hover:bg-red-600/80 transition-colors">✕ Remove</button>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button onClick={analyzeImage} disabled={!selectedImage || analyzing}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                {analyzing ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{language === "hi" ? "विश्लेषण..." : "Analyzing..."}</>
                ) : (
                  <><span>🔬</span>{language === "ml" ? "രോഗം കണ്ടെത്തുക" : language === "hi" ? "रोग का पता लगाएं" : "Detect Disease"}</>
                )}
              </button>
              <button onClick={resetDetector} className="px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all">
                {language === "ml" ? "Reset" : language === "hi" ? "रीसेट" : "Reset"}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <span>⚠️</span><p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* How to Use */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-teal-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center">📋</span>
              {language === "ml" ? "എങ്ങനെ ഉപയോഗിക്കാം" : language === "hi" ? "इसका उपयोग कैसे करें" : "How to Use"}
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-5">
              {[
                { step: "1", icon: "📸", title: language === "hi" ? "फोटो लें" : language === "ml" ? "ഫോട്ടോ എടുക്കുക" : "Take a Clear Photo", desc: language === "hi" ? "संक्रमित पत्ती की स्पष्ट तस्वीर लें" : language === "ml" ? "രോഗബാധിതമായ ഇലയുടെ ഫോട്ടോ" : "Take a clear photo of the affected leaf or plant part", color: "from-blue-500 to-cyan-500" },
                { step: "2", icon: "⬆️", title: language === "hi" ? "अपलोड करें" : language === "ml" ? "അപ്ലോഡ് ചെയ്യുക" : "Upload the Image", desc: language === "hi" ? "यहाँ खींचें या अपलोड करें" : language === "ml" ? "ഇവിടെ ഇടുക അല്ലെങ്കിൽ ക്ലിക്ക് ചെയ്യുക" : "Drag & drop or click to select your image file", color: "from-emerald-500 to-teal-500" },
                { step: "3", icon: "🤖", title: language === "hi" ? "AI विश्लेषण" : language === "ml" ? "AI വിശകലനം" : "AI Analysis", desc: language === "hi" ? "हमारा AI रोग की पहचान करता है" : language === "ml" ? "AI സിസ്റ്റം ചിത്രം വിശകലനം ചെയ്യുന്നു" : "Our AI analyzes the image and identifies diseases with confidence scores", color: "from-purple-500 to-violet-500" },
                { step: "4", icon: "💊", title: language === "hi" ? "उपचार पाएं" : language === "ml" ? "ചികിത്സ നേടുക" : "Get Treatment", desc: language === "hi" ? "विस्तृत उपचार और रोकथाम सुझाव" : language === "ml" ? "ചികിത്സാ നിർദ്ദേശങ്ങൾ" : "Receive detailed treatment recommendations and prevention tips", color: "from-amber-500 to-orange-500" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 group">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex flex-col items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (() => {
        const sev = getSeverityConfig(result.severity);
        return (
          <div className={`bg-white rounded-3xl shadow-lg border-2 ${sev.border} overflow-hidden mb-6`}>
            {/* Severity bar */}
            <div className={`h-2 w-full ${sev.barColor}`} />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">✅</span>
                <h2 className="text-lg font-bold text-gray-800">
                  {language === "ml" ? "നിർണയ ഫലം" : language === "hi" ? "निदान परिणाम" : "Detection Results"}
                </h2>
              </div>

              {/* Disease headline */}
              <div className={`flex items-center justify-between p-4 ${sev.bg} rounded-2xl border ${sev.border} mb-5`}>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{result.disease}</h3>
                  {result.crop && <p className="text-sm text-gray-500 mt-0.5">{language === "hi" ? "फसल:" : "Crop:"} {result.crop}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
                      <div className={`h-2 rounded-full ${sev.barColor} transition-all duration-1000`} style={{ width: `${result.confidence}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{result.confidence}% confidence</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${sev.badge} flex items-center gap-1.5`}>
                  <span>{sev.icon}</span>{getSeverityText(result.severity)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Treatment */}
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <span>💊</span>{language === "ml" ? "ചികിത്സ" : language === "hi" ? "उपचार" : "Treatment"}
                  </h4>
                  <p className="text-sm text-blue-900 leading-relaxed">{result.treatment}</p>
                </div>
                {/* Prevention */}
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                    <span>🛡️</span>{language === "ml" ? "പ്രതിരോധം" : language === "hi" ? "रोकथाम" : "Prevention"}
                  </h4>
                  <p className="text-sm text-green-900 leading-relaxed">{result.prevention}</p>
                </div>
              </div>

              {result.model_available === false && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                  <span>ℹ️</span>
                  <p className="text-sm text-yellow-800">
                    <strong>{language === "hi" ? "ध्यान दें: " : "Note: "}</strong>
                    {language === "hi" ? "AI मॉडल लोड नहीं है, डेमो परिणाम दिख रहा है।" : "AI model not loaded, showing demo result."}
                  </p>
                </div>
              )}
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <span>⚠️</span>
                <p className="text-xs text-amber-800">
                  <strong>{language === "hi" ? "अस्वीकरण: " : "Disclaimer: "}</strong>
                  {language === "hi" ? "यह AI निदान केवल प्रारंभिक मूल्यांकन है। गंभीर समस्याओं के लिए कृषि विशेषज्ञ से संपर्क करें।" : "This AI diagnosis is a preliminary assessment only. For serious issues, consult agricultural experts."}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default DiseaseDetector;
