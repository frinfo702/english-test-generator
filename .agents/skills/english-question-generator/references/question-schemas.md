# 問題JSON スキーマ & 保存先

問題JSONは `public/questions/<exam>/<section>/<task>/` に配置する。
各ディレクトリに問題ファイルと、自動生成される `index.json` を置く。

## ファイル名 = 問題ID

- 新規ファイルは `<YYYYMMDD>-<slug>.json`（例: `20261007-library-hours.json`）。slug は英小文字・数字・ハイフンのみ。
- ファイル名（`.json` を除いた部分）が問題IDになり、学習履歴や音声ディレクトリから参照される。**作成後にリネームしない。削除した名前を再利用しない。**
- 既存の `001.json` などはそのまま有効なIDとして扱う。連番に揃える必要はない。
- `index.json` は Vite（`npm run dev` / `npm run build`）がディレクトリ内容から自動生成するので、手で編集しない。

---

## ディレクトリ対応表

| タスク                                   | 保存先パス                                       | 音声時間  | 1音声あたりの設問数 |
| ---------------------------------------- | ------------------------------------------------ | --------- | ------------------- |
| TOEFL Reading: Complete the Words        | `public/questions/toefl/reading/complete-words/` | —         | —                   |
| TOEFL Reading: Read in Daily Life        | `public/questions/toefl/reading/daily-life/`     | —         | —                   |
| TOEFL Reading: Read Academic Passage     | `public/questions/toefl/reading/academic/`       | —         | —                   |
| TOEFL Writing: Build a Sentence          | `public/questions/toefl/writing/build-sentence/` | —         | —                   |
| TOEFL Writing: Write an Email            | `public/questions/toefl/writing/email/`          | —         | —                   |
| TOEFL Writing: Write Academic Discussion | `public/questions/toefl/writing/discussion/`     | —         | —                   |
| TOEFL Speaking: Listen and Repeat        | `public/questions/toefl/speaking/listen-repeat/` | —         | —                   |
| TOEFL Speaking: Take an Interview        | `public/questions/toefl/speaking/interview/`     | —         | —                   |
| TOEFL Listening: Choose a Response       | `public/questions/toefl/listening/response/`     | 5〜15秒   | 1                   |
| TOEFL Listening: Conversation            | `public/questions/toefl/listening/conversation/` | 30〜90秒  | 2                   |
| TOEFL Listening: Announcement            | `public/questions/toefl/listening/announcement/` | 20〜40秒  | 2〜3                |
| TOEFL Listening: Academic Talk           | `public/questions/toefl/listening/lecture/`      | 45〜120秒 | 4                   |
| TOEIC Part 2                             | `public/questions/toeic/part2/`                  | —         | —                   |
| TOEIC Part 3                             | `public/questions/toeic/part3/`                  | —         | —                   |
| TOEIC Part 4                             | `public/questions/toeic/part4/`                  | —         | —                   |
| TOEIC Part 5                             | `public/questions/toeic/part5/`                  | —         | —                   |
| TOEIC Part 6                             | `public/questions/toeic/part6/`                  | —         | —                   |
| TOEIC Part 7                             | `public/questions/toeic/part7/`                  | —         | —                   |
| Dictation                                | `public/questions/dictation/`                    | 3〜8秒    | 1                   |

---

## TOEFL Reading: Read in Daily Life

everyday text（実用文）1本に2〜3問の設問を付ける（1ファイル＝1テキスト）。

```json
{
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
    }
  ]
}
```

**フィールド仕様:**

