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

| タスク                                   | 保存先パス                                       | 音声時間    | 1音声あたりの設問数 |
| ---------------------------------------- | ------------------------------------------------ | ----------- | ----------------- |
| TOEFL Reading: Complete the Words        | `public/questions/toefl/reading/complete-words/` | —           | —                 |
| TOEFL Reading: Read in Daily Life        | `public/questions/toefl/reading/daily-life/`     | —           | —                 |
| TOEFL Reading: Read Academic Passage     | `public/questions/toefl/reading/academic/`       | —           | —                 |
| TOEFL Writing: Build a Sentence          | `public/questions/toefl/writing/build-sentence/` | —           | —                 |
| TOEFL Writing: Write an Email            | `public/questions/toefl/writing/email/`          | —           | —                 |
| TOEFL Writing: Write Academic Discussion | `public/questions/toefl/writing/discussion/`     | —           | —                 |
| TOEFL Speaking: Listen and Repeat        | `public/questions/toefl/speaking/listen-repeat/` | —           | —                 |
| TOEFL Speaking: Take an Interview        | `public/questions/toefl/speaking/interview/`     | —           | —                 |
| TOEFL Listening: Choose a Response       | `public/questions/toefl/listening/response/`     | 5〜15秒     | 1                 |
| TOEFL Listening: Conversation            | `public/questions/toefl/listening/conversation/` | 30〜90秒    | 2                 |
| TOEFL Listening: Announcement            | `public/questions/toefl/listening/announcement/` | 20〜40秒    | 2〜3              |
| TOEFL Listening: Academic Talk           | `public/questions/toefl/listening/lecture/`      | 45〜120秒   | 4                 |
| TOEIC Part 2                             | `public/questions/toeic/part2/`                  | —           | —                 |
| TOEIC Part 3                             | `public/questions/toeic/part3/`                  | —           | —                 |
| TOEIC Part 4                             | `public/questions/toeic/part4/`                  | —           | —                 |
| TOEIC Part 5                             | `public/questions/toeic/part5/`                  | —           | —                 |
| TOEIC Part 6                             | `public/questions/toeic/part6/`                  | —           | —                 |
| TOEIC Part 7                             | `public/questions/toeic/part7/`                  | —           | —                 |

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

段落内の単語を `hint + _` 形式で一部隠し、**hintの続きだけ**を入力させる。

```json
{
  "paragraph": "The process of pho_________ allows plants to con____ sunlight into che_____ energy. Chlorophyll, the green pig____ found in plant cells, abs____ light from the sun.",
  "items": [
    {
      "index": 0,
      "hint": "pho",
      "answer": "photosynthesis",
      "placeholder": "pho_________"
    },
    {
      "index": 1,
      "hint": "con",
      "answer": "convert",
      "placeholder": "con____"
    },
    {
      "index": 2,
      "hint": "che",
      "answer": "chemical",
      "placeholder": "che_____"
    }
  ]
}
```

**フィールド仕様:**

- `paragraph`: `hint + _` のプレースホルダーを含む文
- `items[].index`: 段落内の出現順（0始まり）
- `items[].hint`: 最初の2〜3文字
- `items[].answer`: 正解の完全な単語
- `items[].hint` は `items[].answer` の先頭一致にする（大文字小文字は無視可）
- `items[].placeholder`: `hint + 続き文字数分の _` で作り、`paragraph` 内文字列と**完全一致**させる
- 続き文字数 = `answer.length - hint.length`
- UIでは hint 部分は表示済みで、解答者は続き部分のみ入力する
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

## TOEFL Listening: Choose a Response

短い発言（5〜15秒）を聞き、最も適切な応答を3つの中から選ぶ。
話し手の意図（implied meaning）、トーン、社会的文脈の理解を評価。
1アイテム＝1問。

```json
{
  "title": "Listen and Choose a Response — Campus Life",
  "questions": [
    {
      "id": "q1",
      "context": "Asking for information",
      "stem": "Excuse me, do you know when the library opens on weekends?",
      "options": {
        "A": "Yes, it opens at 10 AM on Saturdays and Sundays.",
        "B": "The library is closed for renovations.",
        "C": "I usually study at the coffee shop."
      },
      "correct": "A",
      "explanation": "The speaker is asking for information about weekend hours, so a direct answer is the most appropriate response."
    }
  ],
  "audioSegments": [
    { "role": "Student", "text": "Excuse me, do you know when the library opens on weekends?" }
  ]
}
```

