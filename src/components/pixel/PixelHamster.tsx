import { useEffect, useState } from "react";
import { PixelArt } from "./PixelArt";
import {
  HAMSTER_BLINK,
  HAMSTER_BODY,
  HAMSTER_EARS,
  HAMSTER_EARS_TWITCH,
  HAMSTER_H,
  HAMSTER_PALETTE,
  HAMSTER_PAWS_DOWN,
  HAMSTER_PAWS_UP,
  HAMSTER_W,
  PEARL_HAMSTER_PALETTE,
} from "./hamsterSprite";
import styles from "./PixelHamster.module.css";

const NIBBLE_MS = 110;

interface PixelHamsterProps {
  variant?: "kinkuma" | "pearl";
  className?: string;
  /** Called on click, after the pet. */
  onClick?: () => void;
  label?: string;
  expanded?: boolean;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

interface BurstTiming {
  gapMin: number;
  gapMax: number;
  beats: number;
  beatMs: number;
}

/**
 * Runs `flip` as a short burst every so often: the callback receives true
 * to show the alternate pose and false to return to rest.
 */
function useBursts(
  flip: (on: boolean) => void,
  { gapMin, gapMax, beats, beatMs }: BurstTiming,
) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let timer: number;
    const run = (beat: number) => {
      if (beat >= beats) {
        flip(false);
        timer = window.setTimeout(
          () => run(0),
          gapMin + Math.random() * (gapMax - gapMin),
        );
        return;
      }
      flip(beat % 2 === 0);
      timer = window.setTimeout(() => run(beat + 1), beatMs);
    };
    timer = window.setTimeout(() => run(0), gapMin * Math.random());
    return () => window.clearTimeout(timer);
  }, [flip, gapMin, gapMax, beats, beatMs]);
}

export function PixelHamster({
  variant = "kinkuma",
  className,
  onClick,
  label,
  expanded,
}: PixelHamsterProps) {
  const [pawsUp, setPawsUp] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [twitching, setTwitching] = useState(false);
  const [petted, setPetted] = useState(false);

  // Nibble the seed in quick bursts; a pet makes it nibble non-stop.
  useBursts(setPawsUp, {
    gapMin: petted ? 0 : 1200,
    gapMax: petted ? 0 : 2800,
    beats: 8,
    beatMs: NIBBLE_MS,
  });
  useBursts(setBlinking, { gapMin: 2400, gapMax: 5200, beats: 1, beatMs: 150 });
  useBursts(setTwitching, {
    gapMin: 3000,
    gapMax: 7000,
    beats: 3,
    beatMs: 120,
  });

  useEffect(() => {
    if (!petted) return;
    const id = window.setTimeout(() => setPetted(false), 1600);
    return () => window.clearTimeout(id);
  }, [petted]);

  const layers = [
    twitching ? HAMSTER_EARS_TWITCH : HAMSTER_EARS,
    HAMSTER_BODY,
    pawsUp ? HAMSTER_PAWS_UP : HAMSTER_PAWS_DOWN,
  ];
  if (blinking || petted) layers.push(HAMSTER_BLINK);

  return (
    <button
      type="button"
      className={[styles.hamster, petted ? styles.petted : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      onClick={() => {
        setPetted(true);
        onClick?.();
      }}
      aria-label={
        label ??
        (variant === "pearl"
          ? "Pet the pearl white hamster"
          : "Pet the hamster")
      }
      aria-expanded={expanded}
      title="Nom nom"
    >
      <PixelArt
        className={styles.sprite}
        layers={layers}
        palette={variant === "pearl" ? PEARL_HAMSTER_PALETTE : HAMSTER_PALETTE}
        width={HAMSTER_W}
        height={HAMSTER_H}
      />
    </button>
  );
}
