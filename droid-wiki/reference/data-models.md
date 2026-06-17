# Data Models

This page documents the TypeScript interfaces and types used across the application.

## Question Loading

File: [`src/lib/questions.ts`](/src/lib/questions.ts)

```typescript
interface QuestionIndex {
  files: string[];
}

interface LoadedQuestion<T> {
  data: T;
  file: string;
}

interface QuestionFileEntry {
  file: string;
  number: number;
}
```

- **QuestionIndex**: The shape of `index.json` files in each task directory under `public/questions/`. Contains a list of filenames like `["001.json", "002.json", ...]`.
- **LoadedQuestion<T>**: Return type from `fetchQuestionByFileWithMeta` and `fetchRandomQuestionWithMeta`. Wraps the parsed JSON data with the source filename.
- **QuestionFileEntry**: Maps a filename to its numeric ID. Used in the question selector UI to display question numbers.

## Score History

File: [`src/hooks/useScoreHistory.ts`](/src/hooks/useScoreHistory.ts)

```typescript
type TaskId =
  | "toefl/reading/complete-words"
  | "toefl/reading/daily-life"
  | "toefl/reading/academic"
  | "toefl/listening/conversation"
  | "toefl/listening/lecture"
  | "toefl/listening/response"
  | "toefl/listening/announcement"
  | "toefl/writing/build-sentence"
  | "toefl/writing/email"
  | "toefl/writing/discussion"
  | "toefl/speaking/listen-repeat"
  | "toefl/speaking/interview"
  | "toeic/part2"
  | "toeic/part3"
  | "toeic/part4"
  | "toeic/part5"
  | "toeic/part6"
  | "toeic/part7"
  | "shadowing";

interface ScoreEntry {
  taskId: TaskId;
  date: string;
  correct: number;
  total: number;
  pct: number;
  elapsedSeconds?: number;
  questionFile?: string;
}
```

- **TaskId**: Union type of all supported task paths. Used throughout the app to reference tasks for routing, score tracking, and question loading.
- **ScoreEntry**: A single attempt record. Stored in `localStorage` under the key `score-history`. The `pct` field is pre-computed as `Math.round((correct / total) * 100)`.

## Answer Submission

File: [`src/lib/answerSubmission.ts`](/src/lib/answerSubmission.ts)

```typescript
interface SaveAnswerPayload {
  taskId: string;
  problemId: string;
  response: string;
  question?: unknown;
}

interface AnswerEntry {
  answerId: string;
  taskId: string;
  problemId: string;
  response: string;
  date: string;
}
```

- **SaveAnswerPayload**: Input type for saving an answer. The `problemId` is constructed via `buildProblemId()` from the task path, source file, and optional sub-question ID.
- **AnswerEntry**: A saved answer record, stored in `localStorage` under the key `answer-history`. The `answerId` is generated as `ans-${Date.now()}`.

Supporting utilities:

- `buildProblemId(taskId, sourceFile, subQuestionId?)` — Constructs a unique problem identifier
- `loadDraft(problemId)` / `saveDraft(problemId, text)` / `clearDraft(problemId)` — Per-problem draft persistence in `localStorage` under `answer-draft:` prefixed keys
- `buildGradingMessage(problemId, answerId)` — Generates a clipboard-ready message for AI grading

## Question Data Types (Per Task)

Each task page defines its own `ProblemData` interface reflecting the JSON structure of its question files. These are not shared; each page parses independently.

### TOEFL Reading — Complete the Words

File: [`src/pages/toefl/reading/completeWords.ts`](/src/pages/toefl/reading/completeWords.ts)

```typescript
interface CompleteWordsItem {
  index: number;
  hint: string;
  answer: string;
}

// ProblemData:
interface ProblemData {
  paragraph: string;
  items: CompleteWordsItem[];
}
```

### TOEFL Reading — Read in Daily Life

File: [`src/pages/toefl/reading/ReadDailyLifePage.tsx`](/src/pages/toefl/reading/ReadDailyLifePage.tsx)

```typescript
interface Question {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  type: string; // "factual" | "inference" | "purpose" | "vocabulary"
  explanation: string;
}

interface TextBlock {
  id: string;
  textType: string;
  content: string;
  questions: Question[];
}

interface ProblemData {
  texts: TextBlock[];
}
```

### TOEFL Reading — Read an Academic Passage

File: [`src/pages/toefl/reading/ReadAcademicPage.tsx`](/src/pages/toefl/reading/ReadAcademicPage.tsx)

```typescript
interface Question {
  id: string;
  type: string; // "vocabulary" | "detail" | "inference" | "mainIdea" | ...
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ProblemData {
  passage: string;
  title: string;
  questions: Question[];
}
```

### TOEFL Writing — Build a Sentence

File: [`src/pages/toefl/writing/BuildSentencePage.tsx`](/src/pages/toefl/writing/BuildSentencePage.tsx)

```typescript
interface Sentence {
  id: string;
  reference: string;
  chunks: string[];
  correctOrder: number[];
  fullSentence: string;
}

interface ProblemData {
  sentences: Sentence[];
}
```

### TOEFL Writing — Write an Email

File: [`src/pages/toefl/writing/WriteEmailPage.tsx`](/src/pages/toefl/writing/WriteEmailPage.tsx)

