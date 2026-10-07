import type { ReactNode } from "react";
import styles from "./BarGroup.module.css";

/** Stacks ProgressBars so every track starts at the same x, whatever the label. */
export function BarGroup({ children }: { children: ReactNode }) {
  return <div className={styles.group}>{children}</div>;
}
