import { useNavigate } from "react-router-dom";
import { ProgressBar } from "../ui/ProgressBar";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  current?: number;
  total?: number;
  backTo?: string;
}

export function SectionHeader({ title, subtitle, current, total, backTo }: SectionHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        {backTo && (
          <button className={styles.back} onClick={() => navigate(backTo)}>
            ← 戻る
          </button>
        )}
        <div className={styles.titles}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {current !== undefined && total !== undefined && total > 0 && (
        <ProgressBar current={current} total={total} />
      )}
    </div>
  );
}
