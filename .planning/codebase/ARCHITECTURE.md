# Architecture

**Analysis Date:** 2026-02-17

## Pattern Overview

**Overall:** Single-page application (SPA) with a custom 2D canvas-like rendering approach using positioned HTML/SVG elements (not `<canvas>`). React functional components with hooks for state management. No router -- single view.

**Key Characteristics:**
- Statically-loaded JSON data transformed at module initialization (no API calls)
- Custom pan/zoom viewport engine using CSS transforms
- Swimlane-based layout algorithm for collision-free vertical positioning
- All state managed via React hooks in `App.tsx` (no global store)
- Build-time data pipeline: raw JSON -> build script -> compiled JSON -> runtime transforms

## Layers

**Data Layer:**
- Purpose: Raw biblical data authoring, compilation, validation, and runtime type mapping
- Location: `src/data/`
- Contains: Raw JSON (`src/data/raw/`), compiled JSON (`src/data/compiled/`), JSON schemas (`src/data/schemas/`), runtime transformer (`src/data/timeline-data.ts`)
- Depends on: Nothing (leaf layer)
- Used by: Hooks, Components, Layout Engine

**Layout Engine:**
- Purpose: Pure layout math -- computes track positions, swimlane strides, label collision avoidance
- Location: `src/lib/`
- Contains: `timeline-track-layout.ts` (vertical track bands), `timeline-label-layout.ts` (label visibility/collision)
- Depends on: `src/config/timeline-node-config.ts` (for node metrics)
- Used by: `App.tsx` (computed once, passed to components)

**Configuration:**
- Purpose: Centralized visual constants -- zoom tiers, node heights, theme colors
- Location: `src/config/timeline-node-config.ts`
- Contains: Zoom tier definitions per entity type, node metrics lookup
- Depends on: Nothing
- Used by: Layout Engine, TimelineNode component

**Hooks (State Management):**
- Purpose: Encapsulate discrete state concerns as composable hooks
- Location: `src/hooks/`
- Contains: Viewport pan/zoom (`useViewport`), entity selection (`useEntitySelection`), filtering (`useEntityFilter`), path tracing (`usePathTracing`), responsive (`useWindowSize`), accessibility (`useModalA11y`)
- Depends on: Data Layer
- Used by: `App.tsx`

**Components (Presentation):**
- Purpose: Visual rendering of timeline elements and UI chrome
- Location: `src/components/`
- Contains: Timeline nodes, period bands, time grid, minimap, side navigator, right rail detail panel, hover tooltips, relationship lines, welcome overlay, kingdom background SVG
- Depends on: Data Layer, Config, Hooks
- Used by: `App.tsx`

**Build Scripts:**
- Purpose: Offline data pipeline -- transform raw authored JSON into compiled format
- Location: `scripts/`
- Contains: `build-data.ts` (raw -> compiled), `validate-data.ts` (schema + integrity checks), `export-period-sections.cjs`, `export-drawio.cjs`
- Depends on: `src/data/raw/`, `src/data/schemas/`
- Used by: `npm run build:data`, `npm run validate` (prebuild hook)

## Data Flow

**Build-Time Data Pipeline:**

1. Author edits raw JSON files in `src/data/raw/` (people, events, books, periods, themes)
2. `npm run build:data` runs `scripts/build-data.ts` via tsx
3. Script reads raw JSON, normalizes fields (birthYear -> startYear, categories, swimlanes)
4. Assigns swimlanes per entity type using greedy lane allocation
5. Extracts relationships from familyTree, relatedEvents, relatedBooks cross-references
6. Writes compiled JSON to `src/data/compiled/` (people, events, books, periods, themes, relationships)
7. `npm run validate` (prebuild) runs `scripts/validate-data.ts` -- validates raw + compiled against JSON schemas, checks relationship ID integrity

**Runtime Data Flow:**

1. `src/data/timeline-data.ts` imports compiled JSON at module init
2. Transforms compiled entities into `TimelineEntity[]` (adds role/genre mapping, theme inference, relationship lookups)
3. Runs `assignSwimlanes()` for collision-free vertical layout
4. Exports `timelineData`, `periods`, `themes`, `relationships` as module-level constants
5. `App.tsx` imports data, computes `trackLayout` (module-level) and `sectionLayout` (useMemo)
6. Node placements computed per render: `yearToX()` maps BC years to pixel X, swimlane maps to Y
7. Label visibility computed via `computeNodeLabelVisibility()` using priority-sorted collision detection
8. Components receive pre-computed positions as props

**User Interaction Flow:**

