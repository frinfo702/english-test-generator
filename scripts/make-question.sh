#!/usr/bin/env bash
# make-question.sh — 問題JSONファイルの雛形を生成し、index.jsonを更新する
#
# 使い方:
#   ./scripts/make-question.sh <task>
#
# <task> の一覧:
#   toefl/reading/complete-words
#   toefl/reading/daily-life
#   toefl/reading/academic
#   toefl/writing/build-sentence
#   toefl/writing/email
#   toefl/writing/discussion
#   toefl/speaking/listen-repeat
#   toefl/speaking/interview
#   toeic/part5
#   toeic/part6
#   toeic/part7
#
# 例:
#   ./scripts/make-question.sh toeic/part5
#   ./scripts/make-question.sh toefl/reading/daily-life

set -euo pipefail

QUESTIONS_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/questions"

usage() {
  echo "使い方: $0 <task>"
  echo ""
  echo "task の一覧:"
  echo "  toefl/reading/complete-words"
  echo "  toefl/reading/daily-life"
  echo "  toefl/reading/academic"
  echo "  toefl/writing/build-sentence"
  echo "  toefl/writing/email"
  echo "  toefl/writing/discussion"
  echo "  toefl/speaking/listen-repeat"
  echo "  toefl/speaking/interview"
  echo "  toeic/part5"
  echo "  toeic/part6"
  echo "  toeic/part7"
  exit 1
}

