import { apiClient, unwrapApiResponse } from "./apiClient";
import { AUTH_API_BASE_URL, fetchWithAuth } from "./authSession";

export const PROFILE_UPDATED_EVENT = "onboardpro-profile-updated";

const roleLabels = {
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  DEPARTMENT_MANAGER: "Department Manager",
  IT_ADMIN: "IT Manager",
  IT_MANAGER: "IT Manager",
  EMPLOYEE: "Employee",
};

function displayRole(roles = []) {
  const role = roles[0];
  return roleLabels[role] || role?.replaceAll("_", " ") || "Not assigned";
}

function shouldLoadEmployeeProfile(roles = []) {
  return roles.includes("EMPLOYEE");
}

function normalizeProfile(profile, authProfile = {}) {
  return {
    fullName: profile?.fullName || profile?.username || authProfile.username || "Not available",
    employeeId: authProfile.employeeId || profile?.employeeCode || profile?.employeeId || "Not assigned",
    email: authProfile.email || profile?.email || "Not available",
    role: profile?.role || displayRole(authProfile.roles || []),
    accountStatus: profile?.accountStatus || (authProfile.isActive === false ? "Inactive" : "Active"),
    phoneNumber: profile?.phoneNumber || authProfile.phoneNumber || "",
  };
}

async function getAuthProfile() {
  const response = await fetchWithAuth(`${AUTH_API_BASE_URL}/users/me`);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false || !payload.data) {
    throw new Error(payload.message || "Unable to load profile.");
  }

  return payload.data;
}

async function getEmployeeProfile() {
  try {
    const response = await apiClient.get("/employee/profile");
    return unwrapApiResponse(response);
  } catch (error) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

async function updateEmployeeProfile(profile) {
  const response = await apiClient.put("/employee/profile", profile);
  return unwrapApiResponse(response);
}

async function updateAuthProfile(profile) {
  const response = await fetchWithAuth(`${AUTH_API_BASE_URL}/users/me/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false || !payload.data) {
    throw new Error(payload.message || "Unable to update profile.");
  }

  return payload.data;
}

export function notifyUserProfileUpdated(profile) {
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: profile }));
}

export async function getCurrentUserProfile() {
  const authProfile = await getAuthProfile();
  let profile = null;

  if (shouldLoadEmployeeProfile(authProfile.roles)) {
    profile = await getEmployeeProfile();
  }

  return normalizeProfile(profile || authProfile, authProfile);
}

export async function updateCurrentUserProfile(profile) {
  const authProfile = await getAuthProfile();
  const payload = {
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber || "",
  };
  let updatedProfile;

  if (shouldLoadEmployeeProfile(authProfile.roles)) {
    updatedProfile = await updateEmployeeProfile(payload);
  } else {
    updatedProfile = await updateAuthProfile(payload);
  }

  return normalizeProfile(updatedProfile, authProfile);
}

export const userProfileService = {
  getCurrentUserProfile,
  getEmployeeProfile,
  updateEmployeeProfile,
  updateCurrentUserProfile,
};
