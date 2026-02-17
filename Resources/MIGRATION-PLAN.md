# Prototype Migration Plan

## Overview
Extract prototype from `prototype/old-testament-timeline-prototype` into main project root.

---

## React Compatibility
**Verdict: Stay on React 19.2.0**
- Prototype code uses zero deprecated APIs
- All dependencies (Radix UI, Motion) fully support React 19
- Only action: optionally bump Motion from 12.23.24 to 12.33.0+
- Effort: TRIVIAL (<1 hour testing)

---

## Key Improvements

| Aspect | Current | Recommended |
|--------|---------|-------------|
| Scale | 3-4 entities | 1000s via modular files |
| Relationships | Embedded IDs | Normalized relationship table (queryable) |
| Certainty | `approximate` bool | `exact/approximate/estimated` + sources |
| Themes | Empty schema | Full taxonomy with hierarchy |
| Type Safety | Manual | Schema → TypeScript auto-generation |

---

## Phase 1: Dependency Installation

### 1.1 Core Styling Dependencies
```bash
npm install tailwindcss@4.1.12 @tailwindcss/vite
npm install class-variance-authority clsx tailwind-merge tw-animate-css
```

### 1.2 Radix UI Components (Only those actively used)
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover \
  @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator \
  @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch \
  @radix-ui/react-tabs @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip
```

### 1.3 Animation & Icons
```bash
npm install motion@12.23.24 lucide-react@0.487.0
```

### 1.4 Optional (add only if needed)
- `sonner` - toast notifications
- `cmdk` - command palette
- `vaul` - drawer component
- `react-resizable-panels` - if using resizable layout

---

## Phase 2: Tailwind/Styling Setup

### 2.1 Update vite.config.ts
Add Tailwind plugin and path alias:
```ts
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 2.2 Create Style Files
Copy from prototype to `src/styles/`:
1. `tailwind.css` - Tailwind config
2. `theme.css` - CSS variables (colors, typography, spacing)
3. `fonts.css` - Google Fonts imports
4. `index.css` - Main entry (imports above files)

### 2.3 Update main.tsx
```tsx
import './styles/index.css'
```

---

## Phase 3: Component Migration

### 3.1 Foundation Layer (migrate first)
| Component | Source | Target | Notes |
|-----------|--------|--------|-------|
| `utils.ts` | `app/components/ui/utils.ts` | `src/lib/utils.ts` | cn() helper |
| `button.tsx` | `app/components/ui/button.tsx` | `src/components/ui/button.tsx` | Base component |
| `input.tsx` | `app/components/ui/input.tsx` | `src/components/ui/input.tsx` | |
| `label.tsx` | `app/components/ui/label.tsx` | `src/components/ui/label.tsx` | |

### 3.2 UI Components Layer (used by timeline)
| Component | Dependencies |
|-----------|-------------|
| `card.tsx` | - |
| `badge.tsx` | - |
| `separator.tsx` | - |
| `slider.tsx` | radix-ui/slider |
| `switch.tsx` | radix-ui/switch |
| `select.tsx` | radix-ui/select |
| `popover.tsx` | radix-ui/popover |
| `dropdown-menu.tsx` | radix-ui/dropdown-menu |
| `dialog.tsx` | radix-ui/dialog |
| `scroll-area.tsx` | radix-ui/scroll-area |
| `tabs.tsx` | radix-ui/tabs |
| `toggle.tsx` | radix-ui/toggle |
| `toggle-group.tsx` | radix-ui/toggle-group |
| `tooltip.tsx` | radix-ui/tooltip |

### 3.3 Timeline Components (core application)
**Migrate in this order:**
1. `timeline-data.ts` -> `src/lib/timeline-data.ts` (types/constants only, data from JSON)
2. `timeline-nodes.tsx` -> `src/components/timeline/timeline-nodes.tsx`
3. `relationship-lines.tsx` -> `src/components/timeline/relationship-lines.tsx`
4. `hover-tooltip.tsx` -> `src/components/timeline/hover-tooltip.tsx`
5. `right-rail.tsx` -> `src/components/timeline/right-rail.tsx`
6. `minimap.tsx` -> `src/components/timeline/minimap.tsx`
7. `timeline-toolbar.tsx` -> `src/components/timeline/timeline-toolbar.tsx`
8. `welcome-overlay.tsx` -> `src/components/timeline/welcome-overlay.tsx`
9. `info-displays.tsx` -> `src/components/timeline/info-displays.tsx`
10. `App.tsx` -> `src/App.tsx`

---

## Phase 4: Data Model Reconciliation

### 4.1 Schema Differences

| Field | Prototype | Main JSON | Action |
|-------|-----------|-----------|--------|
| **People** | | | |
| Year fields | `startYear/endYear` | `birthYear/deathYear` | Rename in JSON |
| Certainty | `certainty: 'exact'|'approximate'` | `approximate: boolean` | Convert to certainty |
| Themes | `themes: ThemeTag[]` | Missing | Add to JSON |
| Priority | Present | Present | Keep |
| Relationships | `relationships: string[]` | Separate `relatedEvents`, `relatedBooks` | Consolidate |
| **Events** | | | |
| Year | `startYear` | `year` | Rename to startYear |
| Certainty | `certainty` | `approximate` | Convert |
| Category | `category` | Missing | Add to schema |
| **Books** | | | |
| Genre | `genre` | `category` | Keep both or map |
| **Periods** | | | |
| Colors | Different hex values | Different hex values | Use prototype colors (historical theme) |

