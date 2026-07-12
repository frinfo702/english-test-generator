/// <reference types="@cloudflare/workers-types" />

import { isPredominantlyJapaneseScript } from "../../src/lib/transcriptionLanguage";

interface Env {
  XAI_API_KEY?: string;
  AI?: Ai;
}

interface TranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  provider?: "xai" | "whisper";
}

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const XAI_STT_URL = "https://api.x.ai/v1/stt";
const DEFAULT_LANGUAGE = "en";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function extensionForMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return "mp4";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

function normalizeLanguage(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string") return DEFAULT_LANGUAGE;
  const code = raw.trim().toLowerCase();
  if (!code || code === "auto" || code === "english" || code.startsWith("en")) {
    return DEFAULT_LANGUAGE;
  }
  return code.slice(0, 8);
}

async function transcribeWithXai(
  audio: Blob,
  apiKey: string,
  language: string,
): Promise<TranscriptionResponse> {
  const ext = extensionForMime(audio.type || "audio/webm");
  // file must be last in multipart (xAI requirement)
  const formData = new FormData();
  formData.append("format", "true");
  formData.append("language", language);
  formData.append("file", audio, `recording.${ext}`);

  const response = await fetch(XAI_STT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `xAI STT error ${response.status}: ${errText.slice(0, 200) || response.statusText}`,
    );
  }

  const result = (await response.json()) as {
    text?: string;
    language?: string;
    duration?: number;
  };

  return {
    text: result.text ?? "",
    language: result.language || language,
    duration: result.duration,
    provider: "xai",
  };
}

async function transcribeWithWhisper(
  audio: Blob,
  ai: Ai,
  language: string,
): Promise<TranscriptionResponse> {
  const bytes = new Uint8Array(await audio.arrayBuffer());
  const result = await ai.run("@cf/openai/whisper", {
    audio: [...bytes],
    language,
  });
  const text =
    result && typeof result === "object" && "text" in result
      ? String(result.text)
      : "";
  return { text, language, provider: "whisper" };
}

/**
 * Prefer xAI STT (Listen and Repeat / Interview).
 * Whisper is fallback only: missing key, xAI failure, or カタカナ mis-detect on English.
 */
async function transcribeAudio(
  audio: Blob,
  language: string,
  env: Env,
): Promise<TranscriptionResponse> {
  const whisper = env.AI
    ? () => transcribeWithWhisper(audio, env.AI!, language)
    : null;
  const xai = env.XAI_API_KEY
    ? () => transcribeWithXai(audio, env.XAI_API_KEY!, language)
    : null;

  if (!whisper && !xai) {
    throw new Error(
      "Transcription is not configured. Set XAI_API_KEY (required for xAI STT) and/or bind Workers AI.",
    );
  }

  if (xai) {
    try {
      const result = await xai();
      // Safety net: Japanese-accented English sometimes comes back as カタカナ.
      if (
        language === "en" &&
        whisper &&
        isPredominantlyJapaneseScript(result.text)
      ) {
        return whisper();
      }
      return result;
    } catch (err) {
      if (!whisper) throw err;
      return whisper();
    }
  }

  return whisper!();
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const contentLength = Number(
      context.request.headers.get("Content-Length") ?? "0",
    );
    if (contentLength > MAX_AUDIO_BYTES) {
      return Response.json(
        { error: "Audio file is too large." },
        { status: 413, headers: corsHeaders() },
      );
    }

    const formData = await context.request.formData();
    const audio = formData.get("audio");
    const language = normalizeLanguage(formData.get("language"));

    if (!(audio instanceof Blob) || audio.size === 0) {
      return Response.json(
        { error: "Missing audio file." },
        { status: 400, headers: corsHeaders() },
      );
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return Response.json(
        { error: "Audio file is too large." },
        { status: 413, headers: corsHeaders() },
      );
    }

    const result = await transcribeAudio(audio, language, context.env);
    return Response.json(result, { headers: corsHeaders() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transcription failed.";
    const status = message.includes("not configured") ? 503 : 500;
    return Response.json(
      { error: message },
      { status, headers: corsHeaders() },
    );
  }
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });
