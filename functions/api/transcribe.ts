/// <reference types="@cloudflare/workers-types" />

interface Env {
  AI: Ai;
}

interface TranscriptionResponse {
  text: string;
}

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const request = context.request;

  try {
    const contentLength = Number(request.headers.get("Content-Length") ?? "0");
    if (contentLength > MAX_AUDIO_BYTES) {
      return Response.json(
        { error: "Audio file is too large." },
        { status: 413, headers: corsHeaders() },
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof Blob) || audio.size === 0) {
      return Response.json(
        { error: "Missing audio file." },
        { status: 400, headers: corsHeaders() },
      );
    }

    const bytes = new Uint8Array(await audio.arrayBuffer());
    const result = await context.env.AI.run("@cf/openai/whisper", {
      audio: [...bytes],
      language: "en",
    });

    const text =
      result && typeof result === "object" && "text" in result
        ? String(result.text)
        : "";

    const responseBody: TranscriptionResponse = { text };
    return Response.json(responseBody, { headers: corsHeaders() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transcription failed.";
    return Response.json(
      { error: message },
      { status: 500, headers: corsHeaders() },
    );
  }
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
};
