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
 * - Specific device: exact deviceId; soft AEC/NS (USB/headset mics break with hard AEC).
 * - Default: browser AEC/NS for built-in mics.
 */
export function buildAudioConstraints(
  deviceId: string | null | undefined,
  mode: "exact" | "ideal" | "default" = deviceId ? "exact" : "default",
): MediaTrackConstraints {
  if (mode === "default" || !deviceId) {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: { ideal: 1 },
    };
  }

  return {
    deviceId: mode === "exact" ? { exact: deviceId } : { ideal: deviceId },
    echoCancellation: false,
    noiseSuppression: false,
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

export function actualDeviceId(stream: MediaStream): string | null {
  const track = stream.getAudioTracks()[0];
  if (!track) return null;
  const settings = track.getSettings();
  return typeof settings.deviceId === "string" && settings.deviceId
    ? settings.deviceId
    : null;
}

/**
 * Open preferred mic with ordered fallbacks: exact → ideal → default.
 */
export async function openMicrophoneStream(
  preferredId: string | null | undefined,
): Promise<{ stream: MediaStream; usedDeviceId: string | null }> {
  const id = preferredId?.trim() || null;
  const attempts: MediaTrackConstraints[] = id
    ? [
        buildAudioConstraints(id, "exact"),
        buildAudioConstraints(id, "ideal"),
        buildAudioConstraints(null, "default"),
      ]
    : [buildAudioConstraints(null, "default")];

  let lastError: unknown;
  for (const audio of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio });
      return { stream, usedDeviceId: actualDeviceId(stream) ?? id };
    } catch (error) {
      lastError = error;
      // Permission / busy errors must surface; only constraint failures retry.
      if (!isConstraintError(error)) throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to open microphone");
}
