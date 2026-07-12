import { describe, expect, it } from "vitest";
import { isPredominantlyJapaneseScript } from "./transcriptionLanguage";

describe("isPredominantlyJapaneseScript", () => {
  it("detects katakana-heavy English mis-transcripts", () => {
    expect(
      isPredominantlyJapaneseScript(
        "アイ シンク ユニバーシティー シュッド メイク コミュニティ サービス",
      ),
    ).toBe(true);
  });

  it("detects mixed Japanese script answers", () => {
    expect(
      isPredominantlyJapaneseScript(
        "私は大学でコミュニティサービスを必修にすべきだと思います。",
      ),
    ).toBe(true);
  });

  it("accepts normal English transcripts", () => {
    expect(
      isPredominantlyJapaneseScript(
        "I think universities should make community service a graduation requirement.",
      ),
    ).toBe(false);
  });

  it("accepts short empty or sparse text", () => {
    expect(isPredominantlyJapaneseScript("")).toBe(false);
    expect(isPredominantlyJapaneseScript("OK")).toBe(false);
  });
});
