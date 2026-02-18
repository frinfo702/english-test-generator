# 問題JSON スキーマ & 保存先

問題JSONは `public/questions/<exam>/<section>/<task>/` に配置する。
各ディレクトリに `index.json`（ファイルリスト）と `001.json`, `002.json`, ... を置く。

## index.json（全タスク共通）

```json
{ "files": ["001.json", "002.json"] }
```

番号は3桁ゼロパディング（`001`, `002`, ...）。新規追加時は `index.json` の `files` 配列にも追記する。

---

## ディレクトリ対応表

| タスク                                   | 保存先パス                                       |
| ---------------------------------------- | ------------------------------------------------ |
| TOEFL Reading: Read in Daily Life        | `public/questions/toefl/reading/daily-life/`     |
| TOEFL Reading: Read Academic Passage     | `public/questions/toefl/reading/academic/`       |
| TOEFL Reading: Complete the Words        | `public/questions/toefl/reading/complete-words/` |
| TOEFL Writing: Write an Email            | `public/questions/toefl/writing/email/`          |
| TOEFL Writing: Write Academic Discussion | `public/questions/toefl/writing/discussion/`     |
| TOEFL Writing: Build a Sentence          | `public/questions/toefl/writing/build-sentence/` |
| TOEFL Speaking: Take an Interview        | `public/questions/toefl/speaking/interview/`     |
| TOEFL Speaking: Listen and Repeat        | `public/questions/toefl/speaking/listen-repeat/` |
| TOEIC Part 5                             | `public/questions/toeic/part5/`                  |
| TOEIC Part 6                             | `public/questions/toeic/part6/`                  |
| TOEIC Part 7                             | `public/questions/toeic/part7/`                  |

---

## TOEFL Reading: Read in Daily Life

`module` フィールドで Module 1 / Module 2 Easy / Module 2 Hard を区別する。
テキスト2〜4本を含み、各テキストに設問を付ける。

```json
{
  "module": "module1",
  "texts": [
    {
      "id": "t1",
      "textType": "email",
      "content": "From: Student Services\nTo: All Students\nSubject: Library Hours Change\n\nThe main library will be closed for renovation from March 15 to March 22. The Science Library on the north campus will be open 7 AM to midnight.",
      "questions": [
        {
          "id": "q1",
          "stem": "Why is the main library closing?",
          "options": [
            "A. It is being expanded.",
            "B. It is undergoing renovation.",
            "C. It is switching to digital-only access.",
            "D. It is being relocated."
          ],
          "correctIndex": 1,
          "type": "factual",
          "explanation": "The email states the library will be closed 'for renovation.'"
        },
        {
          "id": "q2",
          "stem": "What can be inferred about students during the closure?",
          "options": [
            "A. They will have no access to library materials.",
            "B. They must visit the north campus for all services.",
            "C. They can still access library resources online.",
            "D. They need special permission to use the Science Library."
          ],
          "correctIndex": 2,
          "type": "inference",
          "explanation": "Resources are available 'digitally through the student portal.'"
        }
      ]
    },
    {
      "id": "t2",
      "textType": "SNS post",
      "content": "Campus Cafe Update!\nNew autumn menu starting Monday! New items: Pumpkin Spice Latte & Apple Cider\nTemporarily unavailable: Iced drinks (equipment maintenance)",
      "questions": [
        {
          "id": "q3",
          "stem": "Which item is currently NOT available at the Campus Cafe?",
          "options": [
            "A. Pumpkin Spice Latte",
            "B. Apple Cider",
            "C. Iced drinks",
            "D. The autumn menu"
          ],
          "correctIndex": 2,
          "type": "factual",
          "explanation": "The post states iced drinks are 'temporarily unavailable.'"
        }
      ]
    }
  ]
}
```

**フィールド仕様:**

- `module`: `"module1"` / `"module2-easy"` / `"module2-hard"`
- `textType`: `"email"` / `"SNS post"` / `"notice"` / `"schedule"` / `"advertisement"` など
- `type`（設問種別）: `"factual"` / `"inference"` / `"vocabulary"`
- `correctIndex`: 0始まり（A=0, B=1, C=2, D=3）
- Module 1: テキスト2〜3本、計3〜4問
- Module 2: テキスト3〜4本、計5〜6問

