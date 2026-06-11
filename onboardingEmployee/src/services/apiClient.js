import axios from "axios";
import {
  clearAuthSession,
  getAccessToken,
  refreshAccessToken,
  redirectToLogin,
  scheduleProactiveRefresh,
} from "./authSession";

export const API_BASE_URL = "http://localhost:8082/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor ─────────────────────────────────────────────────────
// Always attach the latest stored access token.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor ────────────────────────────────────────────────────
// On 401: attempt one silent token refresh, then retry the original request.
// On 403 with "deactivated" message: force logout.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error?.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // prevent infinite retry loop

      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        // Re-arm the proactive background refresh timer with the new token.
        scheduleProactiveRefresh();

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
        return apiClient(originalRequest);
      }

      // Refresh also failed — session is dead, send user back to login.
      clearAuthSession();
      redirectToLogin();
    }

    const message = error?.response?.data?.message || "";
    if (
      error?.response?.status === 403 &&
      message.toLowerCase().includes("deactivated")
    ) {
      clearAuthSession();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function unwrapApiResponse(response) {
  return response.data?.data ?? response.data;
}

export function getApiErrorMessage(error, fallback = "API request failed.") {
  const data = error?.response?.data;

  if (Array.isArray(data?.data) && data.data.length) {
    return data.data.join(", ");
  }

  return data?.message || error?.message || fallback;
}