if [[ $# -lt 1 ]]; then
  usage
fi

TASK="$1"
TARGET_DIR="$QUESTIONS_DIR/$TASK"
INDEX_FILE="$TARGET_DIR/index.json"

# ディレクトリ作成
mkdir -p "$TARGET_DIR"

# 既存ファイルの最大番号を取得して次番号を決める
MAX=0
if ls "$TARGET_DIR"/[0-9][0-9][0-9].json > /dev/null 2>&1; then
  for f in "$TARGET_DIR"/[0-9][0-9][0-9].json; do
    NUM="${f##*/}"
    NUM="${NUM%.json}"
    NUM=$((10#$NUM))
    if [[ $NUM -gt $MAX ]]; then
      MAX=$NUM
    fi
  done
fi
NEXT=$((MAX + 1))
FILENAME=$(printf "%03d.json" "$NEXT")
OUTFILE="$TARGET_DIR/$FILENAME"

# タスク別の雛形を生成する関数
generate_template() {
  local task="$1"
  case "$task" in

    toefl/reading/complete-words)
      cat << 'TMPL'
{
  "paragraph": "TODO: 穴埋め付きの段落テキストを書いてください。各穴は word___ 形式。",
  "items": [
    {
      "index": 0,
      "hint": "abc",
      "answer": "TODO: 正解の単語",
      "placeholder": "word___"
    }
  ]
}
TMPL
      ;;

    toefl/reading/daily-life)
      cat << 'TMPL'
{
  "module": "module1",
  "texts": [
    {
      "id": "t1",
      "textType": "email",
      "content": "TODO: 日常テキスト（email / SNS post / notice 等）を記入",
      "questions": [
        {
          "id": "q1",
          "stem": "TODO: 設問文",
          "options": [
            "A. 選択肢A",
            "B. 選択肢B",
            "C. 選択肢C",
            "D. 選択肢D"
          ],
          "correctIndex": 0,
          "type": "factual",
          "explanation": "TODO: 解説"
        }
      ]
    }
  ]
}
TMPL
      ;;

    toefl/reading/academic)
      cat << 'TMPL'
{
  "passage": "TODO: アカデミックな英文パッセージ（300〜500語程度）を記入",
  "questions": [
    {
      "id": "q1",
      "stem": "TODO: 設問文",
      "options": [
        "A. 選択肢A",
        "B. 選択肢B",
        "C. 選択肢C",
        "D. 選択肢D"
      ],
      "correctIndex": 0,
      "type": "factual",
      "explanation": "TODO: 解説"
    }
  ]
}
TMPL
      ;;

    toefl/writing/build-sentence)
      cat << 'TMPL'
{
  "sentences": [
    {
      "id": "s1",
      "reference": "TODO: 誰かが発した質問または文章",
      "chunks": [
        "TODO: 単語1",
        "TODO: 単語2",
        "TODO: 単語3",
        "TODO: 単語4"
      ],
      "correctOrder": [0, 1, 2, 3],
      "fullSentence": "TODO: referenceへの回答として完成した英文（原則は単語分割。重複語の曖昧さ回避時のみ最小限の連結を許容）"
    }
  ]
}
TMPL
      ;;

    toefl/writing/email)
      cat << 'TMPL'
{
  "prompt": "TODO: メール作成の指示（状況・目的・条件を記述）",
  "sampleResponse": "TODO: 模範回答メール本文",
  "keyPoints": [
    "TODO: 採点ポイント1",
    "TODO: 採点ポイント2"
  ]
}
TMPL
      ;;

    toefl/writing/discussion)
      cat << 'TMPL'
{
  "topic": "TODO: ディスカッションのお題",
  "prompt": "TODO: 設問（例：Do you agree or disagree? Give reasons.）",
  "sampleResponse": "TODO: 模範回答（150〜200語程度）",
  "keyPoints": [
    "TODO: 採点ポイント1",
    "TODO: 採点ポイント2"
  ]
}
TMPL
      ;;

    toefl/speaking/listen-repeat)
      cat << 'TMPL'
{
  "sentences": [
    {
      "id": "ls1",
      "text": "TODO: 音読する英文",
      "phonetic": "TODO: 発音のヒント（任意）"
    }
  ]
}
TMPL
      ;;

    toefl/speaking/interview)
      cat << 'TMPL'
{
  "questions": [
    {
      "id": "iq1",
      "question": "TODO: インタビュー設問",
      "prepTime": 15,
      "responseTime": 45,
      "sampleAnswer": "TODO: 模範回答（任意）"
    }
  ]
}
TMPL
      ;;

    toeic/part5)
      cat << 'TMPL'
{
  "questions": [
    {
      "id": "q1",
      "sentence": "The team ___ the project on time.",
      "options": {
        "A": "TODO: 選択肢A",
        "B": "TODO: 選択肢B",
        "C": "TODO: 選択肢C",
        "D": "TODO: 選択肢D"
      },
      "correct": "A",
      "explanation": "TODO: 解説",
      "focus": "verb tense/form"
    }
  ]
}
TMPL
      ;;

    toeic/part6)
      cat << 'TMPL'
{
  "passage": "TODO: 穴埋め付きの文章（4問分の空欄を含む）",
  "questions": [
    {
      "id": "q1",
      "blankNumber": 1,
      "options": {
        "A": "TODO: 選択肢A",
        "B": "TODO: 選択肢B",
        "C": "TODO: 選択肢C",
        "D": "TODO: 選択肢D"
      },
      "correct": "A",
      "explanation": "TODO: 解説"
    }
  ]
}
TMPL
      ;;

    toeic/part7)
      cat << 'TMPL'
{
  "passage": "TODO: 読解パッセージ（メール・広告・記事等）",
  "questions": [
    {
      "id": "q1",
      "stem": "TODO: 設問文",
      "options": {
        "A": "TODO: 選択肢A",
        "B": "TODO: 選択肢B",
        "C": "TODO: 選択肢C",
        "D": "TODO: 選択肢D"
      },
      "correct": "A",
      "explanation": "TODO: 解説"
    }
  ]
}
TMPL
      ;;

    *)
      echo "エラー: 未知のタスク '${task}'" >&2
      usage
      ;;
  esac
}

# 雛形ファイルを書き出し
generate_template "$TASK" > "$OUTFILE"
echo "✓ 作成: $OUTFILE"

# index.json を更新（存在しなければ新規作成）
if [[ -f "$INDEX_FILE" ]]; then
  python3 - "$INDEX_FILE" "$FILENAME" << 'PYEOF'
import json, sys

index_file = sys.argv[1]
new_file = sys.argv[2]

with open(index_file, "r") as f:
    idx = json.load(f)

files = idx.get("files", [])
if new_file not in files:
    files.append(new_file)
    files.sort()

idx["files"] = files

with open(index_file, "w") as f:
    json.dump(idx, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"✓ index.json 更新: {files}")
PYEOF
else
  python3 - "$INDEX_FILE" "$FILENAME" << 'PYEOF'
import json, sys

index_file = sys.argv[1]
new_file = sys.argv[2]

data = {"files": [new_file]}
with open(index_file, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"✓ index.json 新規作成: {[new_file]}")
PYEOF
fi

echo ""
echo "次のステップ:"
echo "  1. $OUTFILE を編集して TODO を実際の問題に置き換えてください"
echo "  2. npm run dev でアプリを起動して動作確認してください"
