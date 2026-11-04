import { Link } from "react-router-dom";
import { PixelPoodle } from "../pixel/PixelPoodle";
import styles from "./HomeHero.module.css";

const QUESTION = [
  "They create small pockets of nature in dense areas.",
  "They replace the need for larger public parks.",
  "They reduce the cost of city planning.",
];

export function HomeHero() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowMark} aria-hidden="true" />
          TOEFL iBT 2026 <span aria-hidden="true">·</span> TOEIC L&amp;R
        </p>

        <h1 className={styles.title}>
          Practice English.
          <br />
          Keep the proof.
        </h1>

        <p className={styles.lead}>
          A quiet, focused place to put in the reps — real questions, timed
          practice tests and feedback you can act on. No account. No noise.
        </p>

        <div className={styles.actions}>
          <Link to="/toefl" className={styles.primaryCta}>
            Start practising <span aria-hidden="true">→</span>
          </Link>
          <Link to="/trial" className={styles.secondaryCta}>
            Take a practice test <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <div className={styles.media}>
        <div className={styles.console} aria-hidden="true">
          <div className={styles.consoleTop}>
            <span className={styles.windowDots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className={styles.consoleTitle}>Study desk</span>
            <span className={styles.liveChip}>
              <i aria-hidden="true" /> Session live
            </span>
          </div>

          <div className={styles.consoleBody}>
            <aside className={styles.rail} aria-hidden="true">
              <span className={styles.railLabel}>Today</span>
              <span className={styles.railItemActive}>
                <span>Practice</span>
                <b>01</b>
              </span>
              <span className={styles.railItem}>
                <span>Review</span>
                <b>02</b>
              </span>
              <span className={styles.railItem}>
                <span>Progress</span>
                <b>03</b>
              </span>
              <span className={styles.railSpacer} />
              <span className={styles.railMini}>
                17 min <small>focused today</small>
              </span>
            </aside>

            <div className={styles.panel}>
              <div className={styles.panelMeta}>
                <span>TOEFL Reading · Passage 2</span>
                <span>04 / 21</span>
              </div>
              <h2 className={styles.panelTitle}>Read an Academic Passage</h2>
              <p className={styles.panelQuestion}>
                According to the passage, what is one benefit of pocket parks?
              </p>

              <div className={styles.options}>
                {QUESTION.map((option, i) => (
                  <span
                    key={option}
                    className={[
                      styles.option,
                      i === 0 ? styles.optionSelected : "",
                    ].join(" ")}
                  >
                    <span className={styles.optionLetter}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{option}</span>
                    {i === 0 && (
                      <span className={styles.optionCheck} aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </span>
                ))}
              </div>

              <div className={styles.consoleFooter}>
                <span className={styles.correctChip}>Correct answer</span>
                <span className={styles.answerNote}>+1 point</span>
                <span className={styles.consoleTime}>00:48</span>
              </div>
            </div>
          </div>

          <div className={styles.consoleStatus}>
            <span>Next: Review this question</span>
            <span className={styles.statusDots} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>

        <div className={styles.photoCard}>
          <img
            className={styles.photo}
            src="/images/hero/tower.jpg"
            alt=""
            width={400}
            height={600}
            decoding="async"
          />
          <span className={styles.photoWash} aria-hidden="true" />
          <div className={styles.photoTop}>
            <span className={styles.photoLabel}>The daily rep</span>
            <span className={styles.photoIndex}>No. 01</span>
          </div>

          <div className={styles.buddy}>
            <span className={styles.buddyLabel}>Study buddy</span>
            <PixelPoodle className={styles.poodle} />
          </div>

          <div className={styles.photoContent}>
            <p className={styles.photoTitle}>A small ritual, repeated.</p>
            <p className={styles.photoCopy}>
              Ten quiet minutes. A clearer answer next time.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
