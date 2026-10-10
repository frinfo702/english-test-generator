import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadScoringSettings } from "../../lib/aiGateway";
import { SettingsPage } from "./SettingsPage";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("puts AI scoring first and the moved backup controls under Data", () => {
    renderPage();
    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((h) => h.textContent);
    expect(headings.slice(0, 2)).toEqual(["AI scoring", "Data"]);
    const data = screen.getByRole("region", { name: "Data" });
    expect(within(data).getByRole("button", { name: /Export/ })).toBeTruthy();
    expect(within(data).getByRole("button", { name: /Import/ })).toBeTruthy();
  });

  it("recommends only Claude Haiku and GPT-6 Luna, each with its maker's mark", () => {
    renderPage();
    const models = screen.getByRole("radiogroup", {
      name: "Recommended models",
    });
    const options = within(models).getAllByRole("radio");
    expect(options).toHaveLength(2);
    const rows = options.map((o) => o.closest("label")!);
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining("Claude Haiku 5.5"),
      expect.stringContaining("GPT-6 Luna"),
    ]);
    expect(rows.map((r) => r.querySelector("svg"))).not.toContain(null);
    expect(screen.queryByText(/DeepSeek/i)).toBeNull();
  });

  it("saves a working key and turns automatic scoring on", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ balance: "4.80", total_used: "0.20" })),
    );
    renderPage();
    const auto = screen.getByRole("radio", { name: "Automatic, with my key" });
    expect((auto as HTMLInputElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("AI Gateway API key"), {
      target: { value: "vck_good" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Key works · $4.80 credit left."),
    ).toBeTruthy();
    expect(loadScoringSettings()).toMatchObject({
      key: "vck_good",
      mode: "auto",
    });
    expect(
      (
        screen.getByRole("radio", {
          name: "Automatic, with my key",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: /Copy & paste/ }));
    expect(loadScoringSettings().mode).toBe("manual");

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(loadScoringSettings().key).toBeNull();
  });

  it("never stores a key the gateway rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ error: { type: "authentication_error" } }, 401)),
    );
    renderPage();
    fireEvent.change(screen.getByLabelText("AI Gateway API key"), {
      target: { value: "vck_bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("AI Gateway rejected the key."),
    ).toBeTruthy();
    await waitFor(() => expect(loadScoringSettings().key).toBeNull());
  });

  it("switches the model to a recommended one or a typed gateway ID", () => {
    renderPage();
    fireEvent.click(screen.getByRole("radio", { name: /GPT-6 Luna/ }));
    expect(loadScoringSettings().model).toBe("openai/gpt-6-luna");

    fireEvent.change(screen.getByLabelText("Another AI Gateway model ID"), {
      target: { value: "openai/gpt-5.6-luna" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use" }));
    expect(loadScoringSettings().model).toBe("openai/gpt-5.6-luna");
  });
});
