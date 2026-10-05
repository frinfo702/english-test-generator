import { Link } from "react-router-dom";
import { HomeHero } from "../components/home/HomeHero";
import table from "../components/ui/ProblemTable.module.css";
import styles from "./HomePage.module.css";

type TestItem = {
  title: string;
  subtitle: string;
  meta: string;
  path: string;
};

const tests: TestItem[] = [
  {
    title: "TOEFL iBT 2026",
    subtitle: "Reading, Writing, Listening, Speaking",
    meta: "12 tasks",
    path: "/toefl",
  },
  {
    title: "TOEIC L&R",
    subtitle: "Parts 2–7 — listening and reading",
    meta: "6 parts",
    path: "/toeic",
  },
  {
    title: "Shadowing",
    subtitle: "Speak along with a model voice, sentence by sentence",
    meta: "Sets",
    path: "/shadowing",
  },
  {
    title: "Dictation",
    subtitle: "Hear a line, then rebuild it word by word",
    meta: "Sets",
    path: "/dictation",
  },
];

export function HomePage() {
  return (
    <div className={styles.page}>
      <HomeHero />

      <section aria-labelledby="suites-heading">
        <div className={styles.sectionHead}>
          <h2 id="suites-heading" className={styles.sectionTitle}>
            Practice
          </h2>
        </div>
        <div className={table.container}>
          {tests.map((test, i) => (
            <Link key={test.path} to={test.path} className={table.row}>
              <span className={table.statusCol}>
                <span className={table.statusNone}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </span>
              <span className={table.titleCell}>
                {test.title}
                <span className={table.titleMeta}>{test.subtitle}</span>
              </span>
              <span className={table.badgeCell}>{test.meta}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
