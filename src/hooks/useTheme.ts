import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  isTheme,
  oppositeTheme,
  persistTheme,
  readStoredTheme,
  resolveTheme,
  type Theme,
} from "../lib/theme";

export type { Theme };

/**
 * Theme state with localStorage persistence.
 * Initial value comes from the FOUC script's data-theme attribute when present.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    return isTheme(attr) ? attr : resolveTheme();
  });

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    persistTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(oppositeTheme(theme));
  }, [theme, setTheme]);

  // Follow OS only while the user has not picked an explicit theme.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readStoredTheme() !== null) return;
      const next: Theme = mq.matches ? "dark" : "light";
      setThemeState(next);
      applyTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}
