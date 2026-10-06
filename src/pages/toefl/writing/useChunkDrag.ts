import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { DragSource, DropTarget } from "./buildSentence";

/** Pointer travel (px) before a press turns into a drag instead of a click. */
const DRAG_THRESHOLD = 4;

export interface DragGhost {
  source: DragSource;
  label: string;
  left: number;
  top: number;
  width: number;
}

interface Pending {
  source: DragSource;
  label: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  active: boolean;
}

/**
 * Drop zones are marked in the DOM: `data-drop="pool"`, or
 * `data-drop="slot"` with `data-slot="<index>"`.
 */
function dropTargetAt(x: number, y: number): DropTarget | null {
  const el = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>("[data-drop]");
  if (!el) return null;
  if (el.dataset.drop === "pool") return { kind: "pool" };
  const index = Number(el.dataset.slot);
  return Number.isInteger(index) ? { kind: "slot", index } : null;
}

export function useChunkDrag(
  enabled: boolean,
  onDrop: (source: DragSource, target: DropTarget) => void,
) {
  const [ghost, setGhost] = useState<DragGhost | null>(null);
  const [over, setOver] = useState<DropTarget | null>(null);
  const pending = useRef<Pending | null>(null);
  const suppressClick = useRef(false);
  const onDropRef = useRef(onDrop);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  useEffect(() => {
    const reset = () => {
      pending.current = null;
      setGhost(null);
      setOver(null);
    };

    const handleMove = (e: PointerEvent) => {
      const p = pending.current;
      if (!p) return;
      if (
        !p.active &&
        Math.hypot(e.clientX - p.startX, e.clientY - p.startY) < DRAG_THRESHOLD
      ) {
        return;
      }
      p.active = true;
      e.preventDefault();
      setGhost({
        source: p.source,
        label: p.label,
        left: e.clientX - p.offsetX,
        top: e.clientY - p.offsetY,
        width: p.width,
      });
      setOver(dropTargetAt(e.clientX, e.clientY));
    };

    const handleUp = (e: PointerEvent) => {
      const p = pending.current;
      if (!p) return;
      if (p.active) {
        const target = dropTargetAt(e.clientX, e.clientY);
        if (target) onDropRef.current(p.source, target);
        // The browser may still fire a click on the chip that was dragged.
        suppressClick.current = true;
        setTimeout(() => {
          suppressClick.current = false;
        }, 0);
      }
      reset();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", reset);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", reset);
    };
  }, []);

  const startDrag = useCallback(
    (e: ReactPointerEvent<HTMLElement>, source: DragSource, label: string) => {
      if (!enabled || e.button !== 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      pending.current = {
        source,
        label,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        width: rect.width,
        active: false,
      };
    },
    [enabled],
  );

  /** True when a click is the tail end of a drag and should be ignored. */
  const isDragClick = useCallback(() => suppressClick.current, []);

  return { ghost, over, startDrag, isDragClick };
}