**フィールド仕様:**
- `context`: 状況ラベル（例: "Asking for information", "Expressing concern"）
- `questions[].options`: オブジェクト形式（`"A"`〜`"C"`、3択）
- `questions[].correct`: アルファベット文字列（`"A"` / `"B"` / `"C"`）
- `audioSegments`: 各設問1セグメント（発言のみ、応答は音声不要）
- 設問数: 8問／ファイル

**聞くポイント:**
- 話し手が何を求めているか（助け、確認、情報、付き合い）
- 感情やトーン（不満、安堵、好奇心）
- 隠された期待や次のステップ

---

## TOEFL Listening: Conversation

キャンパス内の短い会話（30〜90秒）を聞き、2問に答える。
対話理解を評価。会話は Student と Friend/Professor など2名。

```json
{
  "title": "Office Hours Discussion",
  "transcript": "Student: Hi Professor Martinez, do you have a moment?\nProfessor: Sure, come in. What can I help you with?",
  "questions": [
    {
      "id": "q1",
      "stem": "Why does the student visit the professor?",
      "options": ["To ask about an assignment", "To discuss a grade", "To request a recommendation letter", "To change a class schedule"],
      "correctIndex": 0,
      "type": "purpose",
      "explanation": "The student says they have a question about the essay assignment."
    },
    {
      "id": "q2",
      "stem": "What will the student do next?",
      "options": ["Revise the introduction", "Submit the paper", "Meet with a tutor", "Email the professor"],
      "correctIndex": 1,
      "type": "detail",
      "explanation": "The professor tells the student to submit the revised version by Friday."
    }
  ],
  "audioSegments": [
    { "role": "Student", "text": "Hi Professor Martinez, do you have a moment?" },
    { "role": "Professor", "text": "Sure, come in. What can I help you with?" }
  ]
}
```

**フィールド仕様:**
- `transcript`: 全文文字起こし
- `questions[].type`: `"purpose"` / `"detail"` / `"inference"` / `"attitude"`
- `options`: 配列形式（4択）
- `correctIndex`: 0始まり
- 1会話あたり2問、8セットで16問がフルセット

---

## TOEFL Listening: Announcement

構内アナウンスや案内（20〜40秒）を聞き、2〜3問に答える。
詳細情報の保持を評価。Speaker 1名。

```json
{
  "title": "Library Renovation Notice",
  "transcript": "Attention students. The main library will be closed for renovation from March 15 to March 22. The science library on north campus will remain open with extended hours.",
  "questions": [
    {
      "id": "q1",
      "stem": "How long will the main library be closed?",
      "options": ["One day", "One week", "Two weeks", "One month"],
      "correctIndex": 1,
      "type": "detail",
      "explanation": "The announcement states the closure is from March 15 to March 22."
    },
    {
      "id": "q2",
      "stem": "What will happen to the science library during the closure?",
      "options": ["It will close at the regular time", "It will remain open with extended hours", "It will also undergo renovation", "It will move to a temporary location"],
      "correctIndex": 1,
      "type": "detail",
      "explanation": "The science library will remain open with extended hours."
    }
  ],
  "audioSegments": [
    { "role": "Speaker", "text": "Attention students. The main library will be closed for renovation from March 15 to March 22. The science library on north campus will remain open with extended hours." }
  ]
}
```

**フィールド仕様:**
- `transcript`: 全文文字起こし
- `questions[].type`: `"detail"` / `"inference"` / `"vocabulary"`
- `options`: 配列形式（4択）
- `correctIndex`: 0始まり
- 1アナウンスあたり2〜3問、8セットで16〜24問がフルセット

---

## TOEFL Listening: Academic Talk

学術的な講義（45〜120秒）を聞き、4問に答える。
講義理解・構造把握を評価。Lecturer 1名。

```json
{
  "title": "The Formation of Coral Reefs",
  "transcript": "Today we'll discuss how coral reefs form. Coral reefs are built by tiny marine animals called coral polyps, which secrete calcium carbonate...",
  "questions": [
    {
      "id": "q1",
      "stem": "What is the main topic of the lecture?",
      "options": ["Marine animal reproduction", "The formation of coral reefs", "Ocean temperature changes", "Coral reef conservation"],
      "correctIndex": 1,
      "type": "mainIdea",
      "explanation": "The lecture begins by stating they will discuss how coral reefs form."
    },
    {
      "id": "q2",
      "stem": "What role do coral polyps play in reef formation?",
      "options": ["They eat harmful algae", "They secrete calcium carbonate", "They attract fish species", "They clean the water"],
      "correctIndex": 1,
      "type": "detail",
      "explanation": "Coral polyps secrete calcium carbonate to form hard skeletons."
    }
  ],
  "audioSegments": [
    { "role": "Lecturer", "text": "Today we'll discuss how coral reefs form. Coral reefs are built by tiny marine animals called coral polyps, which secrete calcium carbonate..." }
  ]
}
```

