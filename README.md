# English Test Practice

A practice app for the TOEFL iBT 2026 format and TOEIC Reading.
**No network connection or API key is required.** The app loads question JSON files generated locally by an AI agent.

## Setup

```bash
npm install
npm run dev
# -> http://localhost:5173
```

## Adding Questions

Generate questions with an AI agent (for example, Claude Code) and save the output JSON in the matching folder under `public/questions/`.

### Directory Structure

```text
public/
├── prompts/          # Prompt templates for AI question generation
│   ├── toefl/reading/complete-the-words.json
│   ├── toefl/reading/read-in-daily-life.json
│   ├── ...
│   └── toeic/part7-reading-comprehension.json
│
└── questions/        # AI-generated question files (add files here)
    ├── toefl/
    │   ├── reading/complete-words/
    │   │   ├── index.json   <- {"files":["001.json","002.json",...]}
    │   │   ├── 001.json
    │   │   └── 002.json
    │   ├── reading/daily-life/
    │   ├── reading/academic/
    │   ├── writing/build-sentence/
    │   ├── writing/email/
    │   ├── writing/discussion/
    │   ├── speaking/listen-repeat/
    │   └── speaking/interview/
    └── toeic/
        ├── part5/
        ├── part6/
        └── part7/
```

### `index.json` Format

Each task folder must include an `index.json` file:

```json
{ "files": ["001.json", "002.json"] }
```

At runtime, each task first shows a question-number list.
You can pick a specific number or start with the random button.

### Prompting an AI Agent

Example request:

```text
Follow the schema in public/prompts/toefl/reading/complete-the-words.json,
generate one TOEFL Reading Complete the Words question set,
save it to public/questions/toefl/reading/complete-words/002.json,
and update index.json as well.
```

Each file in `public/prompts/` defines the output JSON schema for that task.

## Supported Content

### TOEFL iBT 2026 Format

| Section  | Tasks                                                                      |
| -------- | -------------------------------------------------------------------------- |
| Reading  | Complete the Words / Read in Daily Life (adaptive) / Read an Academic Passage |
| Writing  | Build a Sentence / Write an Email (7 min) / Write for an Academic Discussion (10 min) |
| Speaking | Listen and Repeat / Take an Interview (4 questions x 45 sec)             |

### TOEIC Reading

| Part   | Content                                                     |
| ------ | ----------------------------------------------------------- |
| Part 5 | Incomplete Sentences (30 questions)                         |
| Part 6 | Text Completion (4 passages x 4 questions)                  |
| Part 7 | Reading Comprehension (Single / Double / Triple passage)    |

## Sample Questions

A sample set is included for each task, so you can start practicing immediately.