1. User pans/zooms via mouse drag, scroll wheel, or touch gestures -> `useViewport` updates `panX`, `panY`, `zoomLevel`
2. CSS `transform: translate(panX, panY) scale(zoomLevel)` applied to timeline container
3. User clicks entity -> `useEntitySelection` sets `selectedEntity` -> `RightRail` slides in
4. User enables Path Mode -> `usePathTracing` tracks breadcrumb chain -> `RelationshipLine` SVG curves rendered
5. User toggles theme filter -> `useEntityFilter` filters `timelineData` -> `filteredEntities` re-renders visible nodes
6. User searches -> `useEntityFilter.searchQuery` filters, `panToCenterOnYear()` navigates

**State Management:**
- All state lives in `App.tsx` via hooks -- no Redux, no Context, no Zustand
- `useViewport`: panX, panY, zoomLevel, isDragging (canvas transform state)
- `useEntitySelection`: selectedEntity, hoveredEntity, hoverPosition
- `useEntityFilter`: searchQuery, selectedPeriod, activeThemes -> computed filteredEntities
- `usePathTracing`: pathMode, breadcrumbs[]
- UI state: showWelcome, sidebarOpen (local useState in App)

## Key Abstractions

**TimelineEntity:**
- Purpose: Unified type for all displayable items (person, event, book)
- Definition: `src/data/timeline-data.ts` (lines 46-64)
- Pattern: Discriminated union via `type` field with optional role/category/genre subtype fields
- Contains: id, type, name, startYear, endYear, certainty, priority (1-4), description, themes, swimlane, relationships

**Period:**
- Purpose: Historical era bands displayed at top of timeline
- Definition: `src/data/timeline-data.ts` (lines 66-72)
- Contains: id, name, startYear, endYear, color

**TrackBand / TrackLayout:**
- Purpose: Vertical layout regions for each entity type
- Definition: `src/lib/timeline-track-layout.ts`
- Pattern: Pure functional calculation -- config in, layout out. Three bands: events, people, books stacked vertically

**NodeMetrics / ZoomTier:**
- Purpose: Zoom-responsive node sizing -- height, label visibility, badge visibility per zoom level
- Definition: `src/config/timeline-node-config.ts`
- Pattern: Ordered tier lookup -- first tier where `zoomLevel < maxZoom` wins

**Coordinate System:**
- Years are BC (larger number = further back in time)
- X position: `(START_YEAR - year) * BASE_PIXELS_PER_YEAR` (4 px/year)
- Y position: `trackBand.baseY + (swimlane * trackBand.laneStride)`
- Viewport: CSS transform `translate(panX, panY) scale(zoomLevel)` on container div

## Entry Points

**App Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads `index.html` which loads `/src/main.tsx` as ES module
- Responsibilities: Mounts `<App />` in StrictMode to `#root`

**App Component:**
- Location: `src/App.tsx`
- Triggers: React render
- Responsibilities: Orchestrates all hooks, computes layouts, renders all timeline layers (period bands, kingdom background, time grid, nodes, relationship lines, minimap, side navigator, right rail, tooltips, welcome overlay)

**Data Build:**
- Location: `scripts/build-data.ts`
- Triggers: `npm run build:data` (also called by `npm run validate`)
- Responsibilities: Reads raw JSON, transforms, assigns swimlanes, extracts relationships, writes compiled JSON

**Validation Gate:**
- Location: `scripts/validate-data.ts`
- Triggers: `npm run validate` (runs as prebuild hook before `npm run build`)
- Responsibilities: Runs build:data, validates raw+compiled data against JSON schemas, checks relationship ID integrity

## Error Handling

**Strategy:** Minimal -- no try/catch in components or hooks. Data is static/pre-validated.

**Patterns:**
- Build-time validation catches data errors before they reach runtime (`scripts/validate-data.ts`)
- Schema validation uses custom lightweight validator (no external JSON schema lib)
- Fallback defaults for missing fields: `entity.swimlane || 0`, `entity.priority || 2`, category -> 'event'/'other'
- `normalizeThemeTag()` and `normalizeEventCategory()` safely map unknown strings to canonical values or defaults

## Cross-Cutting Concerns

**Logging:** None. Console.log only in build scripts.
**Validation:** Pre-build JSON schema validation pipeline. No runtime validation.
**Authentication:** None. Static SPA with no backend.
**Accessibility:** Keyboard navigation on timeline nodes (`button` elements with `aria-label`), focus trap via `useModalA11y` hook for RightRail and WelcomeOverlay, ESC key handling.
**Responsive:** `useIsMobile()` (< 480px) and `useIsTablet()` hooks. Mobile: sidebar hidden, right rail full-width overlay, minimap collapsible.
**Design System:** CSS custom properties in `src/styles/theme.css` -- comprehensive token system (colors, typography, spacing, shadows, radii, motion).

---

*Architecture analysis: 2026-02-17*
