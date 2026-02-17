# Coding Conventions

**Analysis Date:** 2026-02-17

## Naming Patterns

**Files:**
- kebab-case for all source files: `timeline-track-layout.ts`, `timeline-node-config.ts`, `right-rail.tsx`
- Hooks use camelCase with `use` prefix: `useViewport.ts`, `usePathTracing.ts`, `useEntityFilter.ts`
- Test files colocated with `.test.ts`/`.test.tsx` suffix: `useViewport.test.ts`, `right-rail.test.tsx`
- Config files at root use kebab-case: `vitest.config.ts`, `vite.config.ts`, `eslint.config.js`

**Functions:**
- camelCase for all functions: `computeTrackLayout()`, `getNodeMetrics()`, `yearToX()`
- React components use PascalCase: `RightRail`, `TimelineNode`, `PeriodBand`
- Hooks use `use` prefix: `useViewport()`, `useEntityFilter()`, `usePathTracing()`
- Event handlers use `handle` prefix: `handleEntityClick`, `handleZoomIn`, `handleSearchSubmit`
- Callback props use `on` prefix: `onClose`, `onViewRelationship`, `onThemeToggle`

**Variables:**
- camelCase for all variables and state: `zoomLevel`, `panX`, `selectedEntity`
- UPPER_SNAKE_CASE for module-level constants: `START_YEAR`, `END_YEAR`, `BASE_PIXELS_PER_YEAR`, `DRAG_THRESHOLD`, `TIMELINE_WIDTH`
- Layout constants at module top: `PERIOD_SECTION_HEIGHT`, `MAIN_SECTION_TOP`, `EVENT_PEOPLE_GAP`

**Types/Interfaces:**
- PascalCase for types and interfaces: `TimelineEntity`, `TrackLayout`, `NodeMetrics`, `ZoomTier`
- Use `interface` for object shapes: `TrackLayoutConfig`, `RightRailProps`, `UseViewportOptions`
- Use `type` for unions and aliases: `EntityType`, `PersonRole`, `DateCertainty`, `ThemeTag`
- Props interfaces named `{Component}Props`: `RightRailProps`, `WelcomeOverlayProps`, `PeriodBandProps`
- Hook return types named `Use{Hook}Return`: `UseEntityFilterReturn`, `UseModalA11yReturn`
- Const arrays with `as const` for literal types: `THEME_TAGS`, `EVENT_CATEGORIES`

## Code Style

**Formatting:**
- No Prettier config; relies on editor defaults
- 2-space indentation (TypeScript convention)
- Single quotes for strings (enforced by ESLint)
- Semicolons used consistently
- Trailing commas in multi-line constructs

**Linting:**
- ESLint flat config at `eslint.config.js`
- Extends: `@eslint/js` recommended, `typescript-eslint` recommended, `react-hooks` recommended, `react-refresh` vite
- Targets `**/*.{ts,tsx}` files
- Ignores: `dist`, `coverage/**`, `prototype/**`

**TypeScript:**
- Strict mode enabled in `tsconfig.app.json`
- `noUnusedLocals: true`, `noUnusedParameters: true`
- `verbatimModuleSyntax: true` (use `import type` for type-only imports)
- Target: ES2022, Module: ESNext, JSX: react-jsx
- Path alias: `@/*` maps to `src/*`

## Import Organization

**Order:**
1. React/library imports: `import { useState, useMemo } from 'react'`
2. Third-party libraries: `import { motion } from 'motion/react'`
3. Internal modules using relative paths: `import { timelineData } from '../data/timeline-data'`
4. Types imported inline with `type` keyword: `import { type TimelineEntity } from '../data/timeline-data'`

**Path Aliases:**
- `@/*` alias available via `tsconfig.app.json` and `vite.config.ts` but rarely used in practice
- Most imports use relative paths: `'../hooks'`, `'./timeline-track-layout'`