**フィールド仕様:**
- `transcript`: 全文文字起こし
- `questions[].type`: `"mainIdea"` / `"detail"` / `"inference"` / `"vocabulary"` / `"attitude"`
- `options`: 配列形式（4択）
- `correctIndex`: 0始まり
- 1講義あたり4問、4セットで16問がフルセット

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

## TOEIC Part 2: Question-Response

応答問題。25問。質問または陳述を聞き、最も適切な応答を3つの中から選ぶ。

```json
{
  "title": "Question-Response Set 1",
  "questions": [
    {
      "id": "q1",
      "stem": "When is the deadline for the budget proposal?",
      "options": {
        "A": "It's due this Friday.",
        "B": "Yes, I submitted it yesterday.",
        "C": "In the conference room."
      },
      "correct": "A",
      "explanation": "The question asks 'When', so only 'It's due this Friday' is a time-related response."
    }
  ],
  "audioSegments": [
    { "role": "Woman", "text": "Number 1. When is the deadline for the budget proposal?" },
    { "role": "Man", "text": "(A) It's due this Friday." },
    { "role": "Man", "text": "(B) Yes, I submitted it yesterday." },
    { "role": "Man", "text": "(C) In the conference room." }
  ]
}
```

**フィールド仕様:**
- `questions[].stem`: 聞かれる質問文
- `questions[].options`: オブジェクト形式（`"A"`〜`"C"` — Part 2は選択肢3つのみ）
- `questions[].correct`: アルファベット文字列（`"A"` / `"B"` / `"C"`）
- `audioSegments`: 質問は Man/Woman 交互、応答3つは反対の性別の話者
- 問題数: 25問（本番準拠）

## TOEIC Part 3: Conversations

会話問題。1会話につき3問×13セット＝39問。
TOEFL Listening Conversation と同構造。会話は必ず Man と Woman の2名。
audioSegments の role は `"Man"` / `"Woman"` を使用（音声割当が一貫する）。
トピックはビジネス文脈（オフィス、会議、出張、顧客対応など）。

```json
{
  "title": "Office Renovation",
  "transcript": "Man: Good morning. I'm here to discuss the office renovation schedule.\nWoman: Yes, let me pull up the contractor's timeline.",
  "questions": [
    {
      "id": "q1",
      "stem": "What is the man's purpose in the conversation?",
      "options": ["To discuss the office renovation timeline", "To complain about construction noise", "To request a change of workspace", "To inquire about contractor pricing"],
      "correctIndex": 0,
      "type": "purpose",
      "explanation": "The man says he is there to discuss the office renovation schedule."
    }
  ],
  "audioSegments": [
    { "role": "Man", "text": "Good morning. I'm here to discuss the office renovation schedule." },
    { "role": "Woman", "text": "Yes, let me pull up the contractor's timeline. The construction team will start next Monday." }
  ]
}
```

**フィールド仕様:**
- TOEFL Listening Conversation と同一構造
- `audioSegments[].role`: `"Man"` または `"Woman"`（TOEICのキャラクター一貫性ルール）
- `options`: 配列形式（TOEFL Listening と同様）
- `correctIndex`: 0始まり
- 1会話あたり3問、13セットで39問がフルセット

## TOEIC Part 4: Talks

説明文問題。1トークにつき3問×10セット＝30問。
TOEFL Listening Lecture と同構造。トークは Speaker 1名。
audioSegments の role は常に `"Speaker"`。
トピックはビジネス関連（アナウンス、プレゼン、ラジオ広告、音声メッセージなど）。

```json
{
  "title": "Airport Announcement",
  "transcript": "Attention all passengers. Flight 247 to Chicago is now boarding at Gate 12.",
  "questions": [
    {
      "id": "q1",
      "stem": "Where does this announcement most likely take place?",
      "options": ["At a train station", "At an airport", "At a bus terminal", "At a hotel lobby"],
      "correctIndex": 1,
      "type": "inference",
      "explanation": "The announcement refers to a flight number, gates, and boarding passes."
    }
  ],
  "audioSegments": [
    { "role": "Speaker", "text": "Attention all passengers. Flight 247 to Chicago is now boarding at Gate 12." }
  ]
}
```

**フィールド仕様:**
- TOEFL Listening Lecture と同一構造
- `audioSegments[].role`: 常に `"Speaker"`（1名の話者）
- `options`: 配列形式
- `correctIndex`: 0始まり
- 1トークあたり3問、10セットで30問がフルセット
