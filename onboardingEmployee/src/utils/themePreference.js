export const THEME_CHANGE_EVENT = "onboardpro-theme-change";

const DARK_THEME = "dark";
const LIGHT_THEME = "light";
const GLOBAL_THEME_KEY = "onboardpro:theme";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    return null;
  }
}

function getUserIdentity(user = readStoredUser()) {
  return user?.id || user?.email || user?.employeeId || localStorage.getItem("userEmail") || localStorage.getItem("userEmployeeId") || "";
}

function getThemeKey(user) {
  const identity = getUserIdentity(user);
  return identity ? `onboardpro:theme:${String(identity).trim().toLowerCase()}` : "";
}

export function getStoredTheme(user) {
  const key = getThemeKey(user);
  const storedTheme = localStorage.getItem(GLOBAL_THEME_KEY) || (key ? localStorage.getItem(key) : "");
  return storedTheme === LIGHT_THEME ? LIGHT_THEME : DARK_THEME;
}

export function applyTheme(theme) {
  const nextTheme = theme === LIGHT_THEME ? LIGHT_THEME : DARK_THEME;
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.classList.toggle("dark", nextTheme === DARK_THEME);
  document.documentElement.style.colorScheme = nextTheme;
  return nextTheme;
}

export function applyStoredTheme(user) {
  return applyTheme(getStoredTheme(user));
}

export function saveTheme(theme, user) {
  const nextTheme = applyTheme(theme);
  const key = getThemeKey(user);

  localStorage.setItem(GLOBAL_THEME_KEY, nextTheme);

  if (key) {
    localStorage.setItem(key, nextTheme);
  }

  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: nextTheme } }));
  return nextTheme;
}
