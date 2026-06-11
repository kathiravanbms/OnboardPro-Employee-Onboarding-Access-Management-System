import { fetchWithAuth } from "../services/authSession";

export function normalizeUserRole(role) {
  if (!role) {
    return "";
  }

  const mapping = {
    Admin: "System Admin",
    "IT Admin": "it_manager",
    "IT Manager": "it_manager",
    "IT_MANAGER": "it_manager",
    "IT_Manager": "it_manager",
    "itmanager": "it_manager",
    "it_manager": "it_manager"
  };

  return mapping[role] || role;
}

export function getRoleSettingsKey(role) {
  return `onboardpro:settings:${normalizeUserRole(role)}`;
}

export function loadRoleSettings(role) {
  try {
    return JSON.parse(localStorage.getItem(getRoleSettingsKey(role)) || "{}") || {};
  } catch {
    return {};
  }
}

export function saveRoleSettings(role, settings) {
  localStorage.setItem(getRoleSettingsKey(role), JSON.stringify(settings || {}));
}

export function getStoredEmployeeId() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return currentUser.employeeId || localStorage.getItem("userEmployeeId") || "";
  } catch {
    return localStorage.getItem("userEmployeeId") || "";
  }
}

export function logoutPreservingSettings() {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "User";
  const role = localStorage.getItem("userRole") || "User";

  if (token) {
    fetchWithAuth("http://localhost:8082/api/audit-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName,
        role,
        module: "Security",
        action: "Logout",
        description: `${userName} logged out.`,
      }),
    }).catch(() => {});
  }

  localStorage.removeItem("currentUser");
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userEmployeeId");
}
