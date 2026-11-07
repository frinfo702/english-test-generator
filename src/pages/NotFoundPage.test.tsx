import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { NotFoundPage } from "./NotFoundPage";

// jsdom has no canvas and no motion preference; the pond bows out quietly and
// the page still has to say what it is.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe("NotFoundPage", () => {
  it("says 404 and nothing else on the page", () => {
    renderAt("/no/such/page");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("404");
    // Only the digits are visible; the rest is for a screen reader.
    expect(document.body.textContent).toBe(
      "404Page not found. ⌥L opens Learn, and the browser's back button returns to where you were.",
    );
    expect(document.title).toBe("404 · English Test Practice");
  });

  it("keeps the pond decorative", () => {
    renderAt("/gone");
    const canvas = document.querySelector("canvas");
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
  });

  it("carries no visible way out of its own", () => {
    renderAt("/gone");
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
