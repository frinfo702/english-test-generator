import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeSpeechRecognitionResult {
  isFinal: boolean;
  transcript: string;

  constructor(transcript: string, isFinal: boolean) {
    this.transcript = transcript;
    this.isFinal = isFinal;
  }

  get [0]() {
    return { transcript: this.transcript };
  }
}

function createResultList(results: FakeSpeechRecognitionResult[]) {
  return new Proxy(
    { length: results.length },
    {
      get(target, prop) {
        if (prop === "length") return target.length;
        const index = Number(prop);
        if (!Number.isNaN(index)) return results[index];
        return undefined;
      },
    },
  ) as unknown as SpeechRecognitionResultList;
}

class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];

  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onend: (() => void) | null = null;

  start = vi.fn(() => undefined);
  stop = vi.fn(() => undefined);
  abort = vi.fn(() => undefined);

  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }

  emitResult(results: FakeSpeechRecognitionResult[]) {
    if (this.onresult) {
      const event = new Event("result");
      Object.defineProperty(event, "results", {
        value: createResultList(results),
      });
      this.onresult(event);
    }
  }

  emitEnd() {
    this.onend?.();
  }

  emitError(error: string, message = "") {
    if (this.onerror) {
      const event = new Event("error");
      Object.defineProperty(event, "error", { value: error });
      Object.defineProperty(event, "message", { value: message });
      this.onerror(event);
    }
  }
}

describe("useSpeechRecognition", () => {
  beforeEach(() => {
    FakeSpeechRecognition.instances = [];
    vi.stubGlobal(
      "SpeechRecognition",
      FakeSpeechRecognition as unknown as new () => unknown,
    );
    vi.stubGlobal(
      "webkitSpeechRecognition",
      FakeSpeechRecognition as unknown as new () => unknown,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports supported when SpeechRecognition is available", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.supported).toBe(true);
  });

  it("starts recognition and sets recording state", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    const instance = FakeSpeechRecognition.instances[0];
    expect(instance.start).toHaveBeenCalled();
    expect(instance.continuous).toBe(false);
    expect(result.current.recording).toBe(true);
  });

  it("updates transcript from final and interim results", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    const instance = FakeSpeechRecognition.instances[0];

    act(() => {
      instance.emitResult([new FakeSpeechRecognitionResult("hello", false)]);
    });

    expect(result.current.transcript).toBe("hello");

    act(() => {
      instance.emitResult([
        new FakeSpeechRecognitionResult("hello", true),
        new FakeSpeechRecognitionResult(" world", false),
      ]);
    });

    expect(result.current.transcript).toBe("hello world");
  });

  it("stops recognition and resolves when onend fires", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    const instance = FakeSpeechRecognition.instances[0];

    let stopped = false;
    act(() => {
      void result.current.stop().then(() => {
        stopped = true;
      });
    });

    expect(instance.stop).toHaveBeenCalled();

    act(() => {
      instance.emitEnd();
    });

    await waitFor(() => {
      expect(stopped).toBe(true);
    });
    expect(result.current.recording).toBe(false);
  });

  it("sets an error when recognition is unsupported", async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("SpeechRecognition", undefined);
    vi.stubGlobal("webkitSpeechRecognition", undefined);

    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.supported).toBe(false);

    act(() => {
      result.current.start();
    });

    expect(result.current.error).toContain("not supported");
  });

  it("ignores no-speech and aborted errors", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    const instance = FakeSpeechRecognition.instances[0];

    act(() => {
      instance.emitError("no-speech");
    });

    expect(result.current.error).toBeNull();

    act(() => {
      instance.emitError("aborted");
    });

    expect(result.current.error).toBeNull();
  });

  it("shows a friendly message for network errors", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    const instance = FakeSpeechRecognition.instances[0];

    act(() => {
      instance.emitError("network");
    });

    expect(result.current.error).toContain("network error");
    expect(result.current.recording).toBe(false);
  });

  it("restarts recognition when onend fires without stop being called", async () => {
    class AutoEndRecognition extends FakeSpeechRecognition {
      start = vi.fn(() => {
        if (FakeSpeechRecognition.instances.length > 1) return;
        queueMicrotask(() => {
          this.emitEnd();
        });
      });
    }

    vi.stubGlobal(
      "SpeechRecognition",
      AutoEndRecognition as unknown as new () => unknown,
    );
    vi.stubGlobal(
      "webkitSpeechRecognition",
      AutoEndRecognition as unknown as new () => unknown,
    );
    FakeSpeechRecognition.instances = [];

    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    expect(result.current.recording).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(FakeSpeechRecognition.instances).toHaveLength(2);
    });

    expect(result.current.recording).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("ignores late end events from a previous recognition instance", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    const firstInstance = FakeSpeechRecognition.instances[0];

    act(() => {
      result.current.start();
    });

    const secondInstance = FakeSpeechRecognition.instances[1];

    expect(firstInstance.abort).toHaveBeenCalled();
    expect(secondInstance.start).toHaveBeenCalled();

    act(() => {
      firstInstance.emitEnd();
    });

    expect(result.current.recording).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("keeps transcript across automatic restarts", async () => {
    const { useSpeechRecognition } = await import("./useSpeechRecognition");
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    const firstInstance = FakeSpeechRecognition.instances[0];

    act(() => {
      firstInstance.emitResult([
        new FakeSpeechRecognitionResult("hello", true),
      ]);
      firstInstance.emitEnd();
    });

    await waitFor(() => {
      expect(FakeSpeechRecognition.instances).toHaveLength(2);
    });

    const secondInstance = FakeSpeechRecognition.instances[1];

    act(() => {
      secondInstance.emitResult([
        new FakeSpeechRecognitionResult("world", true),
      ]);
    });

    expect(result.current.transcript).toBe("hello world");
  });
});
