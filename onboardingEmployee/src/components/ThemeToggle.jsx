import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getStoredTheme, saveTheme, THEME_CHANGE_EVENT } from "../utils/themePreference";

export default function ThemeToggle({ variant = "header" }) {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState(() => getStoredTheme(currentUser));
  const isDark = theme === "dark";

  useEffect(() => {
    setTheme(getStoredTheme(currentUser));

    const syncTheme = (event) => setTheme(event.detail?.theme || getStoredTheme(currentUser));
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
  }, [currentUser]);

  const toggleTheme = () => {
    setTheme(saveTheme(isDark ? "light" : "dark", currentUser));
  };

  if (variant === "settings") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        className="theme-settings-toggle"
      >
        <span className={`theme-settings-option ${!isDark ? "is-active" : ""}`}>
          <Sun className="h-4 w-4" aria-hidden="true" />
          Light
        </span>
        <span className={`theme-settings-option ${isDark ? "is-active" : ""}`}>
          <Moon className="h-4 w-4" aria-hidden="true" />
          Dark
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="theme-icon-button"
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}

export function ThemeSettingsPanel() {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-bold text-[#F8FAFC]">Appearance</h3>
        <p className="mt-1 text-sm text-[#94A3B8]">Choose the theme used across your OnboardPro dashboards.</p>
      </div>
      <ThemeToggle variant="settings" />
    </div>
  );
}

