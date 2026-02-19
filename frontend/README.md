# 🌾 AgriDash — Smart Farming Portal

A modern, full-featured agricultural platform built with **React + Vite** and **Tailwind CSS**. AgriDash empowers farmers with AI-driven insights, real-time data, and peer-to-peer tools — all in one responsive, multilingual dashboard.

---

## 🚀 Project Overview

AgriDash brings together precision agriculture tools under a single portal, supporting three languages (**English, Hindi, Malayalam**) and two authentication methods. It connects farmers to crop intelligence, live market data, equipment rental networks, government schemes, and an AI chatbot — removing barriers between smallholder farmers and modern technology.

---

## 🗺️ Application Routes

The app uses a **single-page sidebar-navigation** architecture (no URL-based routing). Each "route" is a named view activated by the sidebar:

---

### 🏠 `dashboard` — Dashboard
The landing view after login. Provides a personalized overview of the farm's status at a glance.

**Features:**
- Welcome card with the logged-in farmer's name and profile summary
- Quick-access tiles linking to all major sections
- Recent activity feed and key stats (weather snapshot, market highlights)
- Fully multilingual header and metric labels

---

### 📅 `smart-cultivation` — Smart Cultivation
An interactive crop planning calendar + guided cultivation advisor that helps farmers plan their season end-to-end.

**Features:**
- **CultivationStepper** — A multi-step wizard collecting soil type, crop name, location, season, and water availability to generate a full cultivation plan
- **CalendarView** — A farm calendar showing planting dates, irrigation schedules, fertilisation events, and harvest windows with color-coded task categories
- AI-generated step-by-step cultivation guidance returned from the backend
- Supports collapsible task detail panels per calendar event

---

### 🌱 `crops` — Crop Prediction
Recommends the best crops to grow based on soil and environmental inputs using a machine-learning model on the backend.

**Features:**
- Input form for NPK values (Nitrogen, Phosphorus, Potassium), pH, rainfall, temperature, and humidity
- Calls the `/api/predict-crop` backend endpoint and displays the top recommended crop(s)
- Visual probability/confidence display per recommendation
- Multilingual field labels and result cards

---

### 🌤️ `weather` — Weather Forecast
Displays hyperlocal weather information for the farmer's location to support irrigation and field-work planning.

**Features:**
- Current-day weather card (temperature, humidity, wind speed, UV index, feels-like)
- 7-day forecast strip with min/max temperatures and condition icons
- Geolocation support — automatically detects the device's coordinates
- Falls back to mock data gracefully when the API key is not configured
- Severe weather advisory highlights (frost, heavy rain, heat stress)

---

### 📊 `analytics` — Market Prices
Live and historical commodity prices for agricultural produce, helping farmers decide when and where to sell.

**Features:**
- Real-time mandi (market) price feed filterable by crop name and state
- Price trend charts (7-day / 30-day history) per commodity
- Highest-paying mandis ranked for a selected crop
- Color-coded price movement indicators (rise 🟢 / fall 🔴)
- Search and filter by commodity, state, and market name
- Data sourced from the government Agmarknet API via the backend

---

### 🔬 `disease-detector` — Disease Detector
AI-powered plant disease diagnostics using image upload or camera capture.

**Features:**
- Drag-and-drop or camera image upload
- Sends the image to the backend `/api/detect-disease` endpoint (ML model)
- Returns the identified disease name, confidence score, and severity level
- Displays treatment recommendations and preventive measures
- Supports multiple crop types (tomato, potato, rice, wheat, etc.)

---

### 📦 `inventory` — Inventory Management
A complete farm stock tracker for seeds, fertilisers, pesticides, and tools.

**Features:**
- Add, edit, and delete inventory items with quantity, unit, and purchase price
- Categorised view (Seeds / Fertilisers / Pesticides / Equipment / Other)
- Low-stock alerts when items fall below a user-defined threshold
- Usage history log per item
- Export to CSV for offline record-keeping
- Summary statistics (total items, low-stock count, estimated value)

---

### 📈 `reports` — Government Schemes
A curated, searchable directory of central and state government agricultural schemes and subsidies.

