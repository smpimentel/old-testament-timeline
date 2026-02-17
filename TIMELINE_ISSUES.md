# Timeline Issues Triage

## Summary
This document captures screenshot-visible timeline defects and structural causes that can reintroduce them.

Scope includes:
- UI rendering defects visible in the timeline
- Data and layout pipeline issues that produce or amplify those defects

Severity scale:
- `Critical`
- `High`
- `Medium`
- `Low`

## Issue Schema
Each issue follows this fixed schema:

`ID | Severity | Area | Symptom | Repro Steps | Expected | Actual | Evidence | Likely Root Cause | Fix Direction | Acceptance Criteria`

## Priority Order
Fix in this order:
1. `TL-004`
2. `TL-003`
3. `TL-001`
4. `TL-002`
5. `TL-005`
6. `TL-007`
7. `TL-006`

---

## TL-004
`ID | Severity | Area | Symptom | Repro Steps | Expected | Actual | Evidence | Likely Root Cause | Fix Direction | Acceptance Criteria`

`TL-004 | Critical | Layout engine / Track capacity | Nodes spill into adjacent tracks and visually collide when swimlane index exceeds configured lane count | 1) Open timeline 2) View dense patriarch cluster around 2000 BC and book cluster near 1406 BC 3) Observe vertical overflow into other track regions | All nodes should render inside their own track band with no cross-track overlap | Data contains swimlanes above configured lane capacity, so rendered Y positions exceed track bounds | Fixed lane counts: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/lib/timeline-track-layout.ts:61. Static layout creation: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/App.tsx:30. High swimlanes in data: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/compiled/people.json:780 and /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/compiled/books.json:126 | Track layout is computed from defaults, not from actual entity swimlane maxima | Build laneCount from entity data (createConfigFromEntities/computeRequiredLanes) before computeTrackLayout; add regression assertions that all entity Y positions stay in-band | For each type, max(swimlane)+1 <= laneCount; no node from one track renders into another at zoom 0.5, 1.0, 1.5, 2.0, 3.0`

## TL-003
`ID | Severity | Area | Symptom | Repro Steps | Expected | Actual | Evidence | Likely Root Cause | Fix Direction | Acceptance Criteria`

`TL-003 | High | Viewport range / Chronological domain | Earliest entities are clipped/truncated at the left edge | 1) Open timeline 2) Pan to earliest years 3) Inspect 4004 BC entities and labels | Timeline domain should fully include earliest data points | Timeline starts at 4000 BC while data includes 4004 BC nodes/periods | Domain constants: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/hooks/useViewport.ts:4 and /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/hooks/useViewport.ts:40. Data at 4004 BC: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/compiled/events.json:82 and /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/compiled/periods.json:123 | START_YEAR constant does not cover max(startYear) in compiled data | Derive timeline domain from compiled data or update constants to include earliest year with margin | max(startYear) <= START_YEAR and earliest entities render fully without clipping`

## TL-001
`ID | Severity | Area | Symptom | Repro Steps | Expected | Actual | Evidence | Likely Root Cause | Fix Direction | Acceptance Criteria`

`TL-001 | High | Period data / Period band rendering | Duplicate and overlapping period bands and labels render in same date ranges | 1) Open timeline 2) Observe bands in ranges 1876-1446, 1446-1406, 586-538, 538-400 3) Note duplicate labels and stacked band text | Canonical set of periods should render once per range | Duplicate period records render as separate bands with overlapping text | Duplicate ranges in raw periods: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/raw/periods.json:21, /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/raw/periods.json:102, /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/raw/periods.json:30, /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/raw/periods.json:111. Render-all path: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/App.tsx:188 | Period dataset mixes canonical and alternate labels without dedupe/merge rules | Define canonical period set (or alias mapping) and de-duplicate during build/transform; enforce uniqueness constraints by range and id | No duplicate period ranges are emitted; each timeline range has one intended band label`

## TL-002
`ID | Severity | Area | Symptom | Repro Steps | Expected | Actual | Evidence | Likely Root Cause | Fix Direction | Acceptance Criteria`

`TL-002 | High | Period label layout | Period titles overlap and become unreadable in dense/overlapping period segments | 1) Open timeline 2) Move to overlapping period region 3) Observe labels drawn on top of each other | Period labels should remain readable and non-overlapping | All labels are anchored to the same top-left offset with no collision strategy | Label anchor and text draw: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/components/timeline-nodes.tsx:24 and /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/components/timeline-nodes.tsx:33 | Rendering assumes one label per visual region and does not handle concurrent overlapping period bands | Introduce period-label collision handling (laneing, stacking, hiding by priority, or merge labels for overlapping bands) | In overlapping regions, labels never fully overlap; readability remains acceptable at default zoom`

