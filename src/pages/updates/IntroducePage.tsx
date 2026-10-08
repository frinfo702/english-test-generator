import { Link } from "react-router-dom";
import { PixelArt } from "../../components/pixel/PixelArt";
import styles from "./IntroducePage.module.css";
import {
  LOAF_HAMSTER,
  LOAF_HAMSTER_H,
  LOAF_HAMSTER_PALETTE,
  LOAF_HAMSTER_W,
  LYING_HAMSTER,
  LYING_HAMSTER_H,
  LYING_HAMSTER_PALETTE,
  LYING_HAMSTER_W,
  Z,
} from "./introSprites";

// The home hero's indigo, stepped darkest at the bottom, with one lime step
// on top; each is one pixel-block row.
const BARS = ["#1f1e52", "#34337a", "#4a49a3", "#6e6dc4", "#eef59a"];

const SECTIONS: {
  title: string;
  body: React.ReactNode;
}[] = [
  {
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
    title: "What it costs",
    body: <p>Nothing. No sign-up, no account. Open it and start.</p>,
  },
  {
    title: "What is next",
    body: (
      <p>
        More question sets for every task, added a few at a time. The score
        estimate gets sharper with each practice test you take. When something
        new lands, the hamster in the corner will tell you.
      </p>
    ),
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
          timing, and two sleepy hamsters keeping you company.
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
        <PixelArt
          layers={[LOAF_HAMSTER]}
          palette={LOAF_HAMSTER_PALETTE}
          width={LOAF_HAMSTER_W}
          height={LOAF_HAMSTER_H}
          className={styles.loaf}
          title="A cream hamster curled up asleep"
        />
        <PixelArt
          layers={[LYING_HAMSTER]}
          palette={LYING_HAMSTER_PALETTE}
          width={LYING_HAMSTER_W}
          height={LYING_HAMSTER_H}
          className={styles.splat}
          title="A white hamster asleep on its side"
        />
        <div className={styles.zs} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <PixelArt
              key={i}
              layers={[Z]}
              palette={{ o: "currentColor" }}
              width={5}
              height={5}
              className={styles.z}
            />
          ))}
        </div>
      </figure>

      {SECTIONS.map((s) => (
        <section key={s.title} className={styles.section}>
          <h2 className={styles.h2}>{s.title}</h2>
          {s.body}
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
