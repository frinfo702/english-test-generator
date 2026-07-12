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
| Listen and Repeat | `public/questions/toefl/speaking/listen-repeat/` | 7〜10文 |
| Take an Interview | `public/questions/toefl/speaking/interview/`     | 4問     |

## Take an Interview（本番形式）

research-study のオンライン面接。導入 `scenario` のあと、研究者が同じトピックで4問を連続質問する。

### 必須構造

```json
{
  "scenario": "You have volunteered for a research study about {topic}.\nYou will have a short online interview with a researcher. The researcher will ask you some questions.",
  "questions": [
    {
      "id": "q1",
      "type": "opening",
      "question": "Thank you for your participation. Today, I'd like to ask you some questions about {topic}. First, ...",
      "modelAnswer": "...",
      "evaluationPoints": ["...", "..."]
    },
    {
      "id": "q2",
      "type": "personal",
      "question": "I see. And ...",
      "modelAnswer": "...",
      "evaluationPoints": ["...", "..."]
    },
    {
      "id": "q3",
      "type": "opinion",
      "question": "Interesting. ... Why or why not?",
      "modelAnswer": "...",
      "evaluationPoints": ["...", "..."]
    },
    {
      "id": "q4",
      "type": "closing",
      "question": "Good points. I just have one more question. Some people believe that ... Do you agree, or ...? Why?",
      "modelAnswer": "...",
      "evaluationPoints": ["...", "..."]
    }
  ]
}
```

### 質問タイプ（順番固定）

| # | type       | 役割 |
| - | ---------- | ---- |
| 1 | `opening`  | 参加感謝＋トピック導入＋一般論/同世代への質問 |
| 2 | `personal` | 相づち＋本人の習慣・経験 |
| 3 | `opinion`  | 社会変化や価値観への意見（Why / Why not） |
| 4 | `closing`  | 最終問の合図＋ agree/disagree や二者択一 |

### 書き方の注意

- `question` には研究者が話す全文を入れる（転換句を含める）
- 素のエッセイプロンプト（`Describe a time when...` 単体など）にしない
- 4問は同じ research topic に沿った一連の会話にする
- 選択肢フレーム（A / B / in between など）を適度に使い、口頭で答えやすくする
- `modelAnswer` は45秒で話せる長さにする

### 正規例（food preferences）

Scenario:

> You have volunteered for a research study about food preferences.
> You will have a short online interview with a researcher. The researcher will ask you some questions.

1. Thank you for your participation. Today, I’d like to ask you some questions about your food preferences. First, in your opinion, what kinds of meals do people your age enjoy most? Are they traditional, modern, or something in between?
2. I see. And what kind of meals do you usually have on busy days—do you cook, eat out, or pick up something ready-made?
3. Interesting. Many people say that modern life has changed how we eat. Do you think people today have healthier eating habits than in the past? Why or why not?
4. Good points. I just have one more question. Some people believe that preparing traditional meals at home is an important way to stay connected to one’s culture. Do you agree, or do you think it’s possible to connect with culture in other ways? Why?

## 注意

- 音声生成は `scripts/generate-audio.ts` で別途行う（`question` / `modelAnswer` を TTS）
- Speaking はテキストベースの設問のみ本スキルの対象

## 実行手順

1. `scripts/make-question.sh toefl/speaking/interview` で雛形JSONを作成（Listen and Repeat は対応パス）
2. `TODO` を本番問題に置換（Interview は `scenario` と4問すべて）
3. JSON構造を `question-schemas.md` と照合
4. 必要なら `npx tsx scripts/generate-audio.ts` で音声を再生成
5. 保存先パスを報告