**Barrel Files:**
- `src/hooks/index.ts` re-exports all hooks with named exports
- Components are imported directly from their files (no barrel)

## Error Handling

**Patterns:**
- Early return for missing data: `if (!entity) return;`
- Fallback defaults: `entity.swimlane ?? 0`, `p.priority || 2`
- Switch with default fallback: `default: return layout.events;` in `getTrackForType()`
- No try/catch blocks in application code; errors propagate naturally
- Validation functions return booleans: `validateTrackLayout()` returns `true`/`false`

## Logging

**Framework:** None. No logging framework is used.
- No `console.log` statements in production code
- No structured logging

## Comments

**When to Comment:**
- Module-level JSDoc on utility files: `/** Timeline Track Layout Engine */` at top of `src/lib/timeline-track-layout.ts`
- JSDoc on exported functions: `/** Get node metrics for an entity type at a given zoom level. */`
- Section separators using `// ===== SECTION =====` pattern in data files: `// ===== TYPES =====`, `// ===== CORE LAYOUT CALCULATOR =====`
- Inline comments for non-obvious logic: `// Negative zoom < 0.4 so should hit first tier`
- `@deprecated` tags on deprecated exports: `/** @deprecated Use trackLayout.totalHeight */`

**JSDoc:**
- Used sparingly on public API functions in `src/lib/` and `src/config/`
- Not used on React components or hooks
- Not used on internal/private functions

## Function Design

**Size:** Functions are compact. Most under 30 lines. Largest functions are in `src/App.tsx` (the main component) and transform functions in `src/data/timeline-data.ts`.

**Parameters:**
- Object destructuring for hook options: `useViewport({ selectedEntityOpen, railWidth })`
- Object destructuring for component props: `RightRail({ entity, onClose, onViewRelationship, pathMode })`
- Positional params for utility functions: `getNodeMetrics(entityType, zoomLevel)`
- Default parameters: `computeTrackLayout(config = DEFAULT_TRACK_CONFIG)`

**Return Values:**
- Hooks return objects with named properties (state + handlers)
- Pure functions return typed values: `TrackLayout`, `NodeMetrics`, `Record<string, boolean>`
- Components return JSX

## Module Design

**Exports:**
- Named exports for everything: `export function RightRail`, `export const DEFAULT_TRACK_CONFIG`
- Single default export only for `App` component: `export default App`
- Types exported alongside implementations: `export type EntityType`, `export interface TrackLayout`
- Constants co-exported with related functions

**Barrel Files:**
- `src/hooks/index.ts` is the only barrel file; re-exports all hooks
- Components imported directly: `import { RightRail } from './components/right-rail'`

## File Organization

**Standard file structure (utility modules):**
1. Imports
2. Type definitions (`interface`, `type`)
3. Constants (`const`, `UPPER_CASE`)
4. Core functions
5. Utility/helper functions
6. Exports (at declaration site, not bottom)

**Standard file structure (React components):**
1. Library imports (React, motion, lucide)
2. Internal imports (data, hooks, types)
3. Props interface
4. Component function (exported named function, not arrow)
5. Helper functions (inline or above component)

**Standard file structure (hooks):**
1. React imports (`useState`, `useCallback`, `useMemo`)
2. Internal imports (data, types)
3. Options interface (if applicable)
4. Hook function (`export function use___()`)
5. State declarations
6. Callbacks/memos
7. Side effects (`useEffect`)
8. Return object

## Styling Approach

- Tailwind CSS v4 via `@tailwindcss/vite` plugin
- CSS custom properties for theme tokens in `src/styles/theme.css`
- Inline `style={}` for dynamic/computed values (positions, sizes, colors)
- Tailwind classes for layout/spacing: `className="absolute inset-0 cursor-grab"`
- No CSS modules, no styled-components
- `class-variance-authority` + `clsx` + `tailwind-merge` available (shadcn/ui pattern) but used minimally

---

*Convention analysis: 2026-02-17*
