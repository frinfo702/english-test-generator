/**
 * Live spoken conversation over OpenAI's Realtime API: the mic streams up as
 * 24 kHz PCM, the partner's voice streams back, and both sides' transcripts
 * build a log that the speaking loop analyzes afterwards.
 */
import {
  loadPreferredMicrophoneId,
  openMicrophoneStream,
} from "./microphonePreference";

const RATE = 24000;
/** Mic audio goes up in 100 ms batches; per 128-sample frame would flood the socket. */
const BATCH_SAMPLES = RATE / 10;
/** Billing runs while connected, so a forgotten session is cut after a quiet minute. */
const IDLE_MS = 60_000;

export interface Line {
  /** Server item id, so streamed updates land on the right line. */
  id: string;
  who: "you" | "partner";
  text: string;
}

export function floatToBase64Pcm(samples: Float32Array): string {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  samples.forEach((s, i) => {
    const c = Math.max(-1, Math.min(1, s));
    view.setInt16(i * 2, c < 0 ? c * 0x8000 : c * 0x7fff, true);
  });
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function base64PcmToFloat(b64: string): Float32Array {
  const bin = atob(b64);
  const out = new Float32Array(bin.length >> 1);
  for (let i = 0; i < out.length; i++) {
    const v = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
    out[i] = (v >= 0x8000 ? v - 0x10000 : v) / 0x8000;
  }
  return out;
}

type ServerEvent = Record<string, unknown> & { type?: string };

/**
 * Folds one server event into the log. Both the GA and the older beta
 * event names are matched, so a model or API version bump doesn't blank it.
 */
export function applyEvent(lines: Line[], e: ServerEvent): Line[] {
  const id = String(e.item_id ?? e.response_id ?? "");
  const upsert = (who: Line["who"], text: (prev: string) => string) => {
    const i = lines.findIndex((l) => l.id === id && l.who === who);
    if (i < 0) return [...lines, { id, who, text: text("") }];
    return lines.map((l, j) => (j === i ? { ...l, text: text(l.text) } : l));
  };
  switch (e.type) {
    // Transcription lands after the partner has started replying, so the
    // learner's line is reserved when they start speaking to keep turn order.
    case "input_audio_buffer.speech_started":
      return upsert("you", (p) => p);
    // "updated" is cumulative (older servers); "completed" is final.
    case "conversation.item.input_audio_transcription.updated":
    case "conversation.item.input_audio_transcription.completed":
      return upsert("you", () => String(e.transcript ?? ""));
    case "conversation.item.input_audio_transcription.delta":
      return upsert("you", (p) => p + String(e.delta ?? ""));
    case "response.output_audio_transcript.delta":
    case "response.audio_transcript.delta":
      return upsert("partner", (p) => p + String(e.delta ?? ""));
    case "response.output_audio_transcript.done":
    case "response.audio_transcript.done":
      return e.transcript
        ? upsert("partner", () => String(e.transcript))
        : lines;
    default:
      return lines;
  }
}

export function partnerInstructions(topic: string): string {
  return `You are a conversation partner for a Japanese graduate student practicing spoken English (around CEFR B1–B2). Topic: ${topic}
Act like a friendly but real interviewer or colleague: ask one question at a time, follow up on what they actually said, and push for detail and reasons. Keep your turns short (one to three sentences) so they talk more than you. Speak at a natural pace. Do not correct their English during the conversation. If they slip into Japanese, understand it and carry on in English.`;
}

const TAP_WORKLET = `registerProcessor("pcm-tap", class extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
});`;

export interface Conversation {
  stop: (reason?: string) => void;
  /** The mic, for a level meter while the learner talks. */
  stream: MediaStream;
  /** Taps the partner's playback, for a level meter while it talks. */
  output: AnalyserNode;
}

export async function startConversation(
  topic: string,
  on: {
    lines: (update: (prev: Line[]) => Line[]) => void;
    error: (message: string) => void;
    /** `reason` is set when the session ended itself (idle, hidden tab, time limit). */
    closed: (reason?: string) => void;
    speaking: (partnerIsSpeaking: boolean) => void;
  },
): Promise<Conversation> {
  const res = await fetch("/api/realtime-token", { method: "POST" });
  const body = (await res.json().catch(() => ({}))) as {
    token?: string;
    model?: string;
    error?: string;
  };
  if (!res.ok || !body.token || !body.model)
    throw new Error(body.error ?? `Token request failed (${res.status})`);

  const { stream } = await openMicrophoneStream(loadPreferredMicrophoneId());
  const ctx = new AudioContext({ sampleRate: RATE });
  const workletUrl = URL.createObjectURL(
    new Blob([TAP_WORKLET], { type: "text/javascript" }),
  );
  try {
    await ctx.audioWorklet.addModule(workletUrl);
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
    throw e;
  } finally {
    URL.revokeObjectURL(workletUrl);
  }
  const source = ctx.createMediaStreamSource(stream);
  const tap = new AudioWorkletNode(ctx, "pcm-tap");
  source.connect(tap);
  // A node off the graph isn't pulled; the tap writes no output, so this is silent.
  tap.connect(ctx.destination);

  const ws = new WebSocket(`wss://api.openai.com/v1/realtime?model=${body.model}`, [
    "realtime",
    `openai-insecure-api-key.${body.token}`,
  ]);
  const send = (event: object) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event));
  };

  let pending: Float32Array[] = [];
  let pendingLength = 0;
  tap.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
    pending.push(data);
    pendingLength += data.length;
    if (pendingLength < BATCH_SAMPLES) return;
    const batch = new Float32Array(pendingLength);
    let offset = 0;
    for (const p of pending) {
      batch.set(p, offset);
      offset += p.length;
    }
    pending = [];
    pendingLength = 0;
    send({ type: "input_audio_buffer.append", audio: floatToBase64Pcm(batch) });
  };

  const output = ctx.createAnalyser();
  output.connect(ctx.destination);
  let playhead = 0;
  const playing = new Set<AudioBufferSourceNode>();
  const play = (b64: string) => {
    const samples = base64PcmToFloat(b64);
    if (samples.length === 0) return;
    const buffer = ctx.createBuffer(1, samples.length, RATE);
    buffer.getChannelData(0).set(samples);
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(output);
    playhead = Math.max(playhead, ctx.currentTime);
    node.start(playhead);
    playhead += buffer.duration;
    if (playing.size === 0) on.speaking(true);
    playing.add(node);
    node.onended = () => {
      playing.delete(node);
      if (playing.size === 0) on.speaking(false);
    };
  };
  const hush = () => {
    playing.forEach((n) => {
      n.onended = null;
      n.stop();
    });
    if (playing.size) on.speaking(false);
    playing.clear();
    playhead = 0;
  };

  // Not armed while the learner is mid-utterance, so a long answer isn't cut.
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const bump = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(
      () => stop("Ended after a quiet minute, to save API usage."),
      IDLE_MS,
    );
  };
  const onVisibility = () => {
    if (document.hidden) stop("Ended because the tab was hidden.");
  };
  document.addEventListener("visibilitychange", onVisibility);

  ws.onopen = () => {
    send({
      type: "session.update",
      session: {
        type: "realtime",
        instructions: partnerInstructions(topic),
        audio: {
          // No language hint: the learner may switch to Japanese mid-sentence.
          input: {
            format: { type: "audio/pcm", rate: RATE },
            transcription: { model: "gpt-4o-mini-transcribe" },
            turn_detection: { type: "server_vad" },
          },
          output: { format: { type: "audio/pcm", rate: RATE }, voice: "marin" },
        },
      },
    });
    // The partner opens, as an interviewer would.
    send({ type: "response.create" });
    bump();
  };
  ws.onmessage = ({ data }) => {
    let e: ServerEvent;
    try {
      e = JSON.parse(String(data));
    } catch {
      return;
    }
    if (e.type === "response.output_audio.delta" || e.type === "response.audio.delta") {
      play(String(e.delta ?? ""));
      bump();
    } else if (e.type === "input_audio_buffer.speech_started") {
      hush();
      clearTimeout(idleTimer);
      on.lines((prev) => applyEvent(prev, e));
    } else if (e.type === "input_audio_buffer.speech_stopped") bump();
    else if (e.type === "error") {
      const err = e.error as { message?: string } | undefined;
      on.error(err?.message ?? "The voice server reported an error.");
    } else on.lines((prev) => applyEvent(prev, e));
  };

  let stopped = false;
  function stop(reason?: string) {
    if (stopped) return;
    stopped = true;
    clearTimeout(idleTimer);
    document.removeEventListener("visibilitychange", onVisibility);
    hush();
    tap.port.onmessage = null;
    source.disconnect();
    tap.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
    ws.close();
    on.closed(reason);
  }
  ws.onerror = () => on.error("Lost the connection to the voice server.");
  ws.onclose = () => stop();
  return { stop, stream, output };
}
