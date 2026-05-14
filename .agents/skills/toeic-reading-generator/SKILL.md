---
name: toeic-reading
description: >
  TOEIC Reading セクションの問題JSONを生成するスキル。
  「TOEIC Reading」「Part 5」「Part 6」「Part 7」「Incomplete Sentences」
  「Text Completion」「Reading Comprehension」「TOEICの読解」などの発言でトリガーする。
  TOEIC ListeningやTOEFLには使わない。
---

# TOEIC Reading Section

## 先に確認すること

- `../english-question-generator/references/question-schemas.md` を先に読む
- 生成対象タスクの既存サンプルを `public/questions/toeic/` で確認する（part5, part6, part7）

## タスク一覧

| タスク | 保存先 | 問題数 |
|-------|--------|--------|
| Part 5: Incomplete Sentences | `public/questions/toeic/part5/` | 30問 |
| Part 6: Text Completion | `public/questions/toeic/part6/` | 4 passages × 4問 = 16問 |
| Part 7: Reading Comprehension | `public/questions/toeic/part7/` | Single: 2〜4問, Double: 5問, Triple: 5問 |

## 注意

- Part 5/6/7 は `correct` がアルファベット文字列（`"A"`〜`"D"`）で、`correctIndex` ではない
- トピックはビジネス文脈に統一する
- 音声は不要

## 実行手順

1. `scripts/make-question.sh <task>` で雛形JSONを作成
2. `TODO` を本番問題に置換
3. JSON構造を `question-schemas.md` と照合
4. 保存先パスを報告
