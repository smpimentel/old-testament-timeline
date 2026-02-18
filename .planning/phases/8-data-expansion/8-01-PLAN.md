---
phase: 8-data-expansion
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/data/schemas/raw/people.raw.schema.json
  - src/data/schemas/raw/events.raw.schema.json
  - src/data/schemas/compiled/people.compiled.schema.json
  - src/data/schemas/compiled/events.compiled.schema.json
  - src/data/timeline-data.ts
  - scripts/build-data.ts
autonomous: true
requirements: [R4.4, R4.5]

must_haves:
  truths:
    - "Schema accepts source, timelineStory, relatedPeople fields on people"
    - "Schema accepts source field on events"
    - "Build pipeline passes through source and timelineStory fields"
    - "Build pipeline uses raw.endYear for spanning events instead of always copying raw.year"
    - "normalizeCategory maps 'historical' to 'secular-context'"
    - "Runtime types include source, timelineStory, secular-context category"
    - "Date certainty uses 'estimated' for pre-2300 BC entities"
  artifacts:
    - path: "src/data/schemas/raw/people.raw.schema.json"
      provides: "source, timelineStory, relatedPeople fields"
      contains: "timelineStory"
    - path: "src/data/schemas/compiled/people.compiled.schema.json"
      provides: "source, timelineStory fields"
      contains: "timelineStory"
    - path: "src/data/schemas/raw/events.raw.schema.json"
      provides: "source field"
      contains: "source"
    - path: "src/data/schemas/compiled/events.compiled.schema.json"
      provides: "source field"
      contains: "source"
    - path: "scripts/build-data.ts"
      provides: "Fixed event endYear, source/timelineStory passthrough, secular-context mapping, date certainty logic"
      exports: ["build"]
    - path: "src/data/timeline-data.ts"
      provides: "Updated types and color mapping"
      contains: "secular-context"
  key_links:
    - from: "scripts/build-data.ts"
      to: "src/data/schemas/raw/people.raw.schema.json"
      via: "RawPerson type mirrors schema"
      pattern: "source.*timelineStory"
    - from: "src/data/timeline-data.ts"
      to: "scripts/build-data.ts"
      via: "Compiled JSON shape matches runtime types"
      pattern: "secular-context"
---

<objective>
Update schemas, build pipeline, and runtime types for data expansion.

Purpose: Foundation for all Phase 8 data and UI changes. Without these schema/pipeline/type updates, new data cannot flow through the system.
Output: Updated schemas, fixed build-data.ts, updated timeline-data.ts types
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
@src/data/schemas/raw/people.raw.schema.json
@src/data/schemas/raw/events.raw.schema.json
@src/data/schemas/compiled/people.compiled.schema.json
@src/data/schemas/compiled/events.compiled.schema.json
@scripts/build-data.ts
@src/data/timeline-data.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update schemas for new fields</name>
  <files>
    src/data/schemas/raw/people.raw.schema.json
    src/data/schemas/raw/events.raw.schema.json
    src/data/schemas/compiled/people.compiled.schema.json
    src/data/schemas/compiled/events.compiled.schema.json
  </files>
  <action>
Add the following fields to raw people schema (all optional, inside items.properties):
- `source`: `{ "type": "string", "description": "Data source attribution" }`
- `timelineStory`: `{ "type": "string", "enum": ["Active", "Life"], "description": "Whether dates represent activity span or full lifespan" }`
- `relatedPeople`: `{ "type": "array", "items": { "type": "string" }, "description": "IDs of related people" }` (currently missing from raw people schema but events have it)

Add to raw events schema (optional, inside items.properties):
- `source`: `{ "type": "string", "description": "Data source attribution" }`

Add to compiled people schema (optional, inside items.properties):
- `source`: `{ "type": "string" }`
- `timelineStory`: `{ "type": "string", "enum": ["Active", "Life"] }`

Add to compiled events schema (optional, inside items.properties):
- `source`: `{ "type": "string" }`

Do NOT change `required` arrays or `additionalProperties` settings.
  </action>
  <verify>Run `npm run validate` -- should pass with existing data (new fields are all optional).</verify>
  <done>All four schemas accept new optional fields. Existing validation still passes.</done>
