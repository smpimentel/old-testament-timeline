# Dependency Tree (Source of Truth)

Last audited: 2026-02-10
Workspace: `/Users/Stephen1/Desktop/gitprojects/old-testament-timline`

## 1) Project Zones

```text
old-testament-timline/
├─ src/                                   # Active application code
│  ├─ main.tsx                            # Browser entry
│  ├─ App.tsx                             # Root app orchestration
│  ├─ components/
│  │  ├─ timeline-toolbar.tsx             # Search/filters/zoom/path controls
│  │  ├─ timeline-nodes.tsx               # Node, period band, time grid rendering
│  │  ├─ relationship-lines.tsx           # Animated path lines
│  │  ├─ right-rail.tsx                   # Entity detail side panel
│  │  ├─ minimap.tsx                      # Navigator + viewport control
│  │  ├─ hover-tooltip.tsx                # Delayed hover tooltip
│  │  └─ welcome-overlay.tsx              # Onboarding modal
│  ├─ hooks/
│  │  ├─ useViewport.ts                   # Pan/zoom state + handlers
│  │  ├─ useEntitySelection.ts            # Selected entity state
│  │  ├─ useEntityFilter.ts               # Search/filter state
│  │  ├─ usePathTracing.ts                # Theme path tracing
│  │  └─ useWindowSize.ts                 # Window resize tracking
│  ├─ data/
│  │  ├─ raw/*.json                       # Authored source datasets
│  │  ├─ compiled/*.json                  # Generated runtime datasets
│  │  ├─ schemas/raw/*.json               # Raw schema contracts
│  │  ├─ schemas/compiled/*.json          # Compiled schema contracts
│  │  └─ timeline-data.ts                 # Runtime adapter/normalizer
│  └─ styles/                             # Global CSS and design tokens
├─ scripts/
│  ├─ build-data.ts                       # raw -> compiled transform + relationship extraction
│  └─ validate-data.ts                    # build + schema validation + relationship integrity
├─ prototype/old-testament-timeline-prototype/
│  └─ ...                                 # Legacy prototype snapshot (separate app)
├─ Resources/
│  ├─ D-Tree.md                           # Older prototype-oriented tree
│  └─ MIGRATION-PLAN.md                   # Migration plan notes
├─ package.json                           # Script + dependency contract
├─ vite.config.ts                         # Build config + alias
├─ tsconfig*.json                         # TS compiler boundaries
└─ eslint.config.js                       # Lint policy
```

## 2) Runtime Graph (What Actually Runs)

```text
index.html
  -> src/main.tsx
      -> src/styles/index.css
          -> src/styles/fonts.css
          -> src/styles/tailwind.css
          -> src/styles/theme.css
      -> src/App.tsx
          -> src/hooks/useViewport.ts
          -> src/hooks/useEntitySelection.ts
          -> src/hooks/useEntityFilter.ts
          -> src/hooks/usePathTracing.ts
          -> src/hooks/useWindowSize.ts
          -> src/data/timeline-data.ts
              -> src/data/compiled/people.json
              -> src/data/compiled/events.json
              -> src/data/compiled/books.json
              -> src/data/compiled/periods.json
              -> src/data/compiled/themes.json
              -> src/data/compiled/relationships.json
          -> src/components/timeline-toolbar.tsx
          -> src/components/timeline-nodes.tsx
          -> src/components/right-rail.tsx
          -> src/components/minimap.tsx
          -> src/components/hover-tooltip.tsx
          -> src/components/relationship-lines.tsx
          -> src/components/welcome-overlay.tsx
```

## 3) Data Pipeline Graph (Authoring -> UI)

```text
src/data/raw/*.json
  + src/data/schemas/raw/*.schema.json
      -> scripts/build-data.ts
          -> src/data/compiled/*.json
              + src/data/schemas/compiled/*.schema.json
                  -> scripts/validate-data.ts (raw schema checks + compiled schema checks + relationship ID checks)
                      -> src/data/timeline-data.ts (runtime transform to TimelineEntity[])
                          -> App + visualization components
```

## 4) Script and Tooling Dependencies

```text
npm run dev
  -> vite
      -> vite.config.ts (react plugin + tailwind plugin + @ alias)

npm run build
  -> prebuild: npm run validate
      -> tsx scripts/validate-data.ts
          -> npm run build:data
              -> tsx scripts/build-data.ts
  -> tsc -b
  -> vite build

npm run validate
  -> tsx scripts/validate-data.ts

npm run build:data
  -> tsx scripts/build-data.ts
```

## 5) Module Responsibility Map (Active App)

| Module | Role | Depends On | Used By |
|---|---|---|---|
| `src/main.tsx` | React mount + global CSS | `react`, `react-dom`, `src/styles/index.css`, `src/App.tsx` | `index.html` |
| `src/App.tsx` | Global state, interaction logic, composition | `motion/react`, `src/data/timeline-data.ts`, core timeline components | `src/main.tsx` |
| `src/data/timeline-data.ts` | Compiled JSON adapter, type exports, color maps, relationship map | `src/data/compiled/*.json` | `src/App.tsx`, `timeline-*`, `right-rail`, `minimap`, `hover-tooltip` |
| `src/components/timeline-toolbar.tsx` | Search/period jump/zoom/theme/path UI | `lucide-react`, `periods` + `ThemeTag` | `src/App.tsx` |
| `src/components/timeline-nodes.tsx` | PeriodBand + TimeGrid + TimelineNode render primitives | entity types/color maps | `src/App.tsx` |
| `src/components/relationship-lines.tsx` | SVG curved relationship path | `motion/react` | `src/App.tsx` |
| `src/components/right-rail.tsx` | Detail panel with connections and scripture | `motion/react`, `timelineData`, `themeColors` | `src/App.tsx` |
| `src/components/minimap.tsx` | Mini navigator and viewport drag/click | `motion/react`, `periods` | `src/App.tsx` |
| `src/components/hover-tooltip.tsx` | Delayed hover card | `motion/react`, React state/effects | `src/App.tsx` |
| `src/components/welcome-overlay.tsx` | Initial onboarding modal | `motion/react`, `lucide-react` | `src/App.tsx` |

