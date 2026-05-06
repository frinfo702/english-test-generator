import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isToefl = location.pathname.startsWith("/toefl");
  const isToeic = location.pathname.startsWith("/toeic");

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
            English Test Practice
          </Link>
          <nav className={styles.nav}>
            <Link
              to="/toefl"
              className={[
                styles.navLink,
                isToefl ? styles.navLinkActive : "",
              ].join(" ")}
            >
              TOEFL 2026
            </Link>
            <Link
              to="/toeic"
              className={[
                styles.navLink,
                isToeic ? styles.navLinkActive : "",
              ].join(" ")}
            >
              TOEIC Reading
            </Link>
            <span className={styles.navDivider} />
            <Link
              to="/dashboard"
              className={[
                styles.navLink,
                location.pathname === "/dashboard" ? styles.navLinkActive : "",
              ].join(" ")}
            >
              Dashboard
            </Link>
            <span className={styles.kbd}>
              <span className={styles.kbdKey}>⌘</span>
              <span className={styles.kbdKey}>D</span>
            </span>
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
