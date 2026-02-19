import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to automatically include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔐 Adding auth token to request:", config.url);
    } else {
      console.log("⚠️ No auth token found for request:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("🚨 API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers,
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired, invalid, or forbidden - clear storage and redirect to login
      console.log("🔐 Authentication error, clearing storage and reloading");
      localStorage.removeItem("authToken");
      localStorage.removeItem("farmerData");
      window.location.reload(); // This will trigger AuthWrapper to show login
    }
    return Promise.reject(error);
  }
);

// Simple dashboard service
export const dashboardService = {
  getDashboardData: async (lat = null, lon = null) => {
    let url = "/dashboard";
    if (lat && lon) {
      url += `?lat=${lat}&lon=${lon}`;
    }
    const response = await api.get(url);
    return response.data;
  },
};

// Schemes service
export const schemesService = {
  getSchemes: async (search = "", state = "", sector = "agriculture") => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (state) params.append("state", state);
    if (sector) params.append("sector", sector);

    const response = await api.get(`/schemes?${params.toString()}`);
    return response.data;
  },
};

// Market Prices service
export const marketService = {
  getMarketPrices: async (state = "", taluka = "", market = "", crop = "") => {
    const params = new URLSearchParams();
    if (state) params.append("state", state);
    if (taluka) params.append("taluka", taluka);
    if (market) params.append("market", market);
    if (crop) params.append("crop", crop);

    const response = await api.get(`/market-prices?${params.toString()}`);
    return response.data;
  },
};

// Weather service
export const weatherService = {
  getCurrentWeather: async (lat = "", lon = "", city = "") => {
    const params = new URLSearchParams();
    if (lat && lon) {
      params.append("lat", lat);
      params.append("lon", lon);
    } else if (city) {
      params.append("city", city);
    }

    const response = await api.get(`/weather/current?${params.toString()}`);
    return response.data;
  },

  getForecast: async (lat = "", lon = "", city = "", days = 5) => {
    const params = new URLSearchParams();
    if (lat && lon) {
      params.append("lat", lat);
      params.append("lon", lon);
    } else if (city) {
      params.append("city", city);
    }
    params.append("days", days);

    const response = await api.get(`/weather/forecast?${params.toString()}`);
    return response.data;
  },
};

// Inventory service
export const inventoryService = {
  getInventory: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== "all")
      params.append("category", filters.category);
    if (filters.search) params.append("search", filters.search);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.showLowStock) params.append("showLowStock", "true");
    if (filters.showExpiring) params.append("showExpiring", "true");

    const response = await api.get(`/inventory?${params.toString()}`);
    return response.data;
  },

  addItem: async (item) => {
    const response = await api.post("/inventory/items", item);
    return response.data;
  },

  updateStock: async (itemId, quantity, type = "adjustment") => {
    const response = await api.patch(`/inventory/items/${itemId}/stock`, {
      quantity,
      type,
    });
    return response.data;
  },

  deleteItem: async (itemId) => {
    const response = await api.delete(`/inventory/items/${itemId}`);
    return response.data;
  },

  getTransactions: async (itemId = "", limit = 10) => {
    const params = new URLSearchParams();
    if (itemId) params.append("itemId", itemId);
    params.append("limit", limit);

    const response = await api.get(
      `/inventory/transactions?${params.toString()}`
    );
    return response.data;
  },
};

// Crop Prediction service
export const cropPredictionService = {
  predictCrops: async (predictionData) => {
    const response = await api.post("/crop-prediction/predict", predictionData);
    return response.data;
  },

  getCropDetails: async (cropKey) => {
    const response = await api.get(`/crop-prediction/crop/${cropKey}`);
    return response.data;
  },

  getSeasonalRecommendations: async (season, state) => {
    const params = new URLSearchParams();
    params.append("state", state);

    const response = await api.get(
      `/crop-prediction/seasonal/${season}?${params.toString()}`
    );
    return response.data;
  },

  getPredictionOptions: async (language = "en") => {
    const response = await api.get(
      `/crop-prediction/options?language=${language}`
    );
    return response.data;
  },
};

// Authentication service
export const authService = {
  signup: async (userData) => {
    try {
      const response = await api.post("/auth/signup", userData);
      return response.data;
    } catch (error) {
      console.error("❌ Signup API Error:", error.response?.data);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    } catch (error) {
      console.error("❌ Login API Error:", error.response?.data);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  },

  logout: async () => {
    const token = localStorage.getItem("token");
    if (token) {
      const response = await api.post(
        "/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return response.data;
    }
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

// Backward compatibility exports
export const signupUser = authService.signup;
export const loginUser = authService.login;
export const logoutUser = authService.logout;

export default api;
