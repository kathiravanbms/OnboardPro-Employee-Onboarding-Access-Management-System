import { apiClient, unwrapApiResponse } from "./apiClient";

let credentialsCache = null;
let credentialsCacheKey = "";
let credentialsRequest = null;

function getBrowserRequestKey(cacheKey) {
  return `__onboardproCredentialsRequest:${cacheKey}`;
}

function getStoredCredentials(cacheKey) {
  try {
    const value = sessionStorage.getItem(`onboardpro:credentials:${cacheKey}`);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function storeCredentials(cacheKey, credentials) {
  try {
    sessionStorage.setItem(`onboardpro:credentials:${cacheKey}`, JSON.stringify(credentials));
  } catch {
    // Session storage can be unavailable in restricted browser modes.
  }
}

export async function listCredentials({ force = false } = {}) {
  const cacheKey = localStorage.getItem("userEmail") || "";
  if (credentialsCacheKey !== cacheKey) {
    credentialsCache = getStoredCredentials(cacheKey);
    credentialsRequest = null;
    credentialsCacheKey = cacheKey;
  }

  if (credentialsCache && !force) {
    return credentialsCache;
  }

  const browserRequestKey = getBrowserRequestKey(cacheKey);
  if (typeof window !== "undefined" && window[browserRequestKey]) {
    return window[browserRequestKey];
  }
  if (credentialsRequest) {
    return credentialsRequest;
  }

  credentialsRequest = apiClient.get("/credentials")
    .then((response) => {
      credentialsCache = unwrapApiResponse(response);
      credentialsCacheKey = cacheKey;
      storeCredentials(cacheKey, credentialsCache);
      return credentialsCache;
    })
    .finally(() => {
      credentialsRequest = null;
      if (typeof window !== "undefined") {
        delete window[browserRequestKey];
      }
    });

  if (typeof window !== "undefined") {
    window[browserRequestKey] = credentialsRequest;
  }

  return credentialsRequest;
}

export const credentialService = {
  listCredentials,
};
