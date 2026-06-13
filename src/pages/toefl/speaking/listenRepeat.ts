const NUMBER_WORDS: Record<string, string> = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
  thirteen: "13",
  fourteen: "14",
  fifteen: "15",
  sixteen: "16",
  seventeen: "17",
  eighteen: "18",
  nineteen: "19",
  twenty: "20",
  thirty: "30",
  forty: "40",
  fifty: "50",
  sixty: "60",
  seventy: "70",
  eighty: "80",
  ninety: "90",
};

export function normalizeWord(word: string): string {
  const normalized = word.toLowerCase().replace(/[^a-z0-9']/g, "");
  return NUMBER_WORDS[normalized] ?? normalized;
}

export interface AlignedWord {
  type: "match" | "substitution" | "deletion" | "insertion";
  original: string | null;
  recognized: string | null;
  correct: boolean;
}

export function alignWords(
  original: string,
  recognized: string,
): AlignedWord[] {
  const origWords = original.trim().split(/\s+/).filter(Boolean);
  const recWords = recognized.trim().split(/\s+/).filter(Boolean);

  const m = origWords.length;
  const n = recWords.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost =
        normalizeWord(origWords[i - 1]) === normalizeWord(recWords[j - 1])
          ? 0
          : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  const alignment: AlignedWord[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const cost =
        normalizeWord(origWords[i - 1]) === normalizeWord(recWords[j - 1])
          ? 0
          : 1;
      if (dp[i][j] === dp[i - 1][j - 1] + cost) {
        const matched = cost === 0;
        alignment.unshift({
          type: matched ? "match" : "substitution",
          original: origWords[i - 1],
          recognized: recWords[j - 1],
          correct: matched,
        });
        i--;
        j--;
        continue;
      }
    }

    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      alignment.unshift({
        type: "deletion",
        original: origWords[i - 1],
        recognized: null,
        correct: false,
      });
      i--;
      continue;
    }

    if (j > 0) {
      alignment.unshift({
        type: "insertion",
        original: null,
        recognized: recWords[j - 1],
        correct: false,
      });
      j--;
    }
  }

  return alignment;
}

export function countCorrectWords(alignment: AlignedWord[]): number {
  return alignment.filter((a) => a.correct).length;
}

export function countOriginalWords(alignment: AlignedWord[]): number {
  return alignment.filter((a) => a.original != null).length;
}