- 1ファイル = 1テキスト（`texts` は要素1つ）。アプリ側で2本を組み合わせてモジュールにする
- `textType`: 本番で確認できたのは notice / social media post / email（予約確認・案内・招待）/ sign / menu。ほかに schedule, advertisement, text message, webpage, form, receipt など
- `layout`（表示レイアウト。省略時は `textType` から推定）:
  - `"email"`: `content` を `From:` / `To:` / `Subject:` 行 → 空行 → 本文 の形で書く。ヘッダーが枠付きボックスで表示される
  - `"chat"`: スマホ画面の吹き出し。`content` の代わりに `messages: [{ "sender", "time", "text" }]`（2〜3人、最初の発言者が右寄せ）
  - `"live-chat"`: 「Live Chat」パネル。`messages` を使う。`title` で見出しを変更可（既定 `"Live Chat"`）
  - `"notice"`: announcement / advertisement / poster / sign 用の角丸枠。`title` が見出し、`content` は `\n` 区切りの短い行（12語以下の行だけなら中央揃え）。任意で `icon`: `"globe"` / `"megaphone"` / `"calendar"` / `"info"` / `"tag"`
  - `"document"`: その他（schedule, menu, form, receipt, online post など）
- chat / live-chat の設問は「At 9:03 A.M., what does Mr. X imply when he writes, "..."?」のように時刻と発言を引用する形式も使う
- `type`（設問種別）: `"factual"` / `"inference"` / `"purpose"` / `"vocabulary"`
- `correctIndex`: 0始まり（A=0, B=1, C=2, D=3）
- **長さと設問数は対で決める（本番準拠）**:
  - 短いテキスト 40〜80語 → 2問
  - 長いテキスト 100〜150語 → 3問
  - 1モジュール = 短1本 + 長1本 = 5問
- 難易度: CEFR A2〜B2 が中心（spec 上は A1〜C1）。語彙は日常語。難しさは「読み取り方」で出す
- 選択肢は4択

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

- `type`（設問種別）。本番の公式練習問題で確認できたのは次の6種のみ:
  - `"mainIdea"`（主旨）/ `"vocabulary"`（closest in meaning）/ `"detail"` / `"negativeFactual"`（NOT / EXCEPT）/ `"rhetoricalPurpose"`（Why does the author mention X?）/ `"inference"`
  - `"paragraphRelation"` / `"importantIdea"` / `"insertSentence"` は旧形式の名残。新規では使わない（文挿入・要約問題は2026形式に存在しない）
- `correctIndex`: 0始まり、4択、単一正解
- パッセージ: 180〜230語、3段落（`\n\n` 区切り）、タイトル付き
- 構成の定型: ①概念・現象の提示 → ②研究・証拠・具体例 → ③より広い含意・未解決点
- 設問数: 5問固定。1問目は mainIdea か段落1の detail、vocabulary は1問まで
- 難易度: CEFR B1〜C2（spec）。文は明快な説明文で、難しさは推論と修辞目的の問いで出す。専門語は本文中で定義する
- トピック: 心理学・行動科学、動物の認知、生物、地学・天文、歴史、芸術、経済など。背景知識は不要

---

## TOEFL Reading: Complete the Words

段落内の単語の後半を表示時に伏せ、**hintの続きだけ**を入力させる（C-test形式）。

```json
{
  "paragraph": "Glaciers are large masses of ice that move slowly over land. They form in places where more snow falls in winter than melts in summer. Over many years, the snow is pressed into dense ice. As a glacier moves, it carves valleys and carries rocks over long distances. Today, many glaciers are shrinking because temperatures around the world are rising. Scientists study glaciers to learn how the climate has changed.",
  "items": [
    { "index": 0, "hint": "fo", "answer": "form" },
    { "index": 1, "hint": "pla", "answer": "places" },
    { "index": 2, "hint": "mo", "answer": "more" },
    { "index": 3, "hint": "fa", "answer": "falls" },
    { "index": 4, "hint": "win", "answer": "winter" },
    { "index": 5, "hint": "me", "answer": "melts" },
    { "index": 6, "hint": "sum", "answer": "summer" },
    { "index": 7, "hint": "Ov", "answer": "Over" },
    { "index": 8, "hint": "ye", "answer": "years" },
    { "index": 9, "hint": "sn", "answer": "snow" }
  ]
}
```

**フィールド仕様:**

