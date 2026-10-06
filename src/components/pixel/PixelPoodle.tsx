import { useEffect, useState } from "react";
import { PixelArt } from "./PixelArt";
import {
  POODLE_BLINK,
  POODLE_BODY,
  POODLE_H,
  POODLE_PALETTE,
  POODLE_TAILS,
  POODLE_W,
} from "./poodleSprite";
import styles from "./PixelPoodle.module.css";

// Raised → mid → out → mid: a pendulum wag.
const WAG = [0, 1, 2, 1] as const;
const TICK_MS = 150;
const EXCITED_TICK_MS = 70;

interface PixelPoodleProps {
  /** Wags faster and hops — e.g. while the user is typing. */
  excited?: boolean;
  className?: string;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function PixelPoodle({ excited = false, className }: PixelPoodleProps) {
  const [tick, setTick] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const [petted, setPetted] = useState(false);
  const lively = excited || petted;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(
      () => setTick((t) => t + 1),
      lively ? EXCITED_TICK_MS : TICK_MS,
    );
    return () => window.clearInterval(id);
  }, [lively]);

  // Blink at irregular intervals so it doesn't feel mechanical.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          setBlinking(true);
          timer = window.setTimeout(() => {
            setBlinking(false);
            schedule();
          }, 160);
        },
        2200 + Math.random() * 3200,
      );
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!petted) return;
    const id = window.setTimeout(() => setPetted(false), 1400);
    return () => window.clearTimeout(id);
  }, [petted]);

  const tail = POODLE_TAILS[WAG[tick % WAG.length]];
  const layers = blinking ? [POODLE_BODY, tail, POODLE_BLINK] : [POODLE_BODY, tail];

  return (
    <button
      type="button"
      className={[styles.poodle, lively ? styles.lively : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      onClick={() => setPetted(true)}
      aria-label="Pet the poodle"
      title="Woof!"
    >
      <PixelArt
        className={styles.sprite}
        layers={layers}
        palette={POODLE_PALETTE}
        width={POODLE_W}
        height={POODLE_H}
      />
    </button>
  );
}
