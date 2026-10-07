/**
 * Compare src/lib/voiceMapping.ts with xAI's live voice catalog.
 * Usage: npm run check-voices   (needs XAI_API_KEY in .env.local)
 * Exits non-zero when a voice is missing, removed, or has a different gender.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { ALL_VOICES } from "../src/lib/voiceMapping.ts";

interface ApiVoice {
  voice_id: string;
  name: string;
  gender: string;
}

async function main() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY is not set (.env.local)");

  const res = await fetch("https://api.x.ai/v1/tts/voices", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`GET /v1/tts/voices failed: ${res.status}`);
  const { voices } = (await res.json()) as { voices: ApiVoice[] };

  const local = new Map(ALL_VOICES.map((v) => [v.id, v]));
  const remote = new Map(voices.map((v) => [v.voice_id.toLowerCase(), v]));
  const problems = [
    ...voices
      .filter((v) => !local.has(v.voice_id.toLowerCase()))
      .map((v) => `missing locally: ${v.voice_id} (${v.gender})`),
    ...ALL_VOICES.filter((v) => !remote.has(v.id)).map(
      (v) => `no longer in API: ${v.id}`,
    ),
    ...ALL_VOICES.filter(
      (v) => remote.has(v.id) && remote.get(v.id)!.gender !== v.gender,
    ).map(
      (v) =>
        `gender differs: ${v.id} local=${v.gender} api=${remote.get(v.id)!.gender}`,
    ),
  ];

  console.log(`API: ${voices.length} voices, local: ${ALL_VOICES.length}`);
  if (problems.length) {
    problems.forEach((p) => console.log(`  ${p}`));
    process.exit(1);
  }
  console.log("Voice list is up to date.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
