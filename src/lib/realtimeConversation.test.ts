import { describe, expect, it } from "vitest";
import {
  applyEvent,
  base64PcmToFloat,
  floatToBase64Pcm,
  type Line,
} from "./realtimeConversation";

describe("PCM conversion", () => {
  it("round-trips within 16-bit precision", () => {
    const input = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const back = base64PcmToFloat(floatToBase64Pcm(input));
    input.forEach((v, i) => expect(back[i]).toBeCloseTo(v, 3));
  });
});

describe("applyEvent", () => {
  it("builds both sides of the log from streamed events", () => {
    let lines: Line[] = [];
    const events = [
      { type: "response.output_audio_transcript.delta", item_id: "a", delta: "Hi, " },
      { type: "response.output_audio_transcript.delta", item_id: "a", delta: "tell me." },
      { type: "conversation.item.input_audio_transcription.updated", item_id: "b", transcript: "My research" },
      { type: "conversation.item.input_audio_transcription.updated", item_id: "b", transcript: "My research is 汎化" },
      { type: "session.updated" },
    ];
    for (const e of events) lines = applyEvent(lines, e);
    expect(lines).toEqual([
      { id: "a", who: "partner", text: "Hi, tell me." },
      { id: "b", who: "you", text: "My research is 汎化" },
    ]);
  });

  it("keeps the learner's turn before the reply even when transcription arrives late", () => {
    let lines: Line[] = [];
    const events = [
      { type: "input_audio_buffer.speech_started", item_id: "u1" },
      { type: "response.output_audio_transcript.delta", item_id: "p1", delta: "Interesting!" },
      { type: "conversation.item.input_audio_transcription.completed", item_id: "u1", transcript: "I study NLP." },
    ];
    for (const e of events) lines = applyEvent(lines, e);
    expect(lines.map((l) => l.text)).toEqual(["I study NLP.", "Interesting!"]);
  });
});
