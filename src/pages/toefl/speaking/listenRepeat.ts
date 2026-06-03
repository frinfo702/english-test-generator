export function diffWords(original: string, input: string) {
  const origWords = original.trim().split(/\s+/);
  const inputWords = input.trim().split(/\s+/);
  return origWords.map((word, i) => ({
    word,
    correct:
      word.toLowerCase().replace(/[^a-z]/g, "") ===
      (inputWords[i] ?? "").toLowerCase().replace(/[^a-z]/g, ""),
    inputWord: inputWords[i] ?? "",
  }));
}
