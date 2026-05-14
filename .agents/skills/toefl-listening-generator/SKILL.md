---
name: toefl-listening
description: >
  TOEFL iBT 2026 Listening セクションの問題JSONを生成するスキル。
  「TOEFL Listening」「Choose a Response」「Conversation」「Announcement」
  「Academic Talk」「Lecture」「リスニングの練習」などの発言でトリガーする。
  TOEIC Listening（Part 2-4）や他のTOEFLセクションには使わない。
  難易度指定がなければ Module 1（標準）で生成する。
  Listening は音声の生成（TTS）が別途必要。
---

# TOEFL Listening Section

## 先に確認すること

- `../english-question-generator/references/question-schemas.md` を先に読む
- 生成対象タスクの既存サンプルを `public/questions/toefl/listening/` で確認する

## タスク一覧

| タスク | 音声時間 | 1音声あたりの設問数 | 主な評価スキル |
|--------|---------|-------------------|--------------|
| Choose a Response | 5〜15秒 | 1問 | 実用的な応答理解 |
| Conversation | 30〜90秒 | 2問 | 対話理解 |
| Announcement | 20〜40秒 | 2〜3問 | 詳細情報の保持 |
| Academic Talk | 45〜120秒 | 4問 | 講義理解・構造把握 |

## 各タスクの保存先

| タスク | 保存先 |
|--------|--------|
| Choose a Response | `public/questions/toefl/listening/response/` |
| Conversation | `public/questions/toefl/listening/conversation/` |
| Announcement | `public/questions/toefl/listening/announcement/` |
| Academic Talk | `public/questions/toefl/listening/lecture/` |

## 聞くポイント（Choose a Response）

- 話し手が何を求めているか（助け、確認、情報、付き合い）
- 感情やトーン（不満、安堵、好奇心）
- 隠された期待や次のステップ

## 注意

- Speaking とは異なり、スクリプトを使わず問題JSONの指示に従う
- 音声生成は `scripts/generate-audio.ts` で行う（問題生成とは別工程）

## 実行手順

1. `scripts/make-question.sh <task>` で雛形JSONを作成（未対応のタスクは手動で作成）
2. `TODO` を本番問題に置換
3. JSON構造を `question-schemas.md` と照合
4. 保存先パスを報告