- `paragraph`: 元の全文。伏せ字や `_` は保存しない
- `items[].index`: 段落内の出現順（0始まり）
- `items[].answer`: 正解の完全な単語（句読点を含めない）
- `items[].hint` = `answer` の先頭 **floor(len/2) 文字**（例: of→o, the→t, and→a, each→ea, which→wh, moves→mo, places→pla, training→trai, increased→incr, flexibility→flexi）。UIでは hint が表示済みで、解答者は残り ceil(len/2) 文字を入力する
- 1文字語（a, I）は hint が空になるので空欄にしない。数字・固有名詞も空欄にしない

**空欄の配置（公式練習問題の観察に基づく）:**

- 段落: 4〜5文、65〜100語（目安75〜85語）
- **第1文は完全に表示**（トピック提示）。空欄は第2文の2語目から始める
- そこから **1語おき（every other word）** に連続して10個空欄化する。飛ばしてよいのは1文字語・数字・固有名詞だけ（その場合は次の語へずらす）
- 10個目のあとは最後まで表示する。最終文（1〜2文）は空欄なし
- 結果として空欄の約半数は機能語（the, of, in, and, that, with, its, is, have, from, into, such, may）、残りは日常的な内容語・活用形（places, falls, records, requires, surfaces）になる。2〜4文字の短い語が多く、欠落が1〜2文字だけの空欄も普通にある

**難易度の作り方:**

- 語彙レベルで難しくしない。CEFR B1〜B2 の高頻度語で書く（学術語彙リスト上位レベルの長い語を並べない）
- 難しさは「文法・語法・形態」で決まる: 複数形 -s、三単現 -s、過去形・過去分詞、前置詞の選択（depend on / consist of）、接続詞・副詞（however, although, while, also）、冠詞、代名詞・its/their の一致
- 正解が文脈から一意に決まり、hint から別の語に読めないこと（例: `th` → the/this/that/they の曖昧さは文法で一意に決まるか確認する）
- 話題: 百科事典風の短い説明文（自然科学、歴史、芸術、心理学、技術、地理）。中立的な学術レジスター

---

## TOEFL Writing: Write Academic Discussion

教授の問い＋学生2名の意見＋モデルアンサー。

