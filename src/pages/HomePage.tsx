import { Link } from "react-router-dom";
import { HomeHero } from "../components/home/HomeHero";
import { TestLogo } from "../components/ui/TestLogo";
import styles from "./HomePage.module.css";

type Product = {
  number: string;
  label: string;
  logo?: "TOEFL" | "TOEIC";
  title: string;
  description: string;
  meta: string;
  path: string;
  tone: "stone" | "blue" | "green";
};

const products: Product[] = [
  {
    number: "01",
    label: "Test prep",
    logo: "TOEFL",
    title: "TOEFL iBT 2026",
    description:
      "All four sections, twelve task types and the new adaptive reading flow — one calm workspace.",
    meta: "Reading · Writing · Listening · Speaking",
    path: "/toefl",
    tone: "stone",
  },
  {
    number: "02",
    label: "Test prep",
    logo: "TOEIC",
    title: "TOEIC L&R",
    description:
      "Question-Response, conversations, talks and all three reading parts, with a record of every attempt.",
    meta: "Parts 2–7 · Listening and reading",
    path: "/toeic",
    tone: "blue",
  },
  {
    number: "03",
    label: "The full run",
    title: "Practice Test",
    description:
      "A timed TOEFL simulation scored on the 1–6 band scale. Sit the whole thing, or work through it section by section.",
    meta: "Timed · Scored · Reviewable",
    path: "/trial",
    tone: "green",
  },
];

const drills = [
  {
    number: "01",
    title: "Shadowing",
    description: "Speak along with a model voice, sentence by sentence.",
    tag: "Speaking",
    path: "/shadowing",
  },
  {
    number: "02",
    title: "Dictation",
    description: "Hear a line, then rebuild it word by word.",
    tag: "Listening",
    path: "/dictation",
  },
  {
    number: "03",
    title: "Instant Composition",
    description:
      "See the Japanese, say the English before the bar runs out.",
    tag: "Fluency",
    path: "/instant-composition",
  },
  {
    number: "04",
    title: "Speaking Loop",
    description:
      "Talk at 4/3/2, get what you meant in natural English, drill the gaps by voice.",
    tag: "Speaking",
    path: "/speak",
  },
];

const Arrow = ({ diagonal = false }: { diagonal?: boolean }) => (
  <span className={styles.arrow} aria-hidden="true">
    {diagonal ? "↗" : "→"}
  </span>
);

