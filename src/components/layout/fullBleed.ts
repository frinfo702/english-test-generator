import { createContext, useContext, useLayoutEffect } from "react";

/**
 * How much of the shell a page keeps:
 * - `default` — the padded column, header and footer.
 * - `full`    — the padded column dropped, so the page paints edge to edge.
 * - `bare`    — edge to edge *and* no header, announcement or footer.
 */
export type PageFrame = "default" | "full" | "bare";

/** Set by the shell; a page calls one of the hooks, never the context. */
export const FrameContext = createContext<((frame: PageFrame) => void) | null>(
  null,
);

function useFrame(frame: PageFrame) {
  const setFrame = useContext(FrameContext);
  useLayoutEffect(() => {
    if (!setFrame) return;
    setFrame(frame);
    return () => setFrame("default");
  }, [setFrame, frame]);
}

/**
 * A page that owns its whole canvas opts out of the shell's padded column.
 * Call it once, at the top of the page.
 *
 * A layout effect, so the page paints edge to edge on its first frame.
 */
export function useFullBleedPage() {
  useFrame("full");
}

/** Full bleed, with nothing of the shell around it but the page itself. */
export function useBarePage() {
  useFrame("bare");
}
