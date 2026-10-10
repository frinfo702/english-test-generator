#!/usr/bin/env bash
# redesign-video.sh - Rebuild public/updates/redesign.mp4 and its poster
#
# Usage:
#   npx vite --port 5391 &          # any running dev or preview server
#   ./scripts/redesign-video.sh [base-url] [work-dir]
#
# Captures the real app with chrome-devtools-axi (desktop 1280x720 and phone
# 390x844), then cuts the shots together with ffmpeg: caption chips set in
# Geist Mono, 0.5s crossfades, H.264 with no audio. Needs ffmpeg built with
# drawtext and the Geist fonts installed (FONT_DIR, default ~/Library/Fonts).
# The browser session is isolated and stopped at the end, so each run starts
# with empty history and the dashboard shows only this run's reading set.
set -euo pipefail

BASE="${1:-http://localhost:5391}"
WORK="${2:-$(mktemp -d)}"
FONT_DIR="${FONT_DIR:-$HOME/Library/Fonts}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/updates"
export CHROME_DEVTOOLS_AXI_SESSION="${CHROME_DEVTOOLS_AXI_SESSION:-redesign-video}"
mkdir -p "$WORK" "$OUT"

axi() { chrome-devtools-axi "$@" >/dev/null; }
js() { axi eval "() => { $1; return 1 }"; }
go() {
  js "location.hash = '#$1'"
  sleep 1.5
  # Keep the hamster, hide its speech bubble.
  js "document.querySelector('[aria-label=\"Dismiss update\"]')?.click()"
  sleep 0.3
}
theme() {
  js "localStorage.setItem('etp-theme', '$1'); location.reload()"
  sleep 2
}
shot() { axi screenshot "$WORK/$1.png" "${@:2}"; }
pick() { # click option N (0 = A) of the visible question
  js "[...document.querySelectorAll('main button')].filter(b => /^[A-D][A-Z]/.test(b.textContent.trim()))[$1].click()"
  sleep 0.4
}

# ---- Capture ----

axi open "$BASE/"
axi resize 1280 720
theme light

go /
shot home --full-page
go /toefl
shot menu
go /toefl/writing/build-sentence/20261007-apartment-search
shot build
go /toefl/reading/academic/20261007-default-effect
pick 1
shot question
# The rest of the set, answered with the file's correctIndex values.
for i in 2 3 0 1; do
  js "[...document.querySelectorAll('main button')].find(b => b.textContent.trim() === 'Next').click()"
  sleep 0.5
  pick $i
done
js "[...document.querySelectorAll('main button')].find(b => b.textContent.trim() === 'Submit').click()"
sleep 1.5
shot score
go /dashboard
shot dashboard

axi emulate --viewport "390x844x2,mobile,touch"
go /
shot phone-home
go /toefl
shot phone-menu
go /toefl/reading/academic/20261007-default-effect
shot phone-question

axi emulate --viewport "1280x720x1"
theme dark
go /
shot dark
axi stop

# ---- Render ----

PAPER=0xf4f3ef INK=0x131312 STAGE=0x2f2e73 LIME=0xeef59a SIGNAL=0xfa500f
MONO="$FONT_DIR/GeistMono-Medium.ttf"
SANS="$FONT_DIR/Geist-Medium.ttf"
FPS=30 XF=0.5

# Ink chip in the bottom-left corner, like the app's mono eyebrows.
chip() {
  echo "drawtext=fontfile=$MONO:text='$1':fontsize=17:fontcolor=white:x=40:y=h-64:box=1:boxcolor=$INK:boxborderw=12"
}

segs=() durs=()
seg() { # name duration input-args filter
  local name=$1 dur=$2
  ffmpeg -loglevel error -y "${@:3:$#-3}" -t "$dur" -r $FPS \
    -filter_complex "${*: -1},format=yuv420p" -c:v libx264 -crf 18 "$WORK/seg-$name.mp4"
  segs+=("$WORK/seg-$name.mp4") durs+=("$dur")
}
still() { seg "$1" "$2" -loop 1 -i "$WORK/$1.png" "scale=1280:720,$(chip "$3")"; }

