---
name: english-question-generator
description: >
  TOEFL iBT (2026年以降) と TOEIC Reading の問題JSONを生成するスキル。
  「TOEFL対策」「TOEFL問題作って」「Readingの練習」「Writingの練習」「Speakingの練習」
  「TOEFL practice」「TOEFLの問題」「新形式TOEFL」「アダプティブTOEFL」「TOEICの問題を作って」
  「part5の問題を作って」など、試験問題作成依頼で使う。
  セクション/タスク指定がなければ確認し、難易度指定がなければ Module 1（標準）で生成する。
  Listening 音声生成は対象外（Speaking はテキスト問題のみ対応）。
---

# TOEFL / TOEIC Question Generator

## 先に確認すること

- `references/question-schemas.md` を先に読む
- 生成対象タスクの既存サンプルを `public/questions/...` で確認する

## 実行手順

1. 依頼から試験種別・セクション・タスクを特定する
2. セクション/タスク未指定ならユーザーに確認する
3. 難易度未指定なら Module 1（標準）を採用する
4. `scripts/make-question.sh <task>` で雛形JSONを作成する
5. 生成ファイルの `TODO` を本番問題に置換する
6. JSON構造を `references/question-schemas.md` と照合する
7. 保存先パスとファイル名を明示して完了報告する

## task パス

- `toefl/reading/complete-words`
- `toefl/reading/daily-life`
- `toefl/reading/academic`
- `toefl/writing/build-sentence`
- `toefl/writing/email`
- `toefl/writing/discussion`
- `toefl/speaking/listen-repeat`
- `toefl/speaking/interview`
- `toeic/part5`
- `toeic/part6`
- `toeic/part7`

## Complete the Words の必須仕様

- 70〜100語の学術段落を作る
- 空欄は10個に固定する
- `items[].hint` は 2〜3文字にする
- `items[].answer` は完全な正解単語を入れる
- `items[].hint` を `items[].answer` の先頭一致にする
- **解答者は hint の続きのみを入力する前提で作る**
- 続き文字数 = `answer.length - hint.length` で揃える
- `items[].placeholder` は `hint + 続き文字数分の _` にする
- `paragraph` 内の空欄表現を `items[].placeholder` と完全一致させる
- 文脈から一意に正解できる語だけを選ぶ

## 品質チェック

- `index` は 0 始まりで連番にする
- 各 `placeholder` は段落内に1回だけ出現させる
- 綴り・文法・語彙レベルを難易度要件に合わせる
- TOEICはビジネス文脈、TOEFLは学習者向け学術/日常文脈に寄せる
