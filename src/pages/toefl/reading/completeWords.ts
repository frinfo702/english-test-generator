export interface CompleteWordsItem {
  index: number;
  hint: string;
  answer: string;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getExpectedSuffix(item: CompleteWordsItem): string {
  const answer = item.answer.trim();
  const hint = item.hint.trim();
  if (answer.toLowerCase().startsWith(hint.toLowerCase())) {
    return answer.slice(hint.length);
  }
  return answer;
}

export function getAnswerMatches(paragraph: string, answer: string) {
  const pattern = new RegExp(
    `(^|[^A-Za-z])(${escapeRegExp(answer.trim())})(?=[^A-Za-z]|$)`,
    "gi",
  );
  const matches: Array<{ start: number }> = [];

  for (const match of paragraph.matchAll(pattern)) {
    const fullMatch = match[0];
    const answerText = match[2];
    const fullStart = match.index ?? -1;
    if (fullStart === -1) continue;

    const prefixLength = fullMatch.length - answerText.length;
    const start = fullStart + prefixLength;
    matches.push({ start });
  }

  return matches;
}

export function findAnswerPosition(
  paragraph: string,
  answer: string,
  fromIndex: number,
  usedStarts: Set<number>,
): number {
  const matches = getAnswerMatches(paragraph, answer);
  for (const match of matches) {
    if (match.start >= fromIndex && !usedStarts.has(match.start)) {
      return match.start;
    }
  }

  for (const match of matches) {
    if (!usedStarts.has(match.start)) return match.start;
  }

  return -1;
}

export { escapeRegExp };
