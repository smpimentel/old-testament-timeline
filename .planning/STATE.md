# Project State

## Current
- **Milestone:** 1 — Ship v1.0 MVP
- **Phase:** 6 — Visual Alignment with Figma (COMPLETE)
- **Branch:** `working`
- **Last action:** Phase 6 executed (7 commits, P6-1 through P6-7)

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
- Glassmorphism period banner over kingdoms section
- Diamond axis ticks replace triangle pairs

## Known Blockers
- vitest worker timeout (system resource issue, not code-related)
- 5 pre-existing useViewport.test.ts failures (Phase 2 viewport changes, need test update)
