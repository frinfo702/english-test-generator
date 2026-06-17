# How to Contribute

This project is an open-source English test prep app for TOEFL iBT 2026 and TOEIC L&R. Contributions are welcome — whether fixing bugs, adding question content, or improving the UI.

## What You Can Work On

- **Question content** — add or edit JSON question files in `public/questions/`. See `public/questions/README.md` for schema details.
- **Bug fixes** — check the issue tracker or open a PR with a fix.
- **UI improvements** — the design system is documented in `DESIGN.md`. All components use CSS Modules with design tokens from `src/styles/variables.css`.
- **New task types** — add a new page component under `src/pages/<section>/`, wire it into the router in `src/App.tsx`, and add sample question JSONs.
- **Tests** — increase coverage. See [testing.md](testing.md) for conventions.

## PR Process

1. Create a feature branch from `main`.
2. Make your changes, following the conventions in [patterns-and-conventions.md](patterns-and-conventions.md).
3. Run `npm test` to ensure all tests pass.
4. Run `npm run lint` to check for ESLint issues.
5. Submit a pull request targeting `main`.
6. CI runs tests automatically. The PR is merged after review.

## Expectations

- No CLA or formal process — just open a PR.
- Keep changes focused. A PR should address one concern.
- Write tests for new logic (hooks, utilities, page components).
- Follow the existing code style — the linter and Prettier enforce most of it automatically.
- Questions about the design or architecture can be filed as GitHub issues.

## Related Docs

- [Development Workflow](development-workflow.md)
- [Testing](testing.md)
- [Debugging](debugging.md)
- [Tooling](tooling.md)
- [Patterns and Conventions](patterns-and-conventions.md)
