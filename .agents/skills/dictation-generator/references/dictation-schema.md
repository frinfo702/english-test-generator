# ディクテーション問題JSON スキーマ

問題JSONは `public/questions/dictation/` に配置する。
各ディレクトリに `index.json`（ファイルリスト）と `001.json`, `002.json`, ... を置く。

## index.json

```json
{ "files": ["001.json", "002.json", "003.json"] }
```

番号は3桁ゼロパディング（`001`, `002`, ...）。新規追加時は `index.json` の `files` 配列にも追記する。

## 問題ファイル構造

```json
{
  "title": "Daily Life Dictation",
  "sentences": [
    {
      "id": "s1",
      "text": "I usually take the bus to work in the morning.",
      "wordCount": 10,
      "distractors": ["train", "evening", "home"]
    },
    {
      "id": "s2",
      "text": "The coffee shop opens at seven on weekdays.",
      "wordCount": 8,
      "distractors": ["closes", "eight", "weekends"]
    }
  ]
}
```

### フィールド仕様

| フィールド                | 型       | 必須 | 説明                                       |
| ------------------------- | -------- | ---- | ------------------------------------------ |
| `title`                   | string   | ✓    | セットのタイトル（カテゴリ名を含む）       |
| `sentences`               | array    | ✓    | ディクテーション文の配列（1セット6文推奨） |
| `sentences[].id`          | string   | ✓    | 文の識別子（`s1`, `s2`, ... の連番）       |
| `sentences[].text`        | string   | ✓    | ディクテーション対象の英文（1文・短文）    |
| `sentences[].wordCount`   | number   | ✓    | `text` の語数（空白分割と一致）            |
| `sentences[].distractors` | string[] | ✓    | フェイク単語の配列（2〜3個）               |

## 音声ファイル

音声は `public/audio/dictation/<fileBasename>/<n>.mp3` に配置する。
`fileBasename` は問題ファイル名から `.json` を除いたもの（例: `001`）。
`<n>` は文のインデックス+1（1始まり）。

例: `public/questions/dictation/001.json` の1文目 → `public/audio/dictation/001/1.mp3`

音声生成コマンド:

```bash
npm run generate-audio
```

`scripts/generate-audio.ts` が `sentences[].text` を検出し、各文を TTS API に送信して MP3 を生成する。

## distractor 作成のガイドライン

distractor（フェイク選択肢）は学習者が注意深く聴くことを促すために重要。

### 良い distractor の条件

1. **品詞が一致**: 正解と同じ品詞（名詞なら名詞、動詞なら動詞）で、その位置に文法的に入りうる
2. **意味が関連**: 文脈に関連するが正解ではない単語（反意語、類義語、関連語）
3. **音声が紛らわしい**: 発音が正解と似ている、または同じ音素を含む単語
4. **正解文に含まれない**: 正解文の単語と重複しない

### distractor の例

| 正解文                                 | distractor   | 理由                             |
| -------------------------------------- | ------------ | -------------------------------- |
| "I usually take the **bus** to work"   | `train`      | 同じカテゴリ（交通手段）の関連語 |
| "The coffee shop **opens** at seven"   | `closes`     | 反意語（同じ動詞の対義）         |
| "opens at **seven**"                   | `eight`      | 数値の紛らわしさ                 |
| "on **weekdays**"                      | `weekends`   | 反意語                           |
| "She **forgot** to bring her umbrella" | `remembered` | 反意語                           |

## ディクテーションの教育学習原則

以下の原則は EnglishClub および言語教育学の実践に基づく。

### 1. 短い一文形式

ディクテーションは短い1文（6〜14語）が最も効果的。短文は学習者が音声の細部（強勢、リエゾン、縮約形）に集中できる。

### 2. 段階的な難易度

日常会話（Daily Life）→ 学術的文脈（Academic）→ ビジネス・旅行（Business & Travel）の順で語彙と文法が複雑になる。

### 3. 自然な口語英語

実際の会話やアナウンスで聞くような自然な英語を使用。教科書的な不自然な文は避ける。

### 4. 多様な文脈

異なる文脈（日常、学校、仕事、旅行）を混ぜることで、多様な語彙と話し方に触れる。

### 5. 即時フィードバック

間違った単語を選んだ瞬間に「間違い」を伝えることで、自己修正の機会を最大化する。

### 6. 反復聴取

音声を何度でも再生できるようにし、聞き取れなかった細部を確認できるようにする。

### 7. フェイク選択肢の活用

distractor を含めることで、単なる推測ではなく注意深く聴く力を訓練する。

## 既存問題セット一覧

| ファイル   | タイトル                    | 難易度            | 文数 |
| ---------- | --------------------------- | ----------------- | ---- |
| `001.json` | Daily Life Dictation        | Daily Life        | 6    |
| `002.json` | Academic Dictation          | Academic          | 6    |
| `003.json` | Business & Travel Dictation | Business & Travel | 6    |
