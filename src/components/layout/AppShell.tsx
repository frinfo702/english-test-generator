import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: React.ReactNode;
}

function ThemeIcon({ isDark }: { isDark: boolean }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (isDark) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M21 14.5A8.5 8.5 0 1 1 11.5 3a6.5 6.5 0 0 0 9.5 11.5z" />
    </svg>
  );
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const isToefl = location.pathname.startsWith("/toefl");
  const isToeic = location.pathname.startsWith("/toeic");
  const isShadowing = location.pathname.startsWith("/shadowing");
  const isDictation = location.pathname.startsWith("/dictation");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        navigate("/dashboard");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return (
    <div className={styles.shell}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link
            to="/"
            className={styles.logo}
            aria-label="English Test Practice Home"
          >
            <span className={styles.logoMark}>ET</span>
            English Test Practice
          </Link>
          <nav className={styles.nav} aria-label="Main navigation">
            <Link
              to="/toefl"
              className={[
                styles.navLink,
                isToefl ? styles.navLinkActive : "",
              ].join(" ")}
              aria-current={isToefl ? "page" : undefined}
            >
              TOEFL 2026
            </Link>
            <Link
              to="/toeic"
              className={[
                styles.navLink,
                isToeic ? styles.navLinkActive : "",
              ].join(" ")}
              aria-current={isToeic ? "page" : undefined}
            >
              TOEIC L&amp;R
            </Link>
            <span className={styles.navDivider} aria-hidden="true" />
            <Link
              to="/shadowing"
              className={[
                styles.navLink,
                isShadowing ? styles.navLinkActive : "",
              ].join(" ")}
              aria-current={isShadowing ? "page" : undefined}
            >
              Shadowing
            </Link>
            <span className={styles.navDivider} aria-hidden="true" />
            <Link
              to="/dictation"
              className={[
                styles.navLink,
                isDictation ? styles.navLinkActive : "",
              ].join(" ")}
              aria-current={isDictation ? "page" : undefined}
            >
              Dictation
            </Link>
            <span className={styles.navDivider} aria-hidden="true" />
            <Link
              to="/dashboard"
              className={[
                styles.navLink,
                location.pathname === "/dashboard" ? styles.navLinkActive : "",
              ].join(" ")}
              aria-current={
                location.pathname === "/dashboard" ? "page" : undefined
              }
            >
              Dashboard
            </Link>
            <span className={styles.kbd} title="Go to Dashboard">
              <span className={styles.kbdKey}>⌘</span>
              <span className={styles.kbdKey}>D</span>
            </span>
            <button
              type="button"
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              title={isDark ? "Light mode" : "Dark mode"}
            >
              <ThemeIcon isDark={isDark} />
            </button>
          </nav>
        </div>
      </header>
      <main className={styles.main} id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
