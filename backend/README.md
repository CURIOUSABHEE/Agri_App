# 🌾 Agricultural Platform

A comprehensive digital platform for farmers with AI-powered crop analysis, market integration, and multilingual support.

## 🚀 Features

### 🔐 Authentication System
- **Farmer Registration & Login** with phone number
- **JWT-based authentication** for secure API access
- **Profile management** with multilingual support

### 🚜 Farm Management
- **Multiple farm support** per farmer
- **Farm details tracking** (location, area, soil type, crops)
- **Activity logging** for farming operations
- **Comprehensive dashboard** with analytics

### 📸 AI-Powered Image Analysis
- **Crop disease detection** using Google AI
- **Soil health analysis** from images
- **Confidence scoring** and treatment recommendations
- **Analysis history** tracking

### 💬 Intelligent Chat Assistant
- **Multilingual support** (English, Hindi, Marathi, Malayalam, Tamil, etc.)
- **Agricultural knowledge base** with crop-specific advice
- **Voice-to-text** conversion for hands-free interaction
- **Context-aware responses** based on farmer's farm data
- **Chat history** preservation

### 🏪 Market Integration
- **Crop listings** for farmers to sell produce
- **Market price information** 
- **Location-based filtering**
- **Quality grading system**

### 📊 Analytics & Dashboard
- **Weather integration** for farming decisions
- **Activity tracking** and farm analytics
- **Market price trends**
- **Personalized recommendations**

## 🛠️ Technology Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **MongoDB** - Document database for flexible data storage
- **Motor** - Async MongoDB driver
- **JWT Authentication** - Secure token-based auth
- **Google AI (Gemini)** - Advanced image analysis and chat
- **Speech Recognition** - Voice-to-text conversion
- **Multi-language Translation** - Deep Translator integration

### Frontend (React - separate implementation)
- **React 18** with modern hooks
- **Tailwind CSS** for responsive design
- **Axios** for API communication
- **Progressive Web App** capabilities

## 📋 Prerequisites

- Python 3.8 or higher
- MongoDB (local or Atlas)
- Google AI API key (optional, for enhanced features)

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Agri_App/backend
```

### 2. Run the setup script
```bash
./setup.sh
```

### 3. Configure environment variables
Edit the `.env` file with your configuration:

```env
# Database
MONGO_URI=mongodb://localhost:27017
# or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# AI Services (optional)
GOOGLE_API_KEY=your-google-ai-api-key-here
```

### 4. Start the server
```bash
source venv/bin/activate
python main.py
```

## 📚 API Documentation

Once the server is running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new farmer
- `POST /api/auth/login` - Login farmer
- `GET /api/auth/me` - Get current farmer info
- `PUT /api/auth/me` - Update farmer profile

### Farm Management
- `POST /api/farm/create` - Create new farm
- `GET /api/farm/my-farms` - Get all farms
- `GET /api/farm/{farm_id}` - Get farm details
- `PUT /api/farm/{farm_id}` - Update farm
- `DELETE /api/farm/{farm_id}` - Delete farm
- `GET /api/farm/dashboard/data` - Get dashboard data

### Image Analysis
- `POST /api/image/analyze-crop` - Analyze crop disease
- `POST /api/image/analyze-soil` - Analyze soil health
- `GET /api/image/farm/{farm_id}/analyses` - Get analysis history

### Chat Assistant
- `POST /api/chat/message` - Chat with AI assistant
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/voice-to-text` - Convert voice to text
- `GET /api/chat/agricultural-tips` - Get daily tips

### Market
- `GET /api/market/prices` - Get crop prices
- `POST /api/market/listings` - Create listing
- `GET /api/market/listings` - Get listings

## 📱 Usage Examples

### 1. Register a Farmer
```python
import requests

response = requests.post("http://localhost:8000/api/auth/signup", json={
    "name": "राम शर्मा",
    "phone": "9876543210",
    "village": "रामपुर",
    "state": "महाराष्ट्र",
    "language": "hi",
    "password": "secure123"
})

print(response.json())
```

### 2. Create a Farm
```python
# First login to get token
login_response = requests.post("http://localhost:8000/api/auth/login", json={
    "phone": "9876543210",
    "password": "secure123"
})

token = login_response.json()["access_token"]

# Create farm with authorization
farm_response = requests.post(
    "http://localhost:8000/api/farm/create",
    json={
        "name": "मेरा खेत",
        "location": {"lat": 19.0760, "lng": 72.8777},
        "area_acres": 2.5,
        "soil_type": "Loamy",
        "crops": ["Rice", "Wheat"],
        "irrigation_type": "Drip"
    },
    headers={"Authorization": f"Bearer {token}"}
)
```

### 3. Chat with AI Assistant
```python
chat_response = requests.post(
    "http://localhost:8000/api/chat/message",
    json={
        "message": "मेरे धान की फसल में पीले धब्बे दिख रहे हैं",
        "language": "hi"
    },
    headers={"Authorization": f"Bearer {token}"}
)

print(chat_response.json()["response"])
```

## 🔒 Security Features

- **JWT Token Authentication** with expiration
- **Password hashing** using bcrypt
- **Input validation** with Pydantic
- **CORS protection** for web security
- **File upload validation** and size limits

## 🌍 Multilingual Support

Supported languages:
- **English** (en)
- **Hindi** (hi) - हिन्दी
- **Marathi** (mr) - मराठी  
- **Malayalam** (ml) - മലയാളം
- **Tamil** (ta) - தமிழ்
- **Telugu** (te) - తెలుగు
- **Kannada** (kn) - ಕನ್ನಡ
- **Gujarati** (gu) - ગુજરાતી
- **Punjabi** (pa) - ਪੰਜਾਬੀ
- **Bengali** (bn) - বাংলা

## 📊 Database Schema

### Collections

1. **farmers** - Farmer profiles and authentication
2. **farms** - Farm details and management
3. **image_analyses** - AI analysis results
4. **activity_logs** - Farming activity tracking
5. **chat_history** - Conversation history
6. **market_listings** - Crop selling listings

## 🧪 Testing

Run the test suite:
```bash
pytest tests/ -v
```

## 🚀 Deployment

### Production Deployment
1. Set up MongoDB Atlas or production MongoDB
2. Configure environment variables for production
3. Use a production ASGI server like Gunicorn with Uvicorn workers
4. Set up reverse proxy (Nginx) for static files and SSL

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@agriplatform.com
- Documentation: `/docs` endpoint when server is running

## 🙏 Acknowledgments

- Google AI for advanced image analysis capabilities
- MongoDB for flexible document storage
- FastAPI community for excellent documentation and support
- Indian agricultural research community for domain knowledge

---

**Built with ❤️ for farmers across India**