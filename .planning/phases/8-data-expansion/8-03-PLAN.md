---
phase: 8-data-expansion
plan: 03
type: execute
wave: 2
depends_on: [8-01]
files_modified:
  - src/components/timeline-nodes.tsx
  - src/components/right-rail.tsx
  - src/hooks/useEntityFilter.ts
  - src/components/side-navigator.tsx
autonomous: true
requirements: [R4.2, R4.4]

must_haves:
  truths:
    - "Secular-context events render as diamond (rotated square) shape"
    - "Detail panel shows collapsible Source footer when source field is present"
    - "Detail panel shows Timeline Story note for Active entities"
    - "Empty detail panel sections are hidden"
    - "Secular-context events can be toggled on/off via sidebar"
    - "Secular-context toggle defaults to ON (visible)"
  artifacts:
    - path: "src/components/timeline-nodes.tsx"
      provides: "Diamond shape for secular-context events"
      contains: "secular-context"
    - path: "src/components/right-rail.tsx"
      provides: "Source footer section, Timeline Story note"
      contains: "source"
    - path: "src/hooks/useEntityFilter.ts"
      provides: "showSecularContext filter toggle"
      contains: "showSecularContext"
    - path: "src/components/side-navigator.tsx"
      provides: "Secular-context toggle UI"
      contains: "secular-context"
  key_links:
    - from: "src/components/timeline-nodes.tsx"
      to: "src/data/timeline-data.ts"
      via: "Reads entity.category to determine shape"
      pattern: "secular-context.*rotate"
    - from: "src/hooks/useEntityFilter.ts"
      to: "src/components/side-navigator.tsx"
      via: "showSecularContext state + toggle callback"
      pattern: "showSecularContext"
    - from: "src/components/right-rail.tsx"
      to: "src/data/timeline-data.ts"
      via: "Reads entity.source and entity.timelineStory"
      pattern: "entity\\.source"
---

<objective>
Add UI rendering for secular-context events, detail panel enhancements, and filter toggle.

Purpose: Visual and interactive support for new data categories and enriched metadata.
Output: Diamond event nodes, Source footer, Timeline Story note, secular-context toggle
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
@src/components/timeline-nodes.tsx
@src/components/right-rail.tsx
@src/hooks/useEntityFilter.ts
@src/components/side-navigator.tsx
@src/data/timeline-data.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Diamond shape for secular-context events + detail panel enhancements</name>
  <files>
    src/components/timeline-nodes.tsx
    src/components/right-rail.tsx
  </files>
  <action>
**timeline-nodes.tsx -- Diamond shape for secular-context:**

In the `TimelineNode` component, modify the main node shape div (around line 332-342). Replace the single shape div with conditional rendering:

```tsx
const isSecularContext = entity.type === 'event' && entity.category === 'secular-context';
```

For the main node shape div:
- If `isSecularContext && isPointNode`: render a diamond (rotated square) instead of a circle. Use `transform: 'rotate(45deg)'` with `borderRadius: '2px'`. Keep the same size as other point events (`nodeHeight x nodeHeight`).
- If NOT secular-context: keep existing rendering unchanged (circle for point events, rounded rect for spans).

The diamond should use the same `backgroundColor`, `borderColor`, `borderWidth`, `boxShadow` logic as existing nodes. Only the shape changes.

For the label positioning on diamond nodes: labels should appear to the right of the diamond, same as circle events. The existing point-node label logic (left = nodeHeight + 6) works fine.

**right-rail.tsx -- Source footer and Timeline Story note:**

1. Add Source section at the bottom of the content div (after Notes section, around line 318). Use a native HTML `<details>` element (collapsed by default per CONTEXT.md):

```tsx
{entity.source && (
  <section>
    <details className="group">
      <summary
        className="cursor-pointer text-sm font-semibold uppercase tracking-wide list-none flex items-center gap-1"
        style={{
          color: 'var(--color-base-text-secondary)',
          fontSize: 'var(--type-label-xs-size)',
        }}
      >
        Source
        <span className="text-xs ml-1 opacity-60">+</span>
      </summary>
      <p
        className="mt-2"
        style={{
          fontSize: 'var(--type-body-sm-size)',
          lineHeight: 'var(--type-body-sm-line)',
          color: 'var(--color-base-text-primary)',
        }}
      >
        {entity.source}
      </p>
    </details>
  </section>
)}
```

2. Add Timeline Story note in the Summary section. After the description paragraph (around line 160), add:

```tsx
{entity.timelineStory === 'Active' && (
  <p
    className="italic"
    style={{
      fontSize: 'var(--type-label-xs-size)',
      color: 'var(--color-base-text-secondary)',
    }}
  >
    Dates reflect period of scriptural activity, not full lifespan.
  </p>
)}
```

3. The existing rendering already hides sections when data is absent (conditional `&&` rendering). Verify that all sections follow this pattern -- no empty sections should render.
  </action>
  <verify>
