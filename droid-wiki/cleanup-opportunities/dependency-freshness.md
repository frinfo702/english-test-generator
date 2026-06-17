# Dependency Freshness

## Runtime Dependencies

| Package            | Version | Notes                                            |
| ------------------ | ------- | ------------------------------------------------ |
| `react`            | ^19.2.0 | Latest React 19 stable. Current as of June 2026. |
| `react-dom`        | ^19.2.0 | Matches React version. Current.                  |
| `react-router-dom` | ^7.13.0 | React Router v7. Current.                        |
| `zustand`          | ^5.0.11 | State management library. Current major version. |

## Development Dependencies

| Package                     | Version       | Notes                                |
| --------------------------- | ------------- | ------------------------------------ |
| `@cloudflare/workers-types` | ^4.20260613.1 | Matches compatibility date. Fresh.   |
| `@vitejs/plugin-react`      | ^5.1.1        | Matches Vite 7. Current.             |
| `typescript`                | ~5.9.3        | TypeScript 5.9. Current stable.      |
| `vite`                      | ^7.3.1        | Vite 7. Current major version.       |
| `vitest`                    | ^3.2.4        | Vitest 3. Current.                   |
| `wrangler`                  | ^4.100.0      | Wrangler 4. Current major version.   |
| `eslint`                    | ^9.39.1       | ESLint v9 with flat config. Current. |
| `typescript-eslint`         | ^8.48.0       | Current major version.               |
| `@testing-library/react`    | ^16.3.0       | Current major version.               |
| `jsdom`                     | ^27.2.0       | Current major version.               |
| `tsx`                       | ^4.19.0       | Current major version.               |
| `concurrently`              | ^10.0.3       | Current major version.               |
| `dotenv`                    | ^17.4.2       | Current major version.               |
| `globals`                   | ^16.5.0       | Current major version.               |

## Analysis

**All dependencies are on their latest major versions** as of June 2026. There are no outdated or deprecated packages. The project uses modern tooling:

- Vite 7 with the corresponding React plugin
- TypeScript 5.9 with `erasableSyntaxOnly` (new in 5.8+)
- ESLint 9 with flat config (the modern ESLint configuration format)
- Wrangler 4 (latest for Cloudflare Workers/Pages)
- React Router 7 (latest with support for both SPA and framework modes)

## Potential Concerns

- **No version pinning**: The `^` and `~` ranges allow automatic minor/patch updates. This is standard for most projects but could theoretically introduce breaking changes if a dependency violates semver. The lockfile (`package-lock.json`) ensures deterministic installs across environments.
- **No audit findings**: Run `npm audit` periodically to check for vulnerabilities. Not included in CI currently (the test workflow runs tests but not audit).

## Recommendations

1. Consider adding `npm audit` to the CI pipeline
2. Use Dependabot or Renovate for automated dependency update PRs (not configured)
3. Monitor the migration from `react-router-dom` v7 to any future breaking changes (v7 is a major rewrite)
