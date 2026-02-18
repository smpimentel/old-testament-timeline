---
phase: 8-data-expansion
plan: 03
subsystem: ui-rendering
tags: [ui, events, filtering, detail-panel]
dependency-graph:
  requires: [8-01]
  provides: [diamond-shape, source-footer, secular-filter]
  affects: [timeline-nodes, right-rail, side-navigator, useEntityFilter]
tech-stack:
  patterns: [conditional-shape-rendering, native-details-element, filter-toggle]
key-files:
  created: []
  modified:
    - src/components/timeline-nodes.tsx
    - src/components/right-rail.tsx
    - src/hooks/useEntityFilter.ts
    - src/components/side-navigator.tsx
    - src/App.tsx
decisions:
  - Diamond shape via CSS rotate(45deg) on existing div, no SVG needed
  - Native HTML details element for collapsible Source section
  - Filter placed between Themes and Periods sections in sidebar
metrics:
  duration: 120s
  completed: 2026-02-18
---

# Phase 8 Plan 03: UI for Data Expansion Summary

Diamond shapes for secular-context events via CSS rotate, collapsible Source footer using native `<details>`, Timeline Story note for Active entities, and sidebar filter toggle for historical events.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Diamond shape + detail panel enhancements | 5a00a55 | timeline-nodes.tsx, right-rail.tsx |
| 2 | Secular-context filter toggle | f45e77f | useEntityFilter.ts, side-navigator.tsx, App.tsx |

## Implementation Details

### Diamond Shape (timeline-nodes.tsx)
- Added `isSecularContext` check: `entity.type === 'event' && entity.category === 'secular-context'`
- Point nodes with secular-context get `transform: rotate(45deg)` + `borderRadius: 2px` instead of `50%`
- All color/border/shadow logic unchanged

### Detail Panel (right-rail.tsx)
- Collapsible Source section at bottom using native `<details>` element, collapsed by default
- Timeline Story note ("Dates reflect period of scriptural activity, not full lifespan.") shown for `timelineStory === 'Active'` entities
- All sections remain conditionally rendered (no empty sections)

### Filter Toggle (useEntityFilter.ts + side-navigator.tsx)
- `showSecularContext` state defaults to `true` (visible)
- Filter applied before search filter in `filteredEntities` useMemo
- Sidebar shows "Historical Events" pill (expanded) or "H" circle (collapsed)
- Active state: #B8B0A8 background, matching existing theme toggle pattern

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes with zero errors

## Self-Check: PASSED
