import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LATEST_UPDATE, markLatestUpdateSeen } from "../../lib/updates";
import { UpdateNotice } from "./UpdateNotice";

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("reopens the latest update on hamster click without touching the seen mark", () => {
  markLatestUpdateSeen();
  render(
    <MemoryRouter>
      <UpdateNotice />
    </MemoryRouter>,
  );
  expect(screen.queryByText(LATEST_UPDATE.label)).toBeNull();

  const hamster = screen.getByRole("button", {
    name: "Show the latest update",
  });
  fireEvent.click(hamster);
  expect(screen.getByText(LATEST_UPDATE.id)).toBeTruthy();
  expect(screen.getByText(LATEST_UPDATE.label)).toBeTruthy();
  expect(hamster.getAttribute("aria-expanded")).toBe("true");

  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByText(LATEST_UPDATE.label)).toBeNull();

  fireEvent.click(hamster);
  fireEvent.click(hamster);
  expect(screen.queryByText(LATEST_UPDATE.label)).toBeNull();
});

it("leaves an unseen release unseen when the hamster is clicked", () => {
  render(
    <MemoryRouter>
      <UpdateNotice />
    </MemoryRouter>,
  );
  expect(screen.getByText("New")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Show the latest update" }),
  );
  expect(screen.getByText("New")).toBeTruthy();
  expect(localStorage.getItem("etp-update-seen")).toBeNull();
});

it("closes the click-opened bubble when the route changes", () => {
  markLatestUpdateSeen();
  render(
    <MemoryRouter>
      <Link to="/trial/1">trial</Link>
      <Link to="/">home</Link>
      <UpdateNotice />
    </MemoryRouter>,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Show the latest update" }),
  );
  expect(screen.getByText(LATEST_UPDATE.label)).toBeTruthy();

  fireEvent.click(screen.getByText("trial"));
  expect(screen.queryByText(LATEST_UPDATE.label)).toBeNull();
  fireEvent.click(screen.getByText("home"));
  expect(screen.queryByText(LATEST_UPDATE.label)).toBeNull();
});

it("keeps an unseen release bubble showing across navigation", () => {
  render(
    <MemoryRouter>
      <Link to="/elsewhere">elsewhere</Link>
      <UpdateNotice />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByText("elsewhere"));
  expect(screen.getByText("New")).toBeTruthy();
});
