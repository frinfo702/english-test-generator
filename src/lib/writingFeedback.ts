import { scoreBlock } from "./interviewScoring";

export type WritingTaskId = "toefl/writing/email" | "toefl/writing/discussion";

export interface TemplatePart {
  name: string;
  /** What the part does, as the AI is asked to check it. */
  does: string;
  /** Stock phrases that fit the part, for the reader, not the prompt. */
  phrases: string[];
}

/**
 * Response skeletons after Magoosh's free TOEFL writing templates
 * (magoosh.com/toefl/toefl-writing-templates), restated in our own words:
 * the guide is "All Rights Reserved", so its structure is followed but its
 * text and phrase menus are not copied.
 */
export const WRITING_TEMPLATES: Record<WritingTaskId, TemplatePart[]> = {
  "toefl/writing/email": [
    {
      name: "Greeting",
      does: "opens with a greeting as formal as the recipient calls for",
      phrases: ["Dear Professor Kim,", "Hi Alex,"],
    },
    {
      name: "Purpose",
      does: "says in one sentence why the email is being written",
      phrases: ["I'm writing to ask about…", "I wanted to let you know…"],
    },
    {
      name: "One paragraph per point",
      does: "gives each bullet point of the task its own short paragraph",
      phrases: ["First, …", "As for …,", "Could you also …?"],
    },
    {
      name: "Closing line",
      does: "ends with thanks or what should happen next",
      phrases: [
        "Thank you for your time.",
        "I look forward to hearing from you.",
      ],
    },
    {
      name: "Sign-off",
      does: "signs off in the same register as the greeting",
      phrases: ["Best regards,", "Thanks again,"],
    },
  ],
  "toefl/writing/discussion": [
    {
      name: "Position",
      does: "states a clear opinion in the first sentence",
      phrases: ["In my view, …", "I believe that …"],
    },
    {
      name: "Build on a classmate",
      does: "names one classmate, restates their idea and adds something new",
      phrases: ["I agree with Maya that …", "Building on Leo's point, …"],
    },
    {
      name: "Answer the other",
      does: "names the other classmate and explains why the writer sees it differently",
      phrases: ["I see why Leo thinks …, but …", "However, …"],
    },
    {
      name: "Example",
      does: "supports the opinion with a concrete example or reason",
      phrases: ["For example, …", "In my own experience, …"],
    },
    {
      name: "Close",
      does: "ties the opinion back to the professor's question",
      phrases: ["That is why I think …", "Overall, …"],
    },
  ],
};

export const EDIT_THEMES = {
  grammar: "Grammar & spelling",
  elaboration: "Elaboration",
  tone: "Tone & conventions",
  task: "Task fit",
} as const;

export type EditTheme = keyof typeof EDIT_THEMES;

export interface SuggestedEdit {
  /** Copied exactly from the response. */
  from: string;
  /** Empty deletes `from`. */
  to: string;
  theme: EditTheme;
  why: string;
}

const isTheme = (t: unknown): t is EditTheme =>
  typeof t === "string" && t in EDIT_THEMES;

/** The edits in a reply's score block; empty for replies from before edits. */
export function parseSuggestedEdits(reply: string): SuggestedEdit[] {
  const edits = scoreBlock(reply)?.edits;
  if (!Array.isArray(edits)) return [];
  return edits.flatMap((e: Record<string, unknown>) =>
    typeof e?.from === "string" && e.from && typeof e.to === "string"
      ? [
          {
            from: e.from,
            to: e.to,
            theme: isTheme(e.theme) ? e.theme : "grammar",
            why: typeof e.why === "string" ? e.why : "",
          },
        ]
      : [],
  );
}

/** Which template parts the response used, or null when the reply has none. */
export function parseTemplateUse(
  reply: string,
  parts: number,
): boolean[] | null {
  const used = scoreBlock(reply)?.template;
  if (!Array.isArray(used) || used.length !== parts) return null;
  return used.map((u) => u === 1 || u === true);
}

export type EditSegment =
  | { kind: "text"; text: string }
  | { kind: "edit"; n: number; edit: SuggestedEdit };

/**
 * Splits the response around each edit, in the order the AI listed them.
 * An edit whose `from` isn't found after the previous one (the model
 * paraphrased instead of copying) is dropped rather than misplaced.
 */
export function splitByEdits(
  text: string,
  edits: SuggestedEdit[],
): EditSegment[] {
  const segments: EditSegment[] = [];
  let cursor = 0;
  let n = 0;
  for (const edit of edits) {
    const at = text.indexOf(edit.from, cursor);
    if (at < 0) continue;
    if (at > cursor)
      segments.push({ kind: "text", text: text.slice(cursor, at) });
    segments.push({ kind: "edit", n: ++n, edit });
    cursor = at + edit.from.length;
  }
  if (cursor < text.length)
    segments.push({ kind: "text", text: text.slice(cursor) });
  return segments;
}
