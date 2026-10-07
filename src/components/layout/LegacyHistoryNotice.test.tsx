import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { LegacyHistoryNotice } from "./LegacyHistoryNotice";
import {
  discardLegacyHistory,
  legacyHistoryCount,
  migrateLegacyHistory,
} from "../../lib/migrations";

vi.mock("../../lib/migrations", () => ({
  legacyHistoryCount: vi.fn(),
  migrateLegacyHistory: vi.fn(),
  discardLegacyHistory: vi.fn(),
}));

function renderNotice(onMigrated = vi.fn()) {
  render(
    <MemoryRouter>
      <LegacyHistoryNotice onMigrated={onMigrated} />
    </MemoryRouter>,
  );
  return onMigrated;
}

describe("LegacyHistoryNotice", () => {
  beforeAll(() => {
    // jsdom has no modal dialogs.
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
    };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("stays hidden when there is no old history", () => {
    vi.mocked(legacyHistoryCount).mockReturnValue(0);
    renderNotice();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("moves old history only when asked, then reloads pages", async () => {
    vi.mocked(legacyHistoryCount).mockReturnValue(3);
    vi.mocked(migrateLegacyHistory).mockResolvedValue(3);
    const onMigrated = renderNotice();

    expect(screen.getByText(/3 records from before the update/)).toBeTruthy();
    expect(migrateLegacyHistory).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Migrate history" }));

    expect(await screen.findByText("History moved")).toBeTruthy();
    expect(migrateLegacyHistory).toHaveBeenCalledTimes(1);
    expect(onMigrated).toHaveBeenCalledTimes(1);
  });

  it("keeps the old history and says so when moving fails", async () => {
    vi.mocked(legacyHistoryCount).mockReturnValue(1);
    vi.mocked(migrateLegacyHistory).mockRejectedValue(new Error("quota"));
    const onMigrated = renderNotice();

    fireEvent.click(screen.getByRole("button", { name: "Migrate history" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "your old history is untouched: quota",
    );
    expect(onMigrated).not.toHaveBeenCalled();
    expect(discardLegacyHistory).not.toHaveBeenCalled();
  });

  it("deletes old history only after a second confirmation", () => {
    vi.mocked(legacyHistoryCount).mockReturnValue(2);
    renderNotice();

    fireEvent.click(
      screen.getByRole("button", { name: "Discard old history instead" }),
    );
    expect(discardLegacyHistory).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(discardLegacyHistory).toHaveBeenCalledTimes(1);
  });

  it("deletes nothing when put off", () => {
    vi.mocked(legacyHistoryCount).mockReturnValue(2);
    renderNotice();

    fireEvent.click(screen.getByRole("button", { name: "Later" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(discardLegacyHistory).not.toHaveBeenCalled();
    expect(migrateLegacyHistory).not.toHaveBeenCalled();
  });
});
