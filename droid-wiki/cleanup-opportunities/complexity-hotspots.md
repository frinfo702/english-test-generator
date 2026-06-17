# Complexity Hotspots

## Largest Source Files

The table below shows files exceeding 200 lines (source lines, excluding tests and CSS).

| File                                                 | Lines | Description                                                                                                                                                                                                                             |
| ---------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/toefl/speaking/ListenRepeatPage.tsx`      | 755   | Largest component. Handles audio playback, recording, transcription, word alignment, and feedback for the listen-and-repeat task. Contains complex state machine (Phase type: playing, ready, recording, processing, feedback, review). |
| `src/pages/DashboardPage.tsx`                        | 445   | Dashboard with KPI cards, per-task charts, and recent attempts list. Includes a canvas-based chart renderer.                                                                                                                            |
| `src/components/question/ListeningTaskBase.tsx`      | 396   | Shared base component for TOEFL listening tasks (Conversation, Lecture, Announcement). Handles audio segment playback, pausing between segments, and question answering.                                                                |
| `src/hooks/useTts.ts`                                | 375   | Audio playback hook with support for single play, segment concatenation, and gap insertion. Implements the Web Audio API pipeline for gapless audio.                                                                                    |
| `src/pages/toefl/reading/CompleteWordsPage.tsx`      | 334   | Interactive fill-in-the-blank reading task with inline text editing and answer highlighting.                                                                                                                                            |
| `src/pages/toefl/listening/ListenResponsePage.tsx`   | 331   | TOEFL Listening Choose a Response task with audio playback and multiple choice.                                                                                                                                                         |
| `src/pages/toeic/Part2Page.tsx`                      | 323   | TOEIC Part 2 (Question-Response) with audio segments for each question, playback controls, and answer selection.                                                                                                                        |
| `src/pages/toefl/speaking/TakeInterviewPage.tsx`     | 305   | Interview task with recording, transcription, and answer submission.                                                                                                                                                                    |
| `src/pages/toefl/writing/BuildSentencePage.tsx`      | 301   | Sentence-building drag-and-order task.                                                                                                                                                                                                  |
| `src/pages/toeic/Part6Page.tsx`                      | 285   | TOEIC Part 6 (Text Completion) with passage display and inline question handling.                                                                                                                                                       |
| `src/pages/toefl/writing/WriteDiscussionPage.tsx`    | 282   | Academic Discussion writing task with draft saving and answer submission.                                                                                                                                                               |
| `src/pages/toefl/writing/WriteEmailPage.tsx`         | 277   | Email writing task with scenario display and rubric.                                                                                                                                                                                    |
| `src/pages/toefl/reading/ReadDailyLifePage.tsx`      | 260   | Adaptive reading task with passage display.                                                                                                                                                                                             |
| `src/pages/toeic/Part7Page.tsx`                      | 245   | TOEIC Part 7 (Reading Comprehension) with multi-passage layouts.                                                                                                                                                                        |
| `src/pages/toeic/Part5Page.tsx`                      | 240   | TOEIC Part 5 (Incomplete Sentences) with pagination.                                                                                                                                                                                    |
| `src/pages/toefl/reading/ReadAcademicPage.tsx`       | 234   | Academic passage reading task.                                                                                                                                                                                                          |
| `src/pages/ShadowingPage.tsx`                        | 225   | Shadowing practice page.                                                                                                                                                                                                                |
| `src/hooks/useSpeechRecognition.ts`                  | 206   | MediaRecorder + Whisper transcription pipeline.                                                                                                                                                                                         |
| `src/pages/toefl/speaking/ListenRepeatPage.test.tsx` | 407   | Test file for ListenRepeatPage.                                                                                                                                                                                                         |

## Areas of Complexity

### ListenRepeatPage (755 lines)

The most complex component in the codebase. It manages a state machine with six phases (`playing`, `ready`, `recording`, `processing`, `feedback`, `review`), coordinates audio playback with recording, handles the Whisper transcription pipeline, and renders a word-level diff with color-coded alignment results. Consider extracting the phase machine logic and the feedback/diff rendering into separate sub-components.

### DashboardPage (445 lines)

Combines KPI calculation, chart rendering (canvas), per-task statistics, and attempt history. The chart rendering logic is inline — could be extracted into a dedicated chart component.

### ListeningTaskBase (396 lines)

A shared component used by three task types (Conversation, Lecture, Announcement). Manages audio segment playback with gaps, question progression, and scoring. The segment playback logic with embedded silence insertion adds complexity.

### useTts Hook (375 lines)

Contains all audio handling: fetching, decoding, concatenation, WAV encoding, and playback controls. The `audioBufferToWavBlob` function is an inline WAV encoder that could be extracted to a utility module.

### TOEIC Part 2 (323 lines)

Handles audio segments per question with playback, timing, and answer selection. Has duplicated patterns with `ListenResponsePage.tsx`.

## Patterns of Duplication

Several TOEIC and TOEFL pages share similar patterns:

- **Audio-based tasks**: `Part2Page.tsx`, `Part3Page.tsx`, `Part4Page.tsx`, `ListenResponsePage.tsx` all handle `audioSegments` arrays with similar playback logic
- **Writing tasks**: `WriteDiscussionPage.tsx`, `WriteEmailPage.tsx`, `TakeInterviewPage.tsx` all implement draft saving and answer submission independently
- **Reading tasks**: `ReadDailyLifePage.tsx`, `ReadAcademicPage.tsx` both render passages with question panels but have separate implementations

Consolidating these into shared base components could reduce duplication.
