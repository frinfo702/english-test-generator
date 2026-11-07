import { useEffect, useRef } from "react";

const CELL = 7;
const SEGMENTS = 26;
const GLYPHS = "@%$S8Xxt;:o.";
// Muted shark-grey, koi-brown and slate tints; the ink comes from the theme.
const TINTS = ["120,132,160", "140,118,96", "96,104,120", "150,140,170"];

type Pt = { x: number; y: number };

/** Something floating in the water, in canvas coordinates: a capsule, so a
 *  wide object (the 404) is rounded at both ends rather than boxed. */
export interface PondObstacle {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  r: number;
}

interface Fish {
  /** Where the head has been, newest first; the body is laid along it. */
  trail: Pt[];
  spine: Pt[];
  heading: number;
  speed: number;
  width: number;
  gap: number;
  tint: string;
  phase: number;
}

function spawn(
  w: number,
  h: number,
  anywhere: boolean,
  obstacle?: PondObstacle | null,
): Fish {
  // Size is set in 12px-cell units so fish keep their size when CELL changes.
  const base = 2 + Math.random() * 1.8;
  const width = (base * 12) / CELL;
  const gap = base * 3.6;
  let x: number, y: number, heading: number;
  if (anywhere) {
    x = Math.random() * w;
    y = Math.random() * h;
    // Never start on top of whatever is floating there.
    if (obstacle) {
      for (let i = 0; i < 12; i++) {
        const c = closestOnCapsule(obstacle, x, y);
        if (Math.hypot(x - c.x, y - c.y) > obstacle.r + 60) break;
        x = Math.random() * w;
        y = Math.random() * h;
      }
    }
    heading = Math.random() * Math.PI * 2;
  } else {
    // Enter from a random edge, pointed roughly at the middle.
    const edge = Math.floor(Math.random() * 4);
    x = edge === 0 ? -40 : edge === 1 ? w + 40 : Math.random() * w;
    y = edge === 2 ? -40 : edge === 3 ? h + 40 : Math.random() * h;
    heading = Math.atan2(h / 2 - y, w / 2 - x) + (Math.random() - 0.5) * 1.2;
  }
  const len = SEGMENTS * gap;
  const trail = [
    { x, y },
    { x: x - Math.cos(heading) * len, y: y - Math.sin(heading) * len },
  ];
  return {
    trail,
    spine: [],
    heading,
    speed: 0.35 + Math.random() * 0.45,
    width,
    gap,
    tint: TINTS[Math.floor(Math.random() * TINTS.length)],
    phase: Math.random() * 100,
  };
}

function closestOnCapsule(o: PondObstacle, x: number, y: number): Pt {
  const dx = o.bx - o.ax;
  const dy = o.by - o.ay;
  const l2 = dx * dx + dy * dy;
  const t = l2
    ? Math.min(1, Math.max(0, ((x - o.ax) * dx + (y - o.ay) * dy) / l2))
    : 0;
  return { x: o.ax + dx * t, y: o.ay + dy * t };
}

