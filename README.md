# Old Testament Timeline

Interactive visualization of Old Testament history, people, events, and books.

## Quick Start

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (runs validate first) |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run validate` | Validate data schemas |
| `npm run build:data` | Compile raw data to runtime format |

## Project Structure

```
src/
├── App.tsx              # Main app component
├── config/
│   └── timeline-node-config.ts  # Zoom-tier sizing for nodes
├── lib/
│   └── timeline-track-layout.ts # Vertical track spacing engine
├── hooks/               # Reusable state hooks
│   ├── useViewport      # Pan/zoom/gesture handling (accepts railWidth for mobile centering)
│   ├── useEntityFilter  # Search and theme filtering
│   ├── useEntitySelection # Entity selection state
│   ├── usePathTracing   # Breadcrumb path mode
│   ├── useWindowSize    # Window resize + mobile/tablet detection
│   └── useModalA11y     # Modal a11y: focus trap, ESC close, restore focus, scroll lock
├── components/          # UI components
├── data/
│   ├── raw/             # Authored source data
│   ├── compiled/        # Generated runtime data
│   └── timeline-data.ts # Data adapter
└── styles/              # CSS and theme

scripts/
├── build-data.ts        # Compile raw → compiled
└── validate-data.ts     # Schema validation
```

## Responsive Design

- **Mobile (<640px):** Minimap collapses to FAB, right-rail full-width, toolbar scrollable
- **Tablet (640-1024px):** Minimap expanded, right-rail 360px
- **Desktop (>1024px):** Full layout with legends visible
- All interactive elements have 44px min touch targets

## Accessibility

- Welcome overlay and right-rail use `role="dialog"` + `aria-modal="true"`
- `useModalA11y` hook provides:
  - Focus trap (Tab cycles within modal)
  - ESC key closes modal
  - Initial focus on specified element
  - Restore focus to trigger on close
  - Optional body scroll lock
- Timeline nodes keyboard-accessible: Enter/Space to activate

## Data Pipeline

Raw JSON → `build-data.ts` → Compiled JSON → `timeline-data.ts` → React components

## Testing

46 tests total:
- Unit tests: hooks (useViewport, useEntityFilter, usePathTracing, useModalA11y)
- Component tests: App, RightRail
- Integration tests (12): zoom controls, node selection, ESC close, path mode, keyboard nav

CI coverage thresholds:
- Statements: 65%
- Branches: 55%
- Functions: 70%
- Lines: 65%

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Vitest + React Testing Library
- Tailwind CSS
- Motion (Framer Motion)

## Node Visual Tuning

All node appearance is config-driven. No render code edits needed.

### Quick Reference

| Change | File |
|--------|------|
| Node height at zoom X | `src/config/timeline-node-config.ts` (zoom tiers) |
| Label visibility threshold | `src/config/timeline-node-config.ts` (showLabel per tier) |
| Badge visibility threshold | `src/config/timeline-node-config.ts` (showBadges per tier) |
| Gap between swimlanes | `src/lib/timeline-track-layout.ts` (laneGap) |
| Gap between tracks | `src/lib/timeline-track-layout.ts` (trackGap) |
| Number of swimlanes | `src/lib/timeline-track-layout.ts` (laneCount) |
| Theme highlight colors | `src/config/timeline-node-config.ts` (themeHighlightColors) |

### Safe Tuning Workflow

1. Edit config values only
2. Run `validateTrackLayout(computeTrackLayout())` - must return true
3. Test at zoom 0.5, 1.0, 1.5, 2.0, 3.0 - no overlaps
4. Keep `maxNodeHeight` in layout config >= highest tier height in node config

Full details: `TIMELINE_NODE_DEPENDENCY_TREE.md` Section 8

## Release Readiness Checklist

- [ ] `npm run lint` passes (0 errors)
- [ ] `npm run test:run` passes (46 tests)
- [ ] `npm run build` succeeds
- [ ] Coverage meets thresholds via `npm run test:coverage`
- [ ] Manual verification: welcome overlay ESC/focus works
- [ ] Manual verification: right-rail ESC/focus works
- [ ] Manual verification: mobile minimap collapse/expand works
- [ ] Manual verification: toolbar touch targets usable on mobile
