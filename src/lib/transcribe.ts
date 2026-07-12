const DEFAULT_LANGUAGE = "en";

export async function transcribeAudio(
  audio: Blob,
  url: string,
  signal?: AbortSignal,
  language: string = DEFAULT_LANGUAGE,
): Promise<string> {
  const formData = new FormData();
  // Explicit English default — backend also normalizes missing/auto to "en".
  formData.append("language", language || DEFAULT_LANGUAGE);
  const ext = audio.type.includes("mp4")
    ? "mp4"
    : audio.type.includes("wav")
      ? "wav"
      : "webm";
  formData.append("audio", audio, `recording.${ext}`);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      body.error ?? `Transcription request failed (${response.status})`,
    );
  }

  const body = (await response.json()) as { text?: string };
  return body.text ?? "";
}
