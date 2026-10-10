/**
 * Bring-your-own-key scoring through Vercel AI Gateway.
 *
 * The key lives only in this browser's localStorage and goes straight from
 * the page to ai-gateway.vercel.sh: no server of ours sees, stores or logs it.
 * The gateway answers CORS preflights for any origin, so no proxy is needed.
 */

export const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1";

const KEY_STORAGE = "ai-gateway-key";
const MODEL_STORAGE = "ai-gateway-model";
const MODE_STORAGE = "ai-scoring-mode";

export type ScoringMode = "auto" | "manual";

export interface GatewayModel {
  id: string;
  name: string;
  maker: string;
  pitch: string;
  /** USD per million tokens, input / output, as listed on AI Gateway in Oct 2026. */
  price: [number, number];
}

/**
 * IDs checked against https://ai-gateway.vercel.sh/v1/models (Oct 2026).
 * "DeepSeek V4.1" ships on the gateway only as V4.1 Flash, and ChatGPT's
 * Luna as GPT-6 Luna.
 */
export const RECOMMENDED_MODELS: GatewayModel[] = [
  {
    id: "deepseek/deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    maker: "DeepSeek",
    pitch: "Sharp reasoning on grammar and argument, with detailed rewrites.",
    price: [0.3, 1.2],
  },
  {
    id: "openai/gpt-6-luna",
    name: "GPT-6 Luna",
    maker: "OpenAI · ChatGPT",
    pitch: "ChatGPT's efficient model: fast, steady rubric scores.",
    price: [0.1, 0.5],
  },
  {
    id: "anthropic/claude-haiku-5.5",
    name: "Claude Haiku 5.5",
    maker: "Anthropic",
    pitch: "Warm, well-organized feedback that reads like a tutor's notes.",
    price: [0.1, 0.5],
  },
];

export const DEFAULT_MODEL = "anthropic/claude-haiku-5.5";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode / blocked storage */
  }
}

export interface ScoringSettings {
  key: string | null;
  model: string;
  mode: ScoringMode;
}

export function loadScoringSettings(): ScoringSettings {
  return {
    key: read(KEY_STORAGE)?.trim() || null,
    model: read(MODEL_STORAGE)?.trim() || DEFAULT_MODEL,
    mode: read(MODE_STORAGE) === "auto" ? "auto" : "manual",
  };
}

/** Saving a key opts into auto scoring; that's why the user pasted one. */
export function saveGatewayKey(key: string): void {
  write(KEY_STORAGE, key.trim() || null);
  if (key.trim()) write(MODE_STORAGE, "auto");
}

/** Removing the key also drops back to copy & paste. */
export function clearGatewayKey(): void {
  write(KEY_STORAGE, null);
  write(MODE_STORAGE, null);
}

export function saveGatewayModel(model: string): void {
  write(MODEL_STORAGE, model.trim() || null);
}

export function saveScoringMode(mode: ScoringMode): void {
  write(MODE_STORAGE, mode === "auto" ? "auto" : null);
}

/** What auto scoring needs, or null when the page should stay manual. */
export function autoScoring(
  settings = loadScoringSettings(),
): { key: string; model: string } | null {
  return settings.mode === "auto" && settings.key
    ? { key: settings.key, model: settings.model }
    : null;
}

export class GatewayError extends Error {
  readonly kind: "auth" | "credits" | "model" | "network" | "other";
  constructor(message: string, kind: GatewayError["kind"]) {
    super(message);
    this.kind = kind;
  }
}

async function errorFrom(res: Response): Promise<GatewayError> {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string; type?: string };
  } | null;
  const detail = body?.error?.message ?? res.statusText;
  if (res.status === 401 || res.status === 403)
    return new GatewayError("AI Gateway rejected the key.", "auth");
  if (res.status === 402)
    return new GatewayError(
      "Your AI Gateway credits have run out. Top up on vercel.com.",
      "credits",
    );
  if (res.status === 404 || body?.error?.type === "model_not_found")
    return new GatewayError(
      `The model isn't available on AI Gateway: ${detail}`,
      "model",
    );
  return new GatewayError(
    `AI Gateway error (${res.status}): ${detail}`,
    "other",
  );
}

/** Remaining credit balance in USD; throws GatewayError("auth") on a bad key. */
export async function checkGatewayKey(
  key: string,
  signal?: AbortSignal,
): Promise<number | null> {
  let res: Response;
  try {
    res = await fetch(`${GATEWAY_URL}/credits`, {
      headers: { Authorization: `Bearer ${key}` },
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new GatewayError("Couldn't reach AI Gateway.", "network");
  }
  if (!res.ok) throw await errorFrom(res);
  const body = (await res.json().catch(() => null)) as {
    balance?: string | number;
  } | null;
  const balance = Number(body?.balance);
  return Number.isFinite(balance) ? balance : null;
}

/**
 * Sends the same prompt the copy & paste flow puts on the clipboard and
 * returns the model's whole reply, which the same parsers then read.
 */
export async function scoreWithGateway(
  prompt: string,
  { key, model }: { key: string; model: string },
  signal?: AbortSignal,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${GATEWAY_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
      }),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    // A rejected key comes back without CORS headers, so the browser only
    // reports a failed fetch; the credits endpoint answers readably.
    await checkGatewayKey(key, signal);
    throw new GatewayError(
      "Couldn't reach AI Gateway. Check your connection and try again.",
      "network",
    );
  }
  if (!res.ok) throw await errorFrom(res);
  const body = (await res.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const reply = body.choices?.[0]?.message?.content?.trim();
  if (!reply)
    throw new GatewayError("The model returned an empty reply.", "other");
  return reply;
}

export function modelName(id: string): string {
  return RECOMMENDED_MODELS.find((m) => m.id === id)?.name ?? id;
}
