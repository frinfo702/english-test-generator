import { PixelArt } from "../pixel/PixelArt";
import { PixelPoodle } from "../pixel/PixelPoodle";
import styles from "./HomeHero.module.css";

// prettier-ignore
const SPARKLES = [
  "...s.......s..........................s",
  "..sss................................sss",
  "...s..................................s",
  "",
  "",
  ".................s",
  "",
  "",
  "",
  "...........................s",
  "",
  ".....................................s",
  "....................................sss",
  ".....................................s",
  "",
  "",
  "",
  ".....................................s",
  "",
  "",
  "",
  "",
  "......................................s",
  "",
  "",
  "..s",
];

// Back to front; each name is also its CSS class (position + tilt).
const PHOTOS = ["hall", "tower"] as const;

export function HomeHero() {
  return (
    <header className={styles.hero}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>TOEFL iBT 2026 · TOEIC L&amp;R</p>
        <h1 className={styles.title}>English Test Practice</h1>
        <p className={styles.lead}>
          Fresh questions every session. Read, write, listen and speak — a
          little bit every day.
        </p>
      </div>
      <div className={styles.art}>
        <PixelArt
          className={styles.sparkles}
          layers={[SPARKLES]}
          palette={{ s: "var(--hero-lime)" }}
          width={40}
          height={27}
        />
        {PHOTOS.map((name) => (
          <img
            key={name}
            className={`${styles.photo} ${styles[name]}`}
            src={`/images/hero/${name}.jpg`}
            alt=""
            width={96}
            height={132}
            decoding="async"
          />
        ))}
        <span className={styles.ground} aria-hidden="true" />
        <PixelPoodle className={styles.poodle} />
        <HelloBubble />
      </div>
    </header>
  );
}

const BUBBLE_INNER = "l".repeat(24);
// prettier-ignore
const BUBBLE = [
  "..".concat("o".repeat(22)),
  ".o".concat("l".repeat(22), "o"),
  ...Array.from({ length: 8 }, () => `o${BUBBLE_INNER}o`),
  ".o".concat("l".repeat(22), "o"),
  "..oooooooo".concat("ll", "o".repeat(12)),
  ".........olo",
  "........oo",
];

function HelloBubble() {
  return (
    <div className={styles.bubble} aria-hidden="true">
      <PixelArt
        layers={[BUBBLE]}
        palette={{ o: "var(--hero-ink)", l: "var(--hero-lime)" }}
        width={26}
        height={13}
        className={styles.bubbleArt}
      />
      <span className={styles.hello}>hello!</span>
    </div>
  );
}
