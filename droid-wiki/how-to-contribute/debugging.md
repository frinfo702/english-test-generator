# Debugging

## Dev Server Issues

### "concurrently" not found or dev fails to start

```bash
npm ci
npm run dev
```

The `dev` script runs Vite and Wrangler in parallel. If one fails, both stop. Check which process errored by running them separately:

```bash
# Vite only
npm run dev:vite

# Wrangler only
npm run dev:worker
```

### Vite starts but Wrangler fails

Wrangler requires a valid `wrangler.jsonc` and `nodejs_compat` flag. Ensure the compatibility date in `wrangler.jsonc` is current. The dev worker is used only for the `/api/transcribe` endpoint — if you don't need audio transcription, you can run just `npm run dev:vite`.

### CORS / proxy errors

The Vite config proxies `/api/transcribe` to `http://localhost:8788`. If Wrangler runs on a different port, update the proxy target in `vite.config.ts`.

## Build Errors

### TypeScript errors

```bash
npm run build
```

The build runs `tsc -b` before `vite build`. Fix all type errors first. Common issues:

- Missing type imports (`verbatimModuleSyntax` requires `type` keyword for type-only imports).
- Unused variables (strict mode with `noUnusedLocals` and `noUnusedParameters`).

### Vite build fails

Check the terminal output for the specific error. Common causes:

- Missing CSS module imports (a `.module.css` file that doesn't exist).
- Circular imports in hooks or utilities.

## Test Failures

### Tests pass locally but fail in CI

- CI uses Node.js 22 (matching your local version if you use 22+).
- The `jsdom` environment may behave differently from a real browser. Check for APIs not supported by jsdom (e.g., `window.navigator.mediaDevices`).
- File system access in tests — CI has no `public/questions/` directory mounted in the test runner context. Mock file loading calls.

### Flaky tests

Tests involving timers (`useTimer`, `useElapsedTimer`) use `vi.useFakeTimers()`. Ensure `vi.useRealTimers()` is called in `afterEach` to avoid leaking fake timers across tests.

## Audio / Transcription Debugging

### Audio files don't play

1. Check that audio MP3 files exist in `public/audio/`. Run `npm run generate-audio` to generate them (requires `XAI_API_KEY` in `.env.local`).
2. Check browser console for media errors — CORS or mime-type issues.

### Transcription fails

1. Ensure Wrangler is running: `npm run dev:worker`.
2. Check the Cloudflare Functions logs — `functions/api/transcribe.ts` calls Workers AI Whisper.
3. Verify the `AI` binding is configured in `wrangler.jsonc`.
4. In production, check the Cloudflare dashboard for function invocation logs.

### Speech recognition not working

- The `useSpeechRecognition` hook requires a secure context (`https` or `localhost`).
- Check browser permissions for microphone access.
- If the hook returns `"not-supported"`, the browser lacks SpeechRecognition API (use Chrome).

## localStorage Issues

- Scores and answer history persist in `localStorage`. Clear them via DevTools → Application → Local Storage → `http://localhost:5173`.
- If the UI shows stale data, the persistence schema may have changed. Check `src/lib/answerSubmission.ts` and `src/hooks/useScoreHistory.ts` for storage keys.

## Common Mistakes

| Problem                               | Likely cause                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Question doesn't load                 | JSON file missing from `public/questions/` or malformed. Check browser console for 404 or parse error. |
| Wrong question count in menu          | `index.json` file list is out of sync with actual question files in the directory.                     |
| CSS class not applied                 | CSS Module import name mismatch in the component. Class names are camelCase in `.module.css`.          |
| Navigation broken                     | Route path mismatch between `src/App.tsx` and the `<Link>` or `useNavigate` call.                      |
| Build fails with "cannot find module" | Import path is wrong — this project avoids barrel files, import directly from the source file.         |