/** The same angle, folded into (-π, π]. */
function wrap(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/** How much of a cell survives the object floating over it: fish pass under
 *  it, never through it. 1 = clear, 0 = hidden. */
function conceal(o: PondObstacle, x: number, y: number) {
  const c = closestOnCapsule(o, x, y);
  return Math.min(1, Math.max(0, (Math.hypot(x - c.x, y - c.y) - o.r) / 20));
}

/** Body half-width in cells at t (0 = nose, 1 = tail). */
function radius(t: number, w: number) {
  return t < 0.25 ? w * (0.5 + 2 * t) : w * (1 - t) * 1.33;
}

function step(f: Fish, tick: number, obstacle?: PondObstacle | null) {
  // Turn radius never drops below ~70% of the body length; any tighter and
  // the body, which follows the head's path, folds into an L.
  let maxTurn = f.speed / (SEGMENTS * f.gap * 0.7);
  let turn = Math.sin((tick + f.phase) * 0.004) * maxTurn;

  // Steer around the floating object: aim at whichever tangent is nearer, at
  // full turn where it matters. Started early — the body needs a wide arc.
  if (obstacle) {
    const head = f.trail[0];
    const c = closestOnCapsule(obstacle, head.x, head.y);
    const dx = head.x - c.x;
    const dy = head.y - c.y;
    const d = Math.hypot(dx, dy);
    const reach = obstacle.r + SEGMENTS * f.gap;
    if (d > 0.5 && d < reach) {
      const away = Math.atan2(dy, dx);
      const right = wrap(away + Math.PI / 2 - f.heading);
      const left = wrap(away - Math.PI / 2 - f.heading);
      const diff = Math.abs(right) < Math.abs(left) ? right : left;
      // How hard to bother: near the surface, and heading into it.
      const near = Math.min(1, ((reach - d) / (reach - obstacle.r)) * 1.5);
      const inbound = Math.max(0, -Math.cos(f.heading - away));
      turn += diff * near * (0.35 + inbound);
      // A fish that has left it too late turns tighter than it would wander.
      maxTurn += maxTurn * 0.6 * near * inbound;
    }
  }

  f.heading += Math.max(-maxTurn, Math.min(maxTurn, turn));
  const { trail } = f;
  trail.unshift({
    x: trail[0].x + Math.cos(f.heading) * f.speed,
    y: trail[0].y + Math.sin(f.heading) * f.speed,
  });

  // Sample the head's path every `gap` px, so the tail goes exactly where the
  // head went. (Pulling each segment toward the one ahead instead leaves the
  // tail dragging straight in its old direction long after the head turns.)
  const spine: Pt[] = [trail[0]];
  let acc = 0;
  let j = 1;
  for (; j < trail.length && spine.length < SEGMENTS; j++) {
    const a = trail[j - 1];
    const b = trail[j];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    while (
      l > 0 &&
      spine.length < SEGMENTS &&
      acc + l >= spine.length * f.gap
    ) {
      const u = (spine.length * f.gap - acc) / l;
      spine.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
    }
    acc += l;
  }
  trail.length = Math.min(trail.length, j + 1);

  // Swimming sway: a wave runs nose to tail, growing toward the tail.
  const amp = f.width * CELL * 0.35;
  f.spine = spine.map((p, i) => {
    const t = i / (SEGMENTS - 1);
    const a = spine[Math.max(i - 1, 0)];
    const b = spine[Math.min(i + 1, spine.length - 1)];
    const ang = Math.atan2(a.y - b.y, a.x - b.x) + Math.PI / 2;
    const off = Math.sin(tick * 0.06 + f.phase - i * 0.35) * amp * t * t;
    return { x: p.x + Math.cos(ang) * off, y: p.y + Math.sin(ang) * off };
  });
}

function rasterize(f: Fish, cells: Map<number, number>, cols: number) {
  const mark = (cx: number, cy: number, d: number) => {
    if (cx < 0 || cy < 0 || cx >= cols) return;
    const k = cy * cols + cx;
    const prev = cells.get(k);
    if (prev === undefined || d < prev) cells.set(k, d);
  };
  const n = f.spine.length;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = f.spine[i];
    const a = f.spine[Math.max(i - 1, 0)];
    const b = f.spine[Math.min(i + 1, n - 1)];
    // Unit vector pointing toward the tail.
    const back = Math.atan2(b.y - a.y, b.x - a.x);
    const r = radius(t, f.width);
    const cx = p.x / CELL;
    const cy = p.y / CELL;
    // Distance from each cell's true centre to the unrounded spine point, so a
    // cell's shade drifts as the fish moves instead of snapping on rounding.
    const rr = Math.max(r, 0.6);
    for (let gy = Math.floor(cy - rr); gy <= Math.ceil(cy + rr); gy++) {
      for (let gx = Math.floor(cx - rr); gx <= Math.ceil(cx + rr); gx++) {
        const d = Math.hypot(gx + 0.5 - cx, gy + 0.5 - cy) / rr;
        if (d <= 1) mark(gx, gy, d);
      }
    }
    // Pectoral fins and the tail fork: short strokes swept back at 45°.
    const fin =
      i === Math.round(n * 0.28)
        ? f.width * 1.8
        : i === n - 1
          ? f.width * 1.4
          : 0;
    if (fin) {
      for (const side of [-1, 1]) {
        const dir = back + (side * Math.PI) / 4;
        for (let s = i === n - 1 ? 0 : r; s <= fin; s += 0.5) {
          mark(
            Math.floor(cx + Math.cos(dir) * s),
            Math.floor(cy + Math.sin(dir) * s),
            0.55 + (0.4 * s) / fin,
          );
        }
      }
    }
  }
}

