import { config } from "dotenv";
config({ path: ".env.local" });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const SCORES_FILE = path.resolve(__dirname, "scores/history.json");
const ANSWERS_DIR = path.resolve(__dirname, "answers");
const ANSWERS_HISTORY_FILE = path.join(ANSWERS_DIR, "history.json");
const ANSWERS_SUBMISSIONS_DIR = path.join(ANSWERS_DIR, "submissions");
const AUDIO_CACHE_DIR = path.resolve(__dirname, "public/audio-cache");

interface SavedAnswerSummary {
  answerId: string;
  sequence: number;
  taskId: string;
  problemId: string;
  createdAt: string;
  file: string;
}

interface SavedAnswerRecord extends SavedAnswerSummary {
  response: string;
  question?: unknown;
}

function ensureScoresFile() {
  const dir = path.dirname(SCORES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(SCORES_FILE)) fs.writeFileSync(SCORES_FILE, "[]", "utf-8");
}

function ensureAnswersFiles() {
  if (!fs.existsSync(ANSWERS_DIR))
    fs.mkdirSync(ANSWERS_DIR, { recursive: true });
  if (!fs.existsSync(ANSWERS_SUBMISSIONS_DIR)) {
    fs.mkdirSync(ANSWERS_SUBMISSIONS_DIR, { recursive: true });
  }
  if (!fs.existsSync(ANSWERS_HISTORY_FILE)) {
    fs.writeFileSync(ANSWERS_HISTORY_FILE, "[]", "utf-8");
  }
}

function ensureAudioCacheDir() {
  if (!fs.existsSync(AUDIO_CACHE_DIR)) {
    fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
  }
}

function getAudioCacheKey(text: string, voiceId: string): string {
  return crypto.createHash("sha256").update(`${voiceId}:${text}`).digest("hex");
}

