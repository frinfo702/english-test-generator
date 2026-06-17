# TOEFL Writing

Three task types covering the TOEFL iBT 2026 Writing section. Writing tasks save user responses to `localStorage` for later grading (the app does not auto-grade writing responses; users copy a grading message to submit to an AI agent).

## Build a Sentence

Reorder word chunks to build a grammatically correct sentence based on a reference prompt. This is a drag-free click-to-select interaction: users click chunks from a pool in the order they want, and can remove placed chunks by clicking them.

### Data flow

1. `BuildSentencePage` calls `useQuestion<ProblemData>("toefl/writing/build-sentence")`
2. The page shows one sentence at a time from the question set
3. A "pre" phase shows a start button; pressing start begins the elapsed timer
4. Each sentence displays a reference prompt and a pool of shuffled chunks
5. Placed chunks appear in the answer area; users can click to remove and reorder
6. Navigation: previous/next buttons move between sentences
7. On submit, each sentence is compared against `correctOrder` array
8. Score saves number of correctly ordered sentences out of total

### Question file schema

```json
{
  "sentences": [
    {
      "id": "s-001",
      "reference": "Prompt text the sentence should respond to",
      "chunks": ["The", "quick brown", "fox", "jumps over", "the lazy dog"],
      "correctOrder": [0, 1, 2, 3, 4],
      "fullSentence": "The quick brown fox jumps over the lazy dog."
    }
  ]
}
```

### Directory layout

```
public/questions/toefl/writing/build-sentence/
  index.json
  001.json
  002.json
  ...
```

## Write an Email

Compose an email based on a given scenario within 7 minutes. The timer auto-submits when time expires.

### Data flow

1. `WriteEmailPage` calls `useQuestion<ProblemData>("toefl/writing/email")`
2. On start, a 7-minute countdown timer begins (`useTimer(7 * 60)`)
3. The page shows the scenario card (title, description, recipient, purpose, key points)
4. User types in a textarea; drafts are auto-saved to `localStorage` on every change via `saveDraft()`
5. On submit (manual or timer expiry), the answer is saved via `saveAnswerSubmission()` with a `problemId` and `answerId`
6. A `GradingRequestPanel` displays a message the user can copy and send to an AI agent for grading
7. The rubric and model answer are shown after submission for self-evaluation

### Question file schema

```json
{
  "scenario": {
    "title": "Request for Information",
    "description": "...scenario description...",
    "recipient": "Professor Smith",
    "purpose": "Request course information",
    "keyPoints": [
      "Introduce yourself",
      "Ask about prerequisites",
      "Request syllabus"
    ]
  },
  "modelAnswer": "...model email text...",
  "rubric": [
    {
      "criterion": "Task Completion",
      "description": "All key points addressed"
    },
    {
      "criterion": "Organization",
      "description": "Logical paragraph structure"
    }
  ]
}
```

### Directory layout

```
public/questions/toefl/writing/email/
  index.json
  001.json
  002.json
  ...
```

## Academic Discussion

Write your opinion on a professor's prompt after reading two student responses. 10-minute timer with a 100-word minimum requirement.

### Data flow

1. `WriteDiscussionPage` calls `useQuestion<ProblemData>("toefl/writing/discussion")`
2. On start, a 10-minute countdown timer begins
3. The discussion card shows the professor's question and two student responses
4. User types in a textarea; drafts auto-save to `localStorage`
5. A word counter enforces the 100-word minimum -- the submit button is disabled until met
6. On submit, answer is saved with a `problemId` and `answerId` for AI grading
7. Evaluation points and model answer are shown after submission

### Question file schema

```json
{
  "professorQuestion": "Do you agree or disagree with the following statement? ...",
  "professorName": "Williams",
  "student1": { "name": "Sarah", "response": "I believe that..." },
  "student2": { "name": "Mike", "response": "In my opinion..." },
  "modelAnswer": "...model response text...",
  "evaluationPoints": [
    "Clear thesis statement",
    "Supports opinion with reasons"
  ]
}
```

### Directory layout

```
public/questions/toefl/writing/discussion/
  index.json
  001.json
  002.json
  ...
```

## Answer submission system

Writing tasks use shared utilities from `src/lib/answerSubmission.ts`:

- `buildProblemId(taskId, sourceFile, subQuestionId?)` -- creates a unique identifier for each problem
- `saveDraft(problemId, text)` / `loadDraft(problemId)` -- auto-save/restore in-progress writing
- `clearDraft(problemId)` -- remove draft after submission
- `saveAnswerSubmission(payload)` -- stores the final response in `answer-history` localStorage key
- `buildGradingMessage(problemId, answerId)` -- generates text the user copies to get AI grading
- `copyText(text)` -- clipboard helper

## Key source files

| File                                              | Purpose                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `src/pages/toefl/writing/BuildSentencePage.tsx`   | Build a Sentence task page                                       |
| `src/pages/toefl/writing/WriteEmailPage.tsx`      | Write an Email task page                                         |
| `src/pages/toefl/writing/WriteDiscussionPage.tsx` | Academic Discussion task page                                    |
| `src/lib/answerSubmission.ts`                     | Answer persistence, draft management, grading message generation |
| `src/components/ui/GradingRequestPanel.tsx`       | Grading request UI with copy-to-clipboard                        |
| `src/components/ui/Timer.tsx`                     | Countdown timer display component                                |
| `src/hooks/useTimer.ts`                           | Countdown timer hook with expiry callback                        |
| `src/hooks/useQuestion.ts`                        | Generic question loading hook                                    |
| `src/hooks/useScoreHistory.ts`                    | Score persistence (used for Build Sentence)                      |