## 6) Non-Active or Legacy-in-Active-Tree Modules

| Path | Current Status | Notes |
|---|---|---|
| `src/data/themes.json` | Not used | Runtime uses `src/data/compiled/themes.json` via adapter |
| `prototype/old-testament-timeline-prototype/*` | Separate legacy app | Useful reference, not part of active runtime |
| `Resources/D-Tree.md` | Older doc | Prototype-era dependency map |

## 7) Hooks

| Hook | Role | Used By |
|---|---|---|
| `src/hooks/useViewport.ts` | Pan/zoom state, wheel/touch handlers, accepts `railWidth` for mobile centering | `src/App.tsx` |
| `src/hooks/useEntitySelection.ts` | Selected entity state + navigation | `src/App.tsx` |
| `src/hooks/useEntityFilter.ts` | Search, type filter, period filter | `src/App.tsx` |
| `src/hooks/usePathTracing.ts` | Theme-based path tracing state | `src/App.tsx` |
| `src/hooks/useWindowSize.ts` | Window resize tracking + `useIsMobile`/`useIsTablet` helpers | `src/App.tsx`, components |
| `src/hooks/useModalA11y.ts` | Focus trap, ESC close, restore focus, scroll lock | `welcome-overlay`, `right-rail` |

## 8) Build and Validation Audit Results (2026-02-10)

### All Passing
- `npm run validate` - pass
- `npm run build` - pass
- `npm run lint` - pass (0 errors, warnings only in coverage/)
- `npm run test:run` - 46 tests pass
- `scripts/build-data.ts` output:
  - 16 people
  - 4 events
  - 3 books
  - 9 periods
  - 4 themes
  - 65 relationships
- Raw schema checks pass
- Compiled schema checks pass
- Relationship integrity checks pass

### CI Coverage Thresholds
| Metric | Threshold |
|---|---|
| Statements | 65% |
| Branches | 55% |
| Functions | 70% |
| Lines | 65% |

### Test Breakdown
- Unit tests: useViewport (5), useModalA11y (9), useEntityFilter (3), usePathTracing (4)
- Component tests: App (6), RightRail (7)
- Integration tests (12): zoom, node selection, ESC close, path mode, keyboard nav

## 9) Navigation Shortcuts (Where to Work by Goal)

| Goal | Start Here | Then Follow |
|---|---|---|
| Add/modify timeline interaction | `src/App.tsx` | `src/hooks/*` + `src/components/*` |
| Change visual styling/theme | `src/styles/index.css` | `src/styles/theme.css` + component inline styles |
| Add/edit historical content | `src/data/raw/*.json` | `npm run build:data` -> `npm run validate` |
| Change data contract/validation | `src/data/schemas/*` | `scripts/build-data.ts` + `scripts/validate-data.ts` |

## 10) Dependency Truth Summary

- Active app: `App.tsx` + 7 core components + 6 hooks + `timeline-data.ts`.
- Data source of truth: `src/data/compiled/*.json`, produced from `src/data/raw/*.json` by scripts.
- Build is clean: all legacy/unused code removed.

## 11) Responsive and A11y Behavior

### Responsive Breakpoints
| Breakpoint | Behavior |
|---|---|
| Mobile (<640px) | Minimap collapses to FAB, right-rail full-width, toolbar rows scroll horizontally |
| Tablet (640-1024px) | Minimap expanded, right-rail 360px fixed |
| Desktop (>1024px) | Full layout, date legend visible in toolbar |

### Touch Targets
- All toolbar buttons: `min-w-11 min-h-11` (44px)
- Period buttons, theme pills, path toggle: 44px min-height
- Right-rail close button: 44px

### Modal A11y (useModalA11y hook)
| Feature | Implementation |
|---|---|
| Focus trap | Tab cycles within modal container |
| ESC close | Keydown listener calls onClose |
| Initial focus | Focuses initialFocusRef or first focusable |
| Restore focus | Returns focus to previous activeElement on close |
| Scroll lock | Optional `lockBodyScroll` param |

### Components Using useModalA11y
- `welcome-overlay.tsx`: `role="dialog"`, `aria-modal="true"`, `lockBodyScroll: true`
- `right-rail.tsx`: `role="dialog"`, `aria-modal="true"`, `lockBodyScroll: isMobile`

## 12) Release Readiness Checklist

- [ ] `npm run lint` passes (0 errors)
- [ ] `npm run test:run` passes (46 tests)
- [ ] `npm run build` succeeds
- [ ] `npm run test:coverage` meets thresholds
- [ ] Manual: welcome overlay ESC closes, focus restored
- [ ] Manual: right-rail ESC closes, focus restored
- [ ] Manual: mobile minimap collapse/expand works
- [ ] Manual: toolbar touch targets usable on mobile device
