# Project State

## Current
- **Milestone:** 1 — Ship v1.0 MVP
- **Phase:** 6 — Visual Alignment with Figma (COMPLETE)
- **Branch:** `working`
- **Last action:** Completed quick task 5: Fix period nav pan math & add fit-to-view

## Completed
- [x] Codebase mapping (7 docs in `.planning/codebase/`)
- [x] Project initialization (PROJECT.md, REQUIREMENTS.md, ROADMAP.md)
- [x] Phase 1: Dead Code & Quick Tech Debt (R2.1, R2.2, R2.3)
- [x] Phase 2: Fix Critical Bugs — TL-004, TL-003 (R1.1, R1.2, R2.4)
- [x] Phase 3: Fix Period & Label Bugs — TL-001, TL-002, TL-005 (R1.3, R1.4, R1.5)
- [x] Phase 4: Fix Theme & Category Bugs — TL-006, TL-007 (R1.6, R1.7)
- [x] Phase 5: App.tsx Decomposition (R2.5)
- [x] Phase 6: Visual Alignment with Figma (R3.1–R3.7)

## Next
- Plan Phase 7: Data Expansion (R4.1–R4.5)

## Key Decisions
- Priority order: Stabilize → Visual → Data
- Dual-scale coordinate system: log 4004–2300 BC + linear 4px/yr post-2300 BC (src/lib/scale.ts)
- ADAPTIVE_NODE_SIZING feature flag (default: false = Figma-locked sizes)
- Role-based person colors (deviate from Figma uniform sage)
- Period banner removed (overlapped events/main body)
- Diamond axis ticks replace triangle pairs
- Book IDs use `-book` suffix when name collides w/ person (exodus-book, joshua-book)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Remove navigation minimap | 2026-02-18 | 7e31b30 | [1-remove-navigation-minimap](./quick/1-remove-navigation-minimap/) |
| 3 | Replace kingdom bg with Figma export | 2026-02-18 | 8697a22 | [3-replace-kingdom-bg-with-figma-export](./quick/3-replace-kingdom-bg-with-figma-export/) |
| 4 | Remove bottom half of themes from nav panel | 2026-02-18 | 008aed3 | [4-remove-bottom-half-nav-themes](./quick/4-remove-bottom-half-nav-themes/) |
| 5 | Fix period nav pan math & fit-to-view | 2026-02-18 | 0be0985 | [5-fix-period-nav-fit-to-view](./quick/5-fix-period-nav-fit-to-view/) |

## Known Blockers
- vitest worker timeout (system resource issue, not code-related)
- 5 pre-existing useViewport.test.ts failures (Phase 2 viewport changes, need test update)
