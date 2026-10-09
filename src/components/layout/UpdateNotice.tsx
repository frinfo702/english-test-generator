import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  hasSeenLatestUpdate,
  LATEST_UPDATE,
  markLatestUpdateSeen,
} from "../../lib/updates";
import { PixelHamster } from "../pixel/PixelHamster";
import styles from "./UpdateNotice.module.css";

/**
 * A hamster in the corner that speaks up once per release, and again on
 * click. The click only opens the bubble; it never touches the seen mark.
 */
export function UpdateNotice() {
  const { pathname } = useLocation();
  const [seen, setSeen] = useState(hasSeenLatestUpdate);
  const [open, setOpen] = useState(false);
  const onUpdatePage = pathname === LATEST_UPDATE.path;

  // Reading the update counts, however you got there.
  useEffect(() => {
    if (onUpdatePage && !seen) {
      markLatestUpdateSeen();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors localStorage, an external store
      setSeen(true);
    }
  }, [onUpdatePage, seen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // A timed section has a clock in the corner's place of attention.
  if (/^\/trial\/[^/]+$/.test(pathname)) return null;

  const dismiss = () => {
    markLatestUpdateSeen();
    setSeen(true);
    setOpen(false);
  };
  const close = seen ? () => setOpen(false) : dismiss;
  const showing = !seen || open;

  return (
    <aside className={styles.notice} aria-label="Updates">
      {showing && (
        <div className={styles.bubble}>
          <Link to={LATEST_UPDATE.path} onClick={dismiss}>
            <span className={styles.tag}>
              {seen ? LATEST_UPDATE.id : "New"}
            </span>
            {LATEST_UPDATE.label}
          </Link>
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label="Dismiss update"
          >
            ×
          </button>
        </div>
      )}
      <PixelHamster
        onClick={() => setOpen(!showing)}
        label="Show the latest update"
        expanded={showing}
      />
    </aside>
  );
}
