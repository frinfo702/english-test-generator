import { createContext } from "react";

/** The header element a page's clock portals into; null outside the shell. */
export const HeaderClockSlot = createContext<HTMLElement | null>(null);
