import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";
import { SectionHeader } from "./SectionHeader";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

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
                  current={2}
                  total={5}
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
    expect(screen.getByText("2/5")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
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
    expect(screen.getByRole("link", { name: /TOEFL 2026/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /TOEIC L&R/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Shadowing/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeTruthy();

    fireEvent.keyDown(window, { key: "d", ctrlKey: true });
    expect(screen.getByTestId("location").textContent).toBe("/dashboard");
  });
});
