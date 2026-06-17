# Getting started

## Prerequisites

- **Node.js 22+**
- **npm**
- A **Cloudflare account** (only required for the transcription feature and deployment)

## Install

```bash
git clone <repo-url>
cd english-test-generator
npm install
```

## Development

Two dev servers are available:

```bash
# Full stack: frontend + transcription API
npm run dev
# → Vite on http://localhost:5173
# → Wrangler (API) on http://localhost:8788
```

```bash
# Frontend only (no transcription)
npm run dev:vite
# → Vite on http://localhost:5173
```

The Vite dev server proxies `/api/transcribe` to the Wrangler Pages dev server, so the frontend can reach the transcription API from the same origin during development.

## Build

```bash
npm run build
```

Produces the production bundle in `dist/`.

## Test

```bash
npm test
```

Runs Vitest with jsdom. Test files use the `*.test.ts` or `*.test.tsx` naming convention and sit alongside their source files.

## Lint

```bash
npm run lint
```

ESLint with TypeScript rules, React hooks plugin, and React Refresh plugin.

## Deploy

```bash
npm run build
npm run pages:deploy
```

This builds the app and deploys to Cloudflare Pages using the `wrangler pages deploy` command. The Cloudflare project must have a Workers AI binding named `AI`.

For local preview of the built app:

```bash
npm run preview
```

## Adding questions

Questions are AI-generated JSON files stored in `public/questions/`. Generate them using an AI agent (e.g., Claude Code) guided by the prompt templates in `public/prompts/`. Each task folder requires an `index.json` file listing available question files.

Example prompt for an AI agent:

```
Follow the schema in public/prompts/toefl/reading/complete-the-words.json,
generate one TOEFL Reading Complete the Words question set,
save it to public/questions/toefl/reading/complete-words/002.json,
and update index.json as well.
```

## Generating audio

For listening and speaking tasks that include audio segments, run the audio generation script:

```bash
npm run generate-audio
```

This script reads question JSON files that have `audioSegments` or `sentences` fields, calls an external TTS API (ElevenLabs), and saves MP3 files to `public/audio/`.
