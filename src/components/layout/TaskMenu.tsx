import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchQuestionIndex } from "../../lib/questions";
import styles from "./TaskMenu.module.css";

export interface TaskMenuItem {
  label: string;
  desc: string;
  /** Route path; also the task's directory under public/questions/. */
  path: string;
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

/** Thin-line section marks, drawn on the same 24px grid. */
const LINE_ICONS: Record<string, React.ReactNode> = {
  reading: (
    <>
      <path d="M3.5 5.5c2.8-.8 5.7-.5 8.5 1.2 2.8-1.7 5.7-2 8.5-1.2v13c-2.8-.8-5.7-.4-8.5 1.3-2.8-1.7-5.7-2.1-8.5-1.3z" />
      <path d="M12 6.7v13" />
    </>
  ),
  writing: (
    <>
      <path d="M4 20l4.2-1.1L19 8.1 15.9 5 5.1 15.8 4 20z" />
      <path d="M13.9 7l3.1 3.1" />
      <path d="M4 20h16" />
    </>
  ),
  listening: (
    <>
      <path d="M4.5 13v-1a7.5 7.5 0 0 1 15 0v1" />
      <path d="M4.5 12.5h2.2c.7 0 1.3.6 1.3 1.3v4c0 .7-.6 1.3-1.3 1.3H4.5z" />
      <path d="M19.5 12.5h-2.2c-.7 0-1.3.6-1.3 1.3v4c0 .7.6 1.3 1.3 1.3h2.2z" />
    </>
  ),
  speaking: (
    <>
      <path d="M4 5.5h16v10H9l-4.5 3.3v-3.3H4z" />
      <path d="M8 9v3M12 8v5M16 9.5v2" />
    </>
  ),
};

function LineIcon({ section }: { section: string }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {LINE_ICONS[section]}
    </svg>
  );
}

/** Number of problems registered in each task's index.json, keyed by path. */
function useQuestionCounts(sections: TaskMenuSection[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const paths = sections.flatMap((section) =>
      section.items.map((item) => item.path),
    );
    Promise.all(
      paths.map((path) =>
        fetchQuestionIndex(path.replace(/^\//, ""))
          .then((index): [string, number] => [path, index.files.length])
          .catch((): [string, number] => [path, 0]),
      ),
    ).then((entries) => {
      if (!cancelled) setCounts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [sections]);

  return counts;
}

export function TaskMenu({ sections }: TaskMenuProps) {
  const navigate = useNavigate();
  const counts = useQuestionCounts(sections);

  return (
    <div className={styles.sections}>
      {sections.map((section) => (
        <section key={section.key} className={styles.section}>
          <div className={styles.head}>
            {LINE_ICONS[section.key] && (
              <span
                className={styles.iconWrap}
                style={{ color: section.color }}
              >
                <LineIcon section={section.key} />
              </span>
            )}
            <h2 className={styles.label}>{section.label}</h2>
          </div>

          <div className={styles.list}>
            {section.items.map((item, index) => {
              const count = counts[item.path];
              return (
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
                  {!!count && (
                    <span className={styles.meta}>
                      {count} {count === 1 ? "question" : "questions"}
                    </span>
                  )}
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
