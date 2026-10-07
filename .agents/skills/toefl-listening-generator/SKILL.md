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

| タスク            | 音声時間  | 1音声あたりの設問数 | 主な評価スキル     |
| ----------------- | --------- | ------------------- | ------------------ |
| Choose a Response | 約5秒（5〜15語）       | 1問（4択）          | 実用的な応答理解   |
| Conversation      | 50〜110語・5〜9ターン  | 2問                 | 対話理解           |
| Announcement      | 50〜80語               | 2問                 | 目的・指示の把握   |
| Academic Talk     | 150〜230語             | 4問                 | 講義理解・構造把握 |

## 各タスクの保存先

| タスク            | 保存先                                           |
| ----------------- | ------------------------------------------------ |
| Choose a Response | `public/questions/toefl/listening/response/`     |
| Conversation      | `public/questions/toefl/listening/conversation/` |
| Announcement      | `public/questions/toefl/listening/announcement/` |
| Academic Talk     | `public/questions/toefl/listening/lecture/`      |

## 本番との差を生まないための指針

詳細仕様は `question-schemas.md` の Listening 節が正。出典は ETS 公式 Test Specifications (2026) と公式模試の観察。

### Choose a Response

- 新規は**4択（A〜D）**
- 発話を混ぜる: wh-疑問、yes/no、否定疑問（Isn't…?）、依頼・提案、平叙文（報告・不満・感想）
- 正解は間接的な応答を半分程度（「確認しておくね」「オンラインで見てみよう」「代わりに〜は？」）
- distractor: 発話中の語・似た音の繰り返し、別の wh への回答、wh-疑問への Yes/No、代名詞・時制のズレ、"Yes" + 矛盾

### Conversation / Announcement / Academic Talk

- Conversation: キャンパス外の日常（家事、職場のトラブル、読書会、買い物の相談）も使う。慣用表現の機能を問う「Why does the woman say, "…"?」を入れる
- Announcement: キャンパス・授業の連絡（ゲスト講演、施設閉鎖、行事）。主目的・言及の理由・聞き手がすべきこと
- Academic Talk: 授業かポッドキャスト。主題・例の目的・詳細・次に話す内容

## 注意

- Speaking とは異なり、スクリプトを使わず問題JSONの指示に従う
- 音声生成は `scripts/generate-audio.ts` で行う（問題生成とは別工程）

## 実行手順

1. `scripts/make-question.sh <task>` で雛形JSONを作成（未対応のタスクは手動で作成）
2. `TODO` を本番問題に置換
3. JSON構造を `question-schemas.md` と照合
4. 保存先パスを報告