`npx tsc --noEmit` -- no type errors.
`npm run dev` -- app renders. If secular-context events exist in data, they should show as diamonds. Detail panel Source section should be collapsible.
  </verify>
  <done>Secular-context events render as diamonds. Detail panel has collapsible Source footer. Timeline Story note shows for Active entities. Empty sections hidden.</done>
</task>

<task type="auto">
  <name>Task 2: Secular-context filter toggle in sidebar</name>
  <files>
    src/hooks/useEntityFilter.ts
    src/components/side-navigator.tsx
  </files>
  <action>
**useEntityFilter.ts:**

1. Add state: `const [showSecularContext, setShowSecularContext] = useState(true);` (default ON per CONTEXT.md)

2. Add toggle callback: `const handleSecularContextToggle = useCallback(() => { setShowSecularContext(prev => !prev); }, []);`

3. In `filteredEntities` useMemo, add secular-context filter BEFORE the search filter:
```tsx
// Filter secular-context events
if (!showSecularContext && entity.type === 'event' && entity.category === 'secular-context') {
  return false;
}
```
Note: Need to import `normalizeEventCategory` or check `entity.category` -- but since `filteredEntities` filters `timelineData` which already has normalized categories, checking `entity.category === 'secular-context'` directly works. However, the current filter runs on `timelineData` which has categories already set by `transformEvents`. So the filter should work on the category field.

Wait -- looking at the current code, `filteredEntities` uses `timelineData` directly. The entities in `timelineData` already have their `category` field set by `transformEvents`. So checking `entity.category === 'secular-context'` is correct.

BUT: the current useMemo only depends on `[searchQuery]`. Update the dependency array to include `showSecularContext`.

4. Update return type `UseEntityFilterReturn` to include:
   - `showSecularContext: boolean`
   - `handleSecularContextToggle: () => void`

5. Add both to the return object.

**side-navigator.tsx:**

1. Add props to `SideNavigatorProps`:
   - `showSecularContext: boolean`
   - `onSecularContextToggle: () => void`

2. Add a "Historical Events" toggle in the sidebar. Place it after the Themes section divider, before the Periods section. Add a new section:

```tsx
<Divider />
<div style={{ padding: `10px ${sectionPx}px` }}>
  <SectionHeader isOpen={isOpen}>Filters</SectionHeader>
  {isOpen ? (
    <button
      onClick={onSecularContextToggle}
      aria-pressed={showSecularContext}
      className="w-full px-3 py-1.5 rounded-full transition-all text-center"
      style={{
        background: showSecularContext ? '#B8B0A8' : 'transparent',
        border: `1.5px solid ${showSecularContext ? '#B8B0A8' : 'var(--color-base-grid-major)'}`,
        color: 'var(--color-base-text-primary)',
        fontSize: 'var(--type-label-xs-size)',
        fontWeight: showSecularContext ? 600 : 500,
        fontFamily: 'var(--font-body)',
      }}
    >
      Historical Events
    </button>
  ) : (
    <button
      onClick={onSecularContextToggle}
      aria-pressed={showSecularContext}
      aria-label="Historical Events"
      title="Historical Events"
      className="flex items-center justify-center rounded-full transition-all flex-shrink-0"
      style={{
        width: 30,
        height: 30,
        background: showSecularContext ? '#B8B0A8' : 'transparent',
        border: `1.5px solid ${showSecularContext ? '#B8B0A8' : 'var(--color-base-grid-major)'}`,
        color: 'var(--color-base-text-primary)',
        fontSize: 'var(--type-label-xs-size)',
        fontWeight: 700,
        fontFamily: 'var(--font-body)',
      }}
    >
      H
    </button>
  )}
</div>
```

3. Find where `SideNavigator` is used (likely App.tsx or a parent component) and wire the new props from useEntityFilter. Search for `<SideNavigator` usage and add `showSecularContext={showSecularContext}` and `onSecularContextToggle={handleSecularContextToggle}`.
  </action>
  <verify>
`npx tsc --noEmit` -- no type errors.
`npm run dev` -- toggle appears in sidebar. Clicking it hides/shows secular-context events. Default state is ON (visible).
  </verify>
  <done>Secular-context toggle in sidebar. Toggling off hides diamond events from timeline. Default is ON.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes
- Diamond shape renders for secular-context events
- Source footer is collapsible, collapsed by default
- Timeline Story note shows for Active entities
- Toggle hides/shows secular-context events
- No visual regressions on existing events/people/books
</verification>

<success_criteria>
- Secular-context events render as diamonds
- Detail panel Source section works as collapsible footer
- Timeline Story note appears for Active entities
- Secular-context toggle works in sidebar (default ON)
- All existing node rendering unchanged
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/phases/8-data-expansion/8-03-SUMMARY.md`
</output>
