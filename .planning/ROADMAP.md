# Roadmap — Milestone 1: Ship v1.0 MVP

## Phase 1: Dead Code & Quick Tech Debt
**Goal:** Clean foundation — remove dead code, fix duplicate types, remove deprecated exports
**Requirements:** R2.1, R2.2, R2.3
**Estimate:** Small
- Delete `src/components/timeline-toolbar.tsx`
- Fix duplicate `EntityType` in `src/config/timeline-node-config.ts`
- Remove deprecated `TIMELINE_HEIGHT` from `src/hooks/index.ts`
- Update any imports affected

## Phase 2: Fix Critical Bugs (TL-004, TL-003)
**Goal:** Track overflow and viewport domain — nodes stay in-band, full timeline visible
**Requirements:** R1.1, R1.2, R2.4
**Estimate:** Medium
- TL-004: Build lane counts from entity data via `createConfigFromEntities()`
- TL-003: Derive `START_YEAR`/`END_YEAR` from compiled data domain
- Replace hardcoded `4000`/`-4000` in minimap and useViewport
- Add regression tests for track bounds and domain coverage

## Phase 3: Fix Period & Label Bugs (TL-001, TL-002, TL-005)
**Goal:** Clean period rendering and readable labels at all zoom levels
**Requirements:** R1.3, R1.4, R1.5
**Estimate:** Medium-Large
- TL-001: Deduplicate periods in build pipeline or runtime transform
- TL-002: Period label collision avoidance (lane stacking or hide-by-priority)
- TL-005: Node label collision detection at medium zoom
- Tests for label readability and period uniqueness

## Phase 4: Fix Theme & Category Bugs (TL-006, TL-007)
**Goal:** Theme filtering works, event categories preserved
**Requirements:** R1.6, R1.7
**Estimate:** Medium
- TL-006: Preserve semantic event categories in build pipeline
- TL-007: Map themes onto entities, align ThemeTag typing
- Tests for theme filter behavior and category preservation

## Phase 5: App.tsx Decomposition
**Goal:** Extract App.tsx monolith into composable section components
**Requirements:** R2.5
**Estimate:** Medium
- Extract `<TimelineCanvas>` (viewport + pan/zoom container)
- Extract `<PeriodSection>` (period bands rendering)
- Extract `<TrackSection>` (entity nodes by track)
- Extract `<UIChrome>` (minimap, sidebar, toolbar)
- App.tsx becomes orchestrator under 200 lines
- All existing tests must pass unchanged

## Phase 6: Visual Alignment with Figma
**Goal:** Pixel-accurate match to Figma design spec
**Requirements:** R3.1–R3.7
**Estimate:** Large
- Use Figma MCP to verify current state vs design
- Event nodes: shape, color, label placement per DESIGN-SPEC.md
- Person bars: height, fill, shadow, font per spec
- Book rectangles: genre colors, label style per spec
- Kingdom background: chevron, split shapes, gradients per spec
- Period banner/header styling per spec
- Timeline axis ticks and grid
- Scaling/zoom behavior fixes

## Phase 7: Kingdom-Split Lanes
**Goal:** Split Events/People tracks into North (Israel) / South (Judah) sub-bands for divided monarchy (930-586 BC)
**Requirements:** R4.1, R4.2 (partial — monarchy-era data)
**Estimate:** Large
- Add `kingdom` field to data schema (raw + compiled + runtime)
- Populate divided monarchy kings (11+), prophets (8+), events (8+)
- Kingdom-aware swimlane assignment (north lanes / south lanes)
- Visual lane divider + kingdom labels at 930 BC boundary
- North lane ends 721 BC, south continues to 586 BC

## Phase 8: Data Expansion
**Goal:** Comprehensive OT timeline data for v1.0
**Requirements:** R4.1–R4.5
**Estimate:** Large
**Plans:** 4 plans

Plans:
- [ ] 8-01-PLAN.md — Schema + pipeline + runtime type updates
- [ ] 8-02-PLAN.md — Excel import and data population
- [ ] 8-03-PLAN.md — UI: diamond events, detail panel, secular-context toggle
- [ ] 8-04-PLAN.md — Validation, integration, visual verification

---

**After completing all phases:** Deploy v1.0 to GitHub Pages
