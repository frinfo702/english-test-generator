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

| タスク                | 保存先                                           | パッセージの長さ | 設問数                       |
| --------------------- | ------------------------------------------------ | ---------------- | ---------------------------- |
| Complete the Words    | `public/questions/toefl/reading/complete-words/` | 65-100 words     | 1パッセージにつき10 blanks   |
| Read in Daily Life    | `public/questions/toefl/reading/daily-life/`     | 40-150 words     | 1 text × 2〜3 questions      |
| Read Academic Passage | `public/questions/toefl/reading/academic/`       | 180-230 words    | 1 passage × 5 questions      |

## 本番との差を生まないための指針

仕様（語数・設問数・JSON）は `question-schemas.md` が正。ここでは「本番らしさ」を作るコツをまとめる。
出典: ETS公式 Test Blueprint & Specifications (2026) と公式フル模試の観察。市販教材の問題は流用しない。

### Complete the Words（Reading 50問中30問を占める最重要タスク）

- **書き方の順番**: 先に B1〜B2 の平易な5文の説明文を書く → 第2文の2語目から1語おきに10語を機械的に選ぶ → hint = 先頭 floor(len/2) 文字。空欄にしたい難語を選んでから文を作るのは禁止（旧データの失敗パターン）
- 空欄の約半数が the / of / and / in / that / its / with / is / have / from などの短い機能語になるのが正常。`a__`（and）や `o_`（of）のような短い空欄が多いのが本番の手触り
- 内容語は高頻度語の活用形（places, falls, required, surfaces, discovered）にする。`constructive` `vulnerable` `testimony` のような学術語は使わない
- 解答の決め手は文法（数の一致、時制、前置詞の相性、接続詞の論理）。hint から複数の語が考えられる場合は、文法で一意に決まるかを確認する
- 第1文で話題を立て、最後の1〜2文はまとめ・一般化で空欄なし

### Read in Daily Life

- 1本ずつ作る。短い（40〜80語・2問）か長い（100〜150語・3問）のどちらかに寄せる
- 本番らしい素材: 掲示（ペーパーレス化・施設閉鎖）、SNS投稿（イベント告知）、予約確認メール、販促・招待メール、標識、メニュー
- 設問の型: 主目的（What is the main purpose of…?）、詳細（いつ・何を持参・どう申し込む）、読み手や関係についての推論、発信者の特定（What type of business most likely…?）
- distractor は本文の語を別の役割で再利用する（ペーパーレス化の掲示なのに "a paper supplier"、本文中の別の日付など）
- 語彙は日常語。難しさは推論・目的把握で出し、難語では出さない

### Read an Academic Passage

- 180〜230語・3段落・タイトル付き。「概念 → 研究・証拠 → 含意」の流れ
- 5問は mainIdea / vocabulary / detail / negativeFactual / rhetoricalPurpose / inference から重複少なく選ぶ。文挿入・要約は作らない
- rhetoricalPurpose は「Why does the author mention X?」で、正解は「〜を例証するため」型

## 自己チェック（保存前に必ず確認）

- [ ] Complete the Words: 第1文に空欄がない／空欄は1語おきに連続／hint が floor(len/2) 文字／機能語が3〜6個含まれる／最後の文に空欄がない
- [ ] Complete the Words: 10個の answer に CEFR C1 以上の語がない
- [ ] Daily Life: 語数と設問数の組（40〜80語→2問、100〜150語→3問）が合っている
- [ ] 正解の根拠が本文中に1か所で特定でき、distractor が本文の語を流用している
- [ ] `npx vitest run src/lib/toefl-reading` が通る

## 実行手順

1. `scripts/make-question.sh <task>` または `scripts/generate-template.py <task>` で雛形JSONを作成
   - `generate-template.py` はスキル内の `scripts/` に同梱されているPythonスクリプト
   - 使用例: `python3 .agents/skills/toefl-reading-generator/scripts/generate-template.py daily-life`
2. `TODO` を本番問題に置換
3. JSON構造を `question-schemas.md` と照合
4. 保存先パスを報告
