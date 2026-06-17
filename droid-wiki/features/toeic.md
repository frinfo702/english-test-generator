# TOEIC L&R

Six parts covering the TOEIC Listening and Reading exam. Parts 2-4 are Listening tasks that use audio playback; Parts 5-7 are Reading tasks that present text-based questions.

## Part 2: Question-Response

Listen to a spoken question and choose the best response from three options (A, B, C).

### Data flow

1. `Part2Page` calls `useQuestion<ProblemData>("toeic/part2")`
2. Audio segments are structured as 4 segments per question (stem + 3 options)
3. On entering a question, audio plays automatically via `playSegmentsWithGaps()`
4. Each question shows three response options labeled A, B, C
5. Users navigate through questions sequentially and submit when all are answered
6. After grading, each question shows correct/incorrect feedback with explanation

### Question file schema

```json
{
  "title": "Part 2: Question-Response",
  "questions": [
    {
      "id": "q-001",
      "stem": "Where is the meeting?",
      "options": {
        "A": "In the conference room.",
        "B": "At 3 o'clock.",
        "C": "Yes, I did."
      },
      "correct": "A",
      "explanation": "The question asks about location, so option A is appropriate."
    }
  ],
  "audioSegments": [{ "role": "Speaker", "text": "Where is the meeting?" }]
}
```

### Directory layout

```
public/questions/toeic/part2/
  index.json
  001.json
  ...

public/audio/toeic/part2/
  {questionFile}/
    1.mp3
    2.mp3
    ...
```

## Part 3: Conversations

Listens to a conversation and answer questions about it.

`Part3Page` is a thin wrapper that renders `ListeningTaskBase` with `taskId="toeic/part3"` and `readQuestionsAloud` enabled, which reads the questions aloud after the conversation with configured gaps.

### Data flow

Same as `ListeningTaskBase` (see [TOEFL Listening](toefl-listening.md) for component details). The only difference is the `readQuestionsAloud` prop, which inserts silence gaps between audio segments to allow time for answering.

### Directory layout

```
public/questions/toeic/part3/
  index.json
  001.json
  ...

public/audio/toeic/part3/
  {questionFile}/
    1.mp3
    2.mp3
    ...
```

## Part 4: Talks

Listen to a talk and answer questions about it.

`Part4Page` is a thin wrapper that renders `ListeningTaskBase` with `taskId="toeic/part4"`.

### Data flow

Same as `ListeningTaskBase`. See [TOEFL Listening](toefl-listening.md).

### Directory layout

```
public/questions/toeic/part4/
  index.json
  001.json
  ...

public/audio/toeic/part4/
  {questionFile}/
    1.mp3
    2.mp3
    ...
```

## Part 5: Incomplete Sentences

Choose the best word or phrase to complete each sentence. Tests grammar and vocabulary.

### Data flow

1. `Part5Page` calls `useQuestion<ProblemData>("toeic/part5")`
2. Questions are displayed in pages of 10 (controlled by `PAGE_SIZE` constant)
3. Each question shows a sentence with a blank and four options (A, B, C, D)
4. Each option has a "focus" label indicating the grammar topic (e.g., "Prepositions", "Verb tense")
5. Users navigate between pages; all questions on a page must be answered to proceed
6. On submit, score is saved with total correct out of total questions
7. After grading, each question shows feedback with explanation

### Question file schema

```json
{
  "questions": [
    {
      "id": "q-001",
      "sentence": "The new employee _____ to the training session yesterday.",
      "options": { "A": "go", "B": "went", "C": "gone", "D": "going" },
      "correct": "B",
      "explanation": "Past tense is needed for an action that happened yesterday.",
      "focus": "Verb tense"
    }
  ]
}
```

### Directory layout

```
public/questions/toeic/part5/
  index.json
  001.json
  ...
```

## Part 6: Text Completion

Read passages with blanks and choose the best words or sentences to fill each blank.

### Data flow

Similar to Part 5 but questions are grouped by passage. Each passage contains multiple blanks, and each blank has four options. Paginated at 10 questions per page.

### Question file schema

```json
{
  "title": "Text Completion",
  "passages": [
    {
      "id": "p-001",
      "text": "Dear valued customers, we are pleased to announce our new service. _____ [1] _____ will be available starting next month. [...]",
      "questions": [
        {
          "id": "q-001",
          "stem": "Fill in blank [1]",
          "options": { "A": "It", "B": "They", "C": "We", "D": "He" },
          "correct": "A",
          "focus": "Pronoun agreement",
          "explanation": "'It' refers to 'our new service' (singular)."
        }
      ]
    }
  ]
}
```

### Directory layout

```
public/questions/toeic/part6/
  index.json
  001.json
  ...
```

## Part 7: Reading Comprehension

Read single, double, or triple passages and answer comprehension questions.

### Data flow

Similar to Part 5/6 but with longer passages. Questions reference specific passages. Paginated at 10 questions per page.

### Question file schema

```json
{
  "title": "Reading Comprehension",
  "passages": [
    {
      "id": "p-001",
      "text": "...passage text...",
      "title": "Email from HR Department",
      "source": "Company correspondence",
      "questions": [
        {
          "id": "q-001",
          "stem": "What is the main purpose of this email?",
          "options": {
            "A": "To announce a policy change",
            "B": "To schedule a meeting",
            "C": "To request information",
            "D": "To provide feedback"
          },
          "correct": "A",
          "focus": "Main idea",
          "explanation": "The email states that the company is updating its policy..."
        }
      ]
    }
  ]
}
```

### Directory layout

```
public/questions/toeic/part7/
  index.json
  001.json
  ...
```

## Key source files

| File                                            | Purpose                                                        |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `src/pages/toeic/Part2Page.tsx`                 | TOEIC Part 2: Question-Response task page                      |
| `src/pages/toeic/Part3Page.tsx`                 | TOEIC Part 3: Conversations (wrapper around ListeningTaskBase) |
| `src/pages/toeic/Part4Page.tsx`                 | TOEIC Part 4: Talks (wrapper around ListeningTaskBase)         |
| `src/pages/toeic/Part5Page.tsx`                 | TOEIC Part 5: Incomplete Sentences task page                   |
| `src/pages/toeic/Part6Page.tsx`                 | TOEIC Part 6: Text Completion task page                        |
| `src/pages/toeic/Part7Page.tsx`                 | TOEIC Part 7: Reading Comprehension task page                  |
| `src/pages/toeic/ToeicMenuPage.tsx`             | TOEIC menu page listing all parts                              |
| `src/components/question/ListeningTaskBase.tsx` | Shared listening component used by Parts 3 and 4               |
| `src/components/ui/FeedbackPanel.tsx`           | Correct/incorrect feedback for Parts 5-7                       |
| `src/hooks/useTts.ts`                           | Audio playback for Parts 2-4                                   |
| `src/hooks/useQuestion.ts`                      | Generic question loading hook                                  |
| `src/hooks/useScoreHistory.ts`                  | Score persistence                                              |
