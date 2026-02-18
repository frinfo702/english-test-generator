import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const SCORES_FILE = path.resolve(__dirname, "scores/history.json");

function ensureScoresFile() {
  const dir = path.dirname(SCORES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(SCORES_FILE)) fs.writeFileSync(SCORES_FILE, "[]", "utf-8");
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
      },
    },
  ],
});
