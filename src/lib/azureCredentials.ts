import { hasPremium, USER_KEY_HEADERS, type AccessEnv } from "./accessCode";

export interface AzureEnv extends AccessEnv {
  AZURE_SPEECH_KEY?: string;
  AZURE_SPEECH_REGION?: string;
}

const REGION = /^[a-z0-9]{2,32}$/;

/** The user's own Azure Speech resource, else ours with early access, else null. */
export async function azureCredentials(
  request: Request,
  env: AzureEnv,
): Promise<{ key: string; region: string } | null> {
  const key = request.headers.get(USER_KEY_HEADERS.azureKey)?.trim();
  const region = request.headers
    .get(USER_KEY_HEADERS.azureRegion)
    ?.trim()
    .toLowerCase();
  // The region lands in a hostname, so only a bare region name gets through.
  if (key && region && REGION.test(region)) return { key, region };
  if (
    env.AZURE_SPEECH_KEY &&
    env.AZURE_SPEECH_REGION &&
    (await hasPremium(request, env))
  )
    return { key: env.AZURE_SPEECH_KEY, region: env.AZURE_SPEECH_REGION };
  return null;
}