seg intro 3 -f lavfi -i "color=$PAPER:s=1280x720" \
  "drawbox=x=120:y=262:w=10:h=10:color=$SIGNAL:t=fill,\
drawtext=fontfile=$MONO:text='UPDATE · 10 OCTOBER 2026':fontsize=18:fontcolor=$INK:x=142:y=258,\
drawtext=fontfile=$SANS:text='Field Notes':fontsize=120:fontcolor=$INK:x=114:y=300,\
drawtext=fontfile=$SANS:text='English Test Practice has a new look.':fontsize=34:fontcolor=0x4d4c47:x=120:y=450"

# Scroll the home page from the hero down to the practice list.
seg home 5 -loop 1 -i "$WORK/home.png" \
  "crop=1280:720:0:'min(max(0,(t-1.2)*150),ih-720)',$(chip 'PAPER, INK AND ONE ORANGE SIGNAL')"
still menu 3.5 'SECTIONS HANG ON HAIRLINE RULES'
still question 3.5 'PASSAGES SET LIKE A PRINTED SHEET'
still build 3 'MONO LABELS, QUIET CONTROLS'
still score 3.5 'SCORES IN BIG GEIST NUMERALS'
still dashboard 3.5 'YOUR STREAK AT A GLANCE'

# Three phones side by side on paper, each with a hairline frame.
seg phones 4 \
  -loop 1 -i "$WORK/phone-home.png" -loop 1 -i "$WORK/phone-menu.png" \
  -loop 1 -i "$WORK/phone-question.png" -f lavfi -i "color=$PAPER:s=1280x720" \
  "[0]scale=-2:580,pad=iw+2:ih+2:1:1:0xbdbab1[a];\
[1]scale=-2:580,pad=iw+2:ih+2:1:1:0xbdbab1[b];\
[2]scale=-2:580,pad=iw+2:ih+2:1:1:0xbdbab1[c];\
[3][a]overlay=(W-3*w-96)/2:44[ab];[ab][b]overlay=(W-w)/2:44[abc];\
[abc][c]overlay=(W+w+96)/2:44,$(chip 'PAGE HEADS WRAP CLEANLY ON PHONES')"
still dark 3 'DARK MODE, SAME NOTEBOOK'

seg outro 3 -f lavfi -i "color=$STAGE:s=1280x720" \
  "drawbox=x=0:y=696:w=1280:h=24:color=$LIME:t=fill,\
drawtext=fontfile=$SANS:text='Same practice. Fresh pages.':fontsize=72:fontcolor=white:x=120:y=290,\
drawtext=fontfile=$MONO:text='OPEN THE APP AND TAKE A LOOK':fontsize=20:fontcolor=$LIME:x=124:y=400"

# Chain crossfades: each transition starts XF before the running total ends.
inputs=() graph="" prev="0:v" offset=0
for i in "${!segs[@]}"; do inputs+=(-i "${segs[$i]}"); done
for ((i = 1; i < ${#segs[@]}; i++)); do
  offset=$(echo "$offset + ${durs[$((i - 1))]} - $XF" | bc)
  graph+="[$prev][$i:v]xfade=transition=fade:duration=$XF:offset=$offset[v$i];"
  prev="v$i"
done

ffmpeg -loglevel error -y "${inputs[@]}" -filter_complex "${graph%;}" -map "[$prev]" \
  -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart \
  "$OUT/redesign.mp4"
ffmpeg -loglevel error -y -ss 1.2 -i "$WORK/seg-intro.mp4" -frames:v 1 -q:v 4 \
  "$OUT/redesign-poster.jpg"
ls -lh "$OUT"/redesign*
