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
        <Doodles />
      </div>
    </header>
  );
}

function Doodles() {
  return (
    <svg className={styles.doodles} viewBox="0 0 300 200" aria-hidden="true">
      {/* Sparkles */}
      <g className={styles.twinkle} fill="var(--hero-lime)">
        <path d="M18 40 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
        <path
          className={styles.twinkleDelay}
          d="M100 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"
        />
        <path d="M286 172 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
      </g>

      {/* Graduation cap */}
      <g className={styles.cap}>
        <path
          d="M30 170 v12 q22 11 44 0 v-12"
          fill="var(--hero-ink)"
          stroke="var(--hero-ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M14 162 L52 147 L90 162 L52 177 Z"
          fill="var(--hero-ink)"
          stroke="#fff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M52 162 Q76 168 82 186"
          fill="none"
          stroke="var(--hero-orange)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="82" cy="189" r="4" fill="var(--hero-orange)" />
      </g>

      {/* "hello" bubble */}
      <g className={styles.bubble}>
        <path
          d="M222 34 C222 16 242 8 258 8 C280 8 296 18 296 34 C296 50 280 58 260 58 C252 58 246 57 240 54 L226 64 L230 50 C225 46 222 41 222 34 Z"
          fill="var(--hero-lime)"
          stroke="var(--hero-ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <text
          x="259"
          y="40"
          textAnchor="middle"
          transform="rotate(-8 259 36)"
          className={styles.hello}
        >
          hello
        </text>
      </g>

      {/* Little friends */}
      <g className={styles.friendA}>
        <circle
          cx="200"
          cy="70"
          r="13"
          fill="var(--hero-lime)"
          stroke="var(--hero-ink)"
          strokeWidth="2.2"
        />
        <path
          d="M187 68 C188 54 212 54 213 68 C206 62 196 62 187 68 Z"
          fill="var(--hero-ink)"
        />
        <circle cx="195" cy="72" r="1.6" fill="var(--hero-ink)" />
        <circle cx="205" cy="72" r="1.6" fill="var(--hero-ink)" />
        <path
          d="M196 77 Q200 81 204 77"
          fill="none"
          stroke="var(--hero-ink)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
      <g className={styles.friendB}>
        <circle
          cx="282"
          cy="88"
          r="12"
          fill="var(--hero-lime)"
          stroke="var(--hero-ink)"
          strokeWidth="2.2"
        />
        <path
          d="M282 76 L286 66"
          stroke="var(--hero-ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="287" cy="65" r="2.5" fill="var(--hero-orange)" />
        <circle cx="277" cy="88" r="1.6" fill="var(--hero-ink)" />
        <circle cx="287" cy="88" r="1.6" fill="var(--hero-ink)" />
        <path
          d="M277 93 Q282 98 287 93"
          fill="var(--hero-ink)"
          stroke="var(--hero-ink)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
