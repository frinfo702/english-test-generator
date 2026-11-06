/// <reference types="@cloudflare/workers-types" />

import {
  CORS_ALLOW_HEADERS,
  NEEDS_KEY_MESSAGE,
  type AccessEnv,
} from "../../src/lib/accessCode";
import { azureCredentials } from "../../src/lib/azureCredentials";
import { parseAzureAssessment } from "../../src/lib/pronunciation";

interface Env extends AccessEnv {
  AZURE_SPEECH_KEY?: string;
  AZURE_SPEECH_REGION?: string;
}

// Azure rejects pronunciation assessment on more than 30 s of audio;
// 16 kHz mono PCM is 32 KB/s.
const MAX_AUDIO_BYTES = 32_000 * 30 + 1024;

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
  };
}

function base64Utf8(text: string): string {
  // btoa alone throws on curly quotes and other non-Latin-1 characters.
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const fail = (error: string, status: number) =>
    Response.json({ error }, { status, headers: corsHeaders() });

  const azure = await azureCredentials(request, env);
  if (!azure) return fail(NEEDS_KEY_MESSAGE("Azure Speech"), 402);

  const formData = await request.formData();
  const audio = formData.get("audio");
  const referenceText = formData.get("referenceText");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return fail("Missing audio file.", 400);
  }
  if (typeof referenceText !== "string" || !referenceText.trim()) {
    return fail("Missing referenceText.", 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return fail("Audio is longer than 30 seconds.", 413);
  }

  const params = {
    ReferenceText: referenceText.trim(),
    GradingSystem: "HundredMark",
    Granularity: "Phoneme",
    Dimension: "Comprehensive",
    EnableMiscue: "True",
    EnableProsodyAssessment: "True",
  };

  try {
    const response = await fetch(
      `https://${azure.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": azure.key,
          "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
          Accept: "application/json",
          "Pronunciation-Assessment": base64Utf8(JSON.stringify(params)),
        },
        body: audio,
      },
    );
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return fail(
        `Azure error ${response.status}: ${text.slice(0, 200) || response.statusText}`,
        502,
      );
    }
    const result = parseAzureAssessment(await response.json());
    return Response.json(result, { headers: corsHeaders() });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Pronunciation scoring failed.",
      500,
    );
  }
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });
