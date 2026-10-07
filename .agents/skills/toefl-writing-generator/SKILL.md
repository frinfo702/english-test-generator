---
name: toefl-writing
description: >
  TOEFL Writing セクションの問題JSONを生成するスキル。
  「TOEFL Writingの問題作って」「Build a Sentence」「Write an Email」
  「Academic Discussion」「writingの練習」などの発言でトリガーする。
  TOEIC Readingや他のTOEFLセクションには使わない。
---

# TOEFL Writing Section

## 先に確認すること

- `../english-question-generator/references/question-schemas.md` を先に読む
- 生成対象タスクの既存サンプルを `public/questions/toefl/writing/` で確認する

## タスク一覧

| タスク                           | 保存先                                           | 出題数          |
| -------------------------------- | ------------------------------------------------ | --------------- |
| Build a Sentence                 | `public/questions/toefl/writing/build-sentence/` | 1ファイル1文    |
| Write an Email                   | `public/questions/toefl/writing/email/`          | 1問（7分、keyPoints 3つ） |
| Write for an Academic Discussion | `public/questions/toefl/writing/discussion/`     | 1問（10分想定） |

## 本番との差を生まないための指針

仕様とJSONは `question-schemas.md` が正。出典は ETS 公式の Test Specifications (2026)・公式模試・Writing rubric。市販教材の問題は流用しない。

### Build a Sentence

- 場面は**日常会話**。`reference` は友人・同僚の一言（旅行、買い物、試験、映画、料理、引っ越し）。教授の講義調にしない
- 10問の配分目安:
  - 返答が疑問文 4〜6問（Have you… / Did you… / Will you… / Do you know if… / Can you tell me where…）
  - `prefix` または `suffix` あり 4〜6問、全部空欄 4〜6問
  - distractor 1個 4〜6問、なし 残り
- チャンクは5〜7個、2〜3語の複数語チャンクを1〜3個。1語ずつ全部ばらすのは本番らしくない
- 1問1つの文法ポイントを狙う: 間接疑問の語順（where the library is / if he has finished）、報告疑問、関係詞節、完了形の否定（haven't … yet）、受動態、to不定詞
- distractor はその文法ポイントの誤答を作る語（間接疑問なら `does` / `is` の余計な助動詞、時制なら was/were、否定なら no/not）
- 正解の語順が一意であること。別の並びでも文法的に成立するなら作り直す

### Write an Email

- `description` 2〜3文 + `keyPoints` は**3つ**（状況・肯定 → 問題 → 依頼/質問/提案）
- 相手はキャンパス内に限らない（大家、店、クラブ代表、イベント主催者、元同僚）
- `modelAnswer` は120〜150語。keyPoints の言い回しを丸写ししない（本番で減点対象）

### Write for an Academic Discussion

- 教授の投稿70〜90語（背景 → 問い）、学生2名は各40〜60語で**反対の立場**
- 学生の意見は具体的な理由を1つずつに留め、受験者が第3の視点を加えられる余地を残す
- `modelAnswer` は120〜150語、`evaluationPoints` は rubric（関連性・展開・構文の多様さ・語の正確さ）に沿わせる

## 自己チェック

- [ ] Build a Sentence: `prefix + 正解チャンク + suffix` が `fullSentence`（末尾記号除く）と一致する
- [ ] Build a Sentence: `fullSentence` の末尾に `.` か `?` がある
- [ ] Build a Sentence: distractor を入れても正解が1通り
- [ ] `npx vitest run src/lib/toefl-writing src/pages/toefl/writing` が通る

## 実行手順

1. `scripts/make-question.sh <task>` で雛形JSONを作成
2. `TODO` を本番問題に置換
3. JSON構造を `question-schemas.md` と照合
4. 保存先パスを報告
