import {
  mergeAssessments,
  parseAzureAssessment,
  type PronunciationResult,
} from "./pronunciation";

const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
const SPEECH_TOKEN_API_URL =
  (env?.VITE_SPEECH_TOKEN_API_URL as string | undefined) ?? "/api/speech-token";

async function fetchSpeechToken(): Promise<{ token: string; region: string }> {
  const response = await fetch(SPEECH_TOKEN_API_URL, { method: "POST" });
  const body = (await response.json().catch(() => ({}))) as {
    token?: string;
    region?: string;
    error?: string;
  };
  if (!response.ok || !body.token || !body.region) {
    throw new Error(
      body.error ?? `Speech token request failed (${response.status})`,
    );
  }
  return { token: body.token, region: body.region };
}

/**
 * Unscripted assessment over the SDK's continuous mode, for answers longer
 * than the 30 s the REST endpoint accepts. Unscripted rather than scoring
 * against our own transcript: continuous mode scores each segment against the
 * whole reference, which makes per-segment completeness meaningless.
 */
export async function assessSpontaneousSpeech(
  wav: Blob,
): Promise<PronunciationResult> {
  // Dynamic import keeps the SDK out of the bundle for non-speaking pages.
  const [sdk, { token, region }] = await Promise.all([
    import("microsoft-cognitiveservices-speech-sdk"),
    fetchSpeechToken(),
  ]);

  const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
  speechConfig.speechRecognitionLanguage = "en-US";
  const audioConfig = sdk.AudioConfig.fromWavFileInput(
    new File([wav], "answer.wav", { type: "audio/wav" }),
  );
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  const assessment = new sdk.PronunciationAssessmentConfig(
    "",
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    false,
  );
  assessment.enableProsodyAssessment = true;
  assessment.applyTo(recognizer);

  const segments: PronunciationResult[] = [];
  try {
    await new Promise<void>((resolve, reject) => {
      recognizer.recognized = (_, e) => {
        if (e.result.reason !== sdk.ResultReason.RecognizedSpeech) return;
        const json = e.result.properties.getProperty(
          sdk.PropertyId.SpeechServiceResponse_JsonResult,
        );
        segments.push(parseAzureAssessment(JSON.parse(json)));
      };
      recognizer.canceled = (_, e) => {
        if (e.reason === sdk.CancellationReason.Error) {
          reject(new Error(e.errorDetails || "Pronunciation scoring failed."));
        } else {
          resolve();
        }
      };
      recognizer.sessionStopped = () => resolve();
      recognizer.startContinuousRecognitionAsync(undefined, (err) =>
        reject(new Error(err)),
      );
    });
  } finally {
    recognizer.close();
  }

  if (segments.length === 0) throw new Error("No speech was recognized.");
  return mergeAssessments(segments);
}
