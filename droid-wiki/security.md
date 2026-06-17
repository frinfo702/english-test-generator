# Security

## User Authentication

The application has **no user authentication**. It is a fully client-side app that runs entirely in the browser. There is no login, no session management, and no user accounts. All data is local to the browser.

## Data Storage

**All data is stored in browser `localStorage`.** There is no server-side database or persistent backend storage.

Stored data includes:

- **`score-history`**: Attempt records (`ScoreEntry` objects) with task ID, date, score, and elapsed time
- **`answer-history`**: Submitted answer text with timestamps
- **`answer-draft:*`**: In-progress draft text for writing tasks

This data never leaves the browser. There is no server-side storage, no telemetry, and no analytics.

## CORS Configuration

The Cloudflare Pages Function at [`functions/api/transcribe.ts`](/functions/api/transcribe.ts) includes CORS headers on all responses:

```typescript
function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
```

The `Access-Control-Allow-Origin: *` policy is permissive because this is a static app deployed to a custom domain with no authentication. The only API endpoint is the transcription function, which accepts POST requests with audio data.

## Input Validation

### Audio File Size Limits

The transcription API validates audio file size at two levels:

1. **Content-Length header check**: If the `Content-Length` header exceeds 25 MB, the request is rejected with HTTP 413.
2. **Blob size check**: After parsing the form data, if the audio blob is empty or missing, HTTP 400 is returned.

```typescript
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB
```

### Content-Type

The API only accepts `multipart/form-data` POST requests. No other content types are processed.

## API Token Usage

The Cloudflare API token (`CF_API_TOKEN`) is used **only** in CI/CD:

- GitHub Actions workflow for deployment
- Never exposed to the browser or client code
- Stored as a GitHub Actions secret

The token requires the minimum necessary scope: `Cloudflare Pages > Edit` for the specific project.

## Dependencies

All dependencies are installed via `npm ci` with a lockfile (`package-lock.json`), ensuring deterministic installs. The dependency tree is auditable via standard npm audit workflows.

## Threat Model

Since this is a purely client-side application with no authentication, no user data leaves the browser, and the only server endpoint is a stateless transcription proxy, the attack surface is minimal:

| Threat                         | Mitigation                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| XSS via question JSON          | Question files are JSON fetched from the same origin. No user-supplied content is rendered as HTML.  |
| localStorage data exfiltration | No third-party scripts are loaded. No analytics or tracking.                                         |
| Audio file upload abuse        | 25 MB size limit enforced server-side.                                                               |
| CORS abuse                     | Since there's no authentication, the permissive CORS policy does not expose any protected resources. |
| Dependency vulnerabilities     | Lockfile ensures reproducible installs. Dependencies are auditable.                                  |
