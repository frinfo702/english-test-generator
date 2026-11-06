/**
 * Early access codes: `EA-<ID>-<SIG>`, where SIG is an HMAC of the ID under
 * ACCESS_CODE_SECRET. Nothing is stored server-side, so only someone holding
 * the secret can mint a code (scripts/issue-access-code.ts), and a leaked code
 * is cut off by listing its ID in REVOKED_ACCESS_CODES.
 *
 * Shared by the Pages Functions, the issuing script and the browser (headers).
 */

/** Browser → our functions. Premium/early access rides on this one header. */
export const ACCESS_CODE_HEADER = "X-Access-Code";
/** The user's own provider keys, forwarded by our functions and never stored. */
export const USER_KEY_HEADERS = {
  xai: "X-Xai-Key",
  azureKey: "X-Azure-Key",
  azureRegion: "X-Azure-Region",
  openai: "X-OpenAI-Key",
} as const;

const ID = /^[A-Z0-9]{1,24}$/;
// 16 hex = 64 bits: unguessable online, still short enough to type.
const SIG_LENGTH = 16;

async function signature(id: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`early-access:${id}`),
  );
  return [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, SIG_LENGTH)
    .toUpperCase();
}

export async function issueAccessCode(
  id: string,
  secret: string,
): Promise<string> {
  const normalized = id.trim().toUpperCase();
  if (!ID.test(normalized))
    throw new Error("ID must be 1–24 letters or digits.");
  if (secret.length < 32)
    throw new Error("ACCESS_CODE_SECRET must be at least 32 characters.");
  return `EA-${normalized}-${await signature(normalized, secret)}`;
}

/** The code's ID when it is genuine and not revoked, else null. */
export async function verifyAccessCode(
  code: string,
  secret: string | undefined,
  revoked = "",
): Promise<string | null> {
  if (!secret || secret.length < 32) return null;
  const match = /^EA-([A-Z0-9]{1,24})-([0-9A-F]+)$/.exec(
    code.trim().toUpperCase(),
  );
  if (!match) return null;
  const [, id, sig] = match;
  const expected = await signature(id, secret);
  // Constant-time compare, so response timing doesn't leak the signature.
  let diff = sig.length ^ expected.length;
  for (let i = 0; i < expected.length; i++)
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  const revokedIds = revoked
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return revokedIds.includes(id) ? null : id;
}

export interface AccessEnv {
  ACCESS_CODE_SECRET?: string;
  REVOKED_ACCESS_CODES?: string;
}

/**
 * Whether this request may spend the server's own keys. Today that is early
 * access only; a paid Premium check slots in here later.
 */
export async function hasPremium(
  request: Request,
  env: AccessEnv,
): Promise<boolean> {
  const code = request.headers.get(ACCESS_CODE_HEADER);
  return (
    !!code &&
    (await verifyAccessCode(
      code,
      env.ACCESS_CODE_SECRET,
      env.REVOKED_ACCESS_CODES,
    )) !== null
  );
}

export const NEEDS_KEY_MESSAGE = (provider: string) =>
  `Add your ${provider} key in Settings, or redeem an early access code.`;

export const CORS_ALLOW_HEADERS = [
  "Content-Type",
  ACCESS_CODE_HEADER,
  ...Object.values(USER_KEY_HEADERS),
].join(", ");
