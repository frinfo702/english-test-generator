import { Link } from "react-router-dom";
import { PixelArt } from "../../components/pixel/PixelArt";
import {
  HAMSTER_BODY,
  HAMSTER_EARS,
  HAMSTER_H,
  HAMSTER_PALETTE,
  HAMSTER_PAWS_DOWN,
  HAMSTER_W,
} from "../../components/pixel/hamsterSprite";
// Same journal-entry layout as the introduce and redesign pages.
import styles from "./IntroducePage.module.css";
import own from "./AiScoringPage.module.css";
import {
  SCORE_SHEET,
  SCORE_SHEET_H,
  SCORE_SHEET_PALETTE,
  SCORE_SHEET_W,
  SPARK,
  SPARK_H,
  SPARK_SMALL,
  SPARK_SMALL_H,
  SPARK_SMALL_W,
  SPARK_W,
} from "./aiScoringSprites";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "What changed",
    body: (
      <>
        <p>
          Finish a Writing answer and it can come back scored: an overall result
          out of 5, then every rubric point rated on its own row with a short
          note. Speaking answers get an AI score the same way, and practice
          tests are scored too.
        </p>
        <ul className={styles.chips}>
          <li>Write an Email</li>
          <li>Academic Discussion</li>
          <li>Take an Interview</li>
          <li>Practice tests</li>
        </ul>
      </>
    ),
  },
  {
    title: "How it works",
    body: (
      <>
        <p>
          Add a Vercel AI Gateway key in Settings and automatic scoring switches
          on. The moment an answer finishes — a submitted email or discussion,
          or the end of an interview response — scoring starts in the
          background, so you can move on to the next question while it runs. The
          score is saved with the answer, and the practice-test report shows it
          while you review.
        </p>
        <p>
          Copy &amp; paste into any AI chat still works, and a score that fails
          can be retried or finished by hand.
        </p>
      </>
    ),
  },
  {
    title: "Your key, your spend",
    body: (
      <p>
        The key is kept only in this browser and sent only to
        ai-gateway.vercel.sh — never to our servers. You pay the gateway for
        what you use, usually well under a cent per answer, and you pick the
        model: Claude Haiku 5.5 and GPT-6 Luna are recommended, or paste any
        gateway model ID. On a shared computer, remove the key when you are
        done.
      </p>
    ),
  },
  {
    title: "On your phone",
    body: (
      <p>
        The score card stacks under your answer on a phone, and dark mode gets
        the same sheet in carbon paper. The drawing above steps down to fit the
        smaller stage.
      </p>
    ),
  },
];

export function AiScoringPage() {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Update</p>
        <h1 className={styles.title}>Scored when you finish</h1>
        <p className={styles.meta}>
          English Test Practice team ·{" "}
          <time dateTime="2026-10-10">10 October 2026</time>
        </p>
        <p className={styles.lead}>
          Writing and Speaking answers can now be scored right on the page, with
          your own Vercel AI Gateway key. No copy &amp; paste.
        </p>
      </header>

      <figure className={own.figure}>
        <div className={own.stage}>
          <div className={own.ground} aria-hidden="true" />
          <PixelArt
            layers={[SCORE_SHEET]}
            palette={SCORE_SHEET_PALETTE}
            width={SCORE_SHEET_W}
            height={SCORE_SHEET_H}
            className={own.sheet}
            title="A score card: 4 out of 5, with four rubric rows of five score blocks"
          />
          <PixelArt
            layers={[HAMSTER_EARS, HAMSTER_BODY, HAMSTER_PAWS_DOWN]}
            palette={HAMSTER_PALETTE}
            width={HAMSTER_W}
            height={HAMSTER_H}
            className={own.hamster}
            title="A cream hamster nibbling a seed beside the score card"
          />
          <span className={own.sparkA} aria-hidden="true">
            <PixelArt
              layers={[SPARK]}
              palette={{ s: "currentColor" }}
              width={SPARK_W}
              height={SPARK_H}
              className={own.sparkArt}
            />
          </span>
          <span className={own.sparkB} aria-hidden="true">
            <PixelArt
              layers={[SPARK_SMALL]}
              palette={{ s: "currentColor" }}
              width={SPARK_SMALL_W}
              height={SPARK_SMALL_H}
              className={own.sparkArt}
            />
          </span>
        </div>
        <figcaption className={styles.meta}>
          The card from a Writing answer: 4/5 overall, then every rubric point
          rated on its own row. Drawn in the page&apos;s own pixel grid.
        </figcaption>
      </figure>

      {SECTIONS.map((s) => (
        <section key={s.title} className={styles.section}>
          <h2 className={styles.h2}>{s.title}</h2>
          {s.body}
        </section>
      ))}

      <footer className={styles.cta}>
        <p className={styles.ctaTitle}>Add a key, or keep going without one.</p>
        <div className={styles.ctaLinks}>
          <Link to="/settings" className={styles.primary}>
            Add your key
          </Link>
          <Link to="/trial" className={styles.secondary}>
            Take a practice test
          </Link>
        </div>
      </footer>
    </article>
  );
}
