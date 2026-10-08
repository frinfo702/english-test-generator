import { Link } from "react-router-dom";
import { PixelIcon } from "../../components/pixel/PixelIcon";
import type { PixelIconName } from "../../components/pixel/pixelIcons";
import { PixelPoodle } from "../../components/pixel/PixelPoodle";
import styles from "./IntroducePage.module.css";

// Mistral's stepped warm bars, red → yellow; each is one pixel-block row.
const BARS = ["#e10500", "#fa500f", "#ff8205", "#ffaf00", "#ffd800"];

const SECTIONS: {
  icon: PixelIconName;
  title: string;
  body: React.ReactNode;
}[] = [
  {
    icon: "book",
    title: "What is available",
    body: (
      <>
        <p>
          Every task in the TOEFL iBT 2026 format: Reading, Listening, Writing
          and Speaking. Plus TOEIC L&amp;R, shadowing and dictation.
        </p>
        <ul className={styles.chips}>
          <li>Complete the Words</li>
          <li>Build a Sentence</li>
          <li>Listen and Repeat</li>
          <li>Take an Interview</li>
          <li>TOEIC Part 2–7</li>
        </ul>
      </>
    ),
  },
  {
    icon: "microphone",
    title: "What to expect",
    body: (
      <p>
        Timed sections, adaptive modules and real-test pacing. Speaking is
        scored for pronunciation and pace, and every attempt is saved in your
        browser so the dashboard can track your streak and band estimate.
      </p>
    ),
  },
  {
    icon: "briefcase",
    title: "What it costs",
    body: <p>Nothing. No sign-up, no account. Open it and start.</p>,
  },
  {
    icon: "pencil",
    title: "What is next",
    // TODO(human)
    body: <p />,
  },
];

export function IntroducePage() {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Update</p>
        <h1 className={styles.title}>English Test Practice is open</h1>
        <p className={styles.meta}>
          English Test Practice team ·{" "}
          <time dateTime="2026-10-08">8 October 2026</time>
        </p>
        <p className={styles.lead}>
          A practice room for the new TOEFL and TOEIC. Fresh questions, real
          timing, and a small black poodle keeping you company.
        </p>
      </header>

      <figure className={styles.hero}>
        <div className={styles.bars} aria-hidden="true">
          {BARS.map((c, i) => (
            <span
              key={c}
              style={{ background: c, width: `${100 - i * 14}%` }}
            />
          ))}
        </div>
        <PixelPoodle excited className={styles.poodle} />
        <span className={styles.bubble} aria-hidden="true">
          Let&apos;s practice!
        </span>
      </figure>

      {SECTIONS.map((s) => (
        <section key={s.title} className={styles.section}>
          <PixelIcon name={s.icon} className={styles.icon} />
          <div>
            <h2 className={styles.h2}>{s.title}</h2>
            {s.body}
          </div>
        </section>
      ))}

      <footer className={styles.cta}>
        <p className={styles.ctaTitle}>Ready when you are.</p>
        <div className={styles.ctaLinks}>
          <Link to="/toefl" className={styles.primary}>
            Start practicing
          </Link>
          <Link to="/trial" className={styles.secondary}>
            Take a practice test
          </Link>
        </div>
        <div className={styles.footBars} aria-hidden="true">
          {BARS.map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
        </div>
      </footer>
    </article>
  );
}
