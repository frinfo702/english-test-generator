#!/usr/bin/env bash
# make-question.sh - Generate a question JSON template and update index.json
#
# Usage:
#   ./scripts/make-question.sh <task>
#
# Available <task> values:
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
# Examples:
#   ./scripts/make-question.sh toeic/part5
#   ./scripts/make-question.sh toefl/reading/daily-life

set -euo pipefail

QUESTIONS_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/questions"

usage() {
  echo "Usage: $0 <task>"
  echo ""
  echo "Available tasks:"
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

# Create directory
mkdir -p "$TARGET_DIR"

# Detect the max existing number and decide the next filename
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

# Generate task-specific template
generate_template() {
  local task="$1"
  case "$task" in

    toefl/reading/complete-words)
      cat << 'TMPL'
{
  "paragraph": "TODO: Write a paragraph with blanks. Use word___ placeholders for each blank.",
  "items": [
    {
      "index": 0,
      "hint": "abc",
      "answer": "TODO: Correct word",
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
      "content": "TODO: Add an everyday text (email / social post / notice / etc.)",
      "questions": [
        {
          "id": "q1",
          "stem": "TODO: Question stem",
          "options": [
            "A. Choice A",
            "B. Choice B",
            "C. Choice C",
            "D. Choice D"
          ],
          "correctIndex": 0,
          "type": "factual",
          "explanation": "TODO: Explanation"
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
  "passage": "TODO: Add an academic English passage (around 300-500 words)",
  "questions": [
    {
      "id": "q1",
      "stem": "TODO: Question stem",
      "options": [
        "A. Choice A",
        "B. Choice B",
        "C. Choice C",
        "D. Choice D"
      ],
      "correctIndex": 0,
      "type": "factual",
      "explanation": "TODO: Explanation"
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
      "reference": "TODO: A question or statement from another speaker",
      "chunks": [
        "TODO: word 1",
        "TODO: word 2",
        "TODO: word 3",
        "TODO: word 4"
      ],
      "correctOrder": [0, 1, 2, 3],
      "fullSentence": "TODO: Completed response sentence to reference (normally split into single words; combine minimally only to avoid ambiguity with repeated words)"
    }
  ]
}
TMPL
      ;;

    toefl/writing/email)
      cat << 'TMPL'
{
  "prompt": "TODO: Email writing instructions (context, purpose, constraints)",
  "sampleResponse": "TODO: Model email response",
  "keyPoints": [
    "TODO: Scoring point 1",
    "TODO: Scoring point 2"
  ]
}
TMPL
      ;;

    toefl/writing/discussion)
      cat << 'TMPL'
{
  "topic": "TODO: Discussion topic",
  "prompt": "TODO: Prompt (e.g., Do you agree or disagree? Give reasons.)",
  "sampleResponse": "TODO: Model response (about 150-200 words)",
  "keyPoints": [
    "TODO: Scoring point 1",
    "TODO: Scoring point 2"
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
      "text": "TODO: Sentence to read aloud",
      "phonetic": "TODO: Pronunciation hint (optional)"
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
      "question": "TODO: Interview question",
      "prepTime": 15,
      "responseTime": 45,
      "sampleAnswer": "TODO: Model answer (optional)"
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
        "A": "TODO: Choice A",
        "B": "TODO: Choice B",
        "C": "TODO: Choice C",
        "D": "TODO: Choice D"
      },
      "correct": "A",
      "explanation": "TODO: Explanation",
      "focus": "verb tense/form"
    }
  ]
}
TMPL
      ;;

    toeic/part6)
      cat << 'TMPL'
{
  "passage": "TODO: Passage with blanks (includes 4 blank positions)",
  "questions": [
    {
      "id": "q1",
      "blankNumber": 1,
      "options": {
        "A": "TODO: Choice A",
        "B": "TODO: Choice B",
        "C": "TODO: Choice C",
        "D": "TODO: Choice D"
      },
      "correct": "A",
      "explanation": "TODO: Explanation"
    }
  ]
}
TMPL
      ;;

    toeic/part7)
      cat << 'TMPL'
{
  "passage": "TODO: Reading passage (email, ad, article, etc.)",
  "questions": [
    {
      "id": "q1",
      "stem": "TODO: Question stem",
      "options": {
        "A": "TODO: Choice A",
        "B": "TODO: Choice B",
        "C": "TODO: Choice C",
        "D": "TODO: Choice D"
      },
      "correct": "A",
      "explanation": "TODO: Explanation"
    }
  ]
}
TMPL
      ;;

    *)
      echo "Error: Unknown task '${task}'" >&2
      usage
      ;;
  esac
}

# Write template file
generate_template "$TASK" > "$OUTFILE"
echo "Created: $OUTFILE"

# Update index.json (create if missing)
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

print(f"Updated index.json: {files}")
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

print(f"Created new index.json: {[new_file]}")
PYEOF
fi

echo ""
echo "Next steps:"
echo "  1. Edit $OUTFILE and replace TODO values with real question content"
echo "  2. Run npm run dev and verify the app behavior"
