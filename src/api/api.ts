// src/api/api.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1"; // ← only change

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// src/api/api.ts logic update
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Use standard axios for refresh to avoid interceptor loops
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
          withCredentials: true,
        });

        const newAccessToken = data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);

        // Update the failed request with the NEW token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        // Only redirect if we aren't already on login
        if (!window.location.pathname.includes('/login')) {
            window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;