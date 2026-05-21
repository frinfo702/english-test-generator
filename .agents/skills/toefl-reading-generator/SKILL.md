---
name: toefl-reading
description: >
  TOEFL Reading セクションの問題JSONを生成するスキル。
  「TOEFL Readingの問題作って」「Complete the Words」「Read in Daily Life」
  「Academic Passage」「TOEFL Readingの練習」などの発言でトリガーする。
  TOEIC Readingや他のTOEFLセクションには使わない。
---

# TOEFL Reading Section

## 先に確認すること

- `../english-question-generator/references/question-schemas.md` を先に読む
- 生成対象タスクの既存サンプルを `public/questions/toefl/reading/` で確認する

## タスク一覧

| タスク | 保存先 | 設問数 |
|-------|--------|--------|
| Complete the Words | `public/questions/toefl/reading/complete-words/` | 10 blanks |
| Read in Daily Life | `public/questions/toefl/reading/daily-life/` | 2〜3 texts × 2〜3 questions each |
| Read Academic Passage | `public/questions/toefl/reading/academic/` | 5問固定 |

## 必須仕様（2026年新形式準拠）

### Complete the Words
- 70〜100語の学術段落、空欄10個固定
- `hint` は2〜3文字、`answer` の先頭と一致させる
- `placeholder` = `hint + 続き文字数分の _`
- 段落内の空欄と `placeholder` を完全一致させる
- 文脈から一意に特定できる語のみ選ぶ

### Read in Daily Life
- everyday text（email, notice, schedule, menu, announcement, text message, online post, ad, poster, sign, webpage, news article, form, invoice, receipt など）2〜3本
- 各テキスト15〜150語、設問2〜3問
- 合計4〜9問（目安6〜7問）
- 設問タイプ: factual / inference / purpose / vocabulary
- CEFR B2〜C1レベル。高度な推論や態度・意図の読み取りを含む
- 選択肢は4択。不正解選択肢は意味的に近いものを含め、容易に除外できない設計
- 評価されるスキル: 非線形テキスト形式の理解、書面コミュニケーションの主目的の特定、非公式・慣用的表現の理解、推論、スキャン・スキミング

### Read Academic Passage
- 学術段落1本、150〜250語（目安200語）
- 5問固定
- 設問タイプ: vocabulary / detail / inference / mainIdea / paragraphRelation / importantIdea / negativeFactual / rhetoricalPurpose / insertSentence
- トピック領域: history, art and music, business and economics, life science, physical science, social science など。背景知識は不要
- CEFR C1〜C2レベル

## 実行手順

1. `scripts/make-question.sh <task>` で雛形JSONを作成
2. `TODO` を本番問題に置換
3. JSON構造を `question-schemas.md` と照合
4. 保存先パスを報告