## TL-005
`ID | Severity | Area | Symptom | Repro Steps | Expected | Actual | Evidence | Likely Root Cause | Fix Direction | Acceptance Criteria`

`TL-005 | High | Node label rendering / Zoom tiers | Same-year or near-year nodes in the same swimlane produce overlapping text at medium zoom | 1) Zoom to ~150%-175% 2) Inspect years with dense events/books (for example 1446 and 1406) 3) Observe label collisions | Node labels should remain legible and avoid overlap | Labels turn on at medium zoom with fixed placement and no collision avoidance | Label thresholds: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/config/timeline-node-config.ts:25, /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/config/timeline-node-config.ts:33, /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/config/timeline-node-config.ts:41. Fixed label placement: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/components/timeline-nodes.tsx:339 | Label visibility is enabled before there is sufficient horizontal separation; no overlap resolution exists | Add label collision logic (suppress/offset/truncate by density), and/or shift label visibility thresholds to later zoom tiers | At label-enabled zoom, same-year entities do not render unreadable overlapping labels`

## TL-007
`ID | Severity | Area | Symptom | Repro Steps | Expected | Actual | Evidence | Likely Root Cause | Fix Direction | Acceptance Criteria`

`TL-007 | High | Theme filtering/highlighting pipeline | Theme chips do not correctly filter/highlight entities because entities lack mapped themes | 1) Toggle any theme chip in toolbar 2) Observe that matching behavior is absent or inconsistent 3) Inspect data model | Entities should carry theme metadata used by filter/highlight logic | Filter/highlight logic checks entity.themes but transform does not map themes onto entities | Theme-dependent filter check: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/hooks/useEntityFilter.ts:44. Missing theme mapping paths: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/timeline-data.ts:176, /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/timeline-data.ts:194, /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/timeline-data.ts:211 | Data transformation does not populate `themes`; current theme model is incomplete for filtering | Define and normalize theme mapping in compiled/raw data and map onto TimelineEntity; align `ThemeTag` typing to actual theme set | Activating a theme keeps matching entities visible/highlighted and dims non-matching entities deterministically`

## TL-006
`ID | Severity | Area | Symptom | Repro Steps | Expected | Actual | Evidence | Likely Root Cause | Fix Direction | Acceptance Criteria`

`TL-006 | Medium | Data build pipeline / Event categorization | Event semantic categories from authored data are dropped in compilation | 1) Inspect raw events with category values (Judgment, Covenant, Deliverance, etc.) 2) Inspect compiled events categories 3) Compare UI category behavior | Compiled events should preserve intended semantic categories from raw data | Build step hardcodes categories to ["event"] | Hardcoded assignment: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/scripts/build-data.ts:144. Raw categories present: /Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/raw/events.json:22 | Build transformer ignores `raw.category` and replaces with generic category | Preserve/normalize event category from raw in build output; validate category vocabulary against schema | Compiled events retain semantic categories and downstream category-dependent UI logic reflects them`

---

## Important Changes/Additions to Public APIs/Interfaces/Types
1. No end-user API changes in this documentation pass.
2. This document defines a stable internal issue schema for bug triage and ticket conversion.
3. Planned fix-track note: likely type adjustments in `/Users/Stephen1/Desktop/gitprojects/old-testament-timline/src/data/timeline-data.ts` for:
   - `ThemeTag` widening/normalization
   - Entity theme mapping population

## Test Cases and Scenarios
1. Visual scenario: 4000-1300 BC view at ~75%-100% zoom reproduces period-label collisions.
2. Data integrity scenario: assert `max(startYear) <= START_YEAR` and `min(endYear) >= END_YEAR`.
3. Layout integrity scenario: assert per-type `max(swimlane)+1 <= configured laneCount`.
4. Label-collision scenario: same-year entities (for example, 1446 and 1406) do not overlap text at label-enabled zoom tiers.
5. Theme behavior scenario: enabling a theme chip keeps matching entities visible/highlighted and dims non-matches.
6. Regression scenario: no cross-track node overlap at zoom levels `0.5`, `1.0`, `1.5`, `2.0`, `3.0`.

## Assumptions and Defaults
1. Scope includes both screenshot-visible defects and root-cause structural issues.
2. Output location is `/Users/Stephen1/Desktop/gitprojects/old-testament-timline/TIMELINE_ISSUES.md`.
3. Severity scale is `Critical`, `High`, `Medium`, `Low`.
4. Screenshot evidence is treated as current-state behavior in this workspace.
5. Priority order is `TL-004`, `TL-003`, `TL-001`, `TL-002`, `TL-005`, `TL-007`, `TL-006`.
