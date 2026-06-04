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

| タスク                | 保存先                                           | 設問数                       |
| --------------------- | ------------------------------------------------ | ---------------------------- |
| Complete the Words    | `public/questions/toefl/reading/complete-words/` | 1パッセージにつき10 blanks   |
| Read in Daily Life    | `public/questions/toefl/reading/daily-life/`     | pacage × 2〜3 questions each |
| Read Academic Passage | `public/questions/toefl/reading/academic/`       | 1 pacage x 5 questions       |

## 必須仕様（2026年新形式準拠）

### Complete the Words

- 70〜100語の学術段落、空欄10個固定
- `paragraph` には元の全文のみを入れ、`___` や `hint + _` の伏せ字は保存しない
- 空欄化する単語は段落中の出現順に `items` へ並べる
- `hint` は2〜3文字、`answer` の先頭と一致させる
- 文脈から一意に特定できる語のみ選ぶ
- 連続する単語（隣接語）を両方とも空欄にしない。空欄同士は最低3語以上離す

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

1. `scripts/make-question.sh <task>` または `scripts/generate-template.py <task>` で雛形JSONを作成
   - `generate-template.py` はスキル内の `scripts/` に同梱されているPythonスクリプト
   - 使用例: `python3 .agents/skills/toefl-reading-generator/scripts/generate-template.py daily-life`
2. `TODO` を本番問題に置換
3. JSON構造を `question-schemas.md` と照合
4. 保存先パスを報告
