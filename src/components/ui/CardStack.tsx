import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import styles from "./CardStack.module.css";

const MAX_GHOSTS = 3;
const PEEK_PX = 10;

interface CardStackProps {
  /** Index of the item currently shown. Changing it plays the flip animation. */
  index: number;
  /** Total items in the set, so the stack knows how many cards remain. */
  total: number;
  children: ReactNode;
}

/**
 * Shows `children` as the front card of a stack. The cards after the current
 * one peek out underneath, and moving to another item plays a card-flip
 * animation. Purely presentational — navigation stays with the caller.
 */
export function CardStack({ index, total, children }: CardStackProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(index);
  const [cardWidth, setCardWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const card = contentRef.current?.firstElementChild;
      if (card instanceof HTMLElement && card.offsetWidth > 0) {
        setCardWidth(card.offsetWidth);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [index]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    const prev = prevIndexRef.current;
    if (!el || index === prev) return;
    prevIndexRef.current = index;
    if (typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const forward = index > prev;
    el.animate(
      forward
        ? [
            { transform: `translateY(${PEEK_PX}px) scale(0.985)` },
            { transform: "translateY(0) scale(1)" },
          ]
        : [
            {
              transform: "perspective(900px) translateY(-14%) rotateX(10deg)",
              opacity: 0.3,
            },
            {
              transform: "perspective(900px) translateY(0) rotateX(0deg)",
              opacity: 1,
            },
          ],
      {
        duration: forward ? 300 : 340,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
      },
    );
  }, [index]);

  const ghostCount = Math.max(0, Math.min(MAX_GHOSTS, total - index - 1));

  return (
    <div className={styles.stack}>
      <div className={styles.content} ref={contentRef}>
        {children}
      </div>
      {cardWidth !== null &&
        Array.from({ length: ghostCount }, (_, i) => (
          <div
            key={i}
            className={styles.ghost}
            style={{ width: cardWidth }}
            aria-hidden="true"
          >
            <div
              className={styles.ghostInner}
              style={{
                transform: `translateY(${(i + 1) * PEEK_PX}px) scale(${(
                  1 -
                  (i + 1) * 0.015
                ).toFixed(3)})`,
              }}
            />
          </div>
        ))}
    </div>
  );
}
