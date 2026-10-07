import { useEffect, useState } from "react";
import { PERFECT_SCORE_EVENT } from "../../hooks/useScoreHistory";
import { PixelArt } from "./PixelArt";
import styles from "./PerfectCelebration.module.css";

const SHOW_MS = 3200;

const PALETTE = {
  O: "#fa500f",
  Y: "#ffc21a",
  W: "#fff4c2",
  K: "#a8a29a",
  R: "#ff4d6d",
  B: "#5aa9ff",
  G: "#6cc08b",
  P: "#c77dff",
};

// 🎉 cone with its tip at the bottom-left, streamers out of the mouth.
// prettier-ignore
const POPPER = [
  ".........G..P.B",
  "........P..R...Y",
  "",
  "..........Y..B",
  "...............G",
  "....W......B.R",
  "....YW........P",
  "....YYW",
  "...OYYYW.......R",
  "...OOYYYW",
  "...OOOYYYW",
  "..YYOOOYYYW",
  "..YYYOOO",
  "..OYY",
  ".O",
];

// 🎊 ball hanging from a string, split open with confetti spilling out.
// prettier-ignore
const BALL = [
  ".......K",
  ".......K",
  ".......K",
  "....OYYWYYO",
  "....YYWYYYY",
  "...YYWYYYYWY",
  "...YWYYYYWYY",
  "...WYYY..YYY",
  "...YYYY..YYY",
  "...YYYW..YYW",
  "....YWY..YW",
  ".....YY..W",
  ".......PG",
  ".....GR..BP",
  ".......G",
  ".....Y..P.R",
];

const BIT_COLORS = ["#ffc21a", "#fa500f", "#6cc08b", "#5aa9ff", "#ff4d6d"];

// Launched from below both bottom corners. The pattern is fixed rather than
// random so every celebration looks the same and renders stay pure.
const PIECES = Array.from({ length: 30 }, (_, i) => {
  const side = i % 2 ? 1 : -1;
  const k = i >> 1;
  const kind = k === 1 ? "ball" : k === 0 || k === 2 ? "popper" : "bit";
  return {
    kind,
    side,
    sx: `${side * (38 + (k % 3) * 6)}vw`,
    ex: `${side * (4 + ((k * 13) % 34))}vw`,
    peak: `${-(55 + ((k * 17) % 30))}vh`,
    spin: `${side * (kind === "bit" ? 360 + ((k * 97) % 540) : 20 + k * 6)}deg`,
    duration: `${2300 + (k % 4) * 200}ms`,
    delay: `${(k % 5) * 70}ms`,
    color: BIT_COLORS[k % BIT_COLORS.length],
    long: k % 2 === 0,
  };
});

/** Fires pixel 🎉🎊 and confetti across the page when a perfect score is saved. */
export function PerfectCelebration() {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let timer: number | undefined;
    const onPerfect = () => {
      // A new key remounts the overlay, so back-to-back perfects replay it.
      setShown((n) => n + 1);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setShown(0), SHOW_MS);
    };
    window.addEventListener(PERFECT_SCORE_EVENT, onPerfect);
    return () => {
      window.removeEventListener(PERFECT_SCORE_EVENT, onPerfect);
      window.clearTimeout(timer);
    };
  }, []);

  if (!shown) return null;
  return (
    <div key={shown} className={styles.overlay} role="status">
      <span className="sr-only">Perfect score!</span>
      {PIECES.map((p, i) => {
        const timing = {
          animationDuration: p.duration,
          animationDelay: p.delay,
        };
        return (
          // x and y are animated on separate elements so each axis gets its
          // own easing: steady sideways drift, decelerating rise, falling fall.
          <span
            key={i}
            className={styles.x}
            style={
              { "--sx": p.sx, "--ex": p.ex, ...timing } as React.CSSProperties
            }
          >
            <span
              className={styles.y}
              style={
                {
                  "--peak": p.peak,
                  "--spin": p.spin,
                  ...timing,
                } as React.CSSProperties
              }
            >
              {p.kind === "bit" ? (
                <span
                  className={p.long ? styles.streamer : styles.bit}
                  style={{ background: p.color }}
                />
              ) : (
                <PixelArt
                  layers={[p.kind === "ball" ? BALL : POPPER]}
                  palette={PALETTE}
                  width={16}
                  height={16}
                  // Right-side poppers are mirrored so they point inward too.
                  className={[
                    styles.sprite,
                    p.kind === "popper" && p.side > 0 ? styles.mirror : "",
                  ].join(" ")}
                />
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}