---

## TOEFL Reading: Read Academic Passage

学術的な説明文1本＋5設問。

```json
{
  "title": "The Formation of Coral Reefs",
  "passage": "Coral reefs are among the most biologically diverse ecosystems on Earth. These structures are built by tiny marine animals called coral polyps, which secrete calcium carbonate to form hard skeletons...",
  "questions": [
    {
      "id": "q1",
      "type": "vocabulary",
      "stem": "The word 'secrete' in paragraph 1 is closest in meaning to:",
      "options": [
        "A. dissolve",
        "B. produce and release",
        "C. absorb",
        "D. conceal"
      ],
      "correctIndex": 1,
      "explanation": "'Secrete' means to produce and release a substance."
    },
    {
      "id": "q2",
      "type": "detail",
      "stem": "What distinguishes a barrier reef from a fringing reef?",
      "options": [
        "A. Its circular shape",
        "B. Its separation from land by a lagoon",
        "C. Its location in deep water",
        "D. Its larger size"
      ],
      "correctIndex": 1,
      "explanation": "Barrier reefs are 'separated from land by lagoons.'"
    }
  ]
}
```

**フィールド仕様:**

- `type`（設問種別）: `"vocabulary"` / `"detail"` / `"inference"` / `"mainIdea"`
- `correctIndex`: 0始まり
- 設問数: 5問固定

---

## TOEFL Reading: Complete the Words

段落内の単語を `word___` 形式で一部隠し、ヒントの頭文字を元に補完する。

```json
{
  "paragraph": "The process of photosynth___ allows plants to conv___ sunlight into chem___ energy. Chlorophyll, the green pig___ found in plant cells, absor___ light from the sun.",
  "items": [
    {
      "index": 0,
      "hint": "pho",
      "answer": "photosynthesis",
      "placeholder": "photosynth___"
    },
    {
      "index": 1,
      "hint": "con",
      "answer": "convert",
      "placeholder": "conv___"
    },
    {
      "index": 2,
      "hint": "che",
      "answer": "chemical",
      "placeholder": "chem___"
    }
  ]
}
```

**フィールド仕様:**

- `paragraph`: `word___` 形式のプレースホルダーを含む文
- `items[].index`: 段落内の出現順（0始まり）
- `items[].hint`: 最初の2〜3文字
- `items[].answer`: 正解の完全な単語
- `items[].placeholder`: `paragraph` 内の文字列と**完全一致**させること
- 穴埋め数: 8〜10個

---

## TOEFL Writing: Write Academic Discussion

教授の問い＋学生2名の意見＋モデルアンサー。

```json
{
  "professorName": "Dr. Chen",
  "professorQuestion": "Technology is increasingly used in K-12 classrooms. Do you believe integrating technology into education primarily benefits or hinders student learning? Support your position with specific reasons and examples.",
  "student1": {
    "name": "Marcus",
    "response": "I strongly believe technology benefits student learning. Online resources give students access to information beyond any textbook."
  },
  "student2": {
    "name": "Aisha",
    "response": "While technology has benefits, I think it often hinders learning. Students are easily distracted by social media when devices are available."
  },
  "modelAnswer": "Both Marcus and Aisha raise valid points. However, I believe the impact depends on how technology is implemented...",
  "evaluationPoints": [
    "Acknowledges both perspectives before presenting your own view",
    "Adds a new angle not fully addressed by either student",
    "Provides a clear logical argument supported by reasoning",
    "Maintains academic tone and meets the 100-word minimum"
  ]
}
```

---

## TOEFL Writing: Write an Email

状況設定＋送信先＋モデルアンサー。

```json
{
  "situation": "You are a student who needs to request an extension on an assignment due to illness.",
  "recipient": "Professor Johnson",
  "subject": "Assignment Extension Request",
  "modelAnswer": "Dear Professor Johnson,\n\nI am writing to request a short extension on the essay due this Friday...",
  "evaluationPoints": [
    "Opens with appropriate salutation",
    "Clearly states the purpose in the first sentence",
    "Provides a brief, credible reason",
    "Closes politely"
  ]
}
```

---

## TOEFL Writing: Build a Sentence

