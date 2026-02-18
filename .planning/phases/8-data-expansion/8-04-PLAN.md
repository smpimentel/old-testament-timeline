---
phase: 8-data-expansion
plan: 04
type: execute
wave: 3
depends_on: [8-02, 8-03]
files_modified:
  - src/data/raw/people.json
  - src/data/raw/events.json
  - src/data/compiled/people.json
  - src/data/compiled/events.json
  - src/data/compiled/relationships.json
autonomous: false
requirements: [R4.1, R4.2, R4.4, R4.5]

must_haves:
  truths:
    - "Full validation suite passes on expanded dataset"
    - "All relationship references point to valid entity IDs"
    - "App renders expanded data without layout issues"
    - "Diamond events visible and toggleable"
    - "King-prophet relationships appear in detail panel"
    - "Source footer works on entities that have source data"
  artifacts:
    - path: "src/data/compiled/people.json"
      provides: "Fully validated compiled people"
    - path: "src/data/compiled/events.json"
      provides: "Fully validated compiled events"
    - path: "src/data/compiled/relationships.json"
      provides: "Fully validated relationships with king-prophet links"
  key_links:
    - from: "src/data/compiled/relationships.json"
      to: "src/data/compiled/people.json"
      via: "All sourceId/targetId reference valid entity IDs"
      pattern: "sourceId.*targetId"
---

<objective>
Final validation, integration testing, and visual verification of the complete data expansion.

Purpose: Ensure all expanded data, UI changes, and pipeline updates work together correctly.
Output: Fully validated dataset, confirmed visual rendering
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/8-data-expansion/8-CONTEXT.md
@.planning/phases/8-data-expansion/8-02-SUMMARY.md
@.planning/phases/8-data-expansion/8-03-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Full validation and integration cleanup</name>
  <files>
    src/data/raw/people.json
    src/data/raw/events.json
    src/data/compiled/people.json
    src/data/compiled/events.json
    src/data/compiled/relationships.json
  </files>
  <action>
1. Run full validation: `npm run validate`
   - Fix any schema validation errors
   - Fix any relationship integrity errors (orphaned sourceId/targetId)
   - Fix any duplicate ID issues

2. Clean up `appOnly` marker fields from raw JSON if user approved keeping those entities in Plan 02's checkpoint. Remove the `appOnly: true` field from any entries -- it was only for review purposes. If user requested removal of certain entities, remove them from raw JSON.

3. Rebuild compiled data: `npm run build:data`

4. Run validation again: `npm run validate`

5. Run TypeScript check: `npx tsc --noEmit`

6. Run existing tests: `npx vitest run` (ignore known vitest timeout and useViewport.test.ts failures)

7. Check final counts:
   - `cat src/data/compiled/people.json | npx tsx -e "const d=require('./src/data/compiled/people.json'); console.log(d.length + ' people')"`
   - Same for events and relationships
   - Print kingdom distribution: how many Israel kings, Judah kings
   - Print secular-context event count

8. Verify no orphaned relationships by inspecting validation output
  </action>
  <verify>
`npm run validate` exits 0.
`npx tsc --noEmit` exits 0.
People count ~80-90, Events ~35, Relationships ~300+.
No orphaned relationship IDs.
  </verify>
  <done>Full dataset validates. No orphaned references. Counts match expectations. TypeScript compiles clean.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Complete Phase 8 data expansion:
- ~40 new kings from Excel merged into people data
- 10 secular-context events with diamond rendering
- Source footer in detail panel (collapsible)
- Timeline Story note for Active entities
- Secular-context toggle in sidebar
- King-prophet relationships in detail panel
- Full schema validation passing
  </what-built>
  <how-to-verify>
1. Run `npm run dev` and open the app
2. **Kingdom lanes:** Scroll to 930-586 BC era. Verify new kings appear in Israel/Judah bands. Check that the bands don't overflow or overlap badly.
3. **Secular-context events:** Look for diamond-shaped events. Should see events like "Code of Hammurabi", "Battle of Kadesh", etc. with muted gray-brown color.
4. **Toggle:** Click the "Historical Events" toggle in the sidebar. Diamond events should disappear/reappear.
5. **Detail panel:** Click on a king (e.g., Hezekiah). Check that:
   - Dates show Thiele reign dates
   - Source section appears at bottom (collapsed, click to expand)
   - Connections section shows related prophets
6. **Detail panel:** Click on a person with Timeline Story = Active. Verify the italic note "Dates reflect period of scriptural activity, not full lifespan." appears.
7. **General:** Pan around the full timeline. Check for visual issues (overlapping labels, missing nodes, broken layout).
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues to fix</resume-signal>
</task>

</tasks>

<verification>
- Full `npm run validate` passes
- App renders without errors
- Visual layout handles expanded data gracefully
- All new features (diamond, toggle, source, timeline story note) work correctly
</verification>

<success_criteria>
- Phase 8 complete: comprehensive OT timeline data for v1.0
- All R4.1-R4.5 requirements satisfied (R4.3 deferred per CONTEXT.md)
- Data validates against schemas
- UI renders expanded data correctly
- User has visually verified the final state
</success_criteria>

<output>
After completion, create `.planning/phases/8-data-expansion/8-04-SUMMARY.md`
</output>
