import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createBlobEvent(data: Blob): Event {
  const event = new Event("dataavailable");
  Object.defineProperty(event, "data", { value: data });
  return event;
}

function createErrorEvent(error: DOMException): Event {
  const event = new Event("error");
  Object.defineProperty(event, "error", { value: error });
  return event;
}

class FakeMediaRecorder extends EventTarget {
  static instances: FakeMediaRecorder[] = [];

  state = "inactive";
  mimeType = "";
  stream: MediaStream;

  start = vi.fn(() => {
    this.state = "recording";
    this.dispatchEvent(new Event("start"));
  });

  stop = vi.fn(() => {
    this.state = "inactive";
    this.dispatchEvent(new Event("stop"));
  });

  requestData = vi.fn();

  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    super();
    this.stream = stream;
    this.mimeType = options?.mimeType ?? "";
    FakeMediaRecorder.instances.push(this);
  }

  emitData(data: Blob) {
    this.dispatchEvent(createBlobEvent(data));
  }

  emitError(error: DOMException) {
    this.dispatchEvent(createErrorEvent(error));
  }

  static isTypeSupported = vi.fn((type: string) =>
    ["audio/webm", "audio/webm;codecs=opus", "audio/mp4"].includes(type),
  );
}

function createFakeStream(deviceId = "default-mic"): MediaStream {
  const track = {
    stop: vi.fn(),
    enabled: true,
    readyState: "live",
    getSettings: () => ({ deviceId }),
  };
  return {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  } as unknown as MediaStream;
}

function createFetchResponse(text: string, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue({ text }),
  } as unknown as Response;
}

describe("useSpeechRecognition", () => {
  let getUserMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    FakeMediaRecorder.instances = [];
    getUserMediaMock = vi.fn().mockResolvedValue(createFakeStream());

    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: getUserMediaMock },
    });
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(createFetchResponse("hello world")),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("reports supported when MediaRecorder and getUserMedia are available", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.supported).toBe(true);
  });

  it("reports unsupported when MediaRecorder is unavailable", async () => {
    vi.stubGlobal("MediaRecorder", undefined);
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.supported).toBe(false);
  });

  it("starts recording and requests microphone access", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    await act(async () => {
      result.current.start();
    });

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenCalled();
    });
    const constraints = getUserMediaMock.mock.calls[0][0] as {
      audio: MediaTrackConstraints;
    };
    expect(constraints.audio).toMatchObject({
      echoCancellation: true,
      noiseSuppression: true,
    });

    const recorder = FakeMediaRecorder.instances[0];
    expect(recorder.start).toHaveBeenCalled();
    expect(result.current.recording).toBe(true);
  });

  it("passes preferred microphone deviceId as exact constraint", async () => {
    localStorage.setItem("preferred-microphone-device-id", "mic-42");
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenCalled();
    });
    const constraints = getUserMediaMock.mock.calls[0][0] as {
      audio: MediaTrackConstraints;
    };
    expect(constraints.audio).toMatchObject({
      deviceId: { exact: "mic-42" },
      echoCancellation: false,
      noiseSuppression: false,
    });
  });

  it("sets an error when microphone permission is denied", async () => {
    getUserMediaMock.mockRejectedValue(
      new DOMException("Permission denied", "NotAllowedError"),
    );

    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    await act(async () => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.error).toContain("denied");
    });
    expect(result.current.recording).toBe(false);
  });

  it("transcribes audio when recording stops", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    await act(async () => {
      result.current.start();
    });

    await waitFor(() => {
      expect(FakeMediaRecorder.instances).toHaveLength(1);
    });

    const recorder = FakeMediaRecorder.instances[0];
    const blob = new Blob(["fake-audio"], { type: "audio/webm" });

    act(() => {
      recorder.emitData(blob);
    });

    await act(async () => {
      await result.current.stop();
    });

    await waitFor(() => {
      expect(result.current.transcript).toBe("hello world");
    });
    expect(result.current.recording).toBe(false);
    expect(result.current.processing).toBe(false);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/transcribe",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns transcribed text from stop()", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => {
      expect(FakeMediaRecorder.instances).toHaveLength(1);
    });

    const recorder = FakeMediaRecorder.instances[0];
    act(() => {
      recorder.emitData(new Blob(["fake-audio"], { type: "audio/webm" }));
    });

    let returned = "";
    await act(async () => {
      returned = await result.current.stop();
    });

    expect(returned).toBe("hello world");
  });

  it("sets an error when the transcription request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(createFetchResponse("", false, 500)),
    );

    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    await act(async () => {
      result.current.start();
    });

    await waitFor(() => {
      expect(FakeMediaRecorder.instances).toHaveLength(1);
    });

    const recorder = FakeMediaRecorder.instances[0];
    recorder.emitData(new Blob(["fake-audio"], { type: "audio/webm" }));

    await act(async () => {
      await result.current.stop();
    });

    await waitFor(() => {
      expect(result.current.error).toContain("failed");
    });
  });

  it("sets an error when the recorder emits an error", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    await act(async () => {
      result.current.start();
    });

    await waitFor(() => {
      expect(FakeMediaRecorder.instances).toHaveLength(1);
    });

    const recorder = FakeMediaRecorder.instances[0];
    act(() => {
      recorder.emitError(new DOMException("Device error", "NotFoundError"));
    });

    await waitFor(() => {
      expect(result.current.error).toContain("No microphone found");
    });
    expect(result.current.recording).toBe(false);
  });
});
