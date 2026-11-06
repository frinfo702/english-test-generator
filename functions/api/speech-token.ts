/// <reference types="@cloudflare/workers-types" />

import { NEEDS_KEY_MESSAGE, type AccessEnv } from "../../src/lib/accessCode";
import { azureCredentials } from "../../src/lib/azureCredentials";

interface Env extends AccessEnv {
  AZURE_SPEECH_KEY?: string;
  AZURE_SPEECH_REGION?: string;
}

/**
 * The browser SDK streams over a WebSocket that a Pages Function can't proxy,
 * so the browser talks to Azure directly with this 10-minute token instead of
 * the resource key.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const azure = await azureCredentials(request, env);
  if (!azure) {
    return Response.json(
      { error: NEEDS_KEY_MESSAGE("Azure Speech") },
      { status: 402 },
    );
  }
  const response = await fetch(
    `https://${azure.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
    {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": azure.key },
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
    region: azure.region,
  });
};
