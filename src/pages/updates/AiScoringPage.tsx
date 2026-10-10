import { Link } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
// Same journal-entry layout as the introduce and redesign pages.
import styles from "./IntroducePage.module.css";
import own from "./AiScoringPage.module.css";

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

// Rubric rows as the card shows them, out of 5 (they average the 4/5 overall).
const ROWS = [4, 3, 5, 4];
const BAR_X = 284;
const BAR_W = 132;

/** The lead drawing: a score card in line art that draws itself stroke by
 * stroke, then pops its score in. Every mark is in the markup, so with reduced
 * motion (or no Web Animations) the finished drawing simply shows. */
function ScoreDrawing() {
  const ref = useRef<SVGSVGElement>(null);

  // Layout effect: hide the strokes before first paint, so the finished
  // drawing never flashes ahead of the animation.
  useLayoutEffect(() => {
    const svg = ref.current;
    if (
      !svg ||
      typeof svg.animate !== "function" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const anims: Animation[] = [];
    let at = 200;
    svg.querySelectorAll<SVGGeometryElement>("[data-draw]").forEach((el) => {
      const len = el.getTotalLength();
      const duration = Number(el.dataset.draw) || 500;
      anims.push(
        el.animate(
          [
            // Opacity hides the round cap's dot that sits at the start.
            { strokeDasharray: `${len}`, strokeDashoffset: len, opacity: 0 },
            { opacity: 1, offset: 0.02 },
            { strokeDasharray: `${len}`, strokeDashoffset: 0, opacity: 1 },
          ],
          {
            duration,
            delay: at,
            easing: "cubic-bezier(.65,0,.35,1)",
            fill: "backwards",
          },
        ),
      );
      at += duration * 0.45;
    });
    svg.querySelectorAll<SVGElement>("[data-pop]").forEach((el, i) => {
      anims.push(
        el.animate(
          [
            { opacity: 0, transform: "scale(0.4)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          {
            duration: 360,
            delay: at + i * 120,
            easing: "cubic-bezier(.34,1.56,.64,1)",
            fill: "backwards",
          },
        ),
      );
    });
    return () => anims.forEach((a) => a.cancel());
  }, []);

  return (
    <svg
      ref={ref}
      className={own.drawing}
      viewBox="0 0 640 300"
      role="img"
      aria-label="A score card drawing itself: 4 out of 5 on a ring gauge, four rubric bars, and a check stamp"
    >
      {/* Registration marks in the corners, like a blueprint. */}
      <path className={own.faint} d="M24 32h16M32 24v16M600 32h16M608 24v16" />
      <rect
        className={own.line}
        data-draw="900"
        x="200"
        y="34"
        width="240"
        height="214"
        rx="12"
      />
      <path className={own.line} data-draw="400" d="M224 66h96" />
      <path className={own.faint} data-draw="300" d="M224 86h64" />
      <circle className={own.faint} cx="390" cy="80" r="26" />
      {/* 4/5 of the ring: clockwise from 12 o'clock to 288°. */}
      <path
        className={own.signal}
        data-draw="800"
        d="M390 54A26 26 0 1 1 365.27 71.97"
      />
      {ROWS.map((score, i) => {
        const y = 136 + i * 28;
        return (
          <g key={y}>
            <path className={own.faint} data-draw="250" d={`M224 ${y}h36`} />
            <path className={own.track} d={`M${BAR_X} ${y}h${BAR_W}`} />
            <path
              className={own.signal}
              data-draw="450"
              d={`M${BAR_X} ${y}h${(BAR_W * score) / 5}`}
            />
          </g>
        );
      })}
      <circle
        className={`${own.line} ${own.stamp}`}
        data-draw="500"
        cx="448"
        cy="244"
        r="24"
      />
      <path className={own.line} data-draw="350" d="M437 244l8 8 15-16" />
      <text className={own.score} data-pop x="390" y="85" textAnchor="middle">
        4/5
      </text>
      {/* Sparks around the card. */}
      <path
        className={own.spark}
        data-pop
        d="M168 70l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"
      />
      <path
        className={own.spark}
        data-pop
        d="M486 116l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"
      />
      <circle className={own.dot} data-pop cx="160" cy="200" r="4" />
      <circle className={own.dot} data-pop cx="500" cy="60" r="3" />
    </svg>
  );
}

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
          <ScoreDrawing />
        </div>
        <figcaption className={styles.meta}>
          The card from a Writing answer: 4/5 overall, then every rubric point
          rated on its own row. Drawn in code, one stroke at a time.
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
