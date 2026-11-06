/**
 * The user's own speech keys and early access code. They live in this
 * browser's localStorage and ride as headers on calls to our /api functions,
 * which forward a key to its provider and keep nothing.
 */
import { ACCESS_CODE_HEADER, USER_KEY_HEADERS } from "./accessCode";
import { read, write } from "./aiGateway";

export type KeyName = keyof typeof USER_KEY_HEADERS | "accessCode";

const STORAGE: Record<KeyName, string> = {
  xai: "xai-key",
  azureKey: "azure-speech-key",
  azureRegion: "azure-speech-region",
  openai: "openai-key",
  accessCode: "early-access-code",
};

export function loadKey(name: KeyName): string | null {
  return read(STORAGE[name])?.trim() || null;
}

export function saveKey(name: KeyName, value: string | null): void {
  write(STORAGE[name], value?.trim() || null);
}

/** Headers for one of our functions: the provider keys it uses, plus early access. */
export function apiHeaders(
  service: "xai" | "azure" | "openai",
): Record<string, string> {
  const names: (keyof typeof USER_KEY_HEADERS)[] =
    service === "azure" ? ["azureKey", "azureRegion"] : [service];
  const headers: Record<string, string> = {};
  for (const name of names) {
    const value = loadKey(name);
    if (value) headers[USER_KEY_HEADERS[name]] = value;
  }
  const code = loadKey("accessCode");
  if (code) headers[ACCESS_CODE_HEADER] = code;
  return headers;
}

/** True when the server accepts the code; network trouble throws. */
export async function checkAccessCode(code: string): Promise<boolean> {
  const res = await fetch("/api/access", {
    method: "POST",
    headers: { [ACCESS_CODE_HEADER]: code.trim() },
  });
  return res.ok;
}
