import styles from "./HomeHero.module.css";

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
      <HeroIllustration />
    </header>
  );
}

function HeroIllustration() {
  return (
    <svg
      className={styles.art}
      viewBox="0 0 320 200"
      role="img"
      aria-label="A student with headphones and books, saying hello with friends"
    >
      {/* Sparkles */}
      <g className={styles.twinkle} fill="var(--hero-lime)">
        <path d="M30 40 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
        <path
          className={styles.twinkleDelay}
          d="M118 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"
        />
        <path d="M300 160 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
      </g>

      {/* Graduation cap */}
      <g className={styles.cap}>
        <path
          d="M52 160 v14 q24 12 48 0 v-14"
          fill="var(--hero-ink)"
          stroke="var(--hero-ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M36 152 L76 136 L116 152 L76 168 Z"
          fill="var(--hero-ink)"
          stroke="#fff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M76 152 Q100 158 108 176"
          fill="none"
          stroke="var(--hero-orange)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="108" cy="179" r="4" fill="var(--hero-orange)" />
      </g>

      {/* Student */}
      <g className={styles.student}>
        {/* Hair (back) */}
        <path
          d="M140 102 C138 70 202 70 200 102 L204 146 L186 140 L186 110 L154 110 L154 140 L136 146 Z"
          fill="var(--hero-ink)"
        />
        {/* Sweater */}
        <path
          d="M118 202 C118 166 138 146 170 146 C202 146 222 166 222 202 Z"
          fill="var(--hero-lilac)"
          stroke="var(--hero-ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Neck */}
        <path d="M162 128 h16 v20 h-16z" fill="var(--hero-skin)" />
        {/* Headphones around neck */}
        <path
          d="M150 144 Q170 162 190 144"
          fill="none"
          stroke="#f4f1ea"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <ellipse
          cx="148"
          cy="142"
          rx="7"
          ry="9"
          fill="#f4f1ea"
          stroke="var(--hero-ink)"
          strokeWidth="2"
        />
        <ellipse
          cx="192"
          cy="142"
          rx="7"
          ry="9"
          fill="#f4f1ea"
          stroke="var(--hero-ink)"
          strokeWidth="2"
        />
        {/* Head */}
        <g className={styles.head}>
          <circle
            cx="170"
            cy="106"
            r="27"
            fill="var(--hero-skin)"
            stroke="var(--hero-ink)"
            strokeWidth="2.5"
          />
          {/* Bangs */}
          <path
            d="M142 104 C142 76 198 74 198 104 C190 94 178 88 168 92 C158 96 150 98 142 104 Z"
            fill="var(--hero-ink)"
          />
          {/* Face */}
          <ellipse cx="160" cy="110" rx="2.4" ry="3" fill="var(--hero-ink)" />
          <ellipse cx="180" cy="110" rx="2.4" ry="3" fill="var(--hero-ink)" />
          <circle cx="154" cy="118" r="4" fill="var(--hero-cheek)" />
          <circle cx="186" cy="118" r="4" fill="var(--hero-cheek)" />
          <path
            d="M163 119 Q170 126 177 119"
            fill="none"
            stroke="var(--hero-ink)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>
        {/* Books */}
        <g transform="rotate(-10 200 176)">
          <rect
            x="184"
            y="156"
            width="34"
            height="12"
            rx="2"
            fill="var(--hero-orange)"
            stroke="var(--hero-ink)"
            strokeWidth="2"
          />
          <rect
            x="181"
            y="168"
            width="38"
            height="12"
            rx="2"
            fill="var(--hero-lime)"
            stroke="var(--hero-ink)"
            strokeWidth="2"
          />
          <rect
            x="186"
            y="180"
            width="32"
            height="11"
            rx="2"
            fill="#fff"
            stroke="var(--hero-ink)"
            strokeWidth="2"
          />
        </g>
        {/* Hand */}
        <circle
          cx="186"
          cy="176"
          r="7"
          fill="var(--hero-skin)"
          stroke="var(--hero-ink)"
          strokeWidth="2"
        />
      </g>

      {/* "hello" bubble */}
      <g className={styles.bubble}>
        <path
          d="M232 40 C232 22 252 14 268 14 C290 14 306 24 306 40 C306 56 290 64 270 64 C262 64 256 63 250 60 L236 70 L240 56 C235 52 232 47 232 40 Z"
          fill="var(--hero-lime)"
          stroke="var(--hero-ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <text
          x="269"
          y="46"
          textAnchor="middle"
          transform="rotate(-8 269 42)"
          className={styles.hello}
        >
          hello
        </text>
      </g>

      {/* Little friends */}
      <g className={styles.friendA}>
        <circle
          cx="222"
          cy="86"
          r="13"
          fill="var(--hero-lime)"
          stroke="var(--hero-ink)"
          strokeWidth="2.2"
        />
        <path
          d="M209 84 C210 70 234 70 235 84 C228 78 218 78 209 84 Z"
          fill="var(--hero-ink)"
        />
        <circle cx="217" cy="88" r="1.6" fill="var(--hero-ink)" />
        <circle cx="227" cy="88" r="1.6" fill="var(--hero-ink)" />
        <path
          d="M218 93 Q222 97 226 93"
          fill="none"
          stroke="var(--hero-ink)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
      <g className={styles.friendB}>
        <circle
          cx="294"
          cy="96"
          r="12"
          fill="var(--hero-lime)"
          stroke="var(--hero-ink)"
          strokeWidth="2.2"
        />
        <path
          d="M294 84 L298 74"
          stroke="var(--hero-ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="299" cy="73" r="2.5" fill="var(--hero-orange)" />
        <circle cx="289" cy="96" r="1.6" fill="var(--hero-ink)" />
        <circle cx="299" cy="96" r="1.6" fill="var(--hero-ink)" />
        <path
          d="M289 101 Q294 106 299 101"
          fill="var(--hero-ink)"
          stroke="var(--hero-ink)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
