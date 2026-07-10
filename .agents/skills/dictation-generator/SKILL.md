---
name: dictation-generator
description: >
  ディクテーション問題JSONを生成するスキル。
  「ディクテーションの問題を作って」「dictation problem」「リスニングのディクテーション」
  「音声を聞いて単語を並べる問題」「dictation practice」などの依頼で使う。
  短い英文を音声で聞き、単語カードを正しい順番に並べる問題形式。
  フェイク選択肢（distractor）を含めることで、注意深く聞く力を訓練する。
  難易度指定がなければ Daily Life（標準）で生成する。
  音声生成は generate-audio.ts で行う（sentences[].text を TTS API に送信）。
---

# Dictation Problem Generator

## 先に確認すること

- `references/dictation-schema.md` を先に読む
- 既存サンプルを `public/questions/dictation/` で確認する

## 実行手順

1. 依頼から難易度・トピックカテゴリを特定する
2. 難易度未指定なら Daily Life（標準）を採用する
3. `public/questions/dictation/` に `NNN.json` を作成する
4. `index.json` の `files` 配列に新ファイル名を追記する
5. JSON構造を `references/dictation-schema.md` と照合する
6. `npm run generate-audio` で音声を生成する
7. 保存先パスとファイル名を明示して完了報告する

## task パス

- `dictation`（保存先: `public/questions/dictation/`）

## ディクテーションの必須仕様

- 1問につき短い英文1文（6〜14語）を作る
- 1セットあたり6文を含める
- 各文に `distractors`（フェイク単語）を2〜3個付ける
- distractor は文の文脈で紛らわしい単語を選ぶ（反意語、類義語、関連語）
- 文は自然な口語英語にする（日常会話、アカデミック、ビジネスのいずれか）
- 文の最後に句読点（`.` `?` `!`）を付ける
- 同一セット内で文のトピックを統一する

## 難易度レベル

| レベル            | トピック         | 語彙レベル | 文の長さ | distractor数 |
| ----------------- | ---------------- | ---------- | -------- | ------------ |
| Daily Life        | 日常会話・生活   | CEFR A2-B1 | 6-8語    | 2-3個        |
| Academic          | 学校・研究・課題 | CEFR B1-B2 | 7-10語   | 3個          |
| Business & Travel | 仕事・出張・会議 | CEFR B1-B2 | 8-12語   | 3個          |

## 品質チェック

- `wordCount` は `text` を空白分割した語数と一致させる
- distractor が正解文に含まれる単語と重複しないこと
- distractor が文法上その位置に入りうる品詞であること
- 文が1文完結であること（複文・接続詞でつなぐのは可）
- `id` は `s1`, `s2`, ... の連番にする
