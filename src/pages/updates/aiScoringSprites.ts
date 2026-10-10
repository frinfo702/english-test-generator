// Pixel props drawn only for the AI scoring update page: the graded answer
// card and the gateway sparks over it. "." is transparent; inside the card "p"
// is blank paper. Colours (outline, paper, ink) are the hamsters' warm set so
// the scene reads as one drawing.

// One card: a title bar, a big 4/5, and four rubric rows whose pips fill with
// indigo ink. Pips are 2×2 cells with a one-cell gap, five per row.
// prettier-ignore
export const SCORE_SHEET = [
  "oooooooooooooooooooooooooo",
  "oppppppppppppppppppppppppo",
  "oppppppppppppppppppppppppo",
  "oppkkkkkkkkkkppppppppppppo",
  "oppkkkkkkkkkkppppppppppppo",
  "oppppppppppppppppppppppppo",
  "opppppkpppppkkpkkkkkpppppo",
  "oppppkkpppppkkpkkppppppppo",
  "opppkpkppppkkppkkkkppppppo",
  "oppkppkppppkkppppppkpppppo",
  "oppkkkkkppkkpppppppkpppppo",
  "opppppkpppkkpppkpppkpppppo",
  "opppppkppkkpppppkkkppppppo",
  "oppppppppppppppppppppppppo",
  "oppppppppppppppppppppppppo",
  "oppkkkkpppttpttpttpttpeepo",
  "oppkkkkpppttpttpttpttpeepo",
  "oppppppppppppppppppppppppo",
  "oppppppppppppppppppppppppo",
  "oppkkkkpppttpttpttpeepeepo",
  "oppkkkkpppttpttpttpeepeepo",
  "oppppppppppppppppppppppppo",
  "oppppppppppppppppppppppppo",
  "oppkkkkpppttpttpttpttpttpo",
  "oppkkkkpppttpttpttpttpttpo",
  "oppppppppppppppppppppppppo",
  "oppppppppppppppppppppppppo",
  "oppkkkkpppttpttpeepeepeepo",
  "oppkkkkpppttpttpeepeepeepo",
  "osssssssssssssssssssssssso",
  "oooooooooooooooooooooooooo",
];
export const SCORE_SHEET_W = 26;
export const SCORE_SHEET_H = SCORE_SHEET.length;
export const SCORE_SHEET_PALETTE: Record<string, string> = {
  o: "#8c7763",
  p: "#f8f1e6",
  s: "#e2cfb0",
  k: "#3a3340",
  t: "#2f2e73",
  e: "#d9d3c4",
};

// The two spark sizes the stage twinkles, drawn with currentColor so CSS can
// hand them the signal orange.
// prettier-ignore
export const SPARK = [
  "...s...",
  "..sss..",
  ".sssss.",
  "sssssss",
  ".sssss.",
  "..sss..",
  "...s...",
];
export const SPARK_W = 7;
export const SPARK_H = SPARK.length;

// prettier-ignore
export const SPARK_SMALL = [
  "..s..",
  ".sss.",
  "sssss",
  ".sss.",
  "..s..",
];
export const SPARK_SMALL_W = 5;
export const SPARK_SMALL_H = SPARK_SMALL.length;