interface AsciiPondProps {
  className?: string;
  /** Read once a frame: what the fish should swim around. */
  obstacle?: () => PondObstacle | null;
}

/** Pixel-text fish drifting under a page's type — the home prompt and the
 *  404. Purely decorative. */
export function AsciiPond({ className, obstacle }: AsciiPondProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  // The getter is usually an inline arrow; a ref keeps the loop from
  // restarting every render.
  const obstacleRef = useRef(obstacle);
  obstacleRef.current = obstacle;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let ink = "33,33,33";
    /** Set once `draw` exists: a resize wipes the canvas, so a still pond
     *  (reduced motion) has to paint itself again. */
    let repaint: (() => void) | null = null;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      repaint?.();
    };
    // Polled rather than observed: the theme toggle only flips a data attribute.
    const readInk = () => {
      const m = getComputedStyle(canvas).color.match(/\d+/g);
      if (m) ink = m.slice(0, 3).join(",");
    };
    resize();
    readInk();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const count = Math.max(3, Math.min(7, Math.round((w * h) / 140000)));
    const first = obstacleRef.current?.() ?? null;
    const fish = Array.from({ length: count }, () => spawn(w, h, true, first));
    for (const f of fish) step(f, 0, first);
    const cells = new Map<number, number>();
    let tick = 0;
    let raf = 0;

    const draw = (obs: PondObstacle | null) => {
      if (tick % 30 === 0) readInk();
      const cols = Math.ceil(w / CELL) + 1;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${CELL - 1}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const f of fish) {
        cells.clear();
        rasterize(f, cells, cols);
        for (const [k, d] of cells) {
          const x = (k % cols) * CELL;
          const y = Math.floor(k / cols) * CELL;
          const under = obs ? conceal(obs, x + CELL / 2, y + CELL / 2) : 1;
          if (under <= 0) continue;
          const solid = 1 - d;
          // Edge cells fade in over the outer quarter rather than popping on.
          const fade = Math.min(1, solid * 4) * under;
          ctx.fillStyle = `rgba(${f.tint},${fade * (0.08 + solid * 0.37)})`;
          ctx.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
          ctx.fillStyle = `rgba(${ink},${fade * (0.3 + solid * 0.55)})`;
          ctx.fillText(
            GLYPHS[Math.min(GLYPHS.length - 1, Math.floor(d * GLYPHS.length))],
            x + CELL / 2,
            y + CELL / 2 + 0.5,
          );
        }
      }
    };

    const loop = () => {
      tick++;
      const obs = obstacleRef.current?.() ?? null;
      fish.forEach((f, i) => {
        step(f, tick, obs);
        const head = f.spine[0];
        const tail = f.spine[f.spine.length - 1];
        const out = (p: { x: number; y: number }) =>
          p.x < -120 || p.y < -120 || p.x > w + 120 || p.y > h + 120;
        if (out(head) && out(tail)) fish[i] = spawn(w, h, false, obs);
      });
      draw(obs);
      raf = requestAnimationFrame(loop);
    };

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      repaint = () => draw(obstacleRef.current?.() ?? null);
      repaint();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
