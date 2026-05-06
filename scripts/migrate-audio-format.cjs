const fs = require("node:fs");
const path = require("node:path");

const BASE_DIR = path.resolve(__dirname, "../public/questions/toefl/listening");

function parseConversationAudioText(text) {
  const regex = /([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*):\s*/g;
  const segments = [];
  let lastIndex = 0;
  let lastRole = null;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (lastRole !== null) {
      const segmentText = text.slice(lastIndex, match.index).trim();
      if (segmentText) {
        segments.push({ role: lastRole, text: segmentText });
      }
    }
    lastRole = match[1];
    lastIndex = match.index + match[0].length;
  }

  if (lastRole !== null) {
    const segmentText = text.slice(lastIndex).trim();
    if (segmentText) {
      segments.push({ role: lastRole, text: segmentText });
    }
  }

  return segments;
}

function migrateFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  if (!data.audioText || typeof data.audioText !== "string") {
    console.log(`Skip (no audioText): ${filePath}`);
    return;
  }

  if (data.audioSegments) {
    console.log(`Skip (already has audioSegments): ${filePath}`);
    return;
  }

  const isConversation = filePath.includes("/conversation/");
  let audioSegments;

  if (isConversation) {
    audioSegments = parseConversationAudioText(data.audioText);
    if (audioSegments.length === 0) {
      console.warn(`Warning: no segments parsed in ${filePath}`);
      return;
    }
  } else {
    // lecture
    audioSegments = [{ role: "Lecturer", text: data.audioText }];
  }

  const newData = { ...data, audioSegments };
  delete newData.audioText;

  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2) + "\n", "utf-8");
  console.log(`Migrated: ${filePath} (${audioSegments.length} segments)`);
}

function migrateDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      migrateDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".json") && entry.name !== "index.json") {
      migrateFile(fullPath);
    }
  }
}

migrateDir(BASE_DIR);
console.log("Migration complete.");
