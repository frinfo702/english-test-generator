# English Test Practice

TOEFL iBT 2026年新形式 と TOEIC Reading の問題をAIが都度生成するローカル練習アプリ。

## セットアップ

```bash
# 1. 依存パッケージのインストール
npm install

# 2. APIキーの設定
cp .env.local.example .env.local
# .env.local を編集して VITE_ANTHROPIC_API_KEY を設定

# 3. 起動
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## 対応コンテンツ

### TOEFL iBT 2026 新形式

| セクション | タスク                                                                              |
| ---------- | ----------------------------------------------------------------------------------- |
| Reading    | Complete the Words / Read in Daily Life（アダプティブ） / Read an Academic Passage  |
| Writing    | Build a Sentence / Write an Email（7分） / Write for an Academic Discussion（10分） |
| Speaking   | Listen and Repeat / Take an Interview（45秒×4問）                                   |

### TOEIC Reading

| パート | 内容                                                  |
| ------ | ----------------------------------------------------- |
| Part 5 | Incomplete Sentences（30問）                          |
| Part 6 | Text Completion（4文書×4問）                          |
| Part 7 | Reading Comprehension（Single/Double/Triple Passage） |

## プロンプトのカスタマイズ

`public/prompts/` 配下のJSONファイルを直接編集することで、問題生成の指示をカスタマイズできます。
アプリを再起動せずページをリロードするだけで反映されます。
