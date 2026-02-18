---
phase: 8-data-expansion
plan: 02
type: execute
wave: 2
depends_on: [8-01]
files_modified:
  - scripts/import-xlsx.ts
  - src/data/raw/people.json
  - src/data/raw/events.json
  - src/data/compiled/people.json
  - src/data/compiled/events.json
  - src/data/compiled/relationships.json
autonomous: false
requirements: [R4.1, R4.2, R4.3, R4.4]

must_haves:
  truths:
    - "Kings from Excel are merged into people.json as role=King with Thiele dates"
    - "David/Solomon use Thiele reign dates for startYear/endYear"
    - "10 secular-context events exist in events.json with correct years and endYear for spanning events"
    - "King-prophet relationships exist in compiled relationships.json"
    - "All data validates against schemas"
    - "App-only people/events are reconciled with user"
  artifacts:
    - path: "scripts/import-xlsx.ts"
      provides: "Excel to raw JSON import script"
      min_lines: 100
    - path: "src/data/raw/people.json"
      provides: "Expanded people data with ~90 entries"
    - path: "src/data/raw/events.json"
      provides: "Expanded events with 10 secular-context entries"
    - path: "src/data/compiled/relationships.json"
      provides: "King-prophet relationship records"
  key_links:
    - from: "scripts/import-xlsx.ts"
      to: "src/data/raw/people.json"
      via: "Script output overwrites raw JSON"
      pattern: "writeFileSync.*people.json"
    - from: "scripts/import-xlsx.ts"
      to: "src/data/raw/events.json"
      via: "Script output overwrites raw JSON"
      pattern: "writeFileSync.*events.json"
---

<objective>
Import data from TimelineDB.xlsx and populate raw JSON files.

Purpose: Bring the canonical Excel data into the app's data pipeline. This is the core data expansion work.
Output: Import script, expanded raw JSON, rebuilt compiled data
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
@.planning/phases/8-data-expansion/8-RESEARCH.md
@.planning/phases/8-data-expansion/8-01-SUMMARY.md
@scripts/build-data.ts
@src/data/raw/people.json
@src/data/raw/events.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build Excel import script and import data</name>
  <files>
    scripts/import-xlsx.ts
    src/data/raw/people.json
    src/data/raw/events.json
  </files>
  <action>
Install xlsx (SheetJS) as a dev dependency: `npm install --save-dev xlsx`

Create `scripts/import-xlsx.ts` that:

1. Reads `TimelineDB.xlsx` from project root
2. Parses the **People** sheet:
   - Map each row to the raw person JSON shape (id, name, birthYear, deathYear, era, approximate, role, priority, track="people", themes, description, bio, scriptureRefs, relatedEvents, relatedBooks, relatedPeople, source, timelineStory, kingdom)
   - Generate IDs using the existing slug pattern: lowercase, spaces to hyphens, strip special chars
   - Map Excel column headers to JSON field names
   - Set `track: "people"` for all
   - Map `Approximate` boolean column per CONTEXT.md certainty rules (but store as raw boolean -- build-data.ts handles the 3-tier conversion)

3. Parses the **Kings** sheet:
   - Map each king row to raw person shape with `role: "King"`
   - Use Thiele dates as birthYear (reign start) and deathYear (reign end)
   - Determine `kingdom: "Israel"` or `kingdom: "Judah"` from column position
   - **Skip rows** named "Fall of Samaria" and "Fall of Jerusalem" (they're events, not kings)
   - For David and Solomon: if they already exist from People sheet, merge -- Thiele dates win for birthYear/deathYear, keep People sheet description/bio/scriptureRefs
   - Extract `Prophets` column as `relatedPeople` array (these are prophet IDs associated with each king)

4. Parses the **Events** sheet:
   - Map each row to raw event JSON shape
   - Map Excel `category = "Historical"` to `category: "Historical"` (the build pipeline's normalizeCategory will convert to `secular-context`)
   - For spanning events, populate both `year` (start) and `endYear` (end)
   - Set `track: "events"` for all

5. Merges with existing raw data:
   - Load current `people.json` and `events.json`
   - For entities in BOTH Excel and app: Excel data wins for dates, merge metadata
   - For entities ONLY in app (the 28 people, 7 events not in Excel): **Keep them in output** with a `"appOnly": true` marker field so we can present them to the user
   - For entities ONLY in Excel: add them
   - Deduplicate by ID

6. Writes merged output to `src/data/raw/people.json` and `src/data/raw/events.json`
7. Prints a summary: counts of added, updated, app-only entities

After creating the script, run it:
```
npx tsx scripts/import-xlsx.ts
```

Then run the build pipeline:
```
npm run build:data
npm run validate
```

Fix any validation errors that arise from the import.

**Important notes:**
- The Excel file is at the project root: `TimelineDB.xlsx`
- Column headers in Excel may have different casing/naming than JSON fields -- inspect the actual headers and map accordingly
- Some Excel cells may be empty -- handle gracefully (skip optional fields)
- King IDs: use the same slug pattern. For kings with ordinals (Jeroboam I, Jeroboam II), use `jeroboam-i`, `jeroboam-ii` pattern already established in the codebase
- If a king ID already exists in people.json (e.g., david, solomon, rehoboam, etc.), merge rather than duplicate
  </action>
  <verify>
`npx tsx scripts/import-xlsx.ts` runs without errors.
`npm run build:data` succeeds.
`npm run validate` passes.
People count is ~80-90 in compiled output.
Events count includes 10 secular-context events.
  </verify>
  <done>Excel data imported into raw JSON. Kings merged as people with Thiele dates. Secular-context events have correct years. Build and validation pass.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Excel data imported into raw JSON files. The following need user review:

1. **App-only entities** -- 28 people and 7 events exist in the app but NOT in the Excel spreadsheet. These are flagged with `appOnly: true` in the raw JSON.
2. **King merge results** -- David and Solomon dates updated to Thiele reign dates.
3. **Secular-context events** -- 10 historical events added with diamond rendering (not visible yet, UI comes in Plan 03).
4. **Overall data counts** -- verify the totals look right.
  </what-built>
  <how-to-verify>
1. Run `npm run dev` and visually inspect the timeline -- new kings should appear in kingdom lanes
2. Review the app-only entities list (will be printed by the import script) and decide: keep or remove each one
3. Check a few king entries in the detail panel to verify dates match Thiele chronology
4. Verify the app doesn't crash or show visual layout issues with the expanded data
  </how-to-verify>
  <resume-signal>Type "approved" with any keep/remove decisions for app-only entities, or describe issues to fix</resume-signal>
</task>

</tasks>

<verification>
- `npm run validate` passes with expanded dataset
- People count ~80-90 in compiled data
- Events include 10 secular-context entries
- King-prophet relationships generated in relationships.json
- No duplicate IDs
- App renders without crashes
</verification>

<success_criteria>
- All kings from Excel merged into people.json
- David/Solomon use Thiele dates
- 10 secular-context events in events.json with correct year/endYear
- King-prophet relationships in compiled relationships.json
- User has reviewed and approved app-only entity disposition
- Full validation passes
</success_criteria>

<output>
After completion, create `.planning/phases/8-data-expansion/8-02-SUMMARY.md`
</output>
