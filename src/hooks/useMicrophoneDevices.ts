import { useCallback, useEffect, useState } from "react";
import {
  loadPreferredMicrophoneId,
  savePreferredMicrophoneId,
} from "../lib/microphonePreference";

export interface MicDevice {
  deviceId: string;
  label: string;
}

export interface UseMicrophoneDevicesReturn {
  devices: MicDevice[];
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string | null) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Ensures permission so device labels are readable (no-op stream if already granted). */
  ensurePermission: () => Promise<boolean>;
}

function mapDevices(list: MediaDeviceInfo[]): MicDevice[] {
  return (
    list
      .filter((d) => d.kind === "audioinput" && d.deviceId)
      // Chrome often lists a default + communications entry with empty or
      // special ids — keep real devices only (non-empty stable ids).
      .filter(
        (d) => d.deviceId !== "default" && d.deviceId !== "communications",
      )
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label?.trim() || `Microphone ${i + 1}`,
      }))
  );
}

async function microphonePermissionGranted(): Promise<boolean> {
  try {
    // Not all browsers support permissions.query for microphone
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return status.state === "granted";
  } catch {
    return false;
  }
}

export function useMicrophoneDevices(): UseMicrophoneDevicesReturn {
  const [devices, setDevices] = useState<MicDevice[]>([]);
  const [selectedDeviceId, setSelectedState] = useState<string | null>(() =>
    loadPreferredMicrophoneId(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setDevices([]);
      return;
    }
    setLoading(true);
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const mics = mapDevices(list);
      setDevices(mics);

      const preferred = loadPreferredMicrophoneId();
      if (preferred && !mics.some((m) => m.deviceId === preferred)) {
        savePreferredMicrophoneId(null);
        setSelectedState(null);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to list microphones.");
    } finally {
      setLoading(false);
    }
  }, []);

  const ensurePermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone is not supported in this browser.");
      return false;
    }
    try {
      // Avoid opening a second stream if permission is already granted —
      // opening the default mic can steal exclusive access from USB mics.
      if (await microphonePermissionGranted()) {
        await refresh();
        return true;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      await refresh();
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        setError("Microphone permission denied.");
      } else {
        setError(
          e instanceof Error ? e.message : "Could not access microphone.",
        );
      }
      return false;
    }
  }, [refresh]);

  const setSelectedDeviceId = useCallback((deviceId: string | null) => {
    savePreferredMicrophoneId(deviceId);
    setSelectedState(deviceId);
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => {
      void refresh();
    };
    navigator.mediaDevices?.addEventListener?.("devicechange", onChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", onChange);
    };
  }, [refresh]);

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    loading,
    error,
    refresh,
    ensurePermission,
  };
}
