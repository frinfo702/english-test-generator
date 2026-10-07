import { Link } from "react-router-dom";
import { HomeHero } from "../components/home/HomeHero";
import { PixelIcon } from "../components/pixel/PixelIcon";
import type { PixelIconName } from "../components/pixel/pixelIcons";
import table from "../components/ui/ProblemTable.module.css";
import styles from "./HomePage.module.css";

type TestItem = {
  title: string;
  subtitle: string;
  path: string;
  icon: PixelIconName;
};

const tests: TestItem[] = [
  {
    title: "TOEFL iBT 2026",
    subtitle: "Reading, Writing, Listening, Speaking",
    path: "/toefl",
    icon: "university",
  },
  {
    title: "TOEIC L&R",
    subtitle: "Parts 2–7 — listening and reading",
    path: "/toeic",
    icon: "briefcase",
  },
  {
    title: "Shadowing",
    subtitle: "Speak along with a model voice, sentence by sentence",
    path: "/shadowing",
    icon: "microphone",
  },
  {
    title: "Dictation",
    subtitle: "Hear a line, then rebuild it word by word",
    path: "/dictation",
    icon: "pencil",
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
          {tests.map((test) => (
            <Link key={test.path} to={test.path} className={table.row}>
              <span className={table.statusCol}>
                <PixelIcon name={test.icon} className={styles.rowIcon} />
              </span>
              <span className={table.titleCell}>
                {test.title}
                <span className={table.titleMeta}>{test.subtitle}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
