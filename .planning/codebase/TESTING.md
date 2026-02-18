# Testing Patterns

**Analysis Date:** 2026-02-17

## Test Framework

**Runner:**
- Vitest 4.x
- Config: `vitest.config.ts`
- Environment: jsdom
- Globals: enabled (`describe`, `it`, `expect` available without import, but tests explicitly import them)

**Assertion Library:**
- Vitest built-in `expect`
- `@testing-library/jest-dom` matchers (`.toBeInTheDocument()`, `.toHaveFocus()`, `.toHaveAttribute()`)
- Setup file: `src/test/setup.ts` imports `@testing-library/jest-dom`

**Run Commands:**
```bash
npm test                # vitest (watch mode)
npm run test:run        # vitest run (single pass)
npm run test:ui         # vitest --ui (browser UI)
npm run test:coverage   # vitest run --coverage
```

## Test File Organization

**Location:** Colocated with source files in the same directory.

**Naming:** `*.test.ts` for pure logic, `*.test.tsx` for components/JSX.

**Count:** 11 test files total.

**Directory pattern:**
```
src/
├── App.test.tsx                           # Root component tests
├── integration.test.tsx                   # Cross-component integration tests
├── config/
│   └── timeline-node-config.test.ts       # Config logic tests
├── data/
│   └── timeline-data.test.ts              # Data integrity tests
├── lib/
│   ├── timeline-track-layout.test.ts      # Layout engine tests
│   └── timeline-label-layout.test.ts      # Label layout tests
├── hooks/
│   ├── useViewport.test.ts                # Viewport hook tests
│   ├── usePathTracing.test.ts             # Path tracing hook tests
│   ├── useEntityFilter.test.ts            # Entity filter hook tests
│   └── useModalA11y.test.ts               # Modal a11y hook tests
└── components/
    └── right-rail.test.tsx                # Right rail component tests
```

## Coverage

**Provider:** v8 (via `@vitest/coverage-v8`)

**Thresholds (enforced in `vitest.config.ts`):**
- Statements: 65%
- Branches: 55%
- Functions: 70%
- Lines: 65%

**Well tested:**
- Layout engine (`src/lib/timeline-track-layout.ts`) - exhaustive invariant + regression tests
- Node config (`src/config/timeline-node-config.ts`) - zoom tier boundaries, monotonicity
- Label layout (`src/lib/timeline-label-layout.ts`) - collision detection, lane stacking
- Data integrity (`src/data/timeline-data.ts`) - domain coverage, theme normalization
- Hooks (`src/hooks/useViewport.ts`, `usePathTracing.ts`, `useEntityFilter.ts`, `useModalA11y.ts`)
- A11y behavior (focus trapping, ESC close, ARIA attributes)

**Not tested:**
- `src/components/timeline-nodes.tsx` - no test file
- `src/components/side-navigator.tsx` - no test file
- `src/components/minimap.tsx` - no test file
- `src/components/hover-tooltip.tsx` - no test file
- `src/components/welcome-overlay.tsx` - no test file (tested indirectly via `App.test.tsx`)
- `src/components/relationship-lines.tsx` - no test file
- `src/components/kingdom-background.tsx` - no test file
- `src/hooks/useEntitySelection.ts` - no test file
- `src/hooks/useWindowSize.ts` - no test file
- `scripts/` directory (build/validate scripts) - no tests

**View Coverage:**
```bash
npm run test:coverage    # Outputs text + json-summary reporters
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest';

describe('module-name', () => {
  describe('functionName', () => {
    it('describes expected behavior', () => {
      const result = functionName(input);
      expect(result).toBe(expected);
    });
  });
});
```

**Patterns:**
- Nested `describe` blocks for grouping by function or feature
- `it` (not `test`) for individual test cases
- Explicit vitest imports even though globals are enabled: `import { describe, it, expect } from 'vitest'`

**Parameterized tests using `it.each`:**
```typescript
it.each([
  ['person', 0.39, 4, false, false],
  ['person', 0.4, 8, false, false],
  // ... more cases
] as const)(
  '%s at zoom %s returns height=%s, showLabel=%s, showBadges=%s',
  (entityType, zoomLevel, height, showLabel, showBadges) => {
    const metrics = getNodeMetrics(entityType, zoomLevel);
    expect(metrics.height).toBe(height);
    expect(metrics.showLabel).toBe(showLabel);
  }
);
```

**Setup/Teardown:**
```typescript
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  vi.clearAllMocks();
});
```

## Mocking

**Framework:** Vitest built-in `vi.mock()`, `vi.fn()`, `vi.importActual()`

