import { Link } from "react-router-dom";
import styles from "./SiteFooter.module.css";

/** The quiet sign-off used on index, list and utility pages. Task pages and
 *  the home page (which has its own longer footer) opt out. */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link to="/" className={styles.wordmark}>
              English Test Practice
            </Link>
            <p>A quieter place to prepare for test day.</p>
          </div>

          <nav className={styles.links} aria-label="Footer">
            <Link to="/toefl">TOEFL iBT 2026</Link>
            <Link to="/toeic">TOEIC L&amp;R</Link>
            <Link to="/trial">Practice test</Link>
            <Link to="/review">Review</Link>
            <Link to="/updates/ai-scoring">How scoring works</Link>
          </nav>
        </div>

        <div className={styles.bottom}>
          <span>© 2026 English Test Practice</span>
          <span>Built for practice, not for show.</span>
        </div>
      </div>
    </footer>
  );
}
