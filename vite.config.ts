import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const QUESTIONS_DIR = fileURLToPath(
  new URL("./public/questions", import.meta.url),
);

/** Rewrites each index.json under public/questions from the files beside it. */
function writeQuestionIndexes(dir = QUESTIONS_DIR) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name)
    .filter((name) => name !== "index.json")
    .sort();
  if (files.length > 0) {
    const indexPath = path.join(dir, "index.json");
    const next = `${JSON.stringify({ files }, null, 2)}\n`;
    const current = fs.existsSync(indexPath)
      ? fs.readFileSync(indexPath, "utf-8")
      : "";
    if (current !== next) fs.writeFileSync(indexPath, next);
  }
  for (const e of entries) {
    if (e.isDirectory()) writeQuestionIndexes(path.join(dir, e.name));
  }
}

/** Adding or deleting a question file is all it takes; no index to edit. */
function questionIndexes(): Plugin {
  return {
    name: "question-indexes",
    buildStart: () => writeQuestionIndexes(),
    configureServer(server) {
      const onChange = (file: string) => {
        if (file.startsWith(QUESTIONS_DIR) && !file.endsWith("index.json")) {
          writeQuestionIndexes();
        }
      };
      server.watcher.on("add", onChange).on("unlink", onChange);
    },
  };
}

export default defineConfig({
  plugins: [react(), questionIndexes()],
  server: {
    proxy: {
      "/api/transcribe": "http://localhost:8788",
    },
  },
});