function readJsonArray<T>(filePath: string): T[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "score-api",
      configureServer(server) {
        ensureScoresFile();
        ensureAnswersFiles();

        server.middlewares.use(
          "/api/scores",
          async (req: IncomingMessage, res: ServerResponse) => {
            res.setHeader("Content-Type", "application/json");

            if (req.method === "GET") {
              const raw = fs.readFileSync(SCORES_FILE, "utf-8");
              res.end(raw);
              return;
            }

            if (req.method === "POST") {
              const body = await readBody(req);
              const entry = JSON.parse(body);
              const raw = fs.readFileSync(SCORES_FILE, "utf-8");
              const entries = JSON.parse(raw);
              entries.push(entry);
              fs.writeFileSync(
                SCORES_FILE,
                JSON.stringify(entries, null, 2),
                "utf-8",
              );
              res.end(JSON.stringify({ ok: true }));
              return;
            }

            if (req.method === "DELETE") {
              fs.writeFileSync(SCORES_FILE, "[]", "utf-8");
              res.end(JSON.stringify({ ok: true }));
              return;
            }

            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Method not allowed" }));
          },
        );

        server.middlewares.use(
          "/api/answers",
          async (req: IncomingMessage, res: ServerResponse) => {
            res.setHeader("Content-Type", "application/json");

            if (req.method === "GET") {
              const history =
                readJsonArray<SavedAnswerSummary>(ANSWERS_HISTORY_FILE);
              res.end(JSON.stringify(history));
              return;
            }

            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: "Method not allowed" }));
              return;
            }

            try {
              const body = await readBody(req);
              const parsed = JSON.parse(body) as {
                taskId?: string;
                problemId?: string;
                response?: string;
                question?: unknown;
              };

              if (
                typeof parsed.taskId !== "string" ||
                typeof parsed.problemId !== "string" ||
                typeof parsed.response !== "string"
              ) {
                res.statusCode = 400;
                res.end(
                  JSON.stringify({
                    error:
                      "taskId, problemId, and response are required string fields.",
                  }),
                );
                return;
              }

              const history =
                readJsonArray<SavedAnswerSummary>(ANSWERS_HISTORY_FILE);
              const lastSequence = history.reduce((max, item) => {
                if (typeof item.sequence !== "number") return max;
                return Math.max(max, item.sequence);
              }, 0);
              const sequence = lastSequence + 1;
              const answerId = `ans-${String(sequence).padStart(6, "0")}`;
              const createdAt = new Date().toISOString();
              const file = `submissions/${answerId}.json`;

              const record: SavedAnswerRecord = {
                answerId,
                sequence,
                taskId: parsed.taskId,
                problemId: parsed.problemId,
                response: parsed.response,
                question: parsed.question,
                createdAt,
                file,
              };
              fs.writeFileSync(
                path.join(ANSWERS_DIR, file),
                JSON.stringify(record, null, 2),
                "utf-8",
              );

              const summary: SavedAnswerSummary = {
                answerId,
                sequence,
                taskId: parsed.taskId,
                problemId: parsed.problemId,
                createdAt,
                file,
              };
              history.push(summary);
              fs.writeFileSync(
                ANSWERS_HISTORY_FILE,
                JSON.stringify(history, null, 2),
                "utf-8",
              );

              res.end(JSON.stringify({ answerId }));
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Failed to save the answer." }));
            }
          },
        );
        server.middlewares.use(
          "/api/tts",
          async (req: IncomingMessage, res: ServerResponse) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Method not allowed" }));
              return;
            }
            try {
              const body = await readBody(req);
              const parsed = JSON.parse(body) as {
                text?: string;
                voice_id?: string;
              };
              if (!parsed.text || typeof parsed.text !== "string") {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "text is required" }));
                return;
              }
              const apiKey = process.env.XAI_API_KEY;
              if (!apiKey) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({ error: "XAI_API_KEY not configured" }),
                );
                return;
              }
              const voiceId = parsed.voice_id || "ara";
              ensureAudioCacheDir();
              const cacheKey = getAudioCacheKey(parsed.text, voiceId);
              const cachePath = path.join(AUDIO_CACHE_DIR, `${cacheKey}.mp3`);

              if (fs.existsSync(cachePath)) {
                res.statusCode = 200;
                res.setHeader("Content-Type", "audio/mpeg");
                fs.createReadStream(cachePath).pipe(res);
                return;
              }

              const payload = JSON.stringify({
                text: parsed.text,
                voice_id: voiceId,
                language: "en",
                output_format: {
                  codec: "mp3",
                  sample_rate: 24000,
                  bit_rate: 128000,
                },
              });
              const proxyReq = https.request(
                {
                  hostname: "api.x.ai",
                  path: "/v1/tts",
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload),
                  },
                },
                (proxyRes) => {
                  res.statusCode = proxyRes.statusCode ?? 200;
                  const ct = proxyRes.headers["content-type"] || "audio/mpeg";
                  res.setHeader("Content-Type", ct);

                  const tempPath = `${cachePath}.tmp`;
                  const writeStream = fs.createWriteStream(tempPath);
                  let hasError = false;

                  proxyRes.on("data", (chunk: Buffer) => {
                    res.write(chunk);
                    if (!hasError) {
                      writeStream.write(chunk, (err) => {
                        if (err) {
                          hasError = true;
                          writeStream.destroy();
                          try {
                            fs.unlinkSync(tempPath);
                          } catch {
                            // ignore
                          }
                        }
                      });
                    }
                  });
                  proxyRes.on("end", () => {
                    res.end();
                    if (!hasError) {
                      writeStream.end(() => {
                        try {
                          fs.renameSync(tempPath, cachePath);
                        } catch (err) {
                          console.error("Failed to rename cache file:", err);
                          try {
                            fs.unlinkSync(tempPath);
                          } catch {
                            // ignore
                          }
                        }
                      });
                    }
                  });
                  proxyRes.on("error", (err) => {
                    console.error("TTS proxy response error:", err);
                    hasError = true;
                    writeStream.destroy();
                    try {
                      fs.unlinkSync(tempPath);
                    } catch {
                      // ignore
                    }
                    if (!res.writableEnded) {
                      res.statusCode = 502;
                      res.setHeader("Content-Type", "application/json");
                      res.end(JSON.stringify({ error: "TTS request failed" }));
                    }
                  });
                },
              );
              proxyReq.on("error", (err) => {
                console.error("TTS proxy error:", err);
                res.statusCode = 502;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "TTS request failed" }));
              });
              proxyReq.write(payload);
              proxyReq.end();
            } catch {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Internal server error" }));
            }
          },
        );
      },
    },
  ],
});
