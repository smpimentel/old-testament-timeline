# Timeline Node Dependency Tree

Purpose: map all code that controls timeline node appearance and behavior so node refactors can be scoped safely.

## 1) Runtime Dependency Tree (Node Look + Functionality)

```text
src/main.tsx
  -> imports src/styles/index.css (global style tokens/utilities)
  -> renders src/App.tsx

src/App.tsx (composition + orchestration)
  -> data: timelineData, periods (src/data/timeline-data.ts)
  -> render primitives: TimelineNode, TimeGrid, PeriodBand (src/components/timeline-nodes.tsx)
  -> node-adjacent UI:
     -> HoverTooltip (src/components/hover-tooltip.tsx)
     -> RightRail (src/components/right-rail.tsx)
     -> RelationshipLine (src/components/relationship-lines.tsx)
     -> TimelineToolbar (src/components/timeline-toolbar.tsx)
     -> Minimap (src/components/minimap.tsx)
  -> behavior hooks:
     -> useViewport (pan/zoom/world coords)
     -> useEntitySelection (click/hover selection)
     -> useEntityFilter (search/theme filtering)
     -> usePathTracing (breadcrumb/path mode)
     -> useIsMobile (rail width behavior)

src/components/timeline-nodes.tsx (node visual core)
  -> PeriodBand (period header visuals)
  -> TimeGrid (major/minor year lines + labels)
  -> TimelineNode (button node shell + shape + badges + label)
     -> RoleBadge (people only)
     -> DateBadge (hover at higher zoom)
  -> color maps from src/data/timeline-data.ts:
     -> roleColors
     -> eventColors
     -> genreColors
```

## 2) Critical Files and Responsibilities

### Core render + placement
- `src/App.tsx:305` maps `filteredEntities` into `TimelineNode`.
- `src/App.tsx:307` computes X from `yearToX(entity.startYear)`.
- `src/App.tsx:308` computes node width from date span (`endYear`) or point width (`32`).
- `src/App.tsx:312` assigns track Y base (`events=196`, `people=296`, `books=456`).
- `src/App.tsx:316` computes `isHighlighted` by active theme match.
- `src/App.tsx:318` computes `isDimmed` when a theme filter is active.
- `src/App.tsx:319`/`src/App.tsx:320` computes breadcrumb state.

### Node visuals and node-level interaction
- `src/components/timeline-nodes.tsx:192` `TimelineNode` component.
- `src/components/timeline-nodes.tsx:212` zoom-tier sizing/visibility logic by entity type.
- `src/components/timeline-nodes.tsx:275` swimlane offset from `entity.swimlane`.
- `src/components/timeline-nodes.tsx:280` node color selection by type/category/genre.
- `src/components/timeline-nodes.tsx:288` highlight/dim/breadcrumb border and opacity logic.
- `src/components/timeline-nodes.tsx:318` event point-vs-span shape logic (circle vs rounded rect).
- `src/components/timeline-nodes.tsx:327` keyboard activation (`Enter`/`Space`) for accessibility.
- `src/components/timeline-nodes.tsx:337` `data-timeline-node` marker used by viewport drag guard.
- `src/components/timeline-nodes.tsx:390` people role badge rendering.
- `src/components/timeline-nodes.tsx:397` label rendering rules by zoom tier.
- `src/components/timeline-nodes.tsx:415` hover date badge visibility.

### Pan/zoom and drag behavior that affects node usability
- `src/hooks/useViewport.ts:38` year-to-X world coordinate conversion.
- `src/hooks/useViewport.ts:90` mouse-down handling for panning.
- `src/hooks/useViewport.ts:93` prevents pan-start when click starts on `[data-timeline-node]`.
- `src/hooks/useViewport.ts:176` wheel zoom and focal zoom anchoring.
- `src/hooks/useViewport.ts:82` center-on-entity helper (used by search and relationships).

### Selection, hover, path mode, filtering
- `src/hooks/useEntitySelection.ts:18` node click -> selected entity.
- `src/hooks/useEntitySelection.ts:23` hover entity + cursor position for tooltip.
- `src/hooks/useEntityFilter.ts:31` filtered entity list driving which nodes render.
- `src/hooks/useEntityFilter.ts:43` theme filter inclusion logic.
- `src/hooks/usePathTracing.ts:12` breadcrumb append logic (no duplicates).
- `src/hooks/usePathTracing.ts:30` breadcrumb numbering used by node badge.

