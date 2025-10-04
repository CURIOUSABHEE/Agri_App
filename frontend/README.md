# Agricultural Platform Frontend

A modern React-based agricultural platform with multilingual support and multiple authentication methods.

## Features

- 📱 Phone-based OTP Authentication
- 🔐 Google Sign-In Integration
- 🌍 Multilingual Support (English, Hindi, Malayalam)
- 📊 Real-time Market Prices
- 🌤️ Weather Forecasting
- 🌾 Crop Prediction
- 📦 Inventory Management
- 🦠 Disease Detection
- 💬 AI-powered Chatbot

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Google Sign-In

#### Step-by-Step Google Cloud Console Setup:

1. **Create/Select Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Note your project ID

2. **Enable APIs**
   - Go to **APIs & Services** → **Library**
   - Search for "Google Identity" 
   - Enable **Google Identity Services API**

3. **Configure OAuth Consent Screen**
   - Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** user type
   - Fill in required fields:
     - App name: "Agricultural Platform" 
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue

4. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Choose **Web application**
   - Name: "Agri App Local Dev"

5. **Configure Authorized Origins** (IMPORTANT!)
   ```
   Authorized JavaScript origins:
   • http://localhost:5173
   • http://127.0.0.1:5173
   • http://localhost:3000
   • https://yourdomain.com (for production)
   
   Authorized redirect URIs:
   • http://localhost:5173/
   • http://127.0.0.1:5173/
   • http://localhost:3000/
   • https://yourdomain.com/ (for production)
   ```

6. **Copy Client ID**
   - After creating, copy the **Client ID** (not Client Secret)
   - It looks like: `123456789-abcdefg.apps.googleusercontent.com`

### 3. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Google Client ID
VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

### 4. Start Development Server
```bash
npm run dev
```

## Authentication Methods

### Phone + OTP Authentication
- Enter 10-digit Indian mobile number
- Receive OTP via SMS (development mode shows OTP in console)
- Verify OTP to login/register

### Google Sign-In
- Click "Sign in with Google" button
- Authenticate with your Google account
- Automatic user creation/login

## Tech Stack

- **React 18** with Vite
- **Tailwind CSS** for styling
- **Google Identity Services** for OAuth
- **Multilingual Support** with translation system
- **Mobile-responsive** design

## Development Notes

- The app uses Vite for fast development and hot module replacement
- Google Sign-In requires HTTPS in production (use ngrok for local HTTPS testing)
- Phone authentication is designed for Indian numbers (+91)
- All components support English, Hindi, and Malayalam languages
