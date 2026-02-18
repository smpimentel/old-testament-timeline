# Codebase Structure

**Analysis Date:** 2026-02-17

## Directory Layout

```
old-testament-timline/
├── .github/workflows/         # CI/CD
│   ├── ci.yml                 # Test/lint pipeline
│   └── deploy-pages.yml       # GitHub Pages deploy
├── coverage/                  # Generated test coverage (gitignored)
├── dist/                      # Vite build output (gitignored)
├── prototype/                 # Legacy Next.js prototype (inactive)
│   └── old-testament-timeline-prototype/
├── public/                    # Static assets served at root
│   └── vite.svg
├── Resources/                 # Design reference files
│   ├── figma-export/          # Figma SVG exports, tokens, design spec
│   │   ├── period-sections/   # Per-period SVG backgrounds
│   │   ├── tokens.json        # Design token export
│   │   ├── manifest.json      # Component manifest
│   │   └── *.svg              # Individual SVG exports
│   ├── *.drawio               # Diagram source files
│   └── *.md                   # Migration/design docs
├── scripts/                   # Build-time data pipeline
│   ├── build-data.ts          # Raw -> compiled JSON transformer
│   ├── validate-data.ts       # Schema + integrity validation
│   ├── export-drawio.cjs      # Draw.io export utility
│   ├── export-period-sections.cjs  # Period SVG export
│   ├── export-events-sheet-svg.py  # Events sheet SVG export
│   └── generate-figma-svg.mjs     # Figma SVG generator
├── spec/                      # YAML specifications
│   └── timeline-node-spec.yaml
├── src/                       # Application source
│   ├── assets/                # Static imports (SVG)
│   ├── components/            # React components
│   ├── config/                # Visual configuration
│   ├── data/                  # Data layer
│   │   ├── raw/               # Authored source JSON
│   │   ├── compiled/          # Build-generated JSON
│   │   └── schemas/           # JSON validation schemas
│   │       ├── raw/           # Raw data schemas
│   │       └── compiled/      # Compiled data schemas
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Pure layout algorithms
│   ├── styles/                # CSS (Tailwind, theme, fonts)
│   └── test/                  # Test setup
├── index.html                 # Vite entry HTML
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript base config
├── tsconfig.app.json          # App TypeScript config
├── tsconfig.node.json         # Node scripts TypeScript config
├── vite.config.ts             # Vite build config
├── vitest.config.ts           # Test runner config
└── eslint.config.js           # Linting config
```

## Directory Purposes

**`src/components/`**
- Purpose: All React UI components
- Contains: Timeline visualization components, navigation chrome, overlays
- Key files:
  - `timeline-nodes.tsx` -- TimelineNode, TimeGrid, PeriodBand, RoleBadge, DateBadge
  - `right-rail.tsx` -- Entity detail panel (slides in from right)
  - `side-navigator.tsx` -- Left sidebar (search, themes, periods, path mode)
  - `minimap.tsx` -- Bottom-right navigation minimap
  - `kingdom-background.tsx` -- SVG kingdom shape overlay (Figma geometry)
  - `relationship-lines.tsx` -- SVG curved lines between breadcrumb entities
  - `hover-tooltip.tsx` -- Mouse-follow tooltip on entity hover
  - `welcome-overlay.tsx` -- First-visit instructions dialog

**`src/config/`**
- Purpose: Centralized visual configuration constants
- Contains: Zoom tier definitions, node metrics, theme colors
- Key files: `timeline-node-config.ts`, `timeline-node-config.test.ts`

**`src/data/`**
- Purpose: Complete data layer -- authoring, build output, schemas, runtime transforms
- Contains: JSON data files and the main data transformer module
- Key files:
  - `timeline-data.ts` -- Runtime data transformer, type definitions, color mappings, exports
  - `timeline-data.test.ts` -- Data integrity tests
  - `raw/*.json` -- Authored source data (people, events, books, periods, themes)
  - `compiled/*.json` -- Build-generated data (above + relationships)
  - `schemas/raw/*.schema.json` -- Validation schemas for raw data
  - `schemas/compiled/*.schema.json` -- Validation schemas for compiled data

**`src/hooks/`**
- Purpose: Stateful logic extracted into reusable hooks
- Contains: Viewport, selection, filtering, path tracing, responsive, accessibility
- Key files:
  - `useViewport.ts` -- Pan/zoom state, mouse/touch/wheel handlers, yearToX conversion
  - `useEntitySelection.ts` -- Selected/hovered entity state
  - `useEntityFilter.ts` -- Search query, theme filter, period filter -> filteredEntities
  - `usePathTracing.ts` -- Breadcrumb path mode state
  - `useWindowSize.ts` -- Window dimensions, useIsMobile, useIsTablet
  - `useModalA11y.ts` -- Focus trap, ESC close, scroll lock for dialogs
  - `index.ts` -- Barrel export

**`src/lib/`**
- Purpose: Pure layout algorithms (no React dependency)
- Contains: Track layout computation, label collision detection
- Key files:
  - `timeline-track-layout.ts` -- computeTrackLayout, getEntityY, validateTrackLayout, createConfigFromEntities
  - `timeline-label-layout.ts` -- computePeriodLabelLayout, computeNodeLabelVisibility

