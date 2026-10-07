export interface DailyLifeQuestion {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  type: string;
  explanation: string;
}

export interface ChatMessage {
  sender: string;
  /** Display time such as "9:05 A.M.". */
  time?: string;
  text: string;
}

/**
 * How a text is drawn on the left pane.
 * - email:     header boxes (From / To / Subject) above the body
 * - chat:      phone frame with speech bubbles (first sender on the right)
 * - live-chat: "Live Chat" panel, one row per message, colour bar per sender
 * - notice:    rounded frame with optional icon, headline, centred lines
 *              (announcements, advertisements, posters, signs)
 * - document:  plain card for schedules, menus, forms, receipts, etc.
 */
export type DailyLifeLayout =
  "email" | "chat" | "live-chat" | "notice" | "document";

export const NOTICE_ICONS = [
  "globe",
  "megaphone",
  "calendar",
  "info",
  "tag",
] as const;
export type NoticeIcon = (typeof NOTICE_ICONS)[number];

export interface DailyLifeText {
  id: string;
  textType: string;
  layout?: DailyLifeLayout;
  /** Headline for notice; panel title for live-chat (defaults to "Live Chat"). */
  title?: string;
  /** Pictogram above a notice headline. */
  icon?: NoticeIcon;
  /** Full text. Email uses "From:/To:/Subject:" header lines + blank line + body. */
  content?: string;
  /** Required for chat / live-chat. */
  messages?: ChatMessage[];
  questions: DailyLifeQuestion[];
}

export interface DailyLifeData {
  texts: DailyLifeText[];
}

export const DAILY_LIFE_LAYOUTS: DailyLifeLayout[] = [
  "email",
  "chat",
  "live-chat",
  "notice",
  "document",
];

const TEXT_TYPE_LAYOUTS: Record<string, DailyLifeLayout> = {
  email: "email",
  "text message": "chat",
  "text messages": "chat",
  "message exchange": "chat",
  chat: "chat",
  "live chat": "live-chat",
  "online chat": "live-chat",
  notice: "notice",
  announcement: "notice",
  advertisement: "notice",
  ad: "notice",
  poster: "notice",
  flyer: "notice",
  sign: "notice",
};

/** Explicit `layout` wins; otherwise infer from `textType` for older files. */
export function resolveLayout(text: DailyLifeText): DailyLifeLayout {
  const layout =
    text.layout ??
    TEXT_TYPE_LAYOUTS[text.textType.trim().toLowerCase()] ??
    "document";
  if ((layout === "chat" || layout === "live-chat") && !text.messages?.length) {
    return "document";
  }
  return layout;
}

export interface ParsedEmail {
  headers: { label: string; value: string }[];
  body: string;
}

const EMAIL_HEADER = /^(From|To|Cc|Date|Subject):\s*(.*)$/i;

/** Splits leading "From:/To:/Subject:" lines off the body. */
export function parseEmail(content: string): ParsedEmail {
  const lines = content.split("\n");
  const headers: ParsedEmail["headers"] = [];
  let i = 0;
  for (; i < lines.length; i++) {
    const match = EMAIL_HEADER.exec(lines[i].trim());
    if (!match) break;
    const label = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
    headers.push({ label, value: match[2] });
  }
  return { headers, body: lines.slice(i).join("\n").trim() };
}

export interface ParsedNotice {
  title?: string;
  /** Paragraphs; each paragraph keeps its own line breaks. */
  paragraphs: string[];
  /** Short poster-style lines read best centred; prose does not. */
  centered: boolean;
}

const SHORT_LINE_WORDS = 12;

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

/**
 * Uses `title` as the headline, or else a lone short first line followed by
 * a blank line (the shape older notice files already have).
 */
export function parseNotice(text: DailyLifeText): ParsedNotice {
  let paragraphs = (text.content ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  let title = text.title;
  if (
    !title &&
    paragraphs.length > 1 &&
    !paragraphs[0].includes("\n") &&
    wordCount(paragraphs[0]) <= SHORT_LINE_WORDS
  ) {
    title = paragraphs[0];
    paragraphs = paragraphs.slice(1);
  }
  const lines = paragraphs.flatMap((p) => p.split("\n"));
  const centered = lines.every(
    (l) => wordCount(l) <= SHORT_LINE_WORDS && !/^\s*[-•*]\s/.test(l),
  );
  return { title, paragraphs, centered };
}

/** Plain text of a block, for word counts and validation. */
export function textBody(text: DailyLifeText): string {
  if (text.messages?.length) {
    return text.messages.map((m) => m.text).join("\n");
  }
  return text.content ?? "";
}

const LAYOUT_PROMPTS: Partial<Record<DailyLifeLayout, string>> = {
  email: "Read an email.",
  chat: "Read a message exchange.",
  "live-chat": "Read a chat discussion.",
};

/** Instruction line shown above the text, e.g. "Read a notice." */
export function readingPrompt(text: DailyLifeText): string {
  const fixed = LAYOUT_PROMPTS[resolveLayout(text)];
  if (fixed) return fixed;
  const noun = text.textType.trim().toLowerCase();
  const article = /^[aeiou]/.test(noun) ? "an" : "a";
  return `Read ${article} ${noun}.`;
}
