# Audio / TTS System

Two subsystems: **runtime playback** (browser-based audio rendering in `src/hooks/useTts.ts`) and **offline TTS generation** (an external script that calls a TTS API to produce MP3 files in `scripts/generate-audio.ts`).

## Runtime playback (`useTts` hook)

Provides an `AudioContext`-based player capable of single file playback, multi-segment concatenation, and segment playback with configurable silence gaps. Supports speed control (0.5x–1.5x) and real-time progress tracking.

### Key abstractions

**Return interface** (`UseTtsReturn`):

| Property/Method                    | Description                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| `playing`                          | Boolean, true during playback                                  |
| `loading`                          | Boolean, true while fetching/decoding audio                    |
| `error`                            | Error message or null                                          |
| `currentTime`                      | Current playback position in seconds                           |
| `duration`                         | Total duration in seconds                                      |
| `playbackRate`                     | Current speed multiplier (0.5–1.5)                             |
| `setPlaybackRate(rate)`            | Change playback speed                                          |
| `play(url, onEnded?)`              | Play a single audio file from URL                              |
| `playSegments(urls, onEnded?)`     | Fetch, decode, concatenate, and play multiple segments         |
| `playSegmentsWithGaps(urls, gaps)` | Same as playSegments but inserts silence gaps between segments |
| `pause()` / `resume()`             | Pause and resume playback                                      |
| `stop()`                           | Stop and clean up                                              |
| `seek(time)`                       | Seek to a position                                             |

### How it works

```mermaid
flowchart LR
    subgraph Input
        URL[Audio URL(s)]
    end
    subgraph Processing
        Fetch[fetch + decode]
        Concat[concatenate AudioBuffers]
        Wav[encode to WAV Blob]
        ObjURL[createObjectURL]
    end
    subgraph Output
        AudioEl[HTMLAudioElement]
        RAF[requestAnimationFrame tick]
    end

    URL --> Fetch
    Fetch --> Concat
    Concat --> Wav
    Wav --> ObjURL
    ObjURL --> AudioEl
    AudioEl --> RAF
```

1. **Single play**: `play(url)` fetches the file, creates a Blob URL, and plays it via an `<Audio>` element.
2. **Segment concatenation**: `playSegments(urls)` fetches all segments, decodes them to `AudioBuffer` via `AudioContext.decodeAudioData`, concatenates them in memory, re-encodes as a single WAV Blob, and plays the result.
3. **With gaps**: `playSegmentsWithGaps(urls, gaps)` inserts `AudioBuffer`-length silence buffers between segments before concatenation.
4. **Playback tracking**: a `requestAnimationFrame` loop polls `audio.currentTime` and `audio.duration` while playing.
5. **Speed control**: `audio.playbackRate` is set on the `<Audio>` element, clamped to 1.5x maximum.
6. **Cleanup**: on stop or completion, the Blob URL is revoked and the audio element is destroyed to free Safari's audio session before speech recognition starts.

### Shared AudioContext

A module-level `AudioContext` singleton (`sharedAudioCtx`) is reused across calls. If the context is suspended (browser autoplay policy), it is resumed automatically before decoding.

## Offline TTS generation (`scripts/generate-audio.ts`)

A Node.js script that reads question JSON files, calls a TTS API (xAI API / ElevenLabs-compatible), and saves MP3 files to `public/audio/`.

### How it works

1. Walks all `.json` files under `public/questions/` (skipping `index.json`).
2. For each file, checks two structures:
   - **`audioSegments`** — array of `{ role: string, text: string }`. Each segment is assigned a voice based on its role using a deterministic hash. Voices cycle through `["ara", "eve", "leo", "rex", "sal"]` with per-role consistency.
   - **`sentences`** — array of `{ text: string }`. Each sentence gets a random-rotation voice.
3. Before calling the API, checks a local disk cache (`public/audio-cache/` keyed by `sha256(voiceId + ":" + text)`). Cache hits skip the API call.
4. Existing output files are also skipped (idempotent re-runs).
5. Output path: `public/audio/{taskPath}/{filename}/{N}.mp3` where N is the 1-based segment index.

### Role-to-voice mapping

Defined in `src/lib/voiceMapping.ts`, used both at generation time (via deterministic hash) and as a reference for the frontend:

| Role        | Voice ID |
| ----------- | -------- |
| `Student`   | `eve`    |
| `Professor` | `leo`    |
| `Lecturer`  | `rex`    |
| `Woman`     | `eve`    |
| `Man`       | `leo`    |
| `Speaker`   | `rex`    |
| `Narrator`  | `ara`    |
| (default)   | `ara`    |

## Speed control UI

The `SpeedControl` component (`src/components/ui/SpeedControl.tsx`) presents three preset buttons (Slow 0.8x, Normal 1.0x, Fast 1.2x) and an optional slider (0.5–1.5). It is rendered inside listening task pages and the Listen and Repeat speaking task.

## Integration points

- **Listening tasks** (Conversation, Lecture, Announcement, Response) call `playSegmentsWithGaps` to play audio segments with natural pauses.
- **Listen and Repeat** uses `play` for each sentence audio followed by recording.
- **Take Interview** uses `playSegments` for question audio.
- **TOEIC Parts 2-4** use `playSegments` for question-and-option audio with per-segment speakers.
- **Shadowing** uses `playSegments` for model audio playback.
- The playback manager in listening pages coordinates TTS with question state (autoplay, replay, auto-advance).

## Entry points for modification

- **Add new playback mode**: add a method to `useTts` (e.g., `playWithLoop`) and wire it in the hook.
- **Change TTS provider**: update `scripts/generate-audio.ts` to call a different API. Update the API URL, auth, and response parsing.
- **Add voice roles**: update the `ROLE_VOICE_MAP` in `src/lib/voiceMapping.ts` and the voice pool in `scripts/generate-audio.ts`.
- **Change speed limits**: update the clamp in `useTts.ts` `setPlaybackRate` and the min/max props on `SpeedControl`.

Key source files:

| File                                 | Purpose                                                     |
| ------------------------------------ | ----------------------------------------------------------- |
| `src/hooks/useTts.ts`                | Runtime audio playback with concatenation and speed control |
| `src/lib/voiceMapping.ts`            | Role-to-voice ID mapping                                    |
| `src/components/ui/SpeedControl.tsx` | Playback speed UI (presets + slider)                        |
| `scripts/generate-audio.ts`          | Offline TTS generation script                               |
| `src/hooks/usePlaybackManager.ts`    | (Listening pages) coordinates TTS with question sequencing  |
