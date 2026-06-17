# English Test Practice

English Test Practice is a browser-based exam prep application for the **TOEFL iBT 2026** format and **TOEIC L&R** exam. It loads AI-generated question files from local JSON and provides an interactive practice environment with audio playback, speech recognition, score tracking, and a performance dashboard.

The app runs entirely in the browser after loading — no sign-up, no backend, and no runtime AI calls. The only exception is the speaking "Listen and Repeat" task, which records audio and sends it to a Cloudflare Pages Function using Workers AI (Whisper) for transcription.

Built with **React 19**, **TypeScript**, **Vite**, and **Cloudflare Pages**.

## Key capabilities

- **TOEFL iBT 2026 practice** across Reading (3 task types), Writing (3), Listening (4), and Speaking (2)
- **TOEIC L&R practice** for Parts 2-7 (Listening and Reading)
- **Shadowing practice** for pronunciation and fluency training
- **Performance dashboard** with KPI cards, per-task charts, and attempt history
- **Speech recognition** using the Web Audio API and Cloudflare Workers AI (Whisper)
- **Text-to-speech** with configurable playback speed for listening tasks
- **Offline-capable** question loading — questions are pre-generated JSON files served from `public/questions/`
