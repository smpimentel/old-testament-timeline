# Codebase Concerns

**Analysis Date:** 2026-02-17

## Known Issues

Seven tracked issues exist in `TIMELINE_ISSUES.md` (TL-001 through TL-007). Status summary:

**TL-004 (Critical):** Nodes spill into adjacent tracks when swimlane index exceeds configured lane count.
- Files: `src/lib/timeline-track-layout.ts` (line 61 defaults), `src/App.tsx` (line 32 static layout)
- Partially mitigated by `createConfigFromEntities()` which was added but App.tsx already uses it (line 32). Verify actual data still overflows.

**TL-003 (High):** Earliest entities clipped at left edge. Timeline starts at computed domain but minimap hardcodes `4000`.
- Files: `src/components/minimap.tsx` (line 59 hardcodes `4000`), `src/hooks/useViewport.ts` (line 22 hardcodes `panX=-4000`, line 73 `handleFitView` resets to `-4000`)
- The `START_YEAR` and `END_YEAR` are now derived from data via `timelineDomain`, but minimap and fit-view bypass them.

**TL-005 (High):** Same-year nodes produce overlapping labels at medium zoom.
- Files: `src/lib/timeline-label-layout.ts` (label collision engine), `src/config/timeline-node-config.ts` (zoom tier thresholds)
- `computeNodeLabelVisibility()` exists and is wired in. Issue may be partially addressed.

**TL-007 (High):** Theme filtering incomplete -- entities may lack mapped themes.
- Files: `src/data/timeline-data.ts` (lines 354-357, 380-383, 404-405 theme inference), `src/hooks/useEntityFilter.ts` (line 44 filter check)
- Theme inference uses `inferThemesFromCategories()` + `mergeThemes()` which maps categories to themes via alias map. Coverage depends on alias completeness.

**TL-006 (Medium):** Event semantic categories dropped during build.
- Files: `scripts/build-data.ts` (line 142 -- `normalizeCategory` is used correctly)
- Build now preserves `raw.category` via `normalizeCategory()`. Likely resolved.

## Technical Debt

| Area | Issue | Severity | Notes |
|------|-------|----------|-------|
| `src/config/timeline-node-config.ts` line 6 | Duplicate `EntityType` definition | Low | Duplicates `src/data/timeline-data.ts` line 12. Should import instead of redefine. |
| `src/components/timeline-toolbar.tsx` | Entire component unused | Medium | 294 lines. Not imported anywhere in App or other components. Dead code -- replaced by `SideNavigator`. |
| `src/hooks/useViewport.ts` line 10 | `TIMELINE_HEIGHT = 800` deprecated and exported | Low | Marked `@deprecated` but still exported from barrel `src/hooks/index.ts` line 7. Remove export. |
| `src/data/timeline-data.ts` lines 191-200 | `roleColors` all identical (`#B7CCA9`) | Medium | Every role maps to the same color. Either intentional (design wants uniform) or placeholder. Makes role-based coloring meaningless. |
| `src/components/minimap.tsx` line 59 | Hardcoded `4000` in `yearToX` | High | Should use `START_YEAR` from hooks or data domain. Breaks if domain changes. |
| `src/hooks/useViewport.ts` lines 22, 73 | Hardcoded `-4000` initial pan and fit-view reset | High | Should derive from `START_YEAR`. Currently creates drift if domain is not exactly 4000. |
| `src/App.tsx` lines 33-43 | Layout constants scattered as module-level vars | Low | `PERIOD_SECTION_HEIGHT`, `MAIN_SECTION_PADDING_TOP`, etc. Could live in a config object for maintainability. |
| `src/App.tsx` line 581 | App component is 582 lines | Medium | Single-file monolith. Layout computation, rendering, and handler logic all in one component. Consider extracting layout computation and section rendering. |
| `src/data/timeline-data.ts` lines 143-153 | `themeAliasMap` contains questionable mappings | Medium | `pentateuch -> Covenant`, `poetry -> Messiah`, `wisdom -> Messiah` are semantic leaps. May cause surprising theme assignments. |
| `scripts/build-data.ts` | Swimlane assignment duplicated | Low | `assignSwimlanes()` exists in both `scripts/build-data.ts` (line 375) and `src/data/timeline-data.ts` (line 475). Runtime re-runs swimlane assignment on already-assigned data. |

## Missing Pieces

**No error boundaries:**
- No React error boundary wraps the app or major sections. A rendering crash in any component takes down the entire timeline.
- Files affected: `src/App.tsx`, `src/main.tsx`

**No loading/empty states:**
- If compiled JSON data is empty or malformed, no graceful fallback exists. Components render empty.
- Files: `src/data/timeline-data.ts` (transform functions assume valid data)

**No URL state / deep linking:**
- Viewport position, selected entity, and filter state are all ephemeral React state. Refreshing loses everything. No URL params or persistence.
- Files: `src/hooks/useViewport.ts`, `src/hooks/useEntityFilter.ts`, `src/hooks/useEntitySelection.ts`

