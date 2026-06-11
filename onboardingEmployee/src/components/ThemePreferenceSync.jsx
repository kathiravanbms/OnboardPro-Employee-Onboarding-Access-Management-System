import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { applyStoredTheme } from "../utils/themePreference";

export default function ThemePreferenceSync() {
  const { currentUser } = useAuth();

  useEffect(() => {
    applyStoredTheme(currentUser);
  }, [currentUser]);

  return null;
}