**`src/styles/`**
- Purpose: Global CSS -- design tokens, Tailwind integration, font loading
- Key files:
  - `index.css` -- Entry point (imports fonts, tailwind, theme)
  - `theme.css` -- All CSS custom properties (colors, typography, spacing, shadows, radii, motion tokens)
  - `fonts.css` -- Google Fonts loading (Cormorant Garamond, Source Sans 3, IBM Plex Mono)
  - `tailwind.css` -- Tailwind v4 import

**`scripts/`**
- Purpose: Build-time data pipeline and asset export utilities
- Key files:
  - `build-data.ts` -- Core data build: raw JSON -> compiled JSON with swimlanes + relationships
  - `validate-data.ts` -- Pre-build gate: schema validation + relationship integrity checks

**`Resources/`**
- Purpose: Design reference assets (not imported by app at runtime)
- Contains: Figma SVG exports, draw.io diagrams, design specs, migration plans
- Generated: Partially (figma exports)
- Committed: Yes

**`prototype/`**
- Purpose: Legacy prototype (Next.js + shadcn/ui)
- Contains: Earlier version of the app with Tailwind + shadcn components
- Generated: No
- Committed: Yes (historical reference, not active)

## Key File Locations

**Entry Points:**
- `index.html`: Vite HTML entry, loads `/src/main.tsx`
- `src/main.tsx`: React mount point, renders `<App />` into `#root`
- `src/App.tsx`: Main application component (orchestrates everything)

**Configuration:**
- `vite.config.ts`: Build config (base: './', path alias @)
- `vitest.config.ts`: Test runner config
- `tsconfig.json`: TypeScript base config
- `tsconfig.app.json`: App TypeScript config (src/)
- `tsconfig.node.json`: Node scripts TypeScript config
- `eslint.config.js`: ESLint config
- `package.json`: Dependencies, npm scripts

**Core Logic:**
- `src/data/timeline-data.ts`: Data types, transforms, exports (~550 lines)
- `src/lib/timeline-track-layout.ts`: Vertical layout engine (~218 lines)
- `src/lib/timeline-label-layout.ts`: Label collision detection (~127 lines)
- `src/config/timeline-node-config.ts`: Zoom tier config (~95 lines)
- `src/hooks/useViewport.ts`: Pan/zoom engine (~258 lines)

**Testing:**
- `src/test/setup.ts`: Vitest setup file
- `src/**/*.test.ts(x)`: Co-located test files
- `vitest.config.ts`: Test runner configuration

## Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (e.g., `timeline-nodes.tsx`, `right-rail.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useViewport.ts`, `useEntityFilter.ts`)
- Lib modules: `kebab-case.ts` (e.g., `timeline-track-layout.ts`)
- Tests: `*.test.ts` or `*.test.tsx` co-located with source
- Data: `kebab-case.json` or `kebab-case.ts`
- Schemas: `entity.layer.schema.json` (e.g., `people.raw.schema.json`)

**Directories:**
- Lowercase, singular or plural as natural (e.g., `hooks/`, `components/`, `data/`, `lib/`)

**Exports:**
- Components: named exports, PascalCase (e.g., `export function TimelineNode`)
- Hooks: named exports, camelCase with `use` prefix (e.g., `export function useViewport`)
- Types: PascalCase (e.g., `TimelineEntity`, `TrackLayout`)
- Constants: UPPER_SNAKE_CASE (e.g., `START_YEAR`, `TIMELINE_WIDTH`, `SIDEBAR_WIDTH_OPEN`)

## Where to Add New Code

**New Component:**
- Create `src/components/my-component.tsx`
- Export named function component
- Import in `src/App.tsx`
- Add test as `src/components/my-component.test.tsx`

**New Hook:**
- Create `src/hooks/useMyHook.ts`
- Add export to `src/hooks/index.ts` barrel
- Add test as `src/hooks/useMyHook.test.ts`

**New Layout Algorithm:**
- Create `src/lib/my-algorithm.ts` (pure functions, no React)
- Add test as `src/lib/my-algorithm.test.ts`

**New Data Entity Type:**
- Add raw JSON to `src/data/raw/`
- Add raw schema to `src/data/schemas/raw/`
- Add compiled schema to `src/data/schemas/compiled/`
- Update `scripts/build-data.ts` with transform function
- Update `scripts/validate-data.ts` file lists
- Update `src/data/timeline-data.ts` with type and transform
- Run `npm run build:data` then `npm run validate`

**New Design Token:**
- Add CSS custom property to `src/styles/theme.css` in the appropriate section
- Reference as `var(--my-token)` in component styles

**New Build Script:**
- Add to `scripts/` directory
- Add npm script to `package.json`

## Special Directories

**`src/data/compiled/`**
- Purpose: Build-generated JSON (output of `scripts/build-data.ts`)
- Generated: Yes (by `npm run build:data`)
- Committed: Yes (so app works without running build:data)

**`coverage/`**
- Purpose: Test coverage reports (Istanbul/v8)
- Generated: Yes (by `npm run test:coverage`)
- Committed: Yes (but probably should be gitignored)

**`prototype/`**
- Purpose: Historical prototype, not part of active build
- Generated: No
- Committed: Yes (reference only)

**`dist/`**
- Purpose: Vite production build output
- Generated: Yes (by `npm run build`)
- Committed: No (gitignored)

---

*Structure analysis: 2026-02-17*
