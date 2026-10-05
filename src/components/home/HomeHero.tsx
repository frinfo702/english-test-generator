import styles from "./HomeHero.module.css";

// Photos: public domain / CC0 via Wikimedia Commons — see public/images/hero/CREDITS.md
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
        <img
          className={`${styles.photo} ${styles.photoBack}`}
          src="/images/hero/hall.jpg"
          alt=""
          width={320}
          height={480}
          loading="lazy"
        />
        <img
          className={`${styles.photo} ${styles.photoFront}`}
          src="/images/hero/tower.jpg"
          alt=""
          width={320}
          height={480}
          loading="lazy"
        />
        <HelloBubble />
      </div>
    </header>
  );
}

function HelloBubble() {
  return (
    <svg className={styles.bubble} viewBox="0 0 80 62" aria-hidden="true">
      <path
        d="M4 30 C4 12 24 4 40 4 C62 4 76 14 76 30 C76 46 62 54 42 54 C34 54 28 53 22 50 L8 60 L12 46 C7 42 4 37 4 30 Z"
        fill="var(--hero-lime)"
        stroke="var(--hero-ink)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text
        x="41"
        y="36"
        textAnchor="middle"
        transform="rotate(-8 41 32)"
        className={styles.hello}
      >
        hello
      </text>
    </svg>
  );
}
