import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";
import { useBarePage } from "./fullBleed";
import { SectionHeader } from "./SectionHeader";

function BarePage() {
  useBarePage();
  return <div>Bare body</div>;
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

describe("layout components", () => {
  it("renders SectionHeader and navigates back", () => {
    render(
      <MemoryRouter initialEntries={["/current"]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <SectionHeader
                  title="Practice"
                  subtitle="Keep going"
                  backTo="/menu"
                />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Practice")).toBeTruthy();
    expect(screen.getByText("Keep going")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByTestId("location").textContent).toBe("/menu");
  });

  it("renders AppShell nav and handles the dashboard shortcut", () => {
    render(
      <MemoryRouter initialEntries={["/toeic"]}>
        <Routes>
          <Route
            path="*"
            element={
              <AppShell>
                <div>Page body</div>
                <LocationProbe />
              </AppShell>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Page body")).toBeTruthy();
    // TOEIC sits under Learn, so Learn is the active tab.
    expect(
      screen.getByRole("link", { name: "Learn" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeTruthy();

    fireEvent.keyDown(window, { key: "d", ctrlKey: true });
    expect(screen.getByTestId("location").textContent).toBe("/dashboard");

    fireEvent.keyDown(window, { key: "®", code: "KeyR", altKey: true });
    expect(screen.getByTestId("location").textContent).toBe("/review");
  });

  it("drops the header and footer for a bare page", () => {
    render(
      <MemoryRouter initialEntries={["/no/such/page"]}>
        <AppShell>
          <BarePage />
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByText("Bare body")).toBeTruthy();
    expect(
      screen.queryByRole("navigation", { name: "Main navigation" }),
    ).toBeNull();
    expect(screen.queryByRole("contentinfo")).toBeNull();
    // The skip link stays: it is not chrome, it is the way past the page.
    expect(screen.getByText("Skip to main content")).toBeTruthy();
  });
});