**Features:**
- Filterable by category (insurance, subsidy, loan, credit, infrastructure)
- Each scheme card shows eligibility criteria, benefits, application deadline, and a direct application link
- Search by scheme name or keyword
- Multilingual scheme titles and summaries
- "Save for later" / bookmark functionality per scheme

---

### 🚜 `rental` — Equipment Rental (Equip-Rent)
A peer-to-peer marketplace where farmers can list their equipment for rent or find equipment to hire nearby.

**Features:**
- **Renter view** — Browse available tractors, tillers, sprayers, harvesters, etc. with images, daily rates, and owner contact info
- **Lender (My Listings) view** — Manage your own listed equipment; add new listings with photos, pricing, and availability
- **My Bookings** — Track rental requests you have made with status (pending / confirmed / completed)
- BookingModal for submitting rental requests with date range and message
- Equipment listings filtered so users never see their own items in the general feed
- Lenders can delete their own listings
- Responsive grid layout (1-col mobile → 3-col desktop)

---

### ⚙️ `settings` — Settings
User profile and app preferences management.

**Features:**
- Profile card with editable name, phone number, and profile photo (avatar upload)
- Preferred language selector (English / हिंदी / മലയാളം) that updates the whole UI
- Manage registered crops (add / remove crop tags)
- Passkey management — register and delete WebAuthn passkeys for passwordless login
- Account security: change linked phone number, view active sessions
- Animated avatar ring, glassmorphism section headers, and skeleton loading shimmer
- All changes persisted to the backend via the authenticated user API

---

### 🤖 Floating Chatbot (All Pages)
An AI-powered assistant accessible from every page via a floating action button.

**Features:**
- Conversational interface powered by the **Gemini** API (via backend)
- Voice input support (`VoiceChatButton`) using the browser's Web Speech API
- Answers farming questions: crop care, disease management, weather interpretation, scheme eligibility, etc.
- Maintains conversation context within the session
- Minimisable bubble that persists across page navigation

---

### 🔑 Authentication Routes

#### `/auth-test` — Auth Test (Dev Only)
A developer utility page (activated when `window.location.pathname === "/auth-test"`) for testing all authentication flows in isolation. Not linked from the main UI.

#### Login / Register Flow
Handled by `AuthWrapper` → `AuthFlow` → `AuthChoice` before any dashboard view is shown.

**Authentication Methods:**
| Method | Description |
|---|---|
| 📱 Phone + OTP | Enter a 10-digit Indian mobile number; receive and verify OTP via SMS |
| 🔐 Google Sign-In | One-click OAuth via Google Identity Services |
| 🔑 Passkey (WebAuthn) | Biometric / device-based passwordless login for returning users |

---

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` and fill in the following:
```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_API_BASE_URL=http://localhost:5000   # backend base URL
```

#### Google OAuth Setup (if needed)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services** → **Credentials** → **OAuth 2.0 Client ID**
3. Set Authorized JavaScript Origins to `http://localhost:5173`
4. Copy the Client ID into `VITE_GOOGLE_CLIENT_ID`

### 3. Start Dev Server
```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Auth | Google Identity Services, WebAuthn Passkeys, OTP |
| AI Chatbot | Google Gemini API (via backend) |
| State | React `useState` / `useContext` |
| HTTP | Native `fetch` with custom service helpers |
| Icons | Emoji-based icon system |
| i18n | Custom translation system (EN / HI / ML) |

---

## 🌍 Multilingual Support

All major UI text, field labels, and navigation items support:
- 🇬🇧 **English** (`en`)
- 🇮🇳 **Hindi** (`hi`)
- 🇮🇳 **Malayalam** (`ml`)

Language is selected on first launch and can be changed any time from **Settings**.

---

## 📱 Responsive Design

The layout adapts across:
- **Mobile** — collapsible sidebar (icon-only), single-column page layouts
- **Tablet** — two-column grids, expanded sidebar toggle
- **Desktop** — full sidebar with labels, multi-column dashboards

---

## 📝 Development Notes

- Vite provides fast HMR (Hot Module Replacement) during development
- Google Sign-In requires **HTTPS in production** (use `ngrok` for local HTTPS testing)
- Phone OTP is configured for Indian numbers (`+91`); OTP is logged to the console in dev mode
- The Gemini chatbot key must be configured on the **backend** (not the frontend env)
- Disease detection and crop prediction require the Python ML backend to be running