```typescript
interface Scenario {
  recipient: string;
  purpose: string;
  keyPoints: string[];
}

interface RubricItem {
  criterion: string;
  description: string;
}

interface ProblemData {
  scenario: Scenario;
  modelAnswer: string;
  rubric: RubricItem[];
}
```

### TOEFL Writing — Write for an Academic Discussion

File: [`src/pages/toefl/writing/WriteDiscussionPage.tsx`](/src/pages/toefl/writing/WriteDiscussionPage.tsx)

```typescript
interface Student {
  name: string;
  response: string;
}

interface ProblemData {
  professorQuestion: string;
  professorName: string;
  student1: Student;
  student2: Student;
  modelAnswer: string;
  evaluationPoints: string[];
}
```

### TOEFL Speaking — Listen and Repeat

File: [`src/pages/toefl/speaking/ListenRepeatPage.tsx`](/src/pages/toefl/speaking/ListenRepeatPage.tsx)

```typescript
interface Sentence {
  id: string;
  text: string;
  wordCount: number;
}

interface ProblemData {
  sentences: Sentence[];
}
```

### TOEFL Speaking — Take an Interview

File: [`src/pages/toefl/speaking/TakeInterviewPage.tsx`](/src/pages/toefl/speaking/TakeInterviewPage.tsx)

```typescript
interface InterviewQuestion {
  id: string;
  type: string; // "personal" | "opinion" | "hypothetical" | "comparison"
  question: string;
  modelAnswer: string;
  evaluationPoints: string[];
}

interface ProblemData {
  questions: InterviewQuestion[];
}
```

### TOEFL Listening — Conversation / Lecture / Announcement

File: [`src/components/question/ListeningTaskBase.tsx`](/src/components/question/ListeningTaskBase.tsx)

```typescript
interface ListeningQuestion {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  type: string;
  explanation: string;
}

// ProblemData:
interface ProblemData {
  title: string;
  audioSegments: { role: string; text: string }[];
  transcript: string;
  questions: ListeningQuestion[];
}
```

### TOEFL Listening — Choose a Response

File: [`src/pages/toefl/listening/ListenResponsePage.tsx`](/src/pages/toefl/listening/ListenResponsePage.tsx)

```typescript
interface ResponseQuestion {
  id: string;
  context: string;
  stem: string;
  options: { A: string; B: string; C: string };
  correct: string;
  explanation: string;
}

interface ProblemData {
  title: string;
  questions: ResponseQuestion[];
  audioSegments: { role: string; text: string }[];
}
```

### TOEIC Part 2 — Question-Response

File: [`src/pages/toeic/Part2Page.tsx`](/src/pages/toeic/Part2Page.tsx)

```typescript
interface QRQuestion {
  id: string;
  stem: string;
  options: { A: string; B: string; C: string };
  correct: string;
  explanation: string;
}

interface ProblemData {
  title: string;
  questions: QRQuestion[];
  audioSegments: { role: string; text: string }[];
}
```

### TOEIC Part 5 — Incomplete Sentences

File: [`src/pages/toeic/Part5Page.tsx`](/src/pages/toeic/Part5Page.tsx)

```typescript
interface Question {
  id: string;
  sentence: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
  focus: string;
}

interface ProblemData {
  questions: Question[];
}
```

### TOEIC Part 6 — Text Completion

File: [`src/pages/toeic/Part6Page.tsx`](/src/pages/toeic/Part6Page.tsx)

```typescript
interface Question {
  id: string;
  blankNumber: number;
  type: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
}

interface Passage {
  id: string;
  textType: string;
  text: string;
  questions: Question[];
}

interface ProblemData {
  passages: Passage[];
}
```

### TOEIC Part 7 — Reading Comprehension

File: [`src/pages/toeic/Part7Page.tsx`](/src/pages/toeic/Part7Page.tsx)

```typescript
interface Passage {
  id: string;
  textType: string;
  title: string | null;
  content: string;
}

interface Question {
  id: string;
  type: string; // "detail" | "inference" | "vocabulary" | "notStated" | ...
  stem: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
  passageRef: string;
}

interface ProblemData {
  setType: string; // "single" | "double" | "triple"
  passages: Passage[];
  questions: Question[];
}
```

## Audio Segment Types

Audio segments appear in listening and TOEIC tasks as an array of `{ role: string, text: string }` objects. The `role` field maps to a TTS voice via the role-to-voice mapping in [`src/lib/voiceMapping.ts`](/src/lib/voiceMapping.ts):

```typescript
const ROLE_VOICE_MAP: Record<string, string> = {
  Student: "eve",
  Professor: "leo",
  Lecturer: "rex",
  Woman: "eve",
  Man: "leo",
  Speaker: "rex",
  Narrator: "ara",
};
```

Audio is generated server-side by the script at [`scripts/generate-audio.ts`](/scripts/generate-audio.ts) which reads these segment arrays and produces MP3 files using the ElevenLabs API.

## Word Alignment (Speaking)

File: [`src/pages/toefl/speaking/listenRepeat.ts`](/src/pages/toefl/speaking/listenRepeat.ts)

```typescript
interface AlignedWord {
  type: "match" | "substitution" | "deletion" | "insertion";
  original: string | null;
  recognized: string | null;
  correct: boolean;
}
```

Used by the Listen and Repeat task to compare the user's transcribed speech against the original sentence using Levenshtein alignment.
