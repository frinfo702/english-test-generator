const STORAGE_KEY = "preferred-microphone-device-id";

/** Empty string / null means system default. */
export function loadPreferredMicrophoneId(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value || value.trim() === "") return null;
    return value;
  } catch {
    return null;
  }
}

export function savePreferredMicrophoneId(deviceId: string | null): void {
  try {
    if (!deviceId) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, deviceId);
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Constraints for getUserMedia.
 * - Specific device: use exact deviceId so the browser cannot silently pick
 *   another mic. Soften AEC/NS — they often ruin USB/headset mics.
 * - Default: allow browser AEC/NS for built-in laptop mics.
 */
export function buildAudioConstraints(
  deviceId: string | null | undefined,
): MediaTrackConstraints {
  if (deviceId) {
    return {
      deviceId: { exact: deviceId },
      // Aggressive processing often zeros out external USB/headset mics
      // while the analyser still shows some energy (false "working" waveform).
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: true,
      channelCount: { ideal: 1 },
    };
  }
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: { ideal: 1 },
  };
}

export function isConstraintError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "OverconstrainedError" ||
    error.name === "ConstraintNotSatisfiedError" ||
    error.name === "NotFoundError"
  );
}

/**
 * Open the preferred mic, with safe fallbacks if exact deviceId fails.
 */
export async function openMicrophoneStream(
  preferredId: string | null | undefined,
): Promise<{ stream: MediaStream; usedDeviceId: string | null }> {
  const id = preferredId?.trim() || null;

  if (id) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: buildAudioConstraints(id),
      });
      return { stream, usedDeviceId: actualDeviceId(stream) ?? id };
    } catch (error) {
      if (!isConstraintError(error)) throw error;
      // Device unplugged or constraint unsupported — try ideal, then default.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { ideal: id },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true,
            channelCount: { ideal: 1 },
          },
        });
        return { stream, usedDeviceId: actualDeviceId(stream) };
      } catch {
        // fall through to default
      }
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: buildAudioConstraints(null),
  });
  return { stream, usedDeviceId: actualDeviceId(stream) };
}

export function actualDeviceId(stream: MediaStream): string | null {
  const track = stream.getAudioTracks()[0];
  if (!track) return null;
  const settings = track.getSettings();
  return typeof settings.deviceId === "string" && settings.deviceId
    ? settings.deviceId
    : null;
}
