# Configuration

## vite.config.ts

File: [`vite.config.ts`](/vite.config.ts)

Vite configuration for the React/TypeScript build. Uses the `@vitejs/plugin-react` plugin for JSX transform and React Fast Refresh.

In development mode, the dev server proxies `/api/transcribe` requests to the local Wrangler Pages dev server at `http://localhost:8788`. This lets the frontend reach the Cloudflare Pages Function (for Whisper transcription) from the same origin during local development.

```ts
server: {
  proxy: {
    "/api/transcribe": "http://localhost:8788",
  },
},
```

## wrangler.jsonc

File: [`wrangler.jsonc`](/wrangler.jsonc)

Cloudflare Pages project configuration for the `english-test-app` worker.

Key settings:

- **compatibility_flags**: `["nodejs_compat"]` — enables Node.js compatibility for the Pages Function
- **pages_build_output_dir**: `"dist"` — Vite builds to this directory, which Wrangler deploys
- **ai binding**: `AI` — binds a Workers AI resource so the transcription Pages Function can call the Whisper model (`@cf/openai/whisper`)
- **observability**: enabled with full head sampling rate — logs all function invocations

## tsconfig.json

File: [`tsconfig.json`](/tsconfig.json)

Top-level TypeScript project references file. Delegates to two sub-configs:

- **`tsconfig.app.json`** — Used for `src/` source code. Targets `ES2022`, uses `bundler` module resolution, enables strict mode with `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, and `erasableSyntaxOnly`. Includes `vite/client` types.
- **`tsconfig.node.json`** — Used for `vite.config.ts`. Targets `ES2023`, includes `node` types.

## eslint.config.js

File: [`eslint.config.js`](/eslint.config.js)

Flat ESLint configuration (ESLint v9 format). Extends:

- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `eslint-plugin-react-hooks` recommended rules
- `eslint-plugin-react-refresh` Vite integration (warns on Fast Refresh compatibility issues)

Ignores the `dist/` output directory. Targets browser globals for source files.

## package.json

File: [`package.json`](/package.json)

### Scripts

| Script           | Command                         | Description                                                              |
| ---------------- | ------------------------------- | ------------------------------------------------------------------------ |
| `dev`            | `concurrently ...`              | Starts both Wrangler Pages dev server and Vite dev server simultaneously |
| `dev:vite`       | `vite`                          | Starts Vite dev server only (no transcription API)                       |
| `dev:worker`     | `wrangler pages dev`            | Starts Wrangler Pages dev server only                                    |
| `build`          | `tsc -b && vite build`          | Type-check then build for production                                     |
| `lint`           | `eslint .`                      | Run ESLint on all source files                                           |
| `preview`        | `vite preview`                  | Preview the production build locally                                     |
| `test`           | `vitest run`                    | Run all tests                                                            |
| `format`         | `prettier --write .`            | Format all files with Prettier                                           |
| `generate-audio` | `tsx scripts/generate-audio.ts` | Generate MP3 audio files for listening tasks                             |
| `pages:dev`      | `wrangler pages dev dist`       | Serve the built output locally with Wrangler                             |
| `pages:deploy`   | `wrangler pages deploy dist`    | Deploy to Cloudflare Pages                                               |

### Dependencies

See [Dependencies](dependencies.md) for the full list.
