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
import { Settings3LineIcon } from "../ui/SettingsIcon";
import { ThemeToggle } from "../ui/ThemeToggle";
import { LegacyHistoryNotice } from "./LegacyHistoryNotice";
import { SiteFooter } from "./SiteFooter";
import { UpdateNotice } from "./UpdateNotice";
import { HeaderClockSlot } from "./headerSlot";
import { PerfectCelebration } from "../pixel/PerfectCelebration";
import styles from "./AppShell.module.css";

// The mascot's head (sprite rows 1–15, ears to collar) as the logo mark.
const POODLE_HEAD = POODLE_BODY.slice(1, 16).map((row) => row.slice(2, 24));

const ANNOUNCEMENT_DISMISSED_KEY = "etp-announcement-dismissed";

interface AppShellProps {
  children: React.ReactNode;
}

/** The long footer belongs to index and utility pages, never an active task. */
function hideSiteFooter(pathname: string) {
  if (pathname === "/") return true;
  if (
    /^\/toefl\/(reading|writing|listening|speaking)\/[^/]+\/[^/]+/.test(
      pathname,
    ) ||
    /^\/toeic\/part[2-7]\/[^/]+/.test(pathname) ||
    /^\/(shadowing|dictation|instant-composition)\/[^/]+/.test(pathname)
  ) {
    return true;
  }
  return (
    pathname.startsWith("/trial/") ||
    pathname.startsWith("/review/recall/") ||
    pathname.startsWith("/results/")
  );
}

interface NavItem {
  to: string;
  label: string;
  /** One short line shown with the shortcut on a long hover. */
  hint: string;
  /** Letter for the ⌥ shortcut. */
  key: string;
  icon?: React.ReactNode;
  /** Omitted on Learn: whatever no other tab claims is practice. */
  matches?: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Learn",
    hint: "Pick a test or drill",
    key: "L",
  },
  {
    to: "/review",
    label: "Review",
    hint: "Redo what you missed",
    key: "R",
    matches: (p) => p.startsWith("/review"),
  },
  {
    to: "/dashboard",
    label: "Dashboard",
    hint: "Scores and history",
    key: "D",
    matches: (p) => p === "/dashboard",
  },
  {
    to: "/settings",
    label: "Settings",
    hint: "AI scoring and backup",
    key: "S",
    icon: <Settings3LineIcon size={15} aria-hidden="true" />,
    matches: (p) => p.startsWith("/settings"),
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
  const [clockSlot, setClockSlot] = useState<HTMLDivElement | null>(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(() => {
    try {
      return localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const activeItem =
    navItems.find((item) => item.matches?.(location.pathname)) ?? navItems[0];
  const isHome = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const showFooter = !hideSiteFooter(location.pathname);

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

  const dismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    try {
      localStorage.setItem(ANNOUNCEMENT_DISMISSED_KEY, "1");
    } catch {
      // Dismissing for this visit is still better than blocking the action.
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌥ + letter, matched on e.code because ⌥ turns e.key into "®" etc.
      // ⌘ would collide with ⌘L/⌘R/⌘S; ⌘D stays as the original alias.
      const item =
        e.altKey && !e.metaKey && !e.ctrlKey
          ? navItems.find((i) => e.code === `Key${i.key}`)
          : (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d"
            ? navItems.find((i) => i.to === "/dashboard")
            : undefined;
      if (!item) return;
      e.preventDefault();
      navigate(item.to);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return (
    <div className={styles.shell}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {!announcementDismissed && (
        <div className={styles.announcement}>
          <div className={styles.announcementInner}>
            <span className={styles.announcementCopy}>
              <span className={styles.announcementTag}>New</span>
              TOEFL iBT 2026 practice is live
            </span>
            <Link to="/updates/redesign" className={styles.announcementLink}>
              See what changed <span aria-hidden="true">↗</span>
            </Link>
            <button
              type="button"
              className={styles.announcementDismiss}
              onClick={dismissAnnouncement}
              aria-label="Dismiss announcement"
              title="Dismiss announcement"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      )}
      <header
        className={[styles.header, scrolled ? styles.headerScrolled : ""].join(
          " ",
        )}
      >
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

          <div className={styles.clockSlot} ref={setClockSlot} />

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
                  aria-keyshortcuts={`Alt+${item.key}`}
                >
                  {item.icon}
                  <span className={item.icon ? styles.iconLabel : undefined}>
                    {item.label}
                  </span>
                  <span className={styles.kbd} aria-hidden="true">
                    {item.hint}
                    <kbd>⌥{item.key}</kbd>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className={styles.headerActions}>
            <Link to="/toefl" className={styles.headerCta}>
              Start practice
              <span aria-hidden="true">→</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main
        className={[styles.main, isHome ? styles.mainHome : ""].join(" ")}
        id="main-content"
        tabIndex={-1}
      >
        <HeaderClockSlot.Provider value={clockSlot}>
          <Fragment key={historyVersion}>{children}</Fragment>
        </HeaderClockSlot.Provider>
      </main>
      {showFooter && <SiteFooter />}
      <PerfectCelebration />
      <UpdateNotice />
      <LegacyHistoryNotice onMigrated={() => setHistoryVersion((v) => v + 1)} />
    </div>
  );
}
