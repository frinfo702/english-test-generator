# TOEFL Listening

Four task types covering the TOEFL iBT 2026 Listening section. Listening tasks use a shared `ListeningTaskBase` component for common audio playback and question interaction logic. Two distinct interaction patterns exist: the base component for Conversation/Lecture/Announcement, and a standalone page for Choose a Response.

## Conversation, Lecture, Announcement

These three tasks share the `ListeningTaskBase` component in `src/components/question/ListeningTaskBase.tsx`. They differ only in the `taskId`, `title`, and `subtitle` passed as props.

### Data flow

1. `ConversationPage`, `LecturePage`, and `AnnouncementPage` render `ListeningTaskBase` with their respective `taskId` values
2. `ListeningTaskBase` loads question data via `useQuestion<ProblemData>(taskId)`
3. On load, the elapsed timer starts automatically
4. Audio segments are loaded from `public/audio/{taskId}/{questionFile}/` as numbered MP3 files
5. The component concatenates audio segments using `playSegments()` or `playSegmentsWithGaps()` from `useTts`
6. A player card provides play/pause, 10-second skip, seekable progress bar, and speed control
7. Questions appear below the player, each with multiple-choice options (A/B/C/D)
8. Users select options and submit when all questions are answered
9. After grading, the score is saved and a transcript section displays speaker-labeled text
10. Each question shows correct/incorrect feedback with explanation

### Audio segments

The `audioSegments` array in the question JSON describes each segment's speaker role and text. Segments are used to:

- Build the transcript displayed after grading
- Determine the URLs for MP3 files (`{taskId}/{fileBasename}/{segmentIndex + 1}.mp3`)
- Optionally insert silence gaps between segments (configurable via `readQuestionsAloud` and gap arrays)

### Question file schema

```json
{
  "title": "Campus Conversation",
  "audioSegments": [
    { "role": "Student", "text": "Hi Professor, I have a question about..." },
    { "role": "Professor", "text": "Sure, go ahead." }
  ],
  "transcript": "Full transcript text...",
  "questions": [
    {
      "id": "q-001",
      "stem": "Why does the student visit the professor?",
      "options": [
        "To ask about an assignment",
        "To schedule a meeting",
        "To get a recommendation",
        "To change a class"
      ],
      "correctIndex": 0,
      "type": "detail",
      "explanation": "The student says they have a question about the assignment."
    }
  ]
}
```

### Directory layout

```
public/questions/toefl/listening/conversation/
  index.json
  001.json
  ...

public/questions/toefl/listening/lecture/
  index.json
  001.json
  ...

public/questions/toefl/listening/announcement/
  index.json
  001.json
  ...

public/audio/toefl/listening/{taskId}/
  {questionFile}/
    1.mp3
    2.mp3
    ...
```

## Choose a Response

A standalone task page where users hear a short utterance and choose the best response from three options (A, B, C). This simulates TOEFL listening comprehension of pragmatic meaning.

### Data flow

1. `ListenResponsePage` calls `useQuestion<ProblemData>("toefl/listening/response")`
2. On entering a question, audio plays automatically via `playSegmentsWithGaps()`
3. Each question shows a context badge (e.g., "At a restaurant"), the utterance stem, and three options
4. A replay button lets users hear the audio again
5. Users navigate forward/backward and submit when all questions are answered
6. After submission, each question is reviewed with correct/incorrect labels
7. Score saves total correct out of total questions

### Question file schema

```json
{
  "title": "Choose a Response",
  "questions": [
    {
      "id": "q-001",
      "context": "At a restaurant",
      "stem": "Would you like to see the dessert menu?",
      "options": {
        "A": "Yes, please.",
        "B": "I'll have the steak.",
        "C": "The menu, please."
      },
      "correct": "A",
      "explanation": "The question asks about dessert, so option A is the appropriate response."
    }
  ],
  "audioSegments": [
    { "role": "Speaker", "text": "Would you like to see the dessert menu?" }
  ]
}
```

### Directory layout

```
public/questions/toefl/listening/response/
  index.json
  001.json
  ...

public/audio/toefl/listening/response/
  {questionFile}/
    1.mp3
    2.mp3
    ...
```

## Key source files

| File                                               | Purpose                                                                |
| -------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/components/question/ListeningTaskBase.tsx`    | Shared component for Conversation, Lecture, Announcement tasks         |
| `src/pages/toefl/listening/ListeningTaskPage.tsx`  | Thin wrappers that render `ListeningTaskBase` with task-specific props |
| `src/pages/toefl/listening/ListenResponsePage.tsx` | Choose a Response standalone task page                                 |
| `src/hooks/useTts.ts`                              | Audio playback with segment concatenation, speed control, and progress |
| `src/hooks/useQuestion.ts`                         | Generic question loading hook                                          |
| `src/hooks/useElapsedTimer.ts`                     | Session timer for tracking elapsed time                                |
| `src/hooks/useScoreHistory.ts`                     | Score persistence                                                      |
| `src/components/ui/SpeedControl.tsx`               | Playback speed slider/buttons                                          |
