# Old Testament Timeline

## Vision
Interactive browser-based visualization of Old Testament biblical history — people, events, books, and periods rendered on a pannable/zoomable timeline. Target: Bible study groups, students, personal reference.

## Context
- **Type:** Brownfield SPA (React 19 + Vite 7 + Tailwind 4 + TypeScript)
- **Deploy:** GitHub Pages (static, no backend)
- **Design source:** Figma (accessible via `figma-desktop` MCP server) + `DESIGN-SPEC.md`
- **Data pipeline:** Raw JSON → build script → compiled JSON → runtime transforms
- **Current state:** Functional but has 7 tracked bugs (TL-001–TL-007), visual drift from Figma, incomplete data

## Milestone 1: Ship v1.0 MVP

**Priority order:** Stabilize → Visual alignment → Data expansion

### Goals
1. Fix all 7 tracked issues (TL-001–TL-007)
2. Clean up tech debt (dead code, hardcoded values, monolith decomposition)
3. Align visual rendering with Figma design spec
4. Fix scaling/zoom issues
5. Expand data — more people/events, new entity types, richer metadata
6. Deploy stable v1.0 to GitHub Pages

### Non-Goals (v1.0)
- Backend/API/auth
- User accounts or saved state
- Mobile-first redesign (responsive exists, not priority)
- Internationalization

## Key Resources
- **Issues:** `TIMELINE_ISSUES.md` (TL-001–TL-007 with acceptance criteria)
- **Design spec:** `Resources/figma-export/DESIGN-SPEC.md`
- **Figma MCP:** `figma-desktop` — `get_screenshot`, `get_metadata`, `get_design_context`
- **Codebase map:** `.planning/codebase/` (7 docs)

## Constraints
- Static hosting only (GitHub Pages)
- No external dependencies beyond current stack
- Must pass existing CI (lint + build + test:coverage)
