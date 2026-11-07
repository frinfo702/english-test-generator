import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { AsciiPond, type PondObstacle } from "../components/home/AsciiPond";
import { useBarePage } from "../components/layout/fullBleed";
import styles from "./NotFoundPage.module.css";

/** The 404 floats; the pointer eases it aside, and the fish go round it. */
const REPEL = 170; // px from the digits where the pointer starts pushing
const CORE = 70; // px around the digits where the pointer stops pushing
const MAX_NUDGE = 34;
const RIPPLE_MS = 900;

export function NotFoundPage() {
  useBarePage();
  const heroRef = useRef<HTMLElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<number[]>([]);

  // The float's physics lives in a ref: it changes every frame, and none of
  // it belongs in a render.
  const motion = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 0,
    targetY: 0,
    grabbed: false,
    pointerId: -1,
    pointerX: 0,
    pointerY: 0,
    grabX: 0,
    grabY: 0,
  });

  const ripple = useCallback(() => {
    const id = Math.random();
    setRipples((list) => [...list.slice(-2), id]);
    window.setTimeout(() => {
      setRipples((list) => list.filter((r) => r !== id));
    }, RIPPLE_MS);
  }, []);

  /**
   * What the fish steer around: a capsule over the digits, read from the live
   * box so it follows the float — and follows the pointer while you drag it.
   */
  const readObstacle = useCallback((): PondObstacle | null => {
    const hero = heroRef.current;
    const float = floatRef.current;
    if (!hero || !float) return null;
    const h = hero.getBoundingClientRect();
    const f = float.getBoundingClientRect();
    const cx = f.left - h.left + f.width / 2;
    const cy = f.top - h.top + f.height / 2;
    // Half the line box, plus air, so the fish stay clear of the glyphs too.
    const r = f.height / 2 + 18;
    // The capsule's round ends stand in for the corners of the box.
    const reach = Math.max(0, f.width / 2 - r);
    return { ax: cx - reach, ay: cy, bx: cx + reach, by: cy, r };
  }, []);

  /** Writes the float's transform from the physics ref; replaced per mode. */
  const applyRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const float = floatRef.current;
    if (!float) return;
    const still = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")
      .matches;
    let written = "";

    const apply = () => {
      const m = motion.current;
      const hero = heroRef.current;
      if (hero) {
        const limitX = hero.clientWidth / 2 - 48;
        const limitY = hero.clientHeight / 2 - 48;
        m.x = Math.max(-limitX, Math.min(limitX, m.x));
        m.y = Math.max(-limitY, Math.min(limitY, m.y));
      }

      const now = performance.now();
      const bobY = still ? 0 : Math.sin(now * 0.0008) * 3.5;
      const sway = still ? 0 : Math.sin(now * 0.00055 + 1) * 0.6;
      const tilt = Math.max(-8, Math.min(8, m.vx * 1.4));
      const next = `translate3d(${m.x.toFixed(2)}px, ${(m.y + bobY).toFixed(2)}px, 0) rotate(${(tilt + sway).toFixed(2)}deg)`;
      if (next === written) return;
      float.style.transform = next;
      written = next;
    };
    applyRef.current = apply;

    // Nothing drifts on its own when motion is reduced: move it only when a
    // pointer moves it.
    if (still) {
      apply();
      return;
    }

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const m = motion.current;
      // Frames elapsed, capped so a backgrounded tab doesn't fling the spring.
      const dt = Math.min(2.5, (now - last) / 16.667);
      last = now;
      // Loose while it floats, tight while it's held.
      const k = m.grabbed ? 0.24 : 0.022;
      const damp = Math.pow(m.grabbed ? 0.64 : 0.9, dt);
      m.vx = (m.vx + (m.targetX - m.x) * k * dt) * damp;
      m.vy = (m.vy + (m.targetY - m.y) * k * dt) * damp;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      apply();
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  /** With motion reduced nothing springs: the float is where the pointer is. */
  const settle = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const m = motion.current;
      m.x = m.targetX;
      m.y = m.targetY;
    }
    applyRef.current();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const m = motion.current;
    const float = floatRef.current;
    if (!float) return;
    if (m.grabbed) {
      m.targetX = m.grabX + (e.clientX - m.pointerX);
      m.targetY = m.grabY + (e.clientY - m.pointerY);
      settle();
      return;
    }
    const f = float.getBoundingClientRect();
    const dx = f.left + f.width / 2 - e.clientX;
    const dy = f.top + f.height / 2 - e.clientY;
    const d = Math.hypot(dx, dy);
    // On the digits, hold still — you're probably about to pick them up.
    if (d <= CORE) return;
    if (d < REPEL) {
      const push = ((REPEL - d) / (REPEL - CORE)) * MAX_NUDGE;
      m.targetX = (dx / d) * push;
      m.targetY = (dy / d) * push;
    } else {
      m.targetX = 0;
      m.targetY = 0;
    }
    settle();
  };

  const onPointerLeave = () => {
    const m = motion.current;
    if (m.grabbed) return;
    m.targetX = 0;
    m.targetY = 0;
    settle();
  };

  const onGrab = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const m = motion.current;
    m.grabbed = true;
    m.pointerId = e.pointerId;
    m.pointerX = e.clientX;
    m.pointerY = e.clientY;
    m.grabX = m.x;
    m.grabY = m.y;
    e.currentTarget.setPointerCapture(e.pointerId);
    settle();
    ripple();
  };

  const onRelease = (e: React.PointerEvent<HTMLDivElement>) => {
    const m = motion.current;
    if (!m.grabbed || e.pointerId !== m.pointerId) return;
    m.grabbed = false;
    m.pointerId = -1;
    // Let go and it drifts back to where it belongs.
    m.targetX = 0;
    m.targetY = 0;
    settle();
    ripple();
  };

  return (
    <section
      ref={heroRef}
      className={`canvas-grid ${styles.hero}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <title>404 · English Test Practice</title>
      <AsciiPond className={styles.pond} obstacle={readObstacle} />

      <div
        ref={floatRef}
        className={styles.float}
        onPointerDown={onGrab}
        onPointerUp={onRelease}
        onPointerCancel={onRelease}
      >
        {ripples.map((id) => (
          <span key={id} className={styles.ripple} aria-hidden="true" />
        ))}
        <h1 className={styles.code}>404</h1>
      </div>

      <p className="sr-only">
        Page not found. ⌥L opens Learn, and the browser's back button returns to
        where you were.
      </p>
    </section>
  );
}