```json
{
  "professorName": "Dr. Chen",
  "course": "education policy",
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

- `course`（任意）: 授業の科目名。画面では「Your professor is teaching a class on {course}.」と表示される
- `professorQuestion`: 70〜90語。背景2〜3文 → 問い（Should …? / Do you think …? / Which … more important, A or B? Why?）
- `student1` / `student2`: 各40〜60語。**反対の立場**で、それぞれ具体的理由を1つ持つ（受験者が第3の視点を足せる余地を残す）
- `modelAnswer`: 120〜150語。片方に触れつつ新しい理由・例を加える
- 本番は10分、"An effective response will contain at least 100 words"
- 採点観点（0〜5）: 議論への関連性と明確さ、理由・例の展開、構文の多様さと慣用的で正確な語彙、誤りの少なさ

---

## TOEFL Writing: Write an Email

状況設定＋送信先＋モデルアンサー。

```json
{
  "scenario": {
    "title": "Requesting an Extension on an Assignment",
    "description": "You are a student in Professor Martinez's Advanced Writing course. You have been ill for three days and cannot complete the research paper due this Friday.",
    "recipient": "Professor Martinez",
    "subject": "Request for an extension",
    "purpose": "Request a one-week extension on the research paper",
    "keyPoints": [
      "Explain your illness and its impact",
      "Specify how much additional time you need",
      "Offer to provide a doctor note if required"
    ]
  },
  "modelAnswer": "Dear Professor Martinez,\n\nI am writing to request...",
  "rubric": [
    {
      "criterion": "Content",
      "description": "Clearly explains the reason and includes all key points."
    }
  ]
}
```

- `keyPoints`: 画面では「Write an email to {recipient}. In your email, do the following.」の下に箇条書きで表示される。**本番は3つ固定**。定型の流れ:
  1. 状況・肯定的な点・背景を伝える（例: 楽しんだこと、参加した経緯）
  2. 問題・事情を説明する
  3. 依頼・質問・提案をする
- `description`: 2〜3文。相手との関係（教授・大家・店・クラブの代表・友人など）と出来事を書く。キャンパス外の日常場面も多い
- 本番は7分、語数指定なし（目安120〜150語）。`modelAnswer` もこの長さ
- 採点観点（0〜5）: 目的を果たす展開、構文の多様さと慣用表現、丁寧さ・レジスターなど社会的慣習、誤りの少なさ。問題文の語句の丸写しは減点対象なので、`keyPoints` は modelAnswer と同じ言い回しにしない
- `subject`（任意）: 解答欄上の Subject 行。省略時は `title` を表示する

---

## TOEFL Writing: Build a Sentence

相手の発話（`reference`）への返答文を、チャンクを並べて完成させる。**1ファイル＝1文**（`sentences` は要素1つ。下の例は3ファイル分を並べたもの）。

```json
{
  "sentences": [
    {
      "id": "s1",
      "reference": "I'm moving to a new apartment next month.",
      "chunks": ["found", "to help", "you", "have", "helping", "someone"],
      "correctOrder": [3, 2, 0, 5, 1],
      "suffix": "you pack",
      "fullSentence": "Have you found someone to help you pack?"
    },
    {
      "id": "s2",
      "reference": "Did the museum tour go well?",
      "prefix": "Yes, the woman",
      "chunks": ["the tour", "who", "was", "led", "really helpful"],
      "correctOrder": [1, 3, 0, 2, 4],
      "fullSentence": "Yes, the woman who led the tour was really helpful."
    },
    {
      "id": "s3",
      "reference": "What did the professor ask you after class?",
      "prefix": "She wanted to know",
      "chunks": ["I", "had", "the article", "whether", "finished", "did"],
      "correctOrder": [3, 0, 1, 4, 2],
      "fullSentence": "She wanted to know whether I had finished the article."
    }
  ]
}
```

**フィールド仕様:**

- `reference`: 相手の一言（日常会話の発話。話者ラベルは付けない）。質問・報告・感想・誘いなど
- `prefix`（任意）: 返答文の冒頭で既に表示されている語（例: `"She wanted to know"`, `"No, I"`, `"The"`）
- `suffix`（任意）: 返答文の末尾で既に表示されている語（例: `"yet"`, `"for the trip"`）。末尾の `.` / `?` は含めない
- `chunks`: シャッフル済みの配列（表示順）。UIでは小文字で表示される
- `correctOrder`: 正解に使う `chunks` のインデックス列。**含まれないチャンクは distractor** として最後まで選択肢に残る
- `fullSentence`: prefix・空欄部・suffix を合わせた完全な返答文。**末尾に `.` か `?` を必ず付ける**（画面の文末記号はここから取る）
- `prefix + correctOrder の順に並べた chunks + suffix` を空白でつないだもの ＝ `fullSentence` から末尾記号を除いたもの、が成り立つこと（大文字小文字は無視）

**本番の傾向（公式練習問題20問の観察）:**

- 返答が**疑問文**の問題が多い（あるテストで7/10、別のテストで0/10。1セットで4〜6問を目安に混ぜる）
- 全10問のうち約半数に `prefix` か `suffix` がある（文頭・文末どちらも出る）。残りは全部空欄
- チャンク数は **5〜7個**（distractor 含む）。2〜3語の**複数語チャンクを1〜3個**含める（`"to help"`, `"the tour"`, `"a later train"`, `"looked into"`）
- distractor は **0個か1個**。1セットで4〜6問に1個入れる。正解語の文法的な紛らわしい代替にする: was/were, already/yet, not/no, none/not, so/too, because, 余計な `it` / `do` / `did`, -ing と原形（`helping`）
- 狙う文法:
  - 間接疑問（Do you know if… / Can you tell me where… / I wonder why… ＝平叙文の語順）
  - 報告疑問・報告文（She wanted to know where… / He asked when to…）
  - do / will / have を使う直接疑問文（Did you… / Have you… / Will you need to…?）
  - 関係詞節（who led the tour / that was recommended by）
  - 否定（haven't … yet / have no interest in / didn't …）
  - 完了形、受動態、to不定詞、動名詞、find X to be Y
- 話題: 旅行、コンサート、買い物、試験、映画、料理、引っ越し、アルバイトなど日常の雑談。学術的な語彙は使わない
- 全体の長さ: 返答文 7〜13語。正解が一通りに決まること（別の語順でも文法的に成立しないか確認する）
- 1ファイル1文。下の配分（疑問文・prefix/suffix・distractor の割合）は、10ファイル単位で満たす

---

## TOEFL Speaking: Take an Interview

本番形式に合わせた research-study インタビュー。
1セット＝1テーマのオンライン面接。導入シナリオのあと、研究者が4問を連続で尋ねる。

```json
{
  "scenario": "You have volunteered for a research study about food preferences.\nYou will have a short online interview with a researcher. The researcher will ask you some questions.",
  "questions": [
    {
      "id": "q1",
      "type": "opening",
      "question": "Thank you for your participation. Today, I'd like to ask you some questions about your food preferences. First, in your opinion, what kinds of meals do people your age enjoy most? Are they traditional, modern, or something in between?",
      "modelAnswer": "I think people my age usually enjoy modern meals more than traditional ones, but many also like a mix. Fast food, delivery, and international dishes are popular because they are convenient and social. At the same time, some friends still prefer home-style food when they eat with family. So overall, I would say preferences sit somewhere in between.",
      "evaluationPoints": [
        "Addresses the question about people of a similar age",
        "Chooses traditional, modern, or in between",
        "Gives at least one reason or example",
        "Speaks clearly within the time limit"
      ]
    },
    {
      "id": "q2",
      "type": "personal",
      "question": "I see. And what kind of meals do you usually have on busy days—do you cook, eat out, or pick up something ready-made?",
      "modelAnswer": "On busy days I usually pick up something ready-made. I do not have much time to cook after class or work, so a sandwich, salad, or bento is practical. Sometimes I eat out with friends if we are already near a restaurant. I cook only when I have a free evening and want a proper meal.",
      "evaluationPoints": [
        "States a clear personal habit for busy days",
        "Chooses cook, eat out, ready-made, or a mix",
        "Explains why that choice fits a busy schedule",
        "Uses natural first-person language"
      ]
    },
    {
      "id": "q3",
      "type": "opinion",
      "question": "Interesting. Many people say that modern life has changed how we eat. Do you think people today have healthier eating habits than in the past? Why or why not?",
      "modelAnswer": "I do not think people today generally eat healthier than in the past. Modern life makes processed and fast food very easy to get, and busy schedules reduce home cooking. On the other hand, more people now know about nutrition and choose salads or plant-based options. Still, overall convenience often wins, so habits may be less healthy than before.",
      "evaluationPoints": [
        "Takes a clear yes/no position",
        "Connects the answer to modern life",
        "Supports the view with reasons",
        "May briefly acknowledge the other side"
      ]
    },
    {
      "id": "q4",
      "type": "closing",
      "question": "Good points. I just have one more question. Some people believe that preparing traditional meals at home is an important way to stay connected to one's culture. Do you agree, or do you think it's possible to connect with culture in other ways? Why?",
      "modelAnswer": "I partly agree, but I think culture can be kept alive in other ways too. Cooking traditional meals at home is powerful because food carries family stories and shared customs. However, people can also connect through festivals, language, music, and community events. So traditional cooking helps, but it is not the only way to stay connected to culture.",
      "evaluationPoints": [
        "Responds clearly to the agree/or-other-ways frame",
        "Gives a reason for the chosen position",
        "May mention food and alternative cultural practices",
        "Ends the interview response coherently"
      ]
    }
  ]
}
```

**フィールド仕様:**

- `scenario`（必須）: 受験者向け導入文（TTS で `scenario.mp3` 化。画面上は折りたたみ表示）。次の2文構成を基本とする
  1. `You have agreed to take part in a research study about {topic}.`（旧形式 `You have volunteered for…` も可）
  2. `You will have a short online interview with a researcher. The researcher will ask you some questions.`
- `questions`（必須）: 4問固定。同一 `scenario` のトピックに沿った一連の会話にする
- `type`: 出題順に対応するラベル
  - `"opening"` — Q1: 挨拶・導入のあと、同世代や一般論への質問
  - `"personal"` — Q2: 受験者本人の習慣・経験
  - `"opinion"` — Q3: 社会変化・価値観への意見（Why / Why not を含むことが多い）
  - `"closing"` — Q4: 「I just have one more question」などの締め＋ agree/disagree や二者択一
- `question`: **研究者が話す全文**を入れる。転換句（`Thank you for your participation.` / `I see.` / `Interesting.` / `Good points.` など）を含め、素のエッセイプロンプトにしない
- `modelAnswer`: 45秒程度で話せる自然な口頭回答
- `evaluationPoints`: 2〜4個

**出題ルール（本番寄せ）:**

- 1セット＝1トピック（本番例: urban life, exercise habits。ほかに food, travel, technology, free time, shopping, work）
- 準備時間なし、各45秒で回答
- 4問は「事実 → 好み・反応 → 一般論への賛否 → 社会・政策・技術の是非」と抽象度を上げる:
  - `opening`: 本人の事実・描写（Do you live in a city, a town, or a village? / Describe the exercise you usually do.）
  - `personal`: 好み・経験への反応＋理由（What do you like most about…? Why?）
  - `opinion`: 示された一般論への賛否（Some people say that… Do you agree? Why or why not?）
  - `closing`: 社会・政策・技術の問い（Should city governments…? / Are fitness apps a good way to…? Why or why not?）
- 各問は短い相づち（Great. / I see. / Interesting. / Good points.）＋前置き1〜2文＋問い。Q1だけ研究目的の導入を含める
- アカデミックな孤立エッセイ質問（"Describe a time when..." 単体）にはしない

---

## TOEFL Speaking: Listen and Repeat

1つの場面設定で、研修担当者（manager / trainer）の言葉を7文リピートする。`scripts/generate-audio.ts` で各文の音声を別途生成する。

```json
{
  "sentences": [
    {
      "id": "s1",
      "text": "Welcome to the city aquarium.",
      "wordCount": 5
    },
    {
      "id": "s2",
      "text": "Please keep your bags with you at all times.",
      "wordCount": 9
    }
  ]
}
```

**フィールド仕様:**

- `wordCount`: 単語数（空白区切り）
- 1ファイル＝1文（`sentences` は要素1つ）。下の「場面」「長さ」は7ファイルで1シリーズとして作るときの目安
- 場面: 受験者が新人スタッフとして研修を受ける設定（動物園の来園者案内、図書館の貸出カウンター、美術館、ホテルのフロント、キャンパスツアー、ジム、カフェなど）。7文すべて同じ場面
- 内容: あいさつ、規則（Please don't…, You must…）、場所の案内（The gift shop is next to…）、手順・説明
- 長さ: 4〜6語から始め、最後は12〜15語。全体として長くなる（厳密な単調増加でなくてよい）
- 構文の進み方: 単文 → 複合動詞・前置詞句 → 従属節・関係詞節（…, which is…, if you…, before you…）→ 複雑な名詞句
- 縮約形（you'll, don't, it's）を自然に含める。数字・固有名詞は少なめにする

---

## TOEFL Listening 共通: 声とスピーカー画像

- `voices`: 役割ごとの xAI TTS 声ID（例: `{"Student": "eve", "Professor": "leo"}`）。`npm run generate-audio` はこの声で音声を作る。未指定で音声もまだ無いセットは、生成時に自動で配役して JSON に書き戻す。声の一覧は `src/lib/voiceMapping.ts`（API との差分は `npm run check-voices`）。
- `speaker`: `public/images/speakers/<id>.jpg` の人物画像。各画像の性別は `src/lib/speakerPhotos.ts`。Choose a Response は設問ごとに `questions[].speaker`。
- 制約（`src/lib/listeningVoices.test.ts` で検証）:
  - Conversation は話者2人で、男性の声と女性の声を1人ずつ。画像は男女ペア（`c1`〜`c4`）
  - その他のタスクは画像の性別 = 声の性別
  - 同じセット内で声を重複させない
- Academic Talk は `"subject"`（例: `"biology"`）も任意で指定でき、「Listen to a talk in a biology class.」と表示される。

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
    {
      "role": "Student",
      "text": "Excuse me, do you know when the library opens on weekends?"
    }
  ]
}
```

