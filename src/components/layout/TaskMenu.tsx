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

/** Pixel-art section icons, keyed by section key. "#" = filled pixel. */
const PIXEL_ICONS: Record<string, string[]> = {
  reading: [
    "##.....##",
    "#.##.##.#",
    "#...#...#",
    "#...#...#",
    "#...#...#",
    "#...#...#",
    "###.#.###",
    "...###...",
  ],
  writing: [
    "......##",
    ".....#.#",
    "....#.##",
    "...#.#..",
    "..#.#...",
    ".#.#....",
    "#.#.....",
    "##......",
  ],
  listening: [
    "..####..",
    ".#....#.",
    "#......#",
    "#......#",
    "##....##",
    "##....##",
    "##....##",
    "........",
  ],
  speaking: [
    ".######.",
    "#......#",
    "#.#.#.##",
    "#......#",
    ".##.###.",
    "..##....",
    "..#.....",
    "........",
  ],
};

function PixelIcon({ grid, color }: { grid: string[]; color: string }) {
  return (
    <svg
      className={styles.icon}
      viewBox={`0 0 ${grid[0].length} ${grid.length}`}
      shapeRendering="crispEdges"
      fill={color}
      aria-hidden="true"
    >
      {grid.flatMap((row, y) =>
        [...row].map((cell, x) =>
          cell === "#" ? (
            <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} />
          ) : null,
        ),
      )}
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
            {PIXEL_ICONS[section.key] && (
              <PixelIcon
                grid={PIXEL_ICONS[section.key]}
                color={section.color}
              />
            )}
            <h2 className={styles.label}>{section.label}</h2>
            <span className={styles.rule} aria-hidden="true" />
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
                  {count !== undefined && (
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
