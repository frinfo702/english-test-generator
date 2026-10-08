import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  hasSeenLatestUpdate,
  LATEST_UPDATE,
  markLatestUpdateSeen,
} from "../../lib/updates";
import { PixelHamster } from "../pixel/PixelHamster";
import styles from "./UpdateNotice.module.css";

/** A hamster in the corner that speaks up once per release. */
export function UpdateNotice() {
  const { pathname } = useLocation();
  const [seen, setSeen] = useState(hasSeenLatestUpdate);
  const onUpdatePage = pathname === LATEST_UPDATE.path;

  // Reading the update counts, however you got there.
  useEffect(() => {
    if (onUpdatePage && !seen) {
      markLatestUpdateSeen();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors localStorage, an external store
      setSeen(true);
    }
  }, [onUpdatePage, seen]);

  // A timed section has a clock in the corner's place of attention.
  if (/^\/trial\/[^/]+$/.test(pathname)) return null;

  const dismiss = () => {
    markLatestUpdateSeen();
    setSeen(true);
  };

  return (
    <aside className={styles.notice} aria-label="Updates">
      {!seen && (
        <div className={styles.bubble}>
          <Link to={LATEST_UPDATE.path} onClick={dismiss}>
            <span className={styles.tag}>New</span>
            {LATEST_UPDATE.label}
          </Link>
          <button
            type="button"
            className={styles.close}
            onClick={dismiss}
            aria-label="Dismiss update"
          >
            ×
          </button>
        </div>
      )}
      <PixelHamster />
    </aside>
  );
}
