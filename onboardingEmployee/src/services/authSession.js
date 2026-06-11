export const AUTH_API_BASE_URL = "http://localhost:8081/api";

const AUTH_KEYS = [
  "accessToken",
  "refreshToken",
  "token",
  "currentUser",
  "userRole",
  "userName",
  "userEmail",
  "userEmployeeId",
];

// ─── Storage helpers ────────────────────────────────────────────────────────

function readStorage(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

export function getStoredUser() {
  const stored = readStorage("currentUser");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return readStorage("accessToken") || readStorage("token");
}

export function getRefreshToken() {
  return readStorage("refreshToken");
}

export function persistTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("token", accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
}

export function clearAuthSession() {
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  stopProactiveRefresh();
}

export function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

// ─── JWT expiry helpers ──────────────────────────────────────────────────────

/**
 * Decodes the JWT payload (no signature verification – that's the server's job).
 * Returns the `exp` field in milliseconds, or null if unreadable.
 */
function getTokenExpiryMs(token) {
  if (!token) return null;
  try {
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return null;
    const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json);
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Returns true if the stored access token is expired (or absent). */
export function isAccessTokenExpired() {
  const token = getAccessToken();
  const expiryMs = getTokenExpiryMs(token);
  if (expiryMs === null) return !token; // no token → treat as expired
  return Date.now() >= expiryMs;
}

// ─── Refresh mutex ───────────────────────────────────────────────────────────
// Prevents multiple concurrent calls to refreshAccessToken() from
// all hitting the network simultaneously (e.g. parallel API calls on mount).

let _refreshPromise = null;

export async function refreshAccessToken() {
  // If a refresh is already in-flight, piggyback on it.
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = _doRefresh().finally(() => {
    _refreshPromise = null;
  });
  return _refreshPromise;
}

async function _doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    // Response shape: { success: true, data: { accessToken: "...", tokenType: "Bearer" } }
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.success === false || !payload.data?.accessToken) {
      return null;
    }

    const newToken = payload.data.accessToken;
    persistTokens({ accessToken: newToken });
    scheduleProactiveRefresh(); // re-arm the timer with the new token's expiry
    return newToken;
  } catch {
    return null;
  }
}

// ─── Proactive background refresh ────────────────────────────────────────────
// Schedules a refresh 5 minutes before the access token expires so that
// users never hit a 401 from normal activity.

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
let _refreshTimerId = null;

export function scheduleProactiveRefresh() {
  if (_refreshTimerId !== null) {
    clearTimeout(_refreshTimerId);
    _refreshTimerId = null;
  }

  const token = getAccessToken();
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return;

  const msUntilRefresh = expiryMs - Date.now() - REFRESH_BEFORE_EXPIRY_MS;
  if (msUntilRefresh <= 0) {
    // Token already close to expiry or expired — refresh immediately.
    refreshAccessToken().then((newToken) => {
      if (!newToken) {
        clearAuthSession();
        redirectToLogin();
      }
    });
    return;
  }

  _refreshTimerId = setTimeout(async () => {
    _refreshTimerId = null;
    const newToken = await refreshAccessToken();
    if (!newToken) {
      clearAuthSession();
      redirectToLogin();
    }
  }, msUntilRefresh);
}

export function stopProactiveRefresh() {
  if (_refreshTimerId !== null) {
    clearTimeout(_refreshTimerId);
    _refreshTimerId = null;
  }
}

// ─── Authenticated fetch ─────────────────────────────────────────────────────

export async function fetchWithAuth(url, options = {}, { retryOnUnauthorized = true } = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      headers.set("Authorization", `Bearer ${refreshedToken}`);
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}
