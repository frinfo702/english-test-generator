import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboardIcon, GraduationCapIcon } from "../ui/Icons";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
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
          <Link to="/" className={styles.logo} aria-label="English Test Practice Home">
            <span className={styles.logoMark}>
              <GraduationCapIcon size={16} />
            </span>
            <span>English Test Practice</span>
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
            <span className={styles.navDivider} />
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
            <span className={styles.navDivider} />
            <Link
              to="/dashboard"
              className={[
                styles.navLink,
                location.pathname === "/dashboard" ? styles.navLinkActive : "",
              ].join(" ")}
              aria-current={location.pathname === "/dashboard" ? "page" : undefined}
            >
              <LayoutDashboardIcon size={15} style={{ marginRight: 5 }} />
              Dashboard
            </Link>
            <span className={styles.kbd}>
              <span className={styles.kbdKey}>⌘</span>
              <span className={styles.kbdKey}>D</span>
            </span>
          </nav>
        </div>
      </header>
      <main className={styles.main} id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
