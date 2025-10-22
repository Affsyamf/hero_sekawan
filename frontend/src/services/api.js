import { loadingManager } from "../contexts/loadingManager";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Interceptor untuk request
api.interceptors.request.use(
  (config) => {
    loadingManager.setLoading(true);
    
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      // Untuk data JSON biasa
      config.headers["Content-Type"] = "application/json";
    }
    
    return config;
  },
  (error) => {
    loadingManager.setLoading(false);
    return Promise.reject(error);
  }
);

// Interceptor untuk response
api.interceptors.response.use(
  (response) => {
    loadingManager.setLoading(false);
    return response;
  },
  (error) => {
    loadingManager.setLoading(false);

    if (error.response?.status === 401) {
      // logout otomatis
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;