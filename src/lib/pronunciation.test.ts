// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mergeAssessments, parseAzureAssessment } from "./pronunciation";
import { encodeWav } from "./wav";

describe("parseAzureAssessment", () => {
  it("converts 100 ns ticks to seconds and keeps word error types", () => {
    const result = parseAzureAssessment({
      RecognitionStatus: "Success",
      NBest: [
        {
          Display: "Good morning.",
          AccuracyScore: 90,
          FluencyScore: 80,
          CompletenessScore: 100,
          ProsodyScore: 70,
          PronScore: 85,
          Words: [
            {
              Word: "good",
              Offset: 7_000_000,
              Duration: 2_600_000,
              AccuracyScore: 95,
              ErrorType: "None",
            },
            { Word: "morning", AccuracyScore: 0, ErrorType: "Omission" },
          ],
        },
      ],
    });
    expect(result.pronunciation).toBe(85);
    expect(result.prosody).toBe(70);
    expect(result.words[0].start).toBeCloseTo(0.7);
    expect(result.words[0].end).toBeCloseTo(0.96);
    expect(result.words[1].errorType).toBe("Omission");
  });

  it("reads the scores the Speech SDK nests under PronunciationAssessment", () => {
    const result = parseAzureAssessment({
      RecognitionStatus: "Success",
      NBest: [
        {
          PronunciationAssessment: { PronScore: 93.1, ProsodyScore: 89.9 },
          Words: [
            {
              Word: "the",
              Offset: 400_000,
              Duration: 900_000,
              PronunciationAssessment: { AccuracyScore: 80, ErrorType: "None" },
            },
          ],
        },
      ],
    });
    expect(result.pronunciation).toBe(93.1);
    expect(result.prosody).toBe(89.9);
    expect(result.words[0].accuracy).toBe(80);
  });

  it("throws when Azure recognized no speech", () => {
    expect(() =>
      parseAzureAssessment({ RecognitionStatus: "InitialSilenceTimeout" }),
    ).toThrow(/InitialSilenceTimeout/);
  });
});

describe("encodeWav", () => {
  it("writes a 16-bit mono PCM header followed by the samples", async () => {
    const blob = encodeWav(new Float32Array([0, 1, -1]), 16_000);
    const view = new DataView(await blob.arrayBuffer());
    expect(blob.size).toBe(44 + 6);
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getInt16(46, true)).toBe(0x7fff);
    expect(view.getInt16(48, true)).toBe(-0x8000);
  });
});

describe("mergeAssessments", () => {
  const segment = (pronunciation: number, words: number) => ({
    recognized: "x",
    pronunciation,
    accuracy: pronunciation,
    fluency: pronunciation,
    completeness: 100,
    prosody: null,
    words: Array.from({ length: words }, (_, i) => ({
      word: "w",
      start: i,
      end: i + 0.5,
      accuracy: pronunciation,
      errorType: "None",
    })),
  });

  it("weights each segment's score by its word count", () => {
    const merged = mergeAssessments([segment(90, 9), segment(40, 1)]);
    expect(merged.pronunciation).toBeCloseTo(85);
    expect(merged.words).toHaveLength(10);
  });

  it("reports no prosody when any segment lacks it", () => {
    expect(
      mergeAssessments([{ ...segment(80, 2), prosody: 70 }, segment(80, 2)])
        .prosody,
    ).toBeNull();
  });
});