**フィールド仕様:**

- `context`: 状況ラベル（例: "Asking for information", "Expressing concern"）
- `questions[].options`: オブジェクト形式。**本番は4択（`"A"`〜`"D"`）**。旧データは3択
- `questions[].correct`: アルファベット文字列
- `audioSegments`: 各設問1セグメント（発言のみ、応答は音声不要）
- 1ファイル＝1問（`questions` と `audioSegments` は要素1つ）
- 発話の長さ: 1文、5〜15語（約5秒）。難易度 CEFR A1〜B2

**本番の傾向:**

- 発話は wh-疑問、yes/no 疑問、**否定疑問**（Isn't the post office open today?）、依頼・提案、平叙文（報告・不満・感想）を混ぜる
- 正解は**間接的な応答**が多い（「わからないけど調べておく」「スケジュールをオンラインで確認しよう」「代わりに〇〇はどう？」）。yes/no で直接答えない正解を半分程度にする
- distractor の型:
  - 発話中の語・似た音を繰り返す（bus → "I missed the bus"）
  - 別の wh に答える（when ↔ where）
  - wh-疑問に Yes/No で答える
  - 代名詞・時制のズレ（she/he, will/did）
  - "Yes" + 矛盾する内容

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
      "options": [
        "To ask about an assignment",
        "To discuss a grade",
        "To request a recommendation letter",
        "To change a class schedule"
      ],
      "correctIndex": 0,
      "type": "purpose",
      "explanation": "The student says they have a question about the essay assignment."
    },
    {
      "id": "q2",
      "stem": "What will the student do next?",
      "options": [
        "Revise the introduction",
        "Submit the paper",
        "Meet with a tutor",
        "Email the professor"
      ],
      "correctIndex": 1,
      "type": "detail",
      "explanation": "The professor tells the student to submit the revised version by Friday."
    }
  ],
  "audioSegments": [
    {
      "role": "Student",
      "text": "Hi Professor Martinez, do you have a moment?"
    },
    { "role": "Professor", "text": "Sure, come in. What can I help you with?" }
  ]
}
```

**フィールド仕様:**

- `transcript`: 全文文字起こし。50〜110語、5〜9ターン、2名
- `questions[].type`: `"purpose"` / `"detail"` / `"inference"` / `"attitude"`
- `options`: 配列形式（4択）
- `correctIndex`: 0始まり
- 1会話あたり2問
- 場面: キャンパスに限らない日常。家事・用事、職場（空調の修理、プリンターの故障）、読書会、機器選び、友人との予定
- 設問の型: 暗示された意味、相手の提案、理由、慣用表現の機能（Why does the man say, "…"?）、次の行動

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
      "options": [
        "It will close at the regular time",
        "It will remain open with extended hours",
        "It will also undergo renovation",
        "It will move to a temporary location"
      ],
      "correctIndex": 1,
      "type": "detail",
      "explanation": "The science library will remain open with extended hours."
    }
  ],
  "audioSegments": [
    {
      "role": "Speaker",
      "text": "Attention students. The main library will be closed for renovation from March 15 to March 22. The science library on north campus will remain open with extended hours."
    }
  ]
}
```

