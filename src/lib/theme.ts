/**
 * Theme resolution and DOM application.
 * Storage key must stay in sync with the FOUC bootstrap in index.html.
 */
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "etp-theme";

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function getSystemTheme(): Theme {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Prefer explicit user choice, otherwise follow the OS. */
export function resolveTheme(): Theme {
  return readStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

/** Apply to the document and persist as an explicit user preference. */
export function persistTheme(theme: Theme): void {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode / blocked storage */
  }
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}
