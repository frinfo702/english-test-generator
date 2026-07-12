/**
 * Detect transcripts that are predominantly Japanese script.
 * Used when STT auto-detects Japanese for Japanese-accented English
 * and renders it as カタカナ / ひらがな / 漢字.
 */
export function isPredominantlyJapaneseScript(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const jpChars = (
    trimmed.match(/[\u3040-\u30ff\u31f0-\u31ff\u4e00-\u9fff\uff66-\uff9d]/g) ??
    []
  ).length;
  const latinChars = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  const katakanaChars = (trimmed.match(/[\u30a0-\u30ff\uff66-\uff9d]/g) ?? [])
    .length;

  if (katakanaChars >= 8 && katakanaChars >= latinChars) return true;
  if (jpChars >= 6 && jpChars > latinChars * 1.5) return true;
  return false;
}

export const DEFAULT_TRANSCRIPTION_LANGUAGE = "en";