**Motion/animation mocking (used in component + integration tests):**
```typescript
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    aside: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLDivElement> }) => (
      <aside {...props}>{children}</aside>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

**Partial module mocking:**
```typescript
vi.mock('../hooks', async () => {
  const actual = await vi.importActual('../hooks');
  return {
    ...actual,
    useIsMobile: () => false,
  };
});
```

**Mock functions for callbacks:**
```typescript
const onClose = vi.fn<() => void>();
const onViewRelationship = vi.fn<(targetId: string) => void>();
```

**What to mock:**
- Animation libraries (`motion/react`) - replace with plain HTML elements
- Responsive hooks (`useIsMobile`) when testing desktop-only behavior
- Callback props (`onClose`, `onViewRelationship`)

**What NOT to mock:**
- Data layer (`timeline-data.ts`) - tests use real data for integrity checks
- Layout engine (`timeline-track-layout.ts`) - tested with real computation
- Config (`timeline-node-config.ts`) - tested with real zoom tiers
- React hooks from React itself

## Fixtures and Factories

**Test Data:**
```typescript
const mockEntity: TimelineEntity = {
  id: 'test-entity',
  name: 'Test Entity',
  type: 'person',
  role: 'prophet',
  startYear: 1000,
  certainty: 'exact',
  priority: 2,
  description: 'Test description',
  themes: ['Covenant'],
  relationships: [],
};
```

**Location:** Inline in test files. No shared fixture files or factory functions.

**Real data usage:** Several tests import and validate against real compiled data:
```typescript
import { timelineData } from '../data/timeline-data';

it('entities remain inside their track bands across zoom levels', () => {
  for (const entity of timelineData) {
    // ... validate against real data
  }
});
```

## Test Types

**Unit Tests:**
- Pure function testing for layout engine, config, label layout
- Hook testing via `renderHook` + `act` from `@testing-library/react`
- Files: `timeline-track-layout.test.ts`, `timeline-node-config.test.ts`, `timeline-label-layout.test.ts`, `useViewport.test.ts`, `usePathTracing.test.ts`, `useEntityFilter.test.ts`, `useModalA11y.test.ts`

**Component Tests:**
- Render + interact via `@testing-library/react`
- A11y assertions (ARIA roles, focus management, keyboard nav)
- Files: `App.test.tsx`, `right-rail.test.tsx`

**Integration Tests:**
- Full `<App />` render with user interaction flows
- Tests: sidebar navigation, node selection opening right rail, ESC closing overlays, path mode + breadcrumbs, keyboard activation
- File: `src/integration.test.tsx`

**E2E Tests:** Not used. No Playwright or Cypress.

## Common Patterns

**Hook testing:**
```typescript
import { renderHook, act } from '@testing-library/react';

it('toggles path mode', () => {
  const { result } = renderHook(() => usePathTracing());
  act(() => {
    result.current.togglePathMode();
  });
  expect(result.current.pathMode).toBe(true);
});
```

**Component rendering + interaction:**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('closes on ESC key', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByRole('dialog')).toBeDefined();
  await user.keyboard('{Escape}');
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
```

**Invariant/property-based testing pattern:**
```typescript
it('height never decreases as zoom increases', (entityType) => {
  const zoomLevels = [0, 0.25, 0.4, 0.5, 0.65, 0.75, 0.85, 1.0, 1.5, 2.0, 3.0];
  let prevHeight = 0;
  for (const zoom of zoomLevels) {
    const metrics = getNodeMetrics(entityType, zoom);
    expect(metrics.height).toBeGreaterThanOrEqual(prevHeight);
    prevHeight = metrics.height;
  }
});
```

**Regression snapshot tests:**
```typescript
it('default layout values match expected snapshot', () => {
  const layout = computeTrackLayout();
  expect(layout.events.baseY).toBe(120);
  expect(layout.events.laneStride).toBe(32);
  expect(layout.events.bandHeight).toBe(128);
});
```

**A11y testing pattern:**
```typescript
it('has role="dialog" and aria-modal="true"', () => {
  render(<RightRail entity={mockEntity} onClose={onClose} ... />);
  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  expect(dialog).toHaveAttribute('aria-modal', 'true');
});

it('traps focus within dialog', async () => {
  const user = userEvent.setup();
  render(<RightRail ... />);
  // Tab through all focusable elements
  for (let i = 0; i < focusableElements.length - 1; i++) {
    await user.tab();
  }
  await user.tab();
  expect(document.activeElement).toBe(closeBtn);
});
```

---

*Testing analysis: 2026-02-17*
