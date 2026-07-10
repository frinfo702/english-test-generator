import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: React.ReactNode;
}

type NavEntry =
  | {
      kind: "link";
      to: string;
      label: string;
      match: (pathname: string) => boolean;
    }
  | { kind: "divider" };

const NAV: NavEntry[] = [
  {
    kind: "link",
    to: "/toefl",
    label: "TOEFL 2026",
    match: (p) => p.startsWith("/toefl"),
  },
  {
    kind: "link",
    to: "/toeic",
    label: "TOEIC L&R",
    match: (p) => p.startsWith("/toeic"),
  },
  { kind: "divider" },
  {
    kind: "link",
    to: "/shadowing",
    label: "Shadowing",
    match: (p) => p.startsWith("/shadowing"),
  },
  {
    kind: "link",
    to: "/dictation",
    label: "Dictation",
    match: (p) => p.startsWith("/dictation"),
  },
  { kind: "divider" },
  {
    kind: "link",
    to: "/dashboard",
    label: "Dashboard",
    match: (p) => p === "/dashboard",
  },
];

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
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

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
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark}>ET</span>
            <span className={styles.logoText}>English Test Practice</span>
          </Link>
          <nav className={styles.nav} aria-label="Main">
            {NAV.map((entry, i) =>
              entry.kind === "divider" ? (
                <span
                  key={`divider-${i}`}
                  className={styles.navDivider}
                  aria-hidden="true"
                />
              ) : (
                <Link
                  key={entry.to}
                  to={entry.to}
                  className={[
                    styles.navLink,
                    entry.match(pathname) ? styles.navLinkActive : "",
                  ].join(" ")}
                >
                  {entry.label}
                </Link>
              ),
            )}
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
      <main className={styles.main}>{children}</main>
    </div>
  );
}
