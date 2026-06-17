# Design Decisions — Detailed Rationale

## YC-Product Aesthetic

The redesign follows the philosophy defined in [`DESIGN.md`](/DESIGN.md): "ruthlessly functional, high information density, typographic confidence, and zero ornamental noise." This means:

- Every UI element must serve a purpose. Decorative flourishes, gradients, and unnecessary animations are eliminated.
- Information density is prioritized — reduced base font size (15px instead of 16px), compact spacing, minimal chrome.
- Typography carries the visual weight — clear hierarchy through font size, weight, and color, not through decorative backgrounds or borders.
- The interface feels like a professional tool, not a marketing page.

## Color Token System

The app uses CSS custom properties defined in [`src/styles/variables.css`](/src/styles/variables.css) organized into semantic categories:

- **Ink**: Text hierarchy (`--color-ink`, `--color-ink-secondary`, `--color-ink-tertiary`)
- **Surface**: Background layers (page, cards, hover states)
- **Border**: Dividers and input borders (resting and strong)
- **Accent**: Primary actions and links
- **Feedback**: Success/error/warning states with subtle tint backgrounds
- **Section tints**: Reading (blue), Writing (green), Speaking (amber), TOEIC (purple) — used sparingly as dot/line colors only

This token system makes global theme changes possible by editing a single file. The legacy LeetCode-inspired tokens are preserved as CSS custom property aliases at the bottom of `variables.css` for backward compatibility during the redesign transition.

The `DESIGN.md` token values differ from the current `variables.css` because the redesign is being rolled out incrementally. The variables.css file retains some older LeetCode-inspired values (e.g., `--color-accent: #2cbb5d` vs the redesign's `#0f62fe`).

## Component Architecture Choices

### Button Component

File: [`src/components/ui/Button.tsx`](/src/components/ui/Button.tsx)

Buttons use a single polymorphic component with four variants (primary, secondary, ghost, danger) and three sizes (sm, md, lg). All buttons are sharp-edged rectangles with `--radius` (6px), avoiding fully-rounded "pill" shapes except for nav active states.

### Question Selector Pattern

The app uses a consistent two-level navigation pattern for each task:

1. **Question Selector page** — Lists available question numbers, shows previous scores per item, offers a "Random Question" button
2. **Question page** — Renders the actual task content with a timer and scoring

This is implemented as a generic `QuestionSelectorPage` component parameterized by `taskId`, reused across all 18 task types.

### Shared Question Loading

All task pages use the `useQuestion<T>` hook from [`src/hooks/useQuestion.ts`](/src/hooks/useQuestion.ts), which wraps `fetchQuestionByNumberWithMeta`, `fetchRandomQuestionWithMeta`, and `fetchQuestionByFileWithMeta` from [`src/lib/questions.ts`](/src/lib/questions.ts). Each task defines its own `ProblemData` interface to type the parsed JSON.

## Audio Handling

### TTS Concatenation

The `useTts` hook in [`src/hooks/useTts.ts`](/src/hooks/useTts.ts) provides two methods for playing multiple audio segments sequentially:

- **`playSegments(urls)`**: Fetches all audio files, decodes them, concatenates the audio buffers, creates a WAV blob, and plays it via a single `<Audio>` element. This eliminates gaps between segments for seamless listening.
- **`playSegmentsWithGaps(urls, gaps)`**: Same as above but inserts silence gaps between specific segments (used for pausing between questions).

The audio pipeline uses the Web Audio API (`AudioContext.decodeAudioData`) for decoding and manual buffer concatenation, then wraps the result in a WAV container for playback via a standard `<audio>` element. This approach is necessary because the `<audio>` element does not support gapless playback across separate source files.

### Role-Based Voice Mapping

File: [`src/lib/voiceMapping.ts`](/src/lib/voiceMapping.ts)

Audio segments in listening tasks are labeled by speaker role (Student, Professor, Lecturer, Woman, Man, Narrator). Each role maps to an ElevenLabs voice ID:

| Role              | Voice ID |
| ----------------- | -------- |
| Student, Woman    | `eve`    |
| Professor, Man    | `leo`    |
| Lecturer, Speaker | `rex`    |
| Narrator          | `ara`    |

This mapping is used by the audio generation script (`scripts/generate-audio.ts`) when producing MP3 files from the segment text arrays defined in each listening question file.

## Speech Recognition Pipeline

File: [`src/hooks/useSpeechRecognition.ts`](/src/hooks/useSpeechRecognition.ts)

The Listen and Repeat task implements a custom speech recognition pipeline:

1. **MediaRecorder API**: Captures audio from the user's microphone using the browser's native `MediaRecorder` API. Selects the best available audio codec (preferring `audio/webm;codecs=opus`).
2. **Transcription API**: Sends the recorded audio as `multipart/form-data` to the Cloudflare Pages Function at `/api/transcribe`.
3. **Whisper Model**: The Pages Function forwards the audio to Cloudflare Workers AI's `@cf/openai/whisper` model for transcription.
4. **Word Alignment**: The transcribed text is compared against the original sentence using a Levenshtein distance-based alignment algorithm in [`src/pages/toefl/speaking/listenRepeat.ts`](/src/pages/toefl/speaking/listenRepeat.ts), producing a word-level comparison with match/substitution/deletion/insertion types.

The pipeline is designed to work without a dedicated WebSocket or streaming solution — the recording is captured locally, sent as a complete blob, and the transcription is returned as a single response.