### Node-driven companion panels/overlays
- `src/components/hover-tooltip.tsx:11` hover card content from hovered node.
- `src/components/right-rail.tsx:13` selected node detail panel.
- `src/components/right-rail.tsx:23` related entity lookup for connection navigation.
- `src/hooks/useModalA11y.ts:97` ESC + focus trap behavior used by right rail.
- `src/components/relationship-lines.tsx:12` breadcrumb line drawing between selected path nodes.

## 3) Data and Upstream Dependencies

### Runtime data adapter used by node render
- `src/data/timeline-data.ts:19` `TimelineEntity` model consumed by `TimelineNode`.
- `src/data/timeline-data.ts:92` `themeColors` mapping.
- `src/data/timeline-data.ts:100` `roleColors` mapping.
- `src/data/timeline-data.ts:112` `eventColors` mapping.
- `src/data/timeline-data.ts:125` `genreColors` mapping.
- `src/data/timeline-data.ts:176`/`194`/`211` transforms compiled JSON into UI entity shape.
- `src/data/timeline-data.ts:240` runtime `assignSwimlanes` (affects vertical lane stacking).
- `src/data/timeline-data.ts:282` exports `timelineData` used across app.

### Build pipeline feeding runtime adapter
- `scripts/build-data.ts:120` raw -> compiled transform functions.
- `scripts/build-data.ts:194` relationship extraction from raw cross-links.
- `scripts/build-data.ts:333` swimlane assignment during build.
- `scripts/build-data.ts:410` compiled JSON output to `src/data/compiled/*.json`.

Raw sources:
- `src/data/raw/people.json`
- `src/data/raw/events.json`
- `src/data/raw/books.json`
- `src/data/raw/periods.json`
- `src/data/raw/themes.json`

Compiled sources consumed at runtime:
- `src/data/compiled/people.json`
- `src/data/compiled/events.json`
- `src/data/compiled/books.json`
- `src/data/compiled/periods.json`
- `src/data/compiled/themes.json`
- `src/data/compiled/relationships.json`

## 4) Styling Dependencies for Node Look

Global token source:
- `src/styles/index.css:1` imports `theme.css`.
- `src/styles/theme.css:7` base palette tokens.
- `src/styles/theme.css:27` role palette tokens.
- `src/styles/theme.css:37` event palette tokens.
- `src/styles/theme.css:47` genre palette tokens.
- `src/styles/theme.css:57` typography tokens.
- `src/styles/theme.css:97` radius tokens (`--radius-sm` used by node shape).

Node-specific inline styling:
- `src/components/timeline-nodes.tsx:338` focus ring class uses hardcoded `focus:ring-blue-500`.
- `src/components/timeline-nodes.tsx:300` includes local `themeColorMap` (duplicates `themeColors` in data module).
- `src/components/timeline-nodes.tsx:364` event point circles via `borderRadius: '50%'`.

## 5) Interaction Flow Summary

```text
Toolbar change (search/theme/zoom/path)
  -> hooks update state (useEntityFilter/useViewport/usePathTracing)
  -> App recomputes filtered entities + highlight/dim + positions
  -> TimelineNode re-renders with new size/label/badge/opacity/border state

Node hover
  -> useEntitySelection.handleEntityHover
  -> App renders HoverTooltip

Node click
  -> handleEntityClick (App)
    -> optional breadcrumb add (path mode)
    -> select entity
  -> App renders RightRail for selected entity

RightRail relationship click (path mode)
  -> App.handleViewRelationship
    -> breadcrumb updates
    -> panToCenterOnYear
    -> selected entity swap
```

## 6) Test Coverage Relevant to Nodes

- `src/integration.test.tsx:96` click node opens right rail.
- `src/integration.test.tsx:172` path mode + breadcrumb behavior.
- `src/integration.test.tsx:26` zoom controls affecting rendered zoom state.
- `src/hooks/useViewport.test.ts:19` center-on-year calculations with rail width.
- `src/hooks/useEntityFilter.test.ts:5` search/theme filter state coverage.
- `src/hooks/usePathTracing.test.ts:5` breadcrumb logic coverage.
- `src/components/right-rail.test.tsx:43` right rail a11y/ESC/focus behavior.

Gap to note:
- No dedicated component tests currently target `src/components/timeline-nodes.tsx` zoom-tier visuals, point-vs-span shape, or highlight/dim style branches directly.

## 7) Fast Edit Map (What to Change for Common Goals)

- Change node sizes/label visibility by zoom:
  - `src/config/timeline-node-config.ts` (zoom tiers)
- Change node color mapping by entity type/category:
  - `src/data/timeline-data.ts:100`
  - `src/data/timeline-data.ts:112`
  - `src/data/timeline-data.ts:125`
