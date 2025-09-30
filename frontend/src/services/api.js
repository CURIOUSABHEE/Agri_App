import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Simple dashboard service
export const dashboardService = {
  getDashboardData: async () => {
    const response = await api.get("/dashboard");
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

export default api;