**Limited test coverage for components:**
- Only `src/App.test.tsx` (76 lines), `src/components/right-rail.test.tsx` (188 lines), `src/integration.test.tsx` (405 lines) test components.
- No tests for: `Minimap`, `SideNavigator`, `TimelineNode`, `PeriodBand`, `TimeGrid`, `HoverTooltip`, `KingdomBackground`, `RelationshipLine`, `WelcomeOverlay` (standalone).

**No viewport bounds clamping:**
- User can pan infinitely in any direction past the timeline content. No limits prevent scrolling into empty space.
- Files: `src/hooks/useViewport.ts` (mouse/touch handlers set panX/panY without bounds)

**Minimap viewport drag is imprecise:**
- `handleViewportDrag` at `src/components/minimap.tsx` line 49 uses `e.currentTarget.parentElement!` -- a fragile DOM traversal with non-null assertion.

## Risks

**Architecture Risks:**
- **Single-component rendering bottleneck:** All ~200+ timeline entities render in a single flat list inside `App.tsx` (line 505 `nodePlacements.map`). No virtualization. At large dataset sizes or low zoom, this creates many DOM nodes simultaneously.
- **Touch zoom has no focal point:** `src/hooks/useViewport.ts` lines 142-161 -- pinch zoom changes zoom level but doesn't adjust pan to keep the focal point stable, unlike mouse wheel zoom which does (line 178-198).
- **Relationship line SVG per connection:** Each breadcrumb segment creates a full-width SVG element (`src/components/relationship-lines.tsx` lines 69-79). With many breadcrumbs, this creates many overlapping SVGs.

**Data Risks:**
- **Runtime data mutation:** `assignSwimlanes()` at `src/data/timeline-data.ts` line 475 mutates entities in-place (`entity.swimlane = laneIndex`). This runs at module load time on imported data.
- **No data versioning:** Compiled JSON files under `src/data/compiled/` are committed but can become stale if `build:data` isn't run. The `prebuild` script runs `validate` which runs `build:data`, but dev mode (`npm run dev`) does not.

**Dependency Risks:**
- All dependencies are on current major versions (React 19, Vite 7, Tailwind 4). No known deprecation concerns.
- `tw-animate-css` is a small utility package -- verify continued maintenance.

## Improvement Opportunities

**Quick Wins:**
1. Delete `src/components/timeline-toolbar.tsx` -- 294 lines of dead code.
2. Replace hardcoded `4000` in minimap with `START_YEAR` import -- 1-line fix.
3. Replace hardcoded `-4000` in `useViewport` initial state and `handleFitView` with `-START_YEAR * BASE_PIXELS_PER_YEAR` or similar derived value.
4. Remove duplicate `EntityType` in `src/config/timeline-node-config.ts` -- import from `src/data/timeline-data.ts`.
5. Remove deprecated `TIMELINE_HEIGHT` export from `src/hooks/index.ts`.

**Larger Improvements:**
1. **Add React error boundary** around App content to prevent full-page crashes.
2. **Extract App.tsx sections** into composed components (e.g., `<TimelineCanvas>`, `<PeriodSection>`, `<TrackSection>`) to reduce the 582-line monolith.
3. **Add viewport bounds clamping** so users can't pan infinitely past content.
4. **Add virtualization** for timeline nodes -- only render nodes within the visible viewport rect. Would significantly improve performance at low zoom.
5. **Persist viewport/filter state to URL** using `URLSearchParams` for shareable deep links.
6. **Unify swimlane assignment** -- run only in build script OR runtime, not both. Remove the runtime `assignSwimlanes` call if build output is trusted.
7. **Fix touch zoom focal point** to match mouse wheel behavior.

## Test Coverage Gaps

**Untested components:**
- `src/components/minimap.tsx` -- no tests for click-to-navigate or viewport drag
- `src/components/side-navigator.tsx` -- no isolated tests (only integration via App)
- `src/components/timeline-nodes.tsx` -- `TimelineNode`, `PeriodBand`, `TimeGrid`, `RoleBadge`, `DateBadge` all untested
- `src/components/hover-tooltip.tsx` -- no tests
- `src/components/kingdom-background.tsx` -- no tests
- `src/components/relationship-lines.tsx` -- no tests
- Risk: Visual regressions and interaction bugs in these components go undetected.
- Priority: Medium (integration tests cover some flows, but no isolation)

**Untested hooks:**
- `src/hooks/usePathTracing.ts` -- has `src/hooks/usePathTracing.test.ts` (exists but not verified for coverage)
- `src/hooks/useWindowSize.ts` -- no tests for `useIsMobile`, `useIsTablet`
- `src/hooks/useEntitySelection.ts` -- no tests
- Priority: Medium

**Untested data logic:**
- `src/data/timeline-data.ts` -- `mapPersonCategory()`, `mapBookCategory()`, `mergeThemes()`, `selectCanonicalPeriod()` have no direct unit tests
- `scripts/build-data.ts` -- no tests for the build pipeline itself
- Priority: Medium (data integrity tests exist but test outputs, not individual functions)

---

*Concerns audit: 2026-02-17*