**フィールド仕様:**

- `transcript`: 全文文字起こし。50〜80語、1名
- `questions[].type`: `"detail"` / `"inference"` / `"vocabulary"`
- `options`: 配列形式（4択）
- `correctIndex`: 0始まり
- 1アナウンスあたり **2問**
- 場面: キャンパス・授業内（ゲスト講演、ラウンジ閉鎖、春祭り、授業の変更）が中心。図書館・交通・博物館・店舗も可
- 設問の型: 主目的、ある情報がなぜ述べられたか、聞き手がすべきこと

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
      "options": [
        "Marine animal reproduction",
        "The formation of coral reefs",
        "Ocean temperature changes",
        "Coral reef conservation"
      ],
      "correctIndex": 1,
      "type": "mainIdea",
      "explanation": "The lecture begins by stating they will discuss how coral reefs form."
    },
    {
      "id": "q2",
      "stem": "What role do coral polyps play in reef formation?",
      "options": [
        "They eat harmful algae",
        "They secrete calcium carbonate",
        "They attract fish species",
        "They clean the water"
      ],
      "correctIndex": 1,
      "type": "detail",
      "explanation": "Coral polyps secrete calcium carbonate to form hard skeletons."
    }
  ],
  "audioSegments": [
    {
      "role": "Lecturer",
      "text": "Today we'll discuss how coral reefs form. Coral reefs are built by tiny marine animals called coral polyps, which secrete calcium carbonate..."
    }
  ]
}
```

**フィールド仕様:**

- `transcript`: 全文文字起こし。150〜230語（上限250語）、1名
- `questions[].type`: `"mainIdea"` / `"detail"` / `"inference"` / `"vocabulary"` / `"attitude"`
- `options`: 配列形式（4択）
- `correctIndex`: 0始まり
- 1講義あたり4問
- 枠組み: 授業の一部（"a talk in an environmental science class"）またはポッドキャスト（"a podcast about psychology"）。`subject` で指定
- 設問の型: 主題、例が挙げられた目的、詳細、次に話す内容（What will the speaker most likely discuss next?）

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
    {
      "role": "Woman",
      "text": "Number 1. When is the deadline for the budget proposal?"
    },
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
      "options": [
        "To discuss the office renovation timeline",
        "To complain about construction noise",
        "To request a change of workspace",
        "To inquire about contractor pricing"
      ],
      "correctIndex": 0,
      "type": "purpose",
      "explanation": "The man says he is there to discuss the office renovation schedule."
    }
  ],
  "audioSegments": [
    {
      "role": "Man",
      "text": "Good morning. I'm here to discuss the office renovation schedule."
    },
    {
      "role": "Woman",
      "text": "Yes, let me pull up the contractor's timeline. The construction team will start next Monday."
    }
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
      "options": [
        "At a train station",
        "At an airport",
        "At a bus terminal",
        "At a hotel lobby"
      ],
      "correctIndex": 1,
      "type": "inference",
      "explanation": "The announcement refers to a flight number, gates, and boarding passes."
    }
  ],
  "audioSegments": [
    {
      "role": "Speaker",
      "text": "Attention all passengers. Flight 247 to Chicago is now boarding at Gate 12."
    }
  ]
}
```

