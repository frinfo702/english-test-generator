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

- `../english-question-generator/references/question-schemas.md` の Speaking 節を先に読む
- 生成対象タスクの既存サンプルを `public/questions/toefl/speaking/` で確認する

## タスク一覧

| タスク            | 保存先                                           | 出題数  |
| ----------------- | ------------------------------------------------ | ------- |
| Listen and Repeat | `public/questions/toefl/speaking/listen-repeat/` | 1ファイル＝1場面7文 |
| Take an Interview | `public/questions/toefl/speaking/interview/`     | 4問     |

## 本番との差を生まないための指針

詳細仕様とJSONは `question-schemas.md` の Speaking 節が正。出典は ETS 公式 Test Specifications (2026) と公式模試の観察。

### Listen and Repeat

- 1セット＝1場面。受験者は新人スタッフで、manager / trainer の説明を復唱する（動物園、図書館の貸出、美術館、ホテル、キャンパスツアー、ジム）
- 7文の語数の目安: 5 → 7 → 9 → 11 → 11 → 12 → 14（4〜15語で全体として増加）
- 後半ほど従属節・関係詞節・長い名詞句を入れる。縮約形を含める
- 例（自作）: "Welcome to the city aquarium." → "Please keep your bags with you at all times." → "If a child gets separated from a parent, bring them to the front desk right away."

### Take an Interview

- 導入: `You have agreed to take part in a research study about {topic}.` + 2文目は従来どおり
- 準備なし・各45秒。4問で抽象度を上げる:
  1. `opening` 本人の事実・描写（Do you live in a city, a town, or a village?）
  2. `personal` 好み・反応＋理由
  3. `opinion` 示された一般論への賛否（Some people say… Do you agree?）
  4. `closing` 社会・政策・技術の是非（Should local governments…? Why or why not?）
- 各問は短い相づち＋前置き1〜2文＋問い。Q1 だけ研究目的の導入を含める
- `modelAnswer` は45秒（90〜110語）で話せる口語

### 構造例（food preferences、自作）

```json
{
  "scenario": "You have agreed to take part in a research study about food preferences.\nYou will have a short online interview with a researcher. The researcher will ask you some questions.",
  "questions": [
    { "id": "q1", "type": "opening", "question": "Thank you for taking part. Today I'd like to ask you about food. First, how often do you cook for yourself, and what do you usually make?", "modelAnswer": "...", "evaluationPoints": ["..."] },
    { "id": "q2", "type": "personal", "question": "I see. What kind of food do you enjoy most when you eat out with friends? Why?", "modelAnswer": "...", "evaluationPoints": ["..."] },
    { "id": "q3", "type": "opinion", "question": "Interesting. Some people say that young people today don't know how to cook. Do you agree? Why or why not?", "modelAnswer": "...", "evaluationPoints": ["..."] },
    { "id": "q4", "type": "closing", "question": "Good points. One last question. Should schools require students to take cooking classes? Why or why not?", "modelAnswer": "...", "evaluationPoints": ["..."] }
  ]
}
```

`type` の並び（opening → personal → opinion → closing）はテストで固定されている。

## 注意

- 音声生成は `scripts/generate-audio.ts` で別途行う（`scenario` / `question` / `modelAnswer` を TTS）
  - `scenario.mp3`（導入）+ `{n}.mp3`（設問）+ `{n}-model.mp3`（模範解答）
- UI では導入・設問とも基本は音声のみ。テキストは折りたたみ（聞き取れなかったとき用）
- Speaking はテキストベースの設問のみ本スキルの対象

## 実行手順

1. `scripts/make-question.sh toefl/speaking/interview` で雛形JSONを作成（Listen and Repeat は対応パス）
2. `TODO` を本番問題に置換（Interview は `scenario` と4問すべて）
3. JSON構造を `question-schemas.md` と照合
4. 必要なら `npx tsx scripts/generate-audio.ts` で音声を再生成
5. 保存先パスを報告
