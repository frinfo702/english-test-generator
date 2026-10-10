import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  autoScoring,
  checkGatewayKey,
  clearGatewayKey,
  DEFAULT_MODEL,
  GATEWAY_URL,
  GatewayError,
  loadScoringSettings,
  saveGatewayKey,
  saveGatewayModel,
  saveScoringMode,
  scoreWithGateway,
} from "./aiGateway";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("AI Gateway key storage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("starts manual with the default model and no key", () => {
    expect(loadScoringSettings()).toEqual({
      key: null,
      model: DEFAULT_MODEL,
      mode: "manual",
    });
    expect(autoScoring()).toBeNull();
  });

  it("saving a key turns auto scoring on; clearing it turns it off", () => {
    saveGatewayKey("  vck_secret  ");
    expect(loadScoringSettings()).toMatchObject({
      key: "vck_secret",
      mode: "auto",
    });
    expect(autoScoring()).toEqual({ key: "vck_secret", model: DEFAULT_MODEL });

    clearGatewayKey();
    expect(loadScoringSettings()).toMatchObject({ key: null, mode: "manual" });
    expect(localStorage.length).toBe(0);
  });

  it("keeps the key but stays manual when the user picks copy & paste", () => {
    saveGatewayKey("vck_secret");
    saveScoringMode("manual");
    expect(loadScoringSettings().key).toBe("vck_secret");
    expect(autoScoring()).toBeNull();
  });

  it("auto mode without a key is still manual", () => {
    saveScoringMode("auto");
    expect(autoScoring()).toBeNull();
  });

  it("remembers the chosen model", () => {
    saveGatewayKey("k");
    saveGatewayModel("openai/gpt-6-luna");
    expect(autoScoring()).toEqual({ key: "k", model: "openai/gpt-6-luna" });
  });

  it("falls back to manual when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveGatewayKey("k")).not.toThrow();
    expect(autoScoring()).toBeNull();
  });
});

describe("scoreWithGateway", () => {
  const config = { key: "vck_secret", model: "anthropic/claude-haiku-5.5" };
  afterEach(() => vi.unstubAllGlobals());

  it("posts the prompt straight to AI Gateway with the user's key", async () => {
    const fetch = vi.fn(async () =>
      json({
        choices: [
          {
            message: { content: ' Great.\n```toefl-score\n{"score": 4}\n``` ' },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetch);

    const reply = await scoreWithGateway("PROMPT", config);

    expect(reply).toBe('Great.\n```toefl-score\n{"score": 4}\n```');
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${GATEWAY_URL}/chat/completions`);
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer vck_secret",
    );
    expect(JSON.parse(init.body as string)).toEqual({
      model: "anthropic/claude-haiku-5.5",
      messages: [{ role: "user", content: "PROMPT" }],
    });
  });

  it("names the model when the gateway doesn't have it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json(
          { error: { message: "Model x not found", type: "model_not_found" } },
          404,
        ),
      ),
    );
    await expect(scoreWithGateway("p", config)).rejects.toMatchObject({
      kind: "model",
    });
  });

  it("reports a rejected key even though the browser hides the 401", async () => {
    // The chat 401 carries no CORS headers, so fetch only throws; the
    // credits endpoint then says why.
    const fetch = vi.fn(async (url: string) => {
      if (url.endsWith("/chat/completions"))
        throw new TypeError("Failed to fetch");
      return json({ error: { type: "authentication_error" } }, 401);
    });
    vi.stubGlobal("fetch", fetch);

    const error = await scoreWithGateway("p", config).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GatewayError);
    expect((error as GatewayError).kind).toBe("auth");
  });

  it("calls it a network error when the gateway is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(scoreWithGateway("p", config)).rejects.toMatchObject({
      kind: "network",
    });
  });

  it("reads the credit balance to check a key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ balance: "4.80", total_used: "0.20" })),
    );
    expect(await checkGatewayKey("k")).toBe(4.8);
  });
});
