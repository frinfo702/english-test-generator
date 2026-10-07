import { describe, expect, it } from "vitest";
import {
  parseEmail,
  parseNotice,
  readingPrompt,
  resolveLayout,
  type DailyLifeText,
} from "./dailyLife";

function text(partial: Partial<DailyLifeText>): DailyLifeText {
  return { id: "t1", textType: "notice", questions: [], ...partial };
}

describe("resolveLayout", () => {
  it("prefers an explicit layout", () => {
    expect(resolveLayout(text({ textType: "email", layout: "document" }))).toBe(
      "document",
    );
  });

  it("infers the layout from textType", () => {
    expect(resolveLayout(text({ textType: "Email" }))).toBe("email");
    expect(resolveLayout(text({ textType: "advertisement" }))).toBe("notice");
    expect(resolveLayout(text({ textType: "schedule" }))).toBe("document");
  });

  it("falls back to document when a chat has no messages", () => {
    expect(resolveLayout(text({ textType: "text message" }))).toBe("document");
    expect(
      resolveLayout(
        text({
          textType: "text message",
          messages: [{ sender: "A", text: "Hi" }],
        }),
      ),
    ).toBe("chat");
  });
});

describe("parseEmail", () => {
  it("splits header lines from the body", () => {
    const parsed = parseEmail(
      "From: David Chen\nTo: All Staff\nSubject: Parking\n\nDear Team,\nHello.",
    );
    expect(parsed.headers).toEqual([
      { label: "From", value: "David Chen" },
      { label: "To", value: "All Staff" },
      { label: "Subject", value: "Parking" },
    ]);
    expect(parsed.body).toBe("Dear Team,\nHello.");
  });

  it("keeps the whole content as body when there are no headers", () => {
    expect(parseEmail("Dear Team,\nHello.")).toEqual({
      headers: [],
      body: "Dear Team,\nHello.",
    });
  });
});

describe("parseNotice", () => {
  it("uses an explicit title and centres short lines", () => {
    const parsed = parseNotice(
      text({
        title: "Join our classes!",
        content: "Classes start on October 1\nEvening sessions",
      }),
    );
    expect(parsed.title).toBe("Join our classes!");
    expect(parsed.paragraphs).toEqual([
      "Classes start on October 1\nEvening sessions",
    ]);
    expect(parsed.centered).toBe(true);
  });

  it("lifts a short first line as the headline and keeps prose left-aligned", () => {
    const parsed = parseNotice(
      text({
        content:
          "Campus Cafe – Winter Hours\n\nDuring reduced hours, only grab-and-go items and coffee will be available at the counter.",
      }),
    );
    expect(parsed.title).toBe("Campus Cafe – Winter Hours");
    expect(parsed.paragraphs).toHaveLength(1);
    expect(parsed.centered).toBe(false);
  });

  it("does not centre bullet lists", () => {
    expect(
      parseNotice(text({ content: "- Item one\n- Item two" })).centered,
    ).toBe(false);
  });
});

describe("readingPrompt", () => {
  it("names the text type with the right article", () => {
    expect(readingPrompt(text({ textType: "advertisement" }))).toBe(
      "Read an advertisement.",
    );
    expect(readingPrompt(text({ textType: "notice" }))).toBe("Read a notice.");
    expect(
      readingPrompt(
        text({
          textType: "text message",
          messages: [{ sender: "A", text: "Hi" }],
        }),
      ),
    ).toBe("Read a message exchange.");
  });
});
