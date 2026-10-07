/// <reference types="@cloudflare/workers-types" />

interface Env {
  AZURE_SPEECH_KEY?: string;
  AZURE_SPEECH_REGION?: string;
}

/**
 * The browser SDK streams over a WebSocket that a Pages Function can't proxy,
 * so the browser talks to Azure directly with this 10-minute token instead of
 * the resource key.
 */
export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) {
    return Response.json(
      {
        error:
          "Pronunciation scoring is not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.",
      },
      { status: 503 },
    );
  }
  const response = await fetch(
    `https://${env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
    {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": env.AZURE_SPEECH_KEY },
    },
  );
  if (!response.ok) {
    return Response.json(
      { error: `Azure token error ${response.status}` },
      { status: 502 },
    );
  }
  return Response.json({
    token: await response.text(),
    region: env.AZURE_SPEECH_REGION,
  });
};
