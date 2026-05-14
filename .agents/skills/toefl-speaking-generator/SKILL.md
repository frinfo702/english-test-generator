---
name: toefl-speaking
description: >
  TOEFL Speaking セクションの問題JSONを生成するスキル。
  「TOEFL Speaking」「Listen and Repeat」「Take an Interview」
  「スピーキングの練習」などの発言でトリガーする。
  TOEICや他のTOEFLセクションには使わない。
  Speaking はテキスト問題のみ対応（音声生成は generate-audio.ts で行う）。
---

# TOEFL Speaking Section

## 先に確認すること

- `../english-question-generator/references/question-schemas.md` を先に読む
- 生成対象タスクの既存サンプルを `public/questions/toefl/speaking/` で確認する

## タスク一覧

| タスク | 保存先 | 出題数 |
|-------|--------|--------|
| Listen and Repeat | `public/questions/toefl/speaking/listen-repeat/` | 7〜10文 |
| Take an Interview | `public/questions/toefl/speaking/interview/` | 4問 |

## 注意

- 音声生成は `scripts/generate-audio.ts` で別途行う（音声不要のタスクもある）
- Speaking はテキストベースの設問のみ本スキルの対象

## 実行手順

1. `scripts/make-question.sh <task>` で雛形JSONを作成
2. `TODO` を本番問題に置換
3. JSON構造を `question-schemas.md` と照合
4. 保存先パスを報告
