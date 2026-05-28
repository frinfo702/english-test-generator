#!/usr/bin/env python3
"""
Generate a correct JSON template for TOEFL Reading tasks.

Usage:
    python3 generate-template.py <task>

Available tasks:
    complete-words
    daily-life
    academic

Example:
    python3 generate-template.py daily-life
"""

import json
import sys
import os
from pathlib import Path


TEMPLATES = {
    "complete-words": {
        "paragraph": "TODO: Write a paragraph with blanks. Use hint+underscores placeholders (e.g., pho_________).",
        "items": [
            {
                "index": 0,
                "hint": "abc",
                "answer": "TODO: Correct word",
                "placeholder": "abc____",
            }
        ],
    },
    "daily-life": {
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
                            "D. Choice D",
                        ],
                        "correctIndex": 0,
                        "type": "factual",
                        "explanation": "TODO: Explanation",
                    }
                ],
            }
        ]
    },
    "academic": {
        "passage": "TODO: Add an academic English passage (around 300-500 words)",
        "questions": [
            {
                "id": "q1",
                "stem": "TODO: Question stem",
                "options": [
                    "A. Choice A",
                    "B. Choice B",
                    "C. Choice C",
                    "D. Choice D",
                ],
                "correctIndex": 0,
                "type": "factual",
                "explanation": "TODO: Explanation",
            }
        ],
    },
}


def get_next_filename(target_dir: Path) -> str:
    """Detect max existing number and return next filename like 001.json."""
    max_num = 0
    for f in target_dir.glob("[0-9][0-9][0-9].json"):
        num = int(f.stem)
        if num > max_num:
            max_num = num
    return f"{max_num + 1:03d}.json"


def update_index(index_file: Path, new_file: str) -> None:
    """Add new_file to index.json, creating it if missing."""
    if index_file.exists():
        with open(index_file, "r", encoding="utf-8") as f:
            idx = json.load(f)
    else:
        idx = {"files": []}

    files = idx.get("files", [])
    if new_file not in files:
        files.append(new_file)
        files.sort()

    idx["files"] = files
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(idx, f, indent=2, ensure_ascii=False)
        f.write("\n")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python3 generate-template.py <task>")
        print("")
        print("Available tasks:")
        print("  complete-words")
        print("  daily-life")
        print("  academic")
        return 1

    task = sys.argv[1]
    if task not in TEMPLATES:
        print(f"Error: Unknown task '{task}'")
        return 1

    # Resolve paths relative to project root (two levels up from this script)
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent.parent.parent.parent
    target_dir = project_root / "public" / "questions" / "toefl" / "reading" / task
    target_dir.mkdir(parents=True, exist_ok=True)

    filename = get_next_filename(target_dir)
    outfile = target_dir / filename
    index_file = target_dir / "index.json"

    template = TEMPLATES[task]
    with open(outfile, "w", encoding="utf-8") as f:
        json.dump(template, f, indent=2, ensure_ascii=False)
        f.write("\n")

    update_index(index_file, filename)

    print(f"Created: {outfile}")
    print(f"Updated: {index_file}")
    print("")
    print("Next steps:")
    print(f"  1. Edit {outfile} and replace TODO values with real question content")
    print("  2. Run npm run dev and verify the app behavior")
    return 0


if __name__ == "__main__":
    sys.exit(main())
