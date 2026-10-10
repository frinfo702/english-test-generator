import type { ReactNode } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { TrialItemContext } from "../../hooks/useTrialItem";
import { PixelArrowIcon } from "../ui/PixelArrowIcon";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: string;
  backTo?: string;
  /** Right-aligned controls; sharing the title row saves a row of height. */
  actions?: ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  backTo,
  actions,
}: SectionHeaderProps) {
  const navigate = useNavigate();
  // Inside a practice test, leaving a task goes through the test runner only.
  if (useContext(TrialItemContext)) {
    backTo = undefined;
    actions = undefined;
  }
  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        {backTo && (
          <button
            className={styles.back}
            onClick={() => navigate(backTo)}
            aria-label="Go back"
            type="button"
          >
            <PixelArrowIcon direction="left" size={14} />
          </button>
        )}
        <div className={styles.titles}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