チャンクを正しい語順に並べる。10文セット。

```json
{
  "sentences": [
    {
      "id": "s1",
      "reference": "Professor: How has remote work affected office culture?",
      "chunks": [
        "traditional",
        "It",
        "office",
        "has",
        "model",
        "changed",
        "the",
        "significantly"
      ],
      "correctOrder": [1, 3, 7, 5, 6, 0, 2, 4],
      "fullSentence": "It has significantly changed the traditional office model"
    },
    {
      "id": "s2",
      "reference": "Professor: Why was the conclusion surprising?",
      "chunks": [
        "method",
        "was",
        "that we",
        "showed",
        "It",
        "flawed",
        "that",
        "used",
        "the"
      ],
      "correctOrder": [4, 3, 6, 8, 0, 2, 7, 1, 5],
      "fullSentence": "It showed that the method that we used was flawed"
    }
  ]
}
```

**フィールド仕様:**

- `reference`: 他者の発話（質問または文章）。この発話に対する回答を並べ替える
- `chunks`: シャッフル済みの配列（表示順）。原則1単語ずつ分割する
- `correctOrder`: `chunks` のインデックス列で正しい語順を示す
  - 例: `[1, 0, 3, 2, 4]` → chunks[1], chunks[0], chunks[3], chunks[2], chunks[4] の順
- `fullSentence`: `reference` への自然な回答として成立する正解文（末尾ピリオドなし）
- 重複語（例: that, the）が複数あり識別が曖昧になる場合のみ、片方を隣接語と連結してよい（例: "that we"）。連結は1問あたり1〜2個まで
- 文数: 10文固定

---

## TOEFL Speaking: Take an Interview

4問のインタビュー形式。

```json
{
  "questions": [
    {
      "id": "q1",
      "type": "personal",
      "question": "Describe a time when you had to overcome a significant challenge. What did you learn from that experience?",
      "modelAnswer": "One significant challenge I faced was moving to a new city for university without knowing anyone...",
      "evaluationPoints": [
        "Describes a specific relatable challenge",
        "Explains concrete actions taken",
        "Reflects on lessons learned",
        "Stays on topic within the time limit"
      ]
    },
    {
      "id": "q2",
      "type": "opinion",
      "question": "Do you think universities should make community service a graduation requirement?",
      "modelAnswer": "Yes, I think community service should be a graduation requirement...",
      "evaluationPoints": [
        "States a clear position at the outset",
        "Provides specific supporting reasons",
        "Addresses a potential counterargument",
        "Concludes with a summary"
      ]
    }
  ]
}
```

**フィールド仕様:**

- `type`: `"personal"` / `"opinion"` / `"hypothetical"` / `"comparison"`
- 設問数: 4問固定

---

## TOEFL Speaking: Listen and Repeat

短文7〜10文。音声不要のためテキストのみ保持。

```json
{
  "sentences": [
    {
      "id": "s1",
      "text": "The library will be closed for maintenance next weekend.",
      "wordCount": 9
    },
    {
      "id": "s2",
      "text": "Could you remind me when the assignment is due?",
      "wordCount": 9
    }
  ]
}
```

**フィールド仕様:**

- `wordCount`: 単語数（参考値）
- 文数: 7〜10文

---

## TOEIC Part 5: Incomplete Sentences

30問の文法・語彙穴埋め。

```json
{
  "questions": [
    {
      "id": "q1",
      "sentence": "The marketing team ___ the new product launch for next quarter.",
      "options": {
        "A": "is planning",
        "B": "are planned",
        "C": "planning",
        "D": "to plan"
      },
      "correct": "A",
      "explanation": "Singular 'team' takes singular verb.",
      "focus": "verb tense/form"
    },
    {
      "id": "q2",
      "sentence": "All employees must submit expense reports ___ the end of the month.",
      "options": {
        "A": "until",
        "B": "during",
        "C": "by",
        "D": "since"
      },
      "correct": "C",
      "explanation": "'By' indicates a deadline.",
      "focus": "preposition"
    }
  ]
}
```

**フィールド仕様:**

