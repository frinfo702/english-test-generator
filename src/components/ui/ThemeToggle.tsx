import { useTheme } from "../../hooks/useTheme";
import styles from "./ThemeToggle.module.css";

/**
 * Physical slide switch: a solid knob travels across a recessed track.
 * Light mode reads as dawn (warm horizon, dark knob), dark mode as night
 * (deep sky, light knob). Colours follow the document's data-theme attribute,
 * so the switch stays in sync when the OS theme changes on its own.
 */
export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={styles.toggle}
      onClick={toggleTheme}
    >
      <span className={styles.knob} aria-hidden="true" />
    </button>
  );
}
