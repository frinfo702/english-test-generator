import { useNavigate } from "react-router-dom";
import styles from "./TaskMenu.module.css";

export interface TaskMenuItem {
  label: string;
  desc: string;
  path: string;
  /** Fixed constraint worth showing: time limit, item count, format note. */
  meta?: string;
}

export interface TaskMenuSection {
  key: string;
  label: string;
  color: string;
  items: TaskMenuItem[];
}

interface TaskMenuProps {
  sections: TaskMenuSection[];
}

export function TaskMenu({ sections }: TaskMenuProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.sections}>
      {sections.map((section) => (
        <section key={section.key} className={styles.section}>
          <div className={styles.head}>
            <span
              className={styles.dot}
              style={{ background: section.color }}
              aria-hidden="true"
            />
            <h2 className={styles.label}>{section.label}</h2>
            <span className={styles.rule} aria-hidden="true" />
            <span className={styles.count}>{section.items.length} tasks</span>
          </div>

          <div className={styles.list}>
            {section.items.map((item, index) => (
              <button
                key={item.path}
                type="button"
                className={styles.row}
                onClick={() => navigate(item.path)}
              >
                <span className={styles.index}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.body}>
                  <span className={styles.title}>{item.label}</span>
                  <span className={styles.desc}>{item.desc}</span>
                </span>
                {item.meta && <span className={styles.meta}>{item.meta}</span>}
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
