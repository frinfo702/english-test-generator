---
name: toeic-listening
description: >
  TOEIC Listening セクションの問題JSONを生成するスキル。
  「TOEIC Listening」「Part 2」「Part 3」「Part 4」「Question-Response」
  「TOEICリスニング」「part2」「part3」「part4」などの発言でトリガーする。
  TOEIC ReadingやTOEFLには使わない。
  Listening は音声の生成（TTS）が別途必要。
---

# TOEIC Listening Section

## 先に確認すること

- `../english-question-generator/references/question-schemas.md` を先に読む
- 生成対象タスクの既存サンプルを `public/questions/toeic/` で確認する（part2, part3, part4）

## タスク一覧

| タスク | 保存先 | 問題数 |
|-------|--------|--------|
| Part 2: Question-Response | `public/questions/toeic/part2/` | 25問 |
| Part 3: Conversations | `public/questions/toeic/part3/` | 13 sets × 3問 = 39問 |
| Part 4: Talks | `public/questions/toeic/part4/` | 10 talks × 3問 = 30問 |

## 注意

- Part 2 の `options` はオブジェクト形式（`"A"`〜`"C"`）、`correct` は文字列
- Part 3/4 の `options` は配列形式、`correctIndex` は0始まり
- `audioSegments[].role`: Part 3 は `"Man"` / `"Woman"`、Part 4 は `"Speaker"`
- トピックはビジネス文脈に統一する

## 実行手順

1. `scripts/make-question.sh <task>` で雛形JSONを作成
2. `TODO` を本番問題に置換
3. JSON構造を `question-schemas.md` と照合
4. 保存先パスを報告
