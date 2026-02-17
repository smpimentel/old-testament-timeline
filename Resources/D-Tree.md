# Dependency Tree - Old Testament Timeline Prototype

**Path**: `prototype/old-testament-timeline-prototype/src/`

---

## Entry Flow
```
main.tsx → App.tsx → [all components]
```

---

## Component Graph

### App.tsx (Root)
```
App.tsx
├── TimelineToolbar    ← 12 props, 8 callbacks
├── TimelineNodes      ← PeriodBand, TimeGrid, TimelineNode
├── RelationshipLine   ← SVG paths
├── HoverTooltip       ← entity + position
├── RightRail          ← entity detail sidebar
├── Minimap            ← viewport nav
└── WelcomeOverlay     ← onboarding modal
```

### Data Dependencies
```
timeline-data.ts
├── TimelineEntity, Period (types)
├── timelineData[]
├── periods[]
├── themeColors, roleColors, eventColors, genreColors
└── assignSwimlanes()

Consumed by:
  - App.tsx
  - TimelineToolbar (periods)
  - TimelineNodes (color maps)
  - RightRail (themeColors, lookup)
  - Minimap (periods)
```

---

## Types (timeline-data.ts)

| Type | Values |
|------|--------|
| EntityType | person, event, book |
| PersonRole | king, prophet, judge, priest, patriarch, warrior, scribe, other |
| EventCategory | war, treaty, discovery, construction, festival, succession, disaster, renaissance |
| BookGenre | political, cultural, religious, economic, military, scientific, agricultural, maritime |
| DateCertainty | exact, approximate |
| ThemeTag | Covenant, Kingship, Land, Messiah |

### TimelineEntity Interface
```
id, type, name, startYear, endYear?, certainty, priority(1-4),
description, themes?, role?, category?, genre?, relationships?,
scripture?, notes?, swimlane?
```

---

## App.tsx State (18 vars)

| Group | Variables |
|-------|-----------|
| Canvas | panX, panY, zoomLevel |
| Drag | isDragging, dragStart, lastPan, hasMoved, lastTouchDistance |
| Filter | searchQuery, selectedPeriod, activeThemes, showApproximate |
| Selection | selectedEntity, hoveredEntity, tooltipPosition |
| Path | pathMode, breadcrumbs, highlightedEntities |
| UI | showWelcome |

---

## Z-Index Stack

| z | Layer |
|---|-------|
| 50 | Toolbar, HoverTooltip, modals |
| 40 | RightRail |
| 35 | RightRail backdrop |
| 30 | Minimap |
| 25 | Breadcrumb badges |
| 20 | Breadcrumb nodes |
| 15 | Highlighted theme nodes |
| 10 | Default nodes |
| 5 | RelationshipLine paths |
| 0 | Background (bands, grid) |

---

## External Deps

**Core**: react 18.3.1, react-dom, vite 6.3.5, tailwindcss 4.1.12

**UI**: @radix-ui/* (25+ primitives), motion 12.23.24, lucide-react 0.487.0

**Utils**: class-variance-authority, clsx, tailwind-merge

---

## UI Utilities

| File | Export | Purpose |
|------|--------|---------|
| ui/utils.ts | cn() | clsx + tailwind-merge |
| use-mobile.ts | useMobile | responsive hook |

---

## File Map

```
src/
├── main.tsx
├── app/
│   ├── App.tsx
│   ├── components/
│   │   ├── ui/                 [60+ shadcn wrappers]
│   │   ├── timeline-toolbar.tsx
│   │   ├── timeline-nodes.tsx
│   │   ├── hover-tooltip.tsx
│   │   ├── right-rail.tsx
│   │   ├── minimap.tsx
│   │   ├── relationship-lines.tsx
│   │   ├── welcome-overlay.tsx
│   │   └── info-displays.tsx
│   └── data/
│       └── timeline-data.ts
└── styles/
    ├── index.css
    ├── tailwind.css
    ├── fonts.css
    └── theme.css
```