- `options`: オブジェクト形式（`"A"` / `"B"` / `"C"` / `"D"` キー）
- `correct`: `"A"` / `"B"` / `"C"` / `"D"` の文字列（`correctIndex` ではない）
- `focus`: `"verb tense/form"` / `"preposition"` / `"vocabulary in context"` / `"word form"` / `"pronoun"` / `"subject-verb agreement"` / `"conjunction/connector"`
- 問題数: 30問固定

---

## TOEIC Part 6: Text Completion

4パッセージ × 各4問（計16問）。空所は `[1]`〜`[4]` で示す。

```json
{
  "passages": [
    {
      "id": "p1",
      "textType": "business email",
      "text": "Dear Mr. Nakamura,\n\nThank you for your interest in our consulting services. [1] reviewing your company's recent financial reports, our team has identified several areas where we can add value.\n\nWe would like to schedule an initial consultation at your [2]. Please [3] us know your availability for the week of April 14th. We look forward to the [4] of working with you.\n\nBest regards,\nSarah Collins",
      "questions": [
        {
          "id": "q1",
          "blankNumber": 1,
          "type": "grammar",
          "options": {
            "A": "After",
            "B": "While",
            "C": "Before",
            "D": "Until"
          },
          "correct": "A",
          "explanation": "'After reviewing' — team reviewed first, then identified opportunities."
        },
        {
          "id": "q2",
          "blankNumber": 2,
          "type": "vocabulary",
          "options": {
            "A": "expense",
            "B": "convenience",
            "C": "permission",
            "D": "requirement"
          },
          "correct": "B",
          "explanation": "'At your convenience' is a standard polite business phrase."
        }
      ]
    }
  ]
}
```

**フィールド仕様:**

- `textType`: `"business email"` / `"memo"` / `"notice"` / `"letter"` / `"article"`
- `text` 内の空所は `[1]`, `[2]`, `[3]`, `[4]` で示す
- `blankNumber`: 1〜4
- `type`: `"grammar"` / `"vocabulary"` / `"sentence"`（文挿入）
- `correct`: アルファベット文字列（`"A"` など）
- パッセージ数: 4本固定、各4問

---

## TOEIC Part 7: Reading Comprehension

Single / Double / Triple passage の読解。

```json
{
  "setType": "single",
  "passages": [
    {
      "id": "p1",
      "textType": "advertisement",
      "title": "Grand Opening — Riverside Business Center",
      "content": "Riverside Business Center is proud to announce the grand opening of its expanded facilities on April 1st. We now offer 45 fully furnished office suites ranging from 200 to 800 square feet...\n\nFor April, all new tenants receive a 20% discount on their first three months of rent. Free high-speed internet and utilities are included in all lease agreements.\n\nContact our leasing office at 555-0192. Limited spaces available."
    }
  ],
  "questions": [
    {
      "id": "q1",
      "type": "detail",
      "stem": "What is the purpose of the advertisement?",
      "options": {
        "A": "To announce the relocation of a business center",
        "B": "To promote the opening of expanded office facilities",
        "C": "To advertise a temporary sale on office supplies",
        "D": "To recruit new staff"
      },
      "correct": "B",
      "explanation": "The advertisement announces the 'grand opening of expanded facilities.'",
      "passageRef": "p1"
    },
    {
      "id": "q2",
      "type": "inference",
      "stem": "What can be inferred about the internet service?",
      "options": {
        "A": "It is available at an additional cost.",
        "B": "It is provided at no extra charge.",
        "C": "It is only available in conference rooms.",
        "D": "It requires a separate contract."
      },
      "correct": "B",
      "explanation": "'Free high-speed internet...included in all lease agreements.'",
      "passageRef": "p1"
    }
  ]
}
```

**フィールド仕様:**

- `setType`: `"single"` / `"double"` / `"triple"`
- `passages[].textType`: `"advertisement"` / `"email"` / `"memo"` / `"article"` / `"notice"` / `"form"` / `"schedule"`
- `questions[].type`: `"detail"` / `"inference"` / `"notStated"` / `"vocabulary"` / `"intention"`
- `questions[].passageRef`: 複数パッセージ時にどのパッセージか（`"p1"`, `"p2"` など）
- `options`: オブジェクト形式（Part 5 と同様）
- `correct`: アルファベット文字列（`"A"` など）
- Single: 2〜4問、Double: 5問、Triple: 5問
