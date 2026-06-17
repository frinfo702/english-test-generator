# Testing

## Framework

Tests use **Vitest** (v3.2.4) with **jsdom** as the DOM environment for component tests.

Configuration lives in `vitest.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
  },
});
```

## Running Tests

```bash
# Run all tests once
npm test            # vitest run

# Watch mode
npx vitest          # vitest (no args = watch)

# Specific file
npx vitest src/lib/questions.test.ts

# With coverage (not yet configured — add if needed)
npx vitest --coverage
```

## Test File Conventions

- Test files sit **alongside** the file they test.
- Naming: `*.test.ts` for logic, `*.test.tsx` for components.
- Examples:
  - `src/lib/questions.ts` → `src/lib/questions.test.ts`
  - `src/hooks/useTimer.ts` → `src/hooks/useTimer.test.ts`
  - `src/components/ui/ui-components.tsx` → `src/components/ui/ui-components.test.tsx`

## What to Test

- **Utility functions** (`src/lib/`) — pure logic with predictable inputs/outputs.
- **Hooks** (`src/hooks/`) — state transitions, async loading, edge cases.
- **Components** (`src/components/`, `src/pages/`) — rendering, user interactions, conditional states.
- **Page-level** — route loading, question display, answer submission flows.

## Patterns

### Testing hooks

Hooks are tested via `renderHook` from `@testing-library/react`. Example from `useTimer.test.ts`:

```ts
import { renderHook, act } from "@testing-library/react";
import { useTimer } from "./useTimer";

it("counts down from the initial value", () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useTimer(10));
  expect(result.current.timeLeft).toBe(10);
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.timeLeft).toBe(9);
});
```

### Testing components

Components use `render` from `@testing-library/react`. Example from a UI component test:

```ts
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("calls onClick when clicked", async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click</Button>);
  await userEvent.click(screen.getByText("Click"));
  expect(onClick).toHaveBeenCalledOnce();
});
```

### Testing async data loading

Mock the fetch calls or module imports. Example from `useQuestion.test.ts`:

```ts
vi.mock("../lib/questions", () => ({
  fetchQuestion: vi.fn().mockResolvedValue({ id: "001", ... }),
}));
```

### Mocking browser APIs

For `localStorage`, use `vi.stubGlobal` or a simple object mock. For speech recognition and TTS, mock the relevant browser interfaces at the top of the test file using `vi.fn()`.

## CI Integration

Tests run automatically on every push and pull request via `.github/workflows/test.yml`:

```yaml
- run: npm ci
- run: npm test
```

All tests must pass before a PR can be merged.

## Current Coverage (June 2026)

19 test files covering:

- All utility modules in `src/lib/`
- All hooks in `src/hooks/`
- Key UI components (layout, buttons, question selector)
- TOEFL Reading (Complete Words), TOEFL Listening, TOEFL Speaking (Listen & Repeat)
- TOEIC Listening wrappers
