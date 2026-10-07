---
name: english-question-generator
description: >
  TOEFL iBT (2026年以降) と TOEIC の問題JSONを生成するスキル。
  「TOEFL対策」「TOEFL問題作って」「Readingの練習」「Writingの練習」「Speakingの練習」
  「TOEFL practice」「TOEFLの問題」「新形式TOEFL」「アダプティブTOEFL」「TOEICの問題を作って」
   「part5の問題を作って」「TOEICリスニング」「part2」「part3」「part4」
  など、試験問題作成依頼で使う。
  セクション/タスク指定がなければ確認し、難易度指定がなければ Module 1（標準）で生成する。
  Speaking はテキスト問題のみ対応（音声生成は generate-audio.ts で行う）。
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
- `toefl/listening/response`
- `toefl/listening/conversation`
- `toefl/listening/announcement`
- `toefl/listening/lecture`
- `toeic/part2`
- `toeic/part3`
- `toeic/part4`
- `toeic/part5`
- `toeic/part6`
- `toeic/part7`
- `dictation`

## タスク別の指針

TOEFL の各タスクは `toefl-reading` / `toefl-writing` / `toefl-speaking` / `toefl-listening` スキルの指針と自己チェックに従う。仕様は `references/question-schemas.md` が正。

## 品質チェック

- 綴り・文法・語彙レベルを難易度要件に合わせる
- TOEICはビジネス文脈、TOEFLは学習者向け学術/日常文脈に寄せる
