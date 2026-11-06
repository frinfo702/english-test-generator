/// <reference types="@cloudflare/workers-types" />

import {
  hasPremium,
  NEEDS_KEY_MESSAGE,
  USER_KEY_HEADERS,
  type AccessEnv,
} from "../../src/lib/accessCode";

interface Env extends AccessEnv {
  OPENAI_API_KEY?: string;
}

/** The client connects with whatever model the secret was minted for. */
const MODEL = "gpt-realtime-2.1-mini";

/**
 * Browsers can't set headers on a WebSocket, so the conversation page
 * connects to OpenAI's Realtime API with this short-lived client secret
 * instead of the API key.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey =
    request.headers.get(USER_KEY_HEADERS.openai)?.trim() ||
    ((await hasPremium(request, env)) ? env.OPENAI_API_KEY : undefined);
  if (!apiKey) {
    return Response.json(
      { error: NEEDS_KEY_MESSAGE("OpenAI") },
      { status: 402 },
    );
  }
  const response = await fetch(
    "https://api.openai.com/v1/realtime/client_secrets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 300 },
        session: { type: "realtime", model: MODEL },
      }),
    },
  );
  if (!response.ok) {
    return Response.json(
      { error: `OpenAI token error ${response.status}` },
      { status: 502 },
    );
  }
  const body = (await response.json()) as { value?: string };
  if (!body.value) {
    return Response.json(
      { error: "OpenAI returned no token." },
      { status: 502 },
    );
  }
  return Response.json({ token: body.value, model: MODEL });
};
