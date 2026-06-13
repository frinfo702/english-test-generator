export async function transcribeAudio(
  audio: Blob,
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");

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
