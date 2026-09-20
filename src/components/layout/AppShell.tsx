import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: React.ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  shortcut?: string;
  matches: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  {
    to: "/toefl",
    label: "TOEFL 2026",
    matches: (p) => p.startsWith("/toefl"),
  },
  {
    to: "/toeic",
    label: "TOEIC L&R",
    matches: (p) => p.startsWith("/toeic"),
  },
  {
    to: "/shadowing",
    label: "Shadowing",
    matches: (p) => p.startsWith("/shadowing"),
  },
  {
    to: "/dictation",
    label: "Dictation",
    matches: (p) => p.startsWith("/dictation"),
  },
  {
    to: "/dashboard",
    label: "Dashboard",
    shortcut: "⌘D",
    matches: (p) => p === "/dashboard",
  },
];

function SunIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 13.2A8.6 8.6 0 1 1 10.8 3a6.8 6.8 0 0 0 10.2 10.2z" />
    </svg>
  );
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const navRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);

  const activeItem =
    navItems.find((item) => item.matches(location.pathname)) ??
    (location.pathname === "/" ? null : navItems[0]);

  /**
   * The indicator is positioned imperatively: measuring in a layout effect and
   * writing styles avoids a render pass on every navigation.
   */
  const measure = useCallback(() => {
    const link = activeRef.current;
    const indicator = indicatorRef.current;
    if (!link || !indicator) return;
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
    indicator.style.width = `${link.offsetWidth}px`;
    indicator.style.opacity = "1";
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, location.pathname]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
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
          <Link to="/" className={styles.logo} aria-label="English Test Practice home">
            <span className={styles.logoMark} aria-hidden="true">
              ET
            </span>
            <span className={styles.logoText}>English Test Practice</span>
          </Link>

          <nav className={styles.nav} ref={navRef} aria-label="Main navigation">
            <span
              className={styles.indicator}
              aria-hidden="true"
              ref={indicatorRef}
            />
            {navItems.map((item) => {
              const active = item === activeItem;
              return (
                <Link
                  key={item.to}
                  ref={active ? activeRef : undefined}
                  to={item.to}
                  className={[
                    styles.navLink,
                    active ? styles.navLinkActive : "",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                  {item.shortcut && (
                    <span className={styles.kbd} aria-hidden="true">
                      {item.shortcut}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>
      <main className={styles.main} id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
