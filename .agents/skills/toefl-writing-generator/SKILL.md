---
name: toefl-writing
description: >
  TOEFL Writing セクションの問題JSONを生成するスキル。
  「TOEFL Writingの問題作って」「Build a Sentence」「Write an Email」
  「Academic Discussion」「writingの練習」などの発言でトリガーする。
  TOEIC Readingや他のTOEFLセクションには使わない。
---

# TOEFL Writing Section

## 先に確認すること

- `../english-question-generator/references/question-schemas.md` を先に読む
- 生成対象タスクの既存サンプルを `public/questions/toefl/writing/` で確認する

## タスク一覧

| タスク | 保存先 | 出題数 |
|-------|--------|--------|
| Build a Sentence | `public/questions/toefl/writing/build-sentence/` | 10文 |
| Write an Email | `public/questions/toefl/writing/email/` | 1問（7分想定） |
| Write for an Academic Discussion | `public/questions/toefl/writing/discussion/` | 1問（10分想定） |

## 実行手順

1. `scripts/make-question.sh <task>` で雛形JSONを作成
2. `TODO` を本番問題に置換
3. JSON構造を `question-schemas.md` と照合
4. 保存先パスを報告