### 4.2 Build Pipeline
- **Build script**: `raw/` files → `compiled/` files
- **Type generation**: `json-schema-to-typescript` for auto-generated types
- **Runtime validation**: `ajv` for schema validation
- **Relationships**: Normalize into separate table

### 4.3 Data Adapter
Create `src/lib/data-adapter.ts`:
```ts
// Transform JSON data to TimelineEntity format
export function loadTimelineData(): TimelineEntity[] {
  // Load from JSON files
  // Transform to prototype format
  // Assign swimlanes
}
```

---

## Phase 5: Final Integration

### 5.1 Import Path Updates
Update all imports to use `@/` alias:
```ts
import { Button } from '@/components/ui/button'
import { TimelineNode } from '@/components/timeline/timeline-nodes'
```

### 5.2 Data Loading in App.tsx
Replace hardcoded data with JSON imports:
```ts
import periodsData from '@/data/periods.json'
import peopleData from '@/data/people.json'
import eventsData from '@/data/events.json'
import booksData from '@/data/books.json'
```

### 5.3 Remove Prototype Folder
After verification, delete `prototype/` folder.

---

## Phase 6: Testing & Verification

### 6.1 Visual Regression
- [ ] Period bands render correctly
- [ ] Timeline nodes positioned correctly
- [ ] Hover tooltips appear
- [ ] Right rail opens on click
- [ ] Minimap functional
- [ ] Zoom/pan works
- [ ] Relationship lines draw

### 6.2 Functionality
- [ ] Search finds entities
- [ ] Period jump navigates
- [ ] Theme filtering works
- [ ] Path mode tracks breadcrumbs
- [ ] Welcome overlay shows on first load

### 6.3 Data Integrity
- [ ] All periods from JSON display
- [ ] All people render with correct dates
- [ ] All events positioned correctly
- [ ] All books visible
- [ ] Relationships resolve to valid entities

---

## File Structure After Migration

```
src/data/
├── schemas/           # JSON Schema definitions
│   ├── common.schema.json      # Shared: dates, refs, relationships
│   ├── people.schema.json
│   ├── events.schema.json
│   ├── books.schema.json
│   ├── periods.schema.json
│   ├── themes.schema.json
│   └── relationships.schema.json
│
├── raw/               # Editable source files (10-20 entities each)
│   ├── people/
│   │   ├── patriarchs.json
│   │   ├── judges.json
│   │   ├── kings.json
│   │   └── prophets.json
│   ├── events/
│   │   ├── covenants.json
│   │   ├── wars.json
│   │   └── constructions.json
│   └── books/
│       └── books.json
│
├── compiled/          # Build-time generated (UI consumes these)
│   ├── people.json
│   ├── events.json
│   ├── books.json
│   └── relationships.json
│
└── metadata/
    ├── periods.json
    ├── themes.json
    └── certainty-levels.json
```

**Additional folders:**
```
src/
  App.tsx                     # Root component (from prototype)
  main.tsx                    # Entry point
  styles/
    index.css
    tailwind.css
    theme.css
    fonts.css
  lib/
    utils.ts                  # cn() helper
    timeline-data.ts          # Types, constants, swimlane logic
    data-adapter.ts           # JSON to TimelineEntity transform
  components/
    ui/                       # Shadcn/Radix wrappers
      button.tsx
      card.tsx
      ...
    timeline/                 # Timeline-specific
      timeline-nodes.tsx
      timeline-toolbar.tsx
      hover-tooltip.tsx
      right-rail.tsx
      minimap.tsx
      relationship-lines.tsx
      welcome-overlay.tsx
      info-displays.tsx
```

---

## Unresolved Questions

1. **Data source of truth** - Prototype has 50+ entities hardcoded. JSON has ~15. Which is authoritative? Recommend: migrate prototype data to JSON.

2. **Theme colors** - JSON periods use pastel colors (#FFF9C4), prototype uses historical palette (#C8D4B8). Use prototype palette?

3. **Unused UI components** - Prototype has 48 UI components, timeline uses ~12. Migrate all or just used ones? Recommend: used only.

4. **Period date discrepancy** - JSON "dates-unknown" ends at 2500 BC, prototype has it ending at 3500 BC. Verify timeline accuracy.

5. **Missing entities** - Prototype has Isaac, Jacob, Joseph, Joshua, Samuel, Saul, Solomon, Elijah, etc. JSON only has Abraham, Moses, David. Add missing to JSON?

6. **Theme tags** - Prototype has Covenant/Kingship/Land/Messiah. JSON has no theme system. Add themes to JSON schema?

7. **Swimlane algorithm** - Prototype calculates swimlanes at runtime. Keep this or pre-compute and store in JSON?
