import { describe, expect, it } from "vitest";
import {
  parseSuggestedEdits,
  parseTemplateUse,
  splitByEdits,
  type SuggestedEdit,
} from "./writingFeedback";

const block = (json: string) =>
  "Feedback.\n\n```toefl-score\n" + json + "\n```";

const edit = (from: string, to: string): SuggestedEdit => ({
  from,
  to,
  theme: "grammar",
  why: "",
});

describe("parseSuggestedEdits", () => {
  it("reads edits and falls back to grammar for an unknown theme", () => {
    expect(
      parseSuggestedEdits(
        block(
          '{"edits": [{"from": "preparition", "to": "the preparation", "theme": "spelling", "why": "Typo."}], "score": 3}',
        ),
      ),
    ).toEqual([
      {
        from: "preparition",
        to: "the preparation",
        theme: "grammar",
        why: "Typo.",
      },
    ]);
  });

  it("is empty for replies from before edits", () => {
    expect(parseSuggestedEdits(block('{"score": 3}'))).toEqual([]);
  });
});

describe("parseTemplateUse", () => {
  it("reads one flag per part and ignores a list of the wrong length", () => {
    const reply = block('{"template": [1, 0, 1], "score": 3}');
    expect(parseTemplateUse(reply, 3)).toEqual([true, false, true]);
    expect(parseTemplateUse(reply, 5)).toBe(null);
  });
});

describe("splitByEdits", () => {
  it("numbers edits in order and keeps the text between them", () => {
    expect(
      splitByEdits("I has a plan. It are good.", [
        edit("has", "have"),
        edit("are", "is"),
      ]),
    ).toEqual([
      { kind: "text", text: "I " },
      { kind: "edit", n: 1, edit: edit("has", "have") },
      { kind: "text", text: " a plan. It " },
      { kind: "edit", n: 2, edit: edit("are", "is") },
      { kind: "text", text: " good." },
    ]);
  });

  it("drops an edit whose text isn't in the response", () => {
    const segments = splitByEdits("Hello there.", [
      edit("paraphrased", "x"),
      edit("there", "everyone"),
    ]);
    expect(segments.filter((s) => s.kind === "edit")).toEqual([
      { kind: "edit", n: 1, edit: edit("there", "everyone") },
    ]);
  });
});
