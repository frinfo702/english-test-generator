# English Test Practice

A practice app for the TOEFL iBT 2026 format and TOEIC Reading, using AI-generated question JSON.

## Supported Content

### TOEFL iBT 2026 Format

| Section  | Tasks                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Reading  | Complete the Words / Read in Daily Life (adaptive) / Read an Academic Passage         |
| Writing  | Build a Sentence / Write an Email (7 min) / Write for an Academic Discussion (10 min) |
| Speaking | Listen and Repeat / Take an Interview (4 questions x 45 sec)                          |

### TOEIC Reading

| Part   | Content                                                  |
| ------ | -------------------------------------------------------- |
| Part 5 | Incomplete Sentences (30 questions)                      |
| Part 6 | Text Completion (4 passages x 4 questions)               |
| Part 7 | Reading Comprehension (Single / Double / Triple passage) |

## Commands

```bash
npm install
npm run dev            # Vite (:5173) + Wrangler (:8788) for the transcription API
npm run dev:vite       # front-end only, no transcription
npm test               # vitest
npm run lint
npm run format
npm run build
npm run pages:deploy   # deploy dist/ to Cloudflare Pages from your machine
```

Add a question file (named `<YYYYMMDD>-<slug>.json`; never rename or reuse a name):

```bash
./scripts/make-question.sh <task> [slug]
```

## Releasing

Every push to `main` deploys to staging (`https://staging.english-test-generator.pages.dev`).
Production ships only through the Release workflow:

```bash
gh workflow run release.yml -f bump=minor   # patch | minor | major
```

Roll back from the Cloudflare Pages dashboard. The Pages project needs a Workers AI binding named `AI`.