export function HomePage() {
  return (
    <div className={styles.page}>
      <HomeHero />

      <section className={styles.formats} aria-label="What you can practise">
        <div className={styles.container}>
          <p className={styles.formatsLabel}>Built for the formats that matter</p>
          <ul className={styles.formatList}>
            <li>TOEFL iBT 2026</li>
            <li>TOEIC L&amp;R</li>
            <li>AI feedback</li>
            <li>No sign-up</li>
            <li>Local progress</li>
          </ul>
        </div>
      </section>

      <section className={styles.products} aria-labelledby="products-heading">
        <div className={styles.container}>
          <div className={styles.sectionIntro}>
            <p className={styles.sectionLabel}>Start here</p>
            <h2 id="products-heading" className={styles.sectionTitle}>
              Choose the test.
              <br />
              Keep the proof.
            </h2>
            <p className={styles.sectionCopy}>
              Every attempt is saved locally, so you can see the shape of your
              progress rather than guessing at it.
            </p>
          </div>

          <div className={styles.productGrid}>
            {products.map((product) => (
              <Link
                key={product.path}
                to={product.path}
                className={[styles.productCard, styles[product.tone]].join(" ")}
              >
                <span className={styles.productTop}>
                  <span className={styles.productLabel}>
                    {product.label}
                  </span>
                  <span className={styles.productNumber}>{product.number}</span>
                </span>

                <span className={styles.productLogo}>
                  {product.logo ? (
                    <TestLogo name={product.logo} />
                  ) : (
                    <span className={styles.productMark}>1–6</span>
                  )}
                </span>

                <span className={styles.productTitle}>{product.title}</span>
                <span className={styles.productDescription}>
                  {product.description}
                </span>
                <span className={styles.productFooter}>
                  <span className={styles.productMeta}>{product.meta}</span>
                  <span className={styles.productCta}>
                    Explore <Arrow />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.darkBand} aria-labelledby="feedback-heading">
        <div className={styles.container}>
          <div className={styles.darkLayout}>
            <div className={styles.darkIntro}>
              <p className={styles.darkLabel}>
                <span aria-hidden="true" />
                The feedback loop
              </p>
              <h2 id="feedback-heading" className={styles.darkTitle}>
                Not just more questions.
                <br />
                Better next questions.
              </h2>
              <p className={styles.darkCopy}>
                Bring your own AI Gateway key, or copy a ready-made prompt into
                any assistant. Either way, an answer becomes a next step — not
                just a percentage.
              </p>
              <Link
                to="/updates/ai-scoring"
                className={styles.darkLink}
              >
                How scoring works <Arrow diagonal />
              </Link>
            </div>

            <div className={styles.featureList}>
              <Link to="/settings" className={styles.feature}>
                <span className={styles.featureNumber}>01</span>
                <span className={styles.featureBody}>
                  <span className={styles.featureTitle}>
                    Feedback where it matters
                  </span>
                  <span className={styles.featureCopy}>
                    Writing and Speaking scored on language use, with concrete
                    edits and model answers.
                  </span>
                </span>
                <Arrow diagonal />
              </Link>
              <Link to="/toefl/speaking/listen-repeat" className={styles.feature}>
                <span className={styles.featureNumber}>02</span>
                <span className={styles.featureBody}>
                  <span className={styles.featureTitle}>
                    Hear the difference
                  </span>
                  <span className={styles.featureCopy}>
                    Transcriptions sit beside the original so pronunciation and
                    pacing are visible, not vague.
                  </span>
                </span>
                <Arrow diagonal />
              </Link>
              <Link to="/dashboard" className={styles.feature}>
                <span className={styles.featureNumber}>03</span>
                <span className={styles.featureBody}>
                  <span className={styles.featureTitle}>
                    A record that adds up
                  </span>
                  <span className={styles.featureCopy}>
                    Scores, times and trends for every task, kept in this browser
                    and yours to export.
                  </span>
                </span>
                <Arrow diagonal />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.drills} aria-labelledby="drills-heading">
        <div className={styles.container}>
          <div className={styles.drillIntro}>
            <div>
              <p className={styles.sectionLabel}>The daily rep</p>
              <h2 id="drills-heading" className={styles.sectionTitle}>
                Short reps.
                <br />
                Long memory.
              </h2>
            </div>
            <p className={styles.drillIntroCopy}>
              Four small drills for the days when a full section is too much.
              Ten minutes, one answer at a time.
            </p>
          </div>

          <div className={styles.drillList}>
            {drills.map((drill) => (
              <Link key={drill.path} to={drill.path} className={styles.drillRow}>
                <span className={styles.drillNumber}>{drill.number}</span>
                <span className={styles.drillTitle}>{drill.title}</span>
                <span className={styles.drillDescription}>
                  {drill.description}
                </span>
                <span className={styles.drillTag}>{drill.tag}</span>
                <Arrow diagonal />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection} aria-labelledby="cta-heading">
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaCopy}>
              <p className={styles.ctaLabel}>Ready when you are</p>
              <h2 id="cta-heading" className={styles.ctaTitle}>
                Your next score starts
                <br />
                with one answer.
              </h2>
            </div>
            <div className={styles.ctaActions}>
              <Link to="/toefl" className={styles.ctaButton}>
                Start practising <Arrow />
              </Link>
              <p>
                No account required. Progress stays in this browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div>
              <p className={styles.footerLabel}>Keep going</p>
              <p className={styles.footerStatement}>
                Practice makes fluent.
              </p>
            </div>
            <Link to="/toefl" className={styles.footerArrow} aria-label="Start practising">
              ↗
            </Link>
          </div>

          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <span className={styles.footerWordmark}>
                English Test Practice
              </span>
              <p>
                A quieter place to prepare for TOEFL iBT 2026 and TOEIC L&amp;R.
              </p>
            </div>

            <div className={styles.footerColumn}>
              <h3>Tests</h3>
              <Link to="/toefl">TOEFL iBT 2026</Link>
              <Link to="/toeic">TOEIC L&amp;R</Link>
              <Link to="/trial">Practice Test</Link>
            </div>

            <div className={styles.footerColumn}>
              <h3>Drills</h3>
              <Link to="/shadowing">Shadowing</Link>
              <Link to="/dictation">Dictation</Link>
              <Link to="/instant-composition">Instant Composition</Link>
            </div>

            <div className={styles.footerColumn}>
              <h3>Your desk</h3>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/review">Review</Link>
              <Link to="/settings">Settings</Link>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>© 2026 English Test Practice</span>
            <span>Built for practice, not for show.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