</task>

<task type="auto">
  <name>Task 2: Fix build pipeline and update runtime types</name>
  <files>
    scripts/build-data.ts
    src/data/timeline-data.ts
  </files>
  <action>
**build-data.ts changes:**

1. Fix `transformEvent` endYear bug (line ~157): Change `endYear: raw.year` to `endYear: raw.endYear ?? raw.year`. This allows spanning events (secular-context events like "Rise of Egyptian New Kingdom 1550-1070 BC").

2. Fix `normalizeCategory` to map 'historical' to 'secular-context': After the existing normalize logic (lowercase + hyphenate), add: `if (normalized === 'historical') return 'secular-context';` -- return this BEFORE the existing return statement.

3. Update `transformPerson` to pass through new fields:
   - Add `source: raw.source` (will be undefined if not present, that's fine)
   - Add `timelineStory: raw.timelineStory`
   - Update certainty mapping: Instead of `raw.approximate ? 'approximate' : 'exact'`, use the 3-tier mapping from CONTEXT.md:
     ```
     if (raw.birthYear > 2300) return 'estimated';  // Pre-2300 BC (higher year = earlier)
     return raw.approximate ? 'approximate' : 'exact';
     ```

4. Update `transformEvent` to pass through source:
   - Add `source: raw.source`
   - Apply same date certainty logic: `if (raw.year > 2300) return 'estimated'; return raw.approximate ? 'approximate' : 'exact';`

5. Update RawPerson interface: Add `source?: string`, `timelineStory?: string`, `relatedPeople?: string[]`

6. Update RawEvent interface: Add `source?: string`, `endYear?: number` (endYear already exists in schema but not in the TS interface)

7. In `extractRelationships`, add handling for `person.relatedPeople`:
   After the existing familyTree/relatedEvents/relatedBooks blocks for people, add:
   ```
   if (person.relatedPeople) {
     for (const relatedId of person.relatedPeople) {
       relationships.push({
         id: genId(),
         sourceId: person.id,
         targetId: relatedId,
         type: 'event-participant',
         confidence: 'high',
       });
     }
   }
   ```

**timeline-data.ts changes:**

1. Add `'secular-context'` to `EVENT_CATEGORIES` array (after 'event').

2. Add `secular-context` color to `eventColors`: `'secular-context': '#B8B0A8'` (muted gray-brown).

3. Add to `TimelineEntity` interface:
   - `source?: string`
   - `timelineStory?: 'Active' | 'Life'`

4. Update `transformPeople` to pass through new fields from compiled data:
   - Add `source: (p as Record<string, unknown>).source as string | undefined`
   - Add `timelineStory: (p as Record<string, unknown>).timelineStory as 'Active' | 'Life' | undefined`

5. Update `transformEvents` to pass through source:
   - Add `source: (e as Record<string, unknown>).source as string | undefined`

6. Update `normalizeEventCategory` to handle 'secular-context': The existing logic lowercases and checks the set. Since we added 'secular-context' to EVENT_CATEGORIES, this should work automatically. But also add explicit mapping: `if (normalized === 'historical') return 'secular-context';` before the set check.
  </action>
  <verify>
Run `npm run build:data` -- should complete without errors.
Run `npm run validate` -- should pass.
Run `npx tsc --noEmit` -- should compile without type errors.
  </verify>
  <done>Build pipeline fixes endYear bug, maps 'historical' to 'secular-context', passes through source/timelineStory, uses 3-tier certainty. Runtime types include secular-context category with color, source and timelineStory on TimelineEntity.</done>
</task>

</tasks>

<verification>
- `npm run validate` passes
- `npm run build:data` succeeds
- `npx tsc --noEmit` has no errors
- Existing app renders correctly (`npm run dev`)
</verification>

<success_criteria>
- All schemas accept new optional fields
- Build pipeline transforms endYear for spanning events
- 'historical' category maps to 'secular-context'
- Pre-2300 BC dates get 'estimated' certainty
- source/timelineStory flow from raw -> compiled -> runtime
- No regressions in existing data or UI
</success_criteria>

<output>
After completion, create `.planning/phases/8-data-expansion/8-01-SUMMARY.md`
</output>
