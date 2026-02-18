import { Link, useLocation } from "react-router-dom";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const isToefl = location.pathname.startsWith("/toefl");
  const isToeic = location.pathname.startsWith("/toeic");

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          English Test Practice
        </Link>
        <nav className={styles.nav}>
          <Link
            to="/toefl"
            className={[styles.navLink, isToefl ? styles.active : ""].join(" ")}
          >
            TOEFL 2026
          </Link>
          <Link
            to="/toeic"
            className={[styles.navLink, isToeic ? styles.active : ""].join(" ")}
          >
            TOEIC Reading
          </Link>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
