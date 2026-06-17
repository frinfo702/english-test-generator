# TOEFL Reading

Three task types covering the TOEFL iBT 2026 Reading section. Each task loads question JSON from `public/questions/toefl/reading/` with different schemas.

## Complete the Words

Fill in missing words in an academic paragraph. The paragraph is displayed with blank textareas at each word position. Hints show the start of each missing word, and the user types the remaining suffix.

### Data flow

1. `CompleteWordsPage` calls `useQuestion<ProblemData>("toefl/reading/complete-words")`
2. The `completeWords.ts` helper locates each answer word in the paragraph text using regex matching with word-boundary detection
3. `getExpectedSuffix()` computes the portion the user must type by subtracting the hint from the full answer
4. On submit, typed answers are compared case-insensitively against expected suffixes
5. Score is saved via `useScoreHistory` with the number of correctly filled words

### Question file schema

```json
{
  "paragraph": "...academic paragraph text with answer words embedded...",
  "items": [
    { "index": 0, "hint": "init", "answer": "initial" },
    { "index": 1, "hint": "devel", "answer": "development" }
  ]
}
```

### Key interaction details

- Tab, Shift+Tab, and Enter navigate between blank positions
- Textareas auto-resize to fit content
- Wrong answers show the correct word inline after submission
- Non-blank hints display as visible markers in the paragraph

### Directory layout

```
public/questions/toefl/reading/complete-words/
  index.json
  001.json
  002.json
  ...
```

## Read in Daily Life

Read everyday texts (emails, notices, schedules) and answer multiple-choice questions about them. Uses an adaptive text format where multiple text blocks can appear in one question set.

### Data flow

1. `ReadDailyLifePage` calls `useQuestion<ProblemData>("toefl/reading/daily-life")`
2. The page renders each text block followed by its associated questions
3. Each question has type labels: Factual, Inference, Purpose, Vocabulary
4. Users select an option per question and submit when all are answered
5. After grading, each question shows correct/incorrect feedback via `FeedbackPanel` with explanations
6. Score saves total correct out of total questions across all texts

### Question file schema

```json
{
  "texts": [
    {
      "id": "text-001",
      "textType": "Email",
      "content": "...email content...",
      "questions": [
        {
          "id": "q-001",
          "stem": "What is the purpose of this email?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0,
          "type": "purpose",
          "explanation": "..."
        }
      ]
    }
  ]
}
```

### Directory layout

```
public/questions/toefl/reading/daily-life/
  index.json
  001.json
  002.json
  ...
```

## Read an Academic Passage

Read an academic passage and answer multiple-choice questions. Similar to the real TOEFL reading section with passage-focused questions.

### Data flow

1. `ReadAcademicPage` calls `useQuestion<ProblemData>("toefl/reading/academic")`
2. The page renders a two-column layout: passage on the left, questions on the right
3. Question types include: Vocabulary, Detail, Inference, Main Idea, Paragraph Relation, Important Idea, Negative Factual, Rhetorical Purpose, Insert Sentence
4. Users select options and submit when all questions are answered
5. After grading, feedback shows correct answers and explanations
6. Score saves total correct out of total questions

### Question file schema

```json
{
  "passage": "...full academic passage text...",
  "title": "Passage Title",
  "questions": [
    {
      "id": "q-001",
      "type": "mainIdea",
      "stem": "What is the main idea of the passage?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}
```

### Directory layout

```
public/questions/toefl/reading/academic/
  index.json
  001.json
  002.json
  ...
```

## Key source files

| File                                               | Purpose                                                                    |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/pages/toefl/reading/CompleteWordsPage.tsx`    | Complete the Words task page                                               |
| `src/pages/toefl/reading/ReadDailyLifePage.tsx`    | Read in Daily Life task page                                               |
| `src/pages/toefl/reading/ReadAcademicPage.tsx`     | Read an Academic Passage task page                                         |
| `src/pages/toefl/reading/completeWords.ts`         | Helper: answer position lookup, expected suffix extraction, regex matching |
| `src/pages/toefl/ToeflMenuPage.tsx`                | TOEFL section menu -- lists all tasks with descriptions                    |
| `src/components/question/QuestionSelectorPage.tsx` | Shared question number selector with score history                         |
| `src/components/ui/FeedbackPanel.tsx`              | Correct/incorrect feedback with explanation display                        |
| `src/hooks/useQuestion.ts`                         | Generic question loading hook                                              |
| `src/hooks/useScoreHistory.ts`                     | Score persistence and retrieval                                            |
| `src/lib/questions.ts`                             | Question file fetching and index management                                |
