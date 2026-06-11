import { AUTH_API_BASE_URL, fetchWithAuth } from "./authSession";

function normalizeSettings(settings = {}) {
  return {
    emailNotifications: settings.emailNotifications ?? true,
    autoAssignIds: settings.autoAssignEmployeeIds ?? true,
  };
}

async function parseResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || fallbackMessage);
  }

  return normalizeSettings(payload.data || {});
}

async function getSettings() {
  const response = await fetchWithAuth(`${AUTH_API_BASE_URL}/platform-settings`);
  return parseResponse(response, "Unable to load platform settings.");
}

async function updateSettings(settings) {
  const response = await fetchWithAuth(`${AUTH_API_BASE_URL}/platform-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emailNotifications: settings.emailNotifications,
      autoAssignEmployeeIds: settings.autoAssignIds,
    }),
  });
  return parseResponse(response, "Unable to update platform settings.");
}

export const platformSettingsService = {
  getSettings,
  updateSettings,
};
