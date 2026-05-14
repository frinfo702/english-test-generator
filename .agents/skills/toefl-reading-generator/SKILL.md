---
name: toefl-reading
description: >
  TOEFL Reading セクションの問題JSONを生成するスキル。
  「TOEFL Readingの問題作って」「Complete the Words」「Read in Daily Life」
  「Academic Passage」「TOEFL Readingの練習」などの発言でトリガーする。
  TOEIC Readingや他のTOEFLセクションには使わない。
  難易度指定がなければ Module 1（標準）で生成する。
---

# TOEFL Reading Section

## 先に確認すること

- `../english-question-generator/references/question-schemas.md` を先に読む
- 生成対象タスクの既存サンプルを `public/questions/toefl/reading/` で確認する

## タスク一覧

| タスク | 保存先 | 設問数 |
|-------|--------|--------|
| Complete the Words | `public/questions/toefl/reading/complete-words/` | 8〜10 blanks |
| Read in Daily Life | `public/questions/toefl/reading/daily-life/` | Module 1: 3〜4問, Module 2: 5〜6問 |
| Read Academic Passage | `public/questions/toefl/reading/academic/` | 5問固定 |

## Complete the Words の必須仕様

- 70〜100語の学術段落、空欄10個
- `hint` は2〜3文字、`answer` の先頭と一致させる
- `placeholder` = `hint + 続き文字数分の _`
- 段落内の空欄と `placeholder` を完全一致させる
- 文脈から一意に特定できる語のみ選ぶ

## 実行手順

1. `scripts/make-question.sh <task>` で雛形JSONを作成
2. `TODO` を本番問題に置換
3. JSON構造を `question-schemas.md` と照合
4. 保存先パスを報告
