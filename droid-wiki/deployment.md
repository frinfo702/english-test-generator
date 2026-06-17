# Deployment

## Cloudflare Pages

The app is deployed to Cloudflare Pages at `english-test-app`. Deployment is fully automated via GitHub Actions on pushes to the `main` branch.

### GitHub Actions Workflow

File: [`.github/workflows/deploy.yml`](/.github/workflows/deploy.yml)

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - run: npx wrangler pages deploy dist --project-name english-test-generator
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

The workflow:

1. Checks out the repository
2. Sets up Node.js 22
3. Installs dependencies (`npm ci`)
4. Runs the production build (`npm run build` which runs `tsc -b && vite build`)
5. Deploys the `dist/` directory to Cloudflare Pages

### Prerequisites

- Cloudflare account with Pages enabled
- A Cloudflare API token with Pages write permission stored as `CF_API_TOKEN` in GitHub repository secrets
- Cloudflare project name must match `english-test-generator` (or update the `--project-name` flag)

### wrangler.jsonc Configuration

File: [`wrangler.jsonc`](/wrangler.jsonc)

The Wrangler configuration specifies:

- **AI binding**: The `AI` binding is required for the transcription Pages Function. It must be configured in the Cloudflare dashboard under Workers & Pages > your project > Settings > Bindings.
- **compatibility_flags**: `nodejs_compat` enables Node.js APIs in the Workers runtime.
- **observability**: Enabled for logging function invocations.

## Environment Setup

### API Token

The `CLOUDFLARE_API_TOKEN` environment variable (or `CF_API_TOKEN` in GitHub secrets) must have:

- Permission: `Cloudflare Pages > Edit`
- Scope: The specific Pages project or account-wide

### AI Binding

The Workers AI binding named `AI` must be added to the Cloudflare Pages project:

1. Go to Cloudflare Dashboard > Workers & Pages > `english-test-generator`
2. Settings > Bindings > Add binding
3. Type: `Workers AI`, Name: `AI`

## Local Preview

To preview the production build locally:

```bash
npm run build
npm run pages:dev
```

This serves the `dist/` directory with Wrangler, including the Pages Function at `/api/transcribe`. The AI binding is not available locally unless configured with a local Cloudflare token. Audio features that require transcription will fail locally without the binding.

To preview just the frontend (no API):

```bash
npm run build
npm run preview
```

## Manual Deployment

```bash
npm run build
npx wrangler pages deploy dist --project-name english-test-generator
```

Requires `CLOUDFLARE_API_TOKEN` to be set in the environment (or `wrangler login` to be configured).
