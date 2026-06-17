# Patterns and conventions

## Code organization

- Source files live in `src/` organized by role: `pages/`, `components/`, `hooks/`, `lib/`, `styles/`, `store/`
- Page components for each task sit under `src/pages/toefl/` (by section) or `src/pages/toeic/` (by part)
- Shared UI components are in `src/components/ui/`, layout in `src/components/layout/`, question-specific in `src/components/question/`
- Test files use the `*.test.ts` or `*.test.tsx` naming convention and sit alongside the file they test

## Naming

- **Files** — PascalCase for components (`CompleteWordsPage.tsx`), camelCase for utilities (`answerSubmission.ts`)
- **CSS Modules** — named after their component with `.module.css` extension (`Button.module.css`)
- **Exports** — use named exports for components and functions; default export only for `App.tsx`
- **Task IDs** — slash-separated paths matching the route structure (e.g., `toefl/reading/complete-words`)

## State management

- **Zustand** is declared as a dependency in `package.json` but the `store/` directory is currently empty
- Most state is managed via React hooks with `useState`/`useCallback`/`useEffect`
- Persistent data uses `localStorage` directly through read/write helper functions in `src/lib/answerSubmission.ts` and `src/hooks/useScoreHistory.ts`

## CSS conventions

- **CSS Modules** with camelCase class names imported into components
- Design tokens defined as CSS custom properties in `src/styles/variables.css`
- Global resets in `src/styles/global.css`
- Components avoid inline styles — all styling goes in `.module.css` files
- Color tokens follow the design system: `--color-ink`, `--color-accent`, `--color-surface-*`, etc.

## TypeScript usage

- `strict` mode enabled
- No `any` types in new code — prefer `unknown` and type guards
- Interfaces for data models prefixed with no convention; types for union types
- React components use `React.FC` or explicit `interface Props` + function declaration

## Error handling

- Question loading uses try/catch with user-facing error messages
- Async operations in hooks set `error` state strings that pages render conditionally
- Audio transcription errors are surfaced through hook state and displayed in the UI

## Imports

- Avoid barrel files (`index.ts`) — import directly from the source file
- Relative imports within the `src/` tree
- CSS Modules imported as `styles` or a descriptive name

## Development workflow

- Feature branches merged to `main` via pull requests
- CI runs tests on every push via GitHub Actions
- Deployments to Cloudflare Pages happen automatically on pushes to `main`
