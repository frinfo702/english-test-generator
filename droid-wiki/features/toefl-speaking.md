# TOEFL Speaking

Two task types covering the TOEFL iBT 2026 Speaking section. Speaking tasks use both audio playback (TTS) and microphone recording with transcription.

## Listen and Repeat

Listen to a sentence, then repeat it into the microphone. The app records audio, transcribes it via Cloudflare Workers AI (Whisper), and compares the transcript to the original using word-level alignment.

### Data flow

1. `ListenRepeatPage` calls `useQuestion<ProblemData>("toefl/speaking/listen-repeat")`
2. When a sentence is loaded, it plays the corresponding MP3 from `public/audio/toefl/speaking/listen-repeat/{questionFile}/{sentenceNumber}.mp3`
3. After playback completes, the phase transitions from "playing" to "ready"
4. User clicks "Start Recording" to begin microphone capture
5. A countdown timer shows recording time remaining (calculated as `audioDuration * 1.5`, minimum 3 seconds)
6. Recording stops automatically when the timer expires, or the user can stop early
7. The recorded audio blob is sent to the `/api/transcribe` Cloudflare Pages Function, which runs `@cf/openai/whisper`
8. The transcribed text is aligned with the original sentence using `alignWords()` from `listenRepeat.ts`
9. Alignment uses Levenshtein distance with word normalization (including number words like "twenty" -> "20")
10. Each sentence shows a side-by-side diff view with color-coded words: correct (green), wrong (red), missing (dotted), extra (highlighted)
11. After all sentences, the score saves total correct words out of total original words

### Audio requirement

Each question set needs pre-generated MP3 files. Generate them using `scripts/generate-audio.ts`:

```
npx tsx scripts/generate-audio.ts
```

### Phase states

The task progresses through these phases per sentence:

1. **playing** -- sentence audio is playing
2. **ready** -- playback done, waiting for user to start recording
3. **recording** -- microphone active, countdown running
4. **processing** -- audio being transcribed
5. **feedback** -- diff view shown, user can replay audio or proceed

### Word alignment

The `listenRepeat.ts` module provides:

- `normalizeWord()` -- strips punctuation and converts number words to digits for fair comparison
- `alignWords(original, recognized)` -- uses dynamic programming (Levenshtein distance) to align transcription against original, producing an array of `AlignedWord` objects with types: `match`, `substitution`, `deletion`, `insertion`
- `countCorrectWords()` / `countOriginalWords()` -- scoring helpers

### Question file schema

```json
{
  "sentences": [
    {
      "id": "s-001",
      "text": "The quick brown fox jumps over the lazy dog.",
      "wordCount": 8
    }
  ]
}
```

### Directory layout

```
public/questions/toefl/speaking/listen-repeat/
  index.json
  001.json
  002.json
  ...

public/audio/toefl/speaking/listen-repeat/
  {questionFile}/
    1.mp3
    2.mp3
    ...
```

### Transcription API

The Cloudflare Pages Function at `functions/api/transcribe.ts`:

- Accepts POST with `multipart/form-data` containing an `audio` field
- Passes the audio bytes to `@cf/openai/whisper` with `language: "en"`
- Returns `{ "text": "..." }`
- Has a 25 MB size limit
- Returns CORS headers for cross-origin access

## Take an Interview

Answer interview questions on the spot. Each question has a 45-second timer with no prep time.

### Data flow

1. `TakeInterviewPage` calls `useQuestion<ProblemData>("toefl/speaking/interview")`
2. The page shows one interview question at a time
3. Question types include: Personal Experience, Opinion, Hypothetical Situation, Comparison/Choice
4. On start, a 45-second countdown begins; the timer auto-submits on expiry
5. User types their spoken response (in the real test this would be spoken aloud)
6. On submit, the answer is saved via `saveAnswerSubmission()` with a `problemId` per question
7. Evaluation points and model answer are shown for each question
8. After all questions, a summary screen shows completion status

### Question file schema

```json
{
  "questions": [
    {
      "id": "q-001",
      "type": "opinion",
      "question": "What is your opinion on...?",
      "modelAnswer": "...model response...",
      "evaluationPoints": ["States clear opinion", "Provides reasons"]
    }
  ]
}
```

### Directory layout

```
public/questions/toefl/speaking/interview/
  index.json
  001.json
  002.json
  ...
```

## Key source files

| File                                             | Purpose                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| `src/pages/toefl/speaking/ListenRepeatPage.tsx`  | Listen and Repeat task page with recording, transcription, and diff display |
| `src/pages/toefl/speaking/TakeInterviewPage.tsx` | Take an Interview task page with timed responses                            |
| `src/pages/toefl/speaking/listenRepeat.ts`       | Word alignment algorithm (Levenshtein distance) and scoring helpers         |
| `src/hooks/useTts.ts`                            | Audio playback with segments, speed control, and seek                       |
| `src/hooks/useSpeechRecognition.ts`              | Microphone recording and Whisper API transcription                          |
| `src/hooks/useTimer.ts`                          | Countdown timer (used in Take an Interview)                                 |
| `src/hooks/useElapsedTimer.ts`                   | Elapsed session timer (used in Listen and Repeat)                           |
| `src/lib/transcribe.ts`                          | API client for transcription endpoint                                       |
| `functions/api/transcribe.ts`                    | Cloudflare Pages Function wrapping Workers AI Whisper                       |
| `scripts/generate-audio.ts`                      | MP3 generation script for Listen and Repeat audio                           |
