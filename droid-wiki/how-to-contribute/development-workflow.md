# Development Workflow

## Prerequisites

- Node.js 22+
- npm
- A Cloudflare account (for deployment; not needed for local development)
- Optionally, an xAI API key in `.env.local` (for audio generation)

## Branch Strategy

The default branch is `main`. Feature branches are created from `main` and merged back via pull requests.

```
main  ──●────────●────────●────
         \      / \      /
feature   ●────●   ●────●
```

## Local Development

```bash
# Install dependencies
npm ci

# Start the dev server (Vite + Wrangler concurrently)
npm run dev
```

This runs two processes in parallel:

1. **Vite dev server** — serves the React app with HMR at `http://localhost:5173`
2. **Wrangler Pages dev** — runs Cloudflare Functions at `http://localhost:8788`, proxied via Vite's config for `/api/transcribe`

## Code

- Source files live in `src/`. See [patterns-and-conventions.md](patterns-and-conventions.md) for structure.
- Use `src/styles/variables.css` design tokens for styling. Avoid inline styles.
- Component files use `.tsx` extension, utility files use `.ts`.

## Test

```bash
# Run all tests
npm test

# Run tests in watch mode
npx vitest

# Run a single test file
npx vitest src/lib/questions.test.ts
```

All tests must pass before opening a PR. CI enforces this.

## Lint and Format

```bash
# Lint all source files
npm run lint

# Auto-format with Prettier
npm run format
```

## Build

```bash
npm run build
```

This runs `tsc -b` for type-checking then `vite build` to produce the production bundle in `dist/`.

## Submit a PR

1. Push your branch to GitHub.
2. Open a pull request targeting `main`.
3. CI runs `npm test` automatically.
4. After review, the PR is merged.

## Deployment

Deployments are automatic via GitHub Actions:

- On every push to `main`, the `deploy.yml` workflow builds the app and runs `wrangler pages deploy`.
- The live site is served from Cloudflare Pages.
- Manual deploy: `npm run pages:deploy` (requires `CLOUDFLARE_API_TOKEN`).

## Adding Question Content

1. Add a JSON file to the appropriate task directory under `public/questions/`.
2. Update the corresponding `index.json` to include the new file in its file list.
3. Run `npm run generate-audio` if the task uses audio (listening, speaking).
4. Verify it loads correctly in the dev server.
