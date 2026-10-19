import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { SectionHeader } from "../components/layout/SectionHeader";
import styles from "./LearnPage.module.css";

/** Per-element stagger index; set on the element itself, not inherited. */
const at = (i: number, extra?: CSSProperties) =>
  ({ "--i": i, ...extra }) as CSSProperties;

const SECTIONS = [
  ["R", "var(--color-reading)"],
  ["W", "var(--color-writing)"],
  ["L", "var(--color-listening)"],
  ["S", "var(--color-speaking)"],
] as const;

/** TOEFL: the four sections as a path that lights up in order. */
function PathArt() {
  return (
    <div className={styles.path}>
      {SECTIONS.map(([letter, hue], i) => (
        <span
          key={letter}
          className={styles.node}
          style={at(i, { "--hue": hue } as CSSProperties)}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

/** TOEIC: Parts 2–7 as a score chart that regrows on hover. */
function BarsArt() {
  return (
    <div className={styles.bars}>
      {[38, 62, 48, 80, 66, 94].map((h, i) => (
        <span
          key={i}
          className={styles.bar}
          style={at(i, { height: `${h}%` })}
        />
      ))}
    </div>
  );
}

/** Practice test: the four sections stacking into one full run. */
function StackArt() {
  return (
    <div className={styles.stack}>
      {[56, 72, 48, 64].map((w, i) => (
        <span key={i} className={styles.block} style={at(i, { width: w })} />
      ))}
      <span className={styles.ground} />
    </div>
  );
}

/** Shadowing: a voice waveform that starts speaking on hover. */
function WaveArt() {
  return (
    <div className={styles.wave}>
      {[30, 55, 80, 45, 95, 60, 35, 70, 90, 50, 25, 65, 40].map((h, i) => (
        <span
          key={i}
          className={styles.waveBar}
          style={at(i, { height: `${h}%` })}
        />
      ))}
    </div>
  );
}

const DICTATION_WORDS = ["Please", "submit", "it", "today"];

/** Dictation: heard words rolling past, one at a time. */
function TickerArt() {
  return (
    <div className={styles.ticker}>
      <div className={styles.tickerTrack}>
        {/* Doubled so the roll loops without a jump. */}
        {[...DICTATION_WORDS, ...DICTATION_WORDS].map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
    </div>
  );
}

interface Card {
  title: string;
  desc: string;
  cta: string;
  path: string;
  art: ReactNode;
}

const groups: { label: string; cards: Card[] }[] = [
  {
    label: "Tests",
    cards: [
      {
        title: "TOEFL iBT 2026",
        desc: "Reading, Writing, Listening and Speaking, task by task.",
        cta: "Choose a task",
        path: "/toefl",
        art: <PathArt />,
      },
      {
        title: "TOEIC L&R",
        desc: "Parts 2–7, from question-response to triple passages.",
        cta: "Choose a part",
        path: "/toeic",
        art: <BarsArt />,
      },
      {
        title: "Practice Test",
        desc: "A timed TOEFL run, scored on the 1–6 band scale.",
        cta: "Start a test",
        path: "/trial",
        art: <StackArt />,
      },
    ],
  },
  {
    label: "Drills",
    cards: [
      {
        title: "Shadowing",
        desc: "Speak along with a model voice, sentence by sentence.",
        cta: "Start shadowing",
        path: "/shadowing",
        art: <WaveArt />,
      },
      {
        title: "Dictation",
        desc: "Hear a line, then rebuild it word by word.",
        cta: "Start dictation",
        path: "/dictation",
        art: <TickerArt />,
      },
    ],
  },
];

export function LearnPage() {
  return (
    <div>
      <SectionHeader
        title="Learn"
        subtitle="Pick a test or a drill."
        backTo="/"
      />
      {groups.map((group) => (
        <section
          key={group.label}
          className={styles.group}
          aria-labelledby={`learn-${group.label}`}
        >
          <h2 id={`learn-${group.label}`} className={styles.groupLabel}>
            {group.label}
          </h2>
          <ul className={styles.grid}>
            {group.cards.map((card) => (
              <li key={card.path}>
                <Link to={card.path} className={styles.card}>
                  <div className={styles.text}>
                    <span className={styles.title}>{card.title}</span>
                    <span className={styles.desc}>{card.desc}</span>
                    <span className={styles.cta}>
                      {card.cta} <span className={styles.arrow}>→</span>
                    </span>
                  </div>
                  <div className={styles.art} aria-hidden="true">
                    {card.art}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
