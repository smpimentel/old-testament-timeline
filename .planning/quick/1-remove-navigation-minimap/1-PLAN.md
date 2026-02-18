---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/minimap.tsx
  - src/App.tsx
  - src/components/welcome-overlay.tsx
autonomous: true
requirements: [QUICK-1]

must_haves:
  truths:
    - "Minimap no longer renders in the app"
    - "No dead minimap imports or unused variables remain"
    - "App builds and runs without errors"
  artifacts:
    - path: "src/App.tsx"
      provides: "App without minimap import or JSX"
    - path: "src/components/welcome-overlay.tsx"
      provides: "Welcome text without minimap reference"
  key_links: []
---

<objective>
Remove the navigation minimap component and all references to it.

Purpose: User wants the minimap gone — it's not needed for the timeline UX.
Output: Clean codebase with no minimap traces in runtime code.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/App.tsx
@src/components/minimap.tsx
@src/components/welcome-overlay.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Delete minimap component and remove all references</name>
  <files>src/components/minimap.tsx, src/App.tsx, src/components/welcome-overlay.tsx</files>
  <action>
    1. DELETE `src/components/minimap.tsx` entirely.

    2. In `src/App.tsx`:
       - Remove line 14: `import { Minimap } from './components/minimap';`
       - Remove lines 159-164 (the `<Minimap ... />` JSX block).
       - Check if `viewportWidth` and `setPanX` from the `useViewport` destructure are still used elsewhere in App.tsx. If ONLY used by Minimap props, remove them from the destructure. If used elsewhere, keep them.
       - Same check for `pixelsPerYear` — it's also used in PeriodSection and KingdomBackground, so keep it.
       - `TIMELINE_WIDTH` is used in sectionLayout calc, keep it.
       - `START_YEAR` is used in TimeGrid, keep it.

    3. In `src/components/welcome-overlay.tsx`:
       - Remove line 300: the `<li>` mentioning "minimap" for quick navigation.
  </action>
  <verify>
    - `npm run build` succeeds with no errors
    - `grep -r "minimap\|Minimap" src/` returns nothing
    - App renders without the minimap floating panel in bottom-right
  </verify>
  <done>
    - minimap.tsx deleted
    - No minimap imports, JSX, or text references in src/
    - Build passes clean
  </done>
</task>

</tasks>

<verification>
- `npm run build` passes
- No "minimap" string in any src/ file (case-insensitive grep)
- App loads in browser without errors
</verification>

<success_criteria>
- Minimap component fully removed
- Zero dead code left behind
- Clean build
</success_criteria>

<output>
After completion, create `.planning/quick/1-remove-navigation-minimap/1-SUMMARY.md`
</output>
