import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PixelArt } from "../pixel/PixelArt";
import { POODLE_BODY, POODLE_PALETTE } from "../pixel/poodleSprite";
import { ThemeToggle } from "../ui/ThemeToggle";
import { LegacyHistoryNotice } from "./LegacyHistoryNotice";
import { UpdateNotice } from "./UpdateNotice";
import { PerfectCelebration } from "../pixel/PerfectCelebration";
import styles from "./AppShell.module.css";

// The mascot's head (sprite rows 1–15, ears to collar) as the logo mark.
const POODLE_HEAD = POODLE_BODY.slice(1, 16).map((row) => row.slice(2, 24));

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
    to: "/trial",
    label: "Practice Test",
    matches: (p) => p.startsWith("/trial"),
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

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  /** Remounting after a migration beats making every page watch history. */
  const [historyVersion, setHistoryVersion] = useState(0);

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
          <Link
            to="/"
            className={styles.logo}
            aria-label="English Test Practice home"
          >
            <PixelArt
              className={styles.logoMark}
              layers={[POODLE_HEAD]}
              palette={POODLE_PALETTE}
              width={22}
              height={15}
            />
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

          <ThemeToggle />
        </div>
      </header>
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <Fragment key={historyVersion}>{children}</Fragment>
      </main>
      <PerfectCelebration />
      <UpdateNotice />
      <LegacyHistoryNotice onMigrated={() => setHistoryVersion((v) => v + 1)} />
    </div>
  );
}
