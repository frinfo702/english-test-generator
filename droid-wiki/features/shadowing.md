# Shadowing Practice

A standalone listen-and-repeat practice mode for pronunciation and fluency improvement. Unlike the TOEFL "Listen and Repeat" task, Shadowing does not record or transcribe audio. It focuses purely on listening and repeating aloud.

## Purpose

Shadowing practice helps improve:

- Pronunciation and intonation
- Listening comprehension
- Speaking fluency
- Rhythm and pacing of natural English

## Data flow

1. `ShadowingPage` calls `useQuestion<ProblemData>("shadowing")`
2. The page loads a shadowing set with a title and a list of sentences
3. `ShadowingContent` handles per-sentence audio playback
4. Each sentence has a corresponding MP3 file at `public/audio/shadowing/{questionFile}/{sentenceNumber}.mp3`
5. Users can play, pause, resume audio with configurable playback speed via `SpeedControl`
6. A toggle button shows or hides the sentence text (default: hidden to encourage listening first)
7. Previous/Next buttons navigate between sentences in the set
8. No timer, no recording, no scoring -- pure practice mode

## Interaction flow

1. User selects a shadowing set from the question selector
2. Audio auto-loads for the first sentence
3. User presses Play, listens to the sentence, and repeats aloud
4. Optionally reveals the text to check comprehension
5. Moves to the next sentence
6. Continue through all sentences in the set

## Audio requirement

Each question set needs pre-generated MP3 files. Generate them using `scripts/generate-audio.ts`:

```
npx tsx scripts/generate-audio.ts
```

## Question file schema

```json
{
  "title": "Daily Conversations - Set 1",
  "sentences": [
    {
      "id": "s-001",
      "text": "Could you tell me where the nearest subway station is?",
      "wordCount": 10
    },
    {
      "id": "s-002",
      "text": "I'd like to make a reservation for two tonight.",
      "wordCount": 9
    }
  ]
}
```

## Directory layout

```
public/questions/shadowing/
  index.json
  001.json
  002.json
  ...

public/audio/shadowing/
  {questionFile}/
    1.mp3
    2.mp3
    ...
```

## Key source files

| File                                 | Purpose                                                     |
| ------------------------------------ | ----------------------------------------------------------- |
| `src/pages/ShadowingPage.tsx`        | Shadowing practice page with audio playback and text toggle |
| `src/hooks/useTts.ts`                | Audio playback with speed control                           |
| `src/hooks/useQuestion.ts`           | Generic question loading hook                               |
| `src/components/ui/SpeedControl.tsx` | Playback speed adjustment                                   |
| `scripts/generate-audio.ts`          | MP3 generation script for shadowing audio files             |
