# Lore

## February 2026 — Initial Scaffold and Local-First Pivot

The project began on **February 18, 2026** with a scaffold that called the Anthropic API for question generation. Within the same day, the architecture was refactored to replace all API calls with local JSON file loading, removing the `@anthropic-ai/sdk` dependency and the associated network and API-key requirements. This established the core design principle: **no sign-up, no internet required after load**.

Eleven task directories were seeded with sample question JSONs covering all TOEFL iBT 2026 sections (Reading, Writing, Speaking) and TOEIC L&R (Parts 5, 6, 7). The loading infrastructure in `src/lib/questions.ts` and the `useQuestion` hook were introduced.

## February — March 2026: Core Features

Over the next weeks, the following features were added:

- **Immediate scoring** — answers are graded on submission with instant feedback.
- **Dashboard** — `src/hooks/useScoreHistory.ts` and supporting components for reviewing past scores.
- **Answer persistence** — `src/lib/answerSubmission.ts` reads and writes to `localStorage` so progress survives page reloads.
- **TOEFL Writing / Speaking grading flow** — copy-to-clipboard for self-evaluation.
- **Timer support** — `useTimer` and `useElapsedTimer` hooks for tracking writing and speaking duration.
- **Slot-based input** — improved UI for fill-in-the-blank questions (Complete Words, Daily Life).
- **Question number selector** — a grid view that lets users pick specific numbered questions rather than only random ones. This was contributed as a pull request by **Kenichiro Goto** on **May 6**.

## May 2026 — Listening, Audio, and Deployment

**May 6–7**: Listening audio functionality was added using browser TTS and MP3 files. The README gained screenshot images. New question sets were added across all sections.

**May 14**: A major push introduced:

- **Shadowing feature** — a dedicated page for listening and repeating.
- **TOEIC Listening** — Parts 2, 3, and 4 with audio playback.
- **Playback controls** — Slow/Normal/Fast speed controls and `playSegmentsWithGaps`.
- **Read-aloud mode** — for TOEFL Speaking tasks.
- **Serverless migration** — the app moved to Cloudflare Pages with a `wrangler.jsonc` configuration.
- **Deployment pipeline** — a GitHub Actions workflow (`deploy.yml`) that builds and deploys to Cloudflare Pages on pushes to `main`.
- **Audio generation script** — `scripts/generate-audio.ts` that calls xAI's TTS API to produce MP3 files for listening and shadowing tasks.

**May 20–27**: Additional question sets, refactoring, and a favicon. The adaptive test mode was removed (`803ef40`). Progress bars were centered.

## June 2026 — Testing, Refinement, and the LeetCode Aesthetic

**June 3–4**: A testing push brought unit tests for `fetchTaskQuestionCount`, `CompleteWordsPage`, and the daily-life reading parser. Pull requests from **Kenichiro Goto** fixed the Daily Life page and complete-word task.

**June 5**: Fixed a bug where newlines were not inserted in speech transcriptions.

**June 12–13**: Major visual overhaul — the UI was redesigned to **look like LeetCode** with a clean, code-focused layout. The `DESIGN.md` design system was established with the YC-product aesthetic and cobalt-blue trust anchor. Key changes:

- Task question counts wired into TOEFL and TOEIC menus.
- Back button refactored across all pages.
- Academic Passage questions displayed in full on a single screen.
- Speech recognition integrated (`useSpeechRecognition`) with tests.
- Microphone bug fix — halted early stopping.
- Audio playback error handling.
- Answer reveal on question completion.
- Number word normalization in Listen & Repeat.
- Diff improvement for answer comparison.
- Default transcription language set to English.
- Audio suspension bug fixed.
