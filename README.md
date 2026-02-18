# English Test Practice

TOEFL iBT 2026年新形式 と TOEIC Reading の練習アプリ。
**ネットワーク接続・APIキー不要**。AIエージェントがローカルに生成した問題JSONを読み込んで練習します。

## セットアップ

```bash
npm install
npm run dev
# → http://localhost:5173
```

## 問題の追加方法

問題はAIエージェント（Claude Code等）に生成してもらい、`public/questions/` 配下の対応フォルダに保存します。

### ディレクトリ構造

```
public/
├── prompts/          # AIへの指示書（プロンプトテンプレート）
│   ├── toefl/reading/complete-the-words.json
│   ├── toefl/reading/read-in-daily-life.json
│   ├── ...
│   └── toeic/part7-reading-comprehension.json
│
└── questions/        # AIが生成した問題ファイル（←ここに追加）
    ├── toefl/
    │   ├── reading/complete-words/
    │   │   ├── index.json   ← {"files":["001.json","002.json",...]}
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

### index.json の形式

各タスクフォルダに `index.json` が必要です：

```json
{ "files": ["001.json", "002.json"] }
```

アプリ起動時にランダムで1ファイルを選んで読み込みます。

### AIへの依頼方法

Claude Codeに以下のように依頼してください：

```
public/prompts/toefl/reading/complete-the-words.json の仕様に従って
TOEFL Reading Complete the Words の問題を生成し、
public/questions/toefl/reading/complete-words/002.json に保存してください。
index.json も更新してください。
```

各 `public/prompts/` ファイルに出力JSONのスキーマが定義されています。

## 対応コンテンツ

### TOEFL iBT 2026 新形式

| セクション | タスク                                                                              |
| ---------- | ----------------------------------------------------------------------------------- |
| Reading    | Complete the Words / Read in Daily Life（アダプティブ） / Read an Academic Passage  |
| Writing    | Build a Sentence / Write an Email（7分） / Write for an Academic Discussion（10分） |
| Speaking   | Listen and Repeat / Take an Interview（45秒×4問）                                   |

### TOEIC Reading

| パート | 内容                                                      |
| ------ | --------------------------------------------------------- |
| Part 5 | Incomplete Sentences（30問）                              |
| Part 6 | Text Completion（4文書×4問）                              |
| Part 7 | Reading Comprehension（Single / Double / Triple Passage） |

## サンプル問題

各タスクに1セットのサンプル問題が同梱されています。すぐに練習を始められます。