**フィールド仕様:**

- TOEFL Listening Lecture と同一構造
- `audioSegments[].role`: 常に `"Speaker"`（1名の話者）
- `options`: 配列形式
- `correctIndex`: 0始まり
- 1トークあたり3問、10セットで30問がフルセット

---

## Dictation

短い英文1文を音声で聞き、単語カードを正しい順番に並べる問題。
フェイク選択肢（distractor）が混ざっているため、注意深く聴く力を訓練する。
詳細は `dictation-generator` スキルの `references/dictation-schema.md` を参照。

```json
{
  "title": "Daily Life Dictation",
  "sentences": [
    {
      "id": "s1",
      "text": "I usually take the bus to work in the morning.",
      "wordCount": 10,
      "distractors": ["train", "evening", "home"]
    },
    {
      "id": "s2",
      "text": "The coffee shop opens at seven on weekdays.",
      "wordCount": 8,
      "distractors": ["closes", "eight", "weekends"]
    }
  ]
}
```

**フィールド仕様:**

- `sentences[].text`: ディクテーション対象の英文（1文・6〜14語）
- `sentences[].wordCount`: `text` の語数（空白分割と一致）
- `sentences[].distractors`: フェイク単語の配列（2〜3個、正解文に含まれない単語）
- 1セットあたり6文推奨
- 音声: `public/audio/dictation/<fileBasename>/<n>.mp3`（`npm run generate-audio` で生成）
