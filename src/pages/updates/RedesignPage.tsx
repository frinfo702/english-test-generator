import { Link } from "react-router-dom";
// Same journal-entry layout as the introduce page; only the video is new.
import styles from "./IntroducePage.module.css";
import own from "./RedesignPage.module.css";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "What changed",
    body: (
      <>
        <p>
          The app now reads like a notebook: warm paper, near-black ink and one
          orange signal, borrowed from the poodle&apos;s collar. Titles and big
          numbers are set in Geist; counts, timers and labels in Geist Mono.
          Lists and sections open on a ruled line instead of a card.
        </p>
        <ul className={styles.chips}>
          <li>Paper and ink</li>
          <li>One orange signal</li>
          <li>Geist type</li>
          <li>Hairline rules</li>
          <li>Pixel stage</li>
        </ul>
      </>
    ),
  },
  {
    title: "On your phone",
    body: (
      <p>
        Page heads wrap instead of squeezing, the timer moves out of the way,
        and the practice test report folds into a single column.
      </p>
    ),
  },
  {
    title: "What stayed",
    body: (
      <p>
        Every task, every question and your saved history. Dark mode is still
        one switch away, and it got the same treatment.
      </p>
    ),
  },
];

export function RedesignPage() {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Update</p>
        <h1 className={styles.title}>A new look: Field Notes</h1>
        <p className={styles.meta}>
          English Test Practice team ·{" "}
          <time dateTime="2026-10-10">10 October 2026</time>
        </p>
        <p className={styles.lead}>
          Same practice, fresh pages. Thirty seconds of the redesign, on desktop
          and on a phone.
        </p>
      </header>

      <figure className={own.figure}>
        <video
          className={own.video}
          src="/updates/redesign.mp4"
          poster="/updates/redesign-poster.jpg"
          width={1280}
          height={720}
          controls
          muted
          playsInline
          preload="metadata"
        >
          <a href="/updates/redesign.mp4">Download the video</a>
        </video>
        <figcaption className={styles.meta}>
          Home, task menu, a reading passage, the score card, the dashboard,
          phones and dark mode. No sound.
        </figcaption>
      </figure>

      {SECTIONS.map((s) => (
        <section key={s.title} className={styles.section}>
          <h2 className={styles.h2}>{s.title}</h2>
          {s.body}
        </section>
      ))}

      <footer className={styles.cta}>
        <p className={styles.ctaTitle}>Take a look around.</p>
        <div className={styles.ctaLinks}>
          <Link to="/" className={styles.primary}>
            Open the home page
          </Link>
          <Link to="/toefl" className={styles.secondary}>
            Start practicing
          </Link>
        </div>
      </footer>
    </article>
  );
}
