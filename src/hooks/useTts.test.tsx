import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  private channels: Float32Array[];

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }

  getChannelData(channel: number) {
    return this.channels[channel];
  }
}

class FakeAudioContext {
  state: "running" | "suspended" = "running";
  resume = vi.fn(async () => {
    this.state = "running";
  });

  createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
    return new FakeAudioBuffer(numberOfChannels, length, sampleRate) as unknown as AudioBuffer;
  }

  decodeAudioData = vi.fn(async () => {
    const buffer = new FakeAudioBuffer(1, 4, 22050);
    buffer.getChannelData(0).set([0, 0.5, -0.5, 1]);
    return buffer as unknown as AudioBuffer;
  });
}

class FakeAudio {
  static instances: FakeAudio[] = [];

  src: string;
  playbackRate = 1;
  currentTime = 0;
  duration = 12;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(async () => undefined);
  pause = vi.fn(() => undefined);

  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }
}

describe("useTts", () => {
  const fetchMock = vi.fn();
  const createObjectURL = vi.fn(() => "blob:audio");
  const revokeObjectURL = vi.fn();
  const requestAnimationFrameMock = vi.fn(() => 1);
  const cancelAnimationFrameMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    requestAnimationFrameMock.mockClear();
    cancelAnimationFrameMock.mockClear();
    FakeAudio.instances = [];

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("AudioContext", FakeAudioContext as unknown as typeof AudioContext);
    vi.stubGlobal("Audio", FakeAudio as unknown as typeof Audio);
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock);
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrameMock);

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("plays fetched audio and exposes playback controls", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(["audio"], { type: "audio/mpeg" })),
    });

    const { useTts } = await import("./useTts");
    const { result } = renderHook(() => useTts());

    await act(async () => {
      await result.current.play("/audio.mp3");
    });

    expect(fetchMock).toHaveBeenCalledWith("/audio.mp3");
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(result.current.playing).toBe(true);
    expect(result.current.loading).toBe(false);

    const lastAudio = FakeAudio.instances.at(-1);

    act(() => {
      result.current.setPlaybackRate(2);
      result.current.seek(99);
      result.current.pause();
    });

    expect(result.current.playbackRate).toBe(1.5);
    expect(lastAudio?.playbackRate).toBe(1.5);
    expect(lastAudio?.currentTime).toBe(12);
    expect(result.current.playing).toBe(false);

    act(() => {
      result.current.resume();
    });

    await waitFor(() => {
      expect(result.current.playing).toBe(true);
    });
    expect(lastAudio?.play).toHaveBeenCalledTimes(2);
  });

  it("surfaces fetch failures when normal playback cannot start", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    const { useTts } = await import("./useTts");
    const { result } = renderHook(() => useTts());

    await act(async () => {
      await result.current.play("/missing.mp3");
    });

    expect(result.current.playing).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Audio fetch failed (404)");
  });

  it("plays concatenated audio segments with and without gaps", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    const { useTts } = await import("./useTts");
    const { result } = renderHook(() => useTts());

    await act(async () => {
      await result.current.playSegments(["/1.mp3", "/2.mp3"]);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.playing).toBe(true);

    fetchMock.mockClear();
    createObjectURL.mockClear();

    await act(async () => {
      await result.current.playSegmentsWithGaps(["/1.mp3", "/2.mp3"], [0.5]);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });
});
