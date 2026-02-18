# Requirements — Milestone 1: Ship v1.0 MVP

## R1: Fix Critical/High Bugs
- **R1.1** TL-004 (Critical): Track overflow — nodes stay inside track bands at all zoom levels
- **R1.2** TL-003 (High): Viewport domain — timeline domain covers all data (4004 BC+), no clipping
- **R1.3** TL-001 (High): Period dedup — no duplicate period bands/labels for same date range
- **R1.4** TL-002 (High): Period label collision — labels readable in overlapping regions
- **R1.5** TL-005 (High): Node label collision — same-year labels don't overlap at medium zoom
- **R1.6** TL-007 (High): Theme filtering — theme chips correctly filter/highlight entities
- **R1.7** TL-006 (Medium): Event categories — semantic categories preserved through build pipeline

## R2: Tech Debt Cleanup
- **R2.1** Remove dead code: `timeline-toolbar.tsx` (294 lines unused)
- **R2.2** Remove duplicate `EntityType` in `timeline-node-config.ts` — import from `timeline-data.ts`
- **R2.3** Remove deprecated `TIMELINE_HEIGHT` export from hooks barrel
- **R2.4** Replace hardcoded `4000`/`-4000` in minimap and useViewport with data-derived values
- **R2.5** Decompose `App.tsx` monolith (582 lines) into composable components

## R3: Visual Alignment
- **R3.1** Match Figma design spec for event nodes (shape, color, label placement)
- **R3.2** Match Figma design spec for person bars (height, fill, border, shadow, label font)
- **R3.3** Match Figma design spec for book rectangles (genre colors, label style)
- **R3.4** Match Figma design spec for kingdom background shapes (chevron, split, gradients)
- **R3.5** Match Figma design spec for period banner/header
- **R3.6** Fix scaling/zoom behavior — nodes scale properly across zoom tiers
- **R3.7** Timeline axis ticks and grid alignment per design spec

## R4: Data Expansion
- **R4.1** Add missing people (fill gaps in patriarchs, judges, kings, prophets)
- **R4.2** Add missing events (complete coverage of major OT events)
- **R4.3** Add new entity types if needed (places, prophecies, covenants)
- **R4.4** Enrich metadata — descriptions, scripture references for all entities
- **R4.5** Validate all data against schemas after expansion

## Success Criteria
- All 7 TL issues pass their acceptance criteria
- CI passes (lint + build + test:coverage above thresholds)
- Visual fidelity matches Figma at default zoom
- No hardcoded magic numbers for timeline domain
- App.tsx under 200 lines after decomposition
- Data covers major OT timeline comprehensively