- Change highlight/dim/breadcrumb border treatment:
  - `src/config/timeline-node-config.ts` (themeHighlightColors, breadcrumbAccentColor)
  - `src/components/timeline-nodes.tsx:288`
- Change node track positions or default track height:
  - `src/lib/timeline-track-layout.ts` (DEFAULT_TRACK_CONFIG)
- Change vertical overlap handling:
  - `src/data/timeline-data.ts:240`
  - `scripts/build-data.ts:333`
- Change hover/selection behavior:
  - `src/hooks/useEntitySelection.ts:18`
  - `src/components/hover-tooltip.tsx:11`
  - `src/components/right-rail.tsx:13`

## 8) Node Tuning Guide (Config-Only Changes)

### Overview
Node visuals can be tuned via two config files without touching render logic:
- `src/config/timeline-node-config.ts` - zoom-based sizing
- `src/lib/timeline-track-layout.ts` - vertical track spacing

### Zoom Tier Config (`src/config/timeline-node-config.ts`)

**Key exports:**
- `getNodeMetrics(entityType, zoomLevel)` - returns {height, showLabel, showBadges}
- `getMaxNodeHeight(entityType)` - returns height at max zoom
- `themeHighlightColors` - outline colors for theme highlights
- `breadcrumbAccentColor` - border color for path mode

**Zoom tier arrays (one per entity type):**
```ts
const personZoomTiers: ZoomTier[] = [
  { maxZoom: 0.75, metrics: { height: 4, showLabel: false, showBadges: false } },
  { maxZoom: 1.25, metrics: { height: 8, showLabel: false, showBadges: false } },
  { maxZoom: 1.5, metrics: { height: 16, showLabel: false, showBadges: false } },
  { maxZoom: 1.75, metrics: { height: 16, showLabel: true, showBadges: false } },
  { maxZoom: Infinity, metrics: { height: 24, showLabel: true, showBadges: true } },
];
```

**How tiers work:** First tier where `zoomLevel < maxZoom` wins. Tiers checked in order.

**Tuning guide:**
| Goal | Edit |
|------|------|
| Make nodes taller at low zoom | Increase `height` in low-zoom tiers |
| Show labels earlier | Lower `maxZoom` threshold where `showLabel: true` |
| Hide badges entirely | Set `showBadges: false` in all tiers |
| Add new zoom breakpoint | Insert tier in array (keep ascending maxZoom order) |

### Track Layout Config (`src/lib/timeline-track-layout.ts`)

**Key exports:**
- `computeTrackLayout(config?)` - returns {events, people, books, totalHeight}
- `validateTrackLayout(layout)` - returns true if no overlaps
- `getEntityY(layout, entityType, swimlane)` - Y position for entity
- `DEFAULT_TRACK_CONFIG` - base config

**DEFAULT_TRACK_CONFIG keys:**
```ts
{
  maxNodeHeight: { event: 24, person: 28, book: 22 },
  laneGap: 8,        // vertical gap between swimlanes
  trackGap: 48,      // vertical gap between track bands
  headerOffset: 100, // Y offset for period bands
  laneCount: { event: 4, person: 6, book: 3 },
}
```

**Layout invariants:**
- `laneStride = maxNodeHeight + laneGap`
- `bandHeight = laneStride * laneCount`
- Tracks stack: events (top) -> people -> books (bottom)
- No overlap: each band ends before next begins

**Tuning guide:**
| Goal | Edit |
|------|------|
| More vertical breathing room | Increase `laneGap` |
| More space between tracks | Increase `trackGap` |
| Support more swimlanes | Increase `laneCount` for type |
| Taller nodes at max zoom | Increase `maxNodeHeight` (must match node config) |

### Safe Workflow for Node Visual Changes

1. **Zoom sizing only:** Edit `src/config/timeline-node-config.ts` zoom tiers
2. **Track layout only:** Edit `DEFAULT_TRACK_CONFIG` in `src/lib/timeline-track-layout.ts`
3. **Verify no collisions:** `validateTrackLayout(computeTrackLayout())` returns true
4. **Test at all zoom levels:** Zoom 0.5 -> 3.0, check no overlap/clipping
5. **Keep max heights in sync:** `maxNodeHeight` in layout config should match highest tier height in node config (plus any badge overhang)

### Files You Should NOT Edit for Visual Tuning

- `src/components/timeline-nodes.tsx` - render logic; reads from config
- `src/App.tsx` - orchestration; consumes layout
- `src/hooks/useViewport.ts` - pan/zoom math; independent of visuals
