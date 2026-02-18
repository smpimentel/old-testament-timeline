# Technology Stack

**Analysis Date:** 2026-02-17

## Languages

**Primary:**
- TypeScript ~5.9.3 - All application code (`src/`), build scripts (`scripts/build-data.ts`, `scripts/validate-data.ts`), config files (`vite.config.ts`, `vitest.config.ts`)

**Secondary:**
- JavaScript (CommonJS) - Legacy export scripts (`scripts/export-period-sections.cjs`, `scripts/export-drawio.cjs`)
- JavaScript (ESM) - SVG generator (`scripts/generate-figma-svg.mjs`)
- Python - SVG export utility (`scripts/export-events-sheet-svg.py`)
- CSS - Styles with CSS custom properties (`src/styles/theme.css`, `src/styles/fonts.css`, `src/styles/tailwind.css`)
- JSON - Data layer (`src/data/raw/*.json`, `src/data/compiled/*.json`, `src/data/schemas/**/*.json`)

## Runtime

**Environment:**
- Node.js 22 (specified in CI workflows `.github/workflows/ci.yml`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.0 - UI framework, SPA with single `<App />` component
- Tailwind CSS 4.1.12 - Utility-first CSS via Vite plugin `@tailwindcss/vite`
- Radix UI - Headless accessible component primitives (dialog, popover, select, tabs, tooltip, slider, etc.)
- Motion (Framer Motion) 12.23.24 - Animation library for `AnimatePresence` transitions

**Testing:**
- Vitest 4.0.18 - Test runner, config at `vitest.config.ts`
- Testing Library (React 16.3.2, jest-dom 6.9.1, user-event 14.6.1) - Component testing utilities
- jsdom 28.0.0 - DOM environment for tests

**Build/Dev:**
- Vite 7.2.4 - Dev server and bundler, config at `vite.config.ts`
- `@vitejs/plugin-react` 5.1.1 - React Fast Refresh and JSX transform
- `tsx` 4.21.0 - TypeScript execution for scripts (build-data, validate-data)
- ESLint 9.39.1 - Linting, flat config at `eslint.config.js`

## Key Dependencies

**Critical:**
- `react` ^19.2.0 / `react-dom` ^19.2.0 - Core rendering
- `tailwindcss` ^4.1.12 + `@tailwindcss/vite` ^4.1.18 - Tailwind v4 with Vite integration
- `motion` ^12.23.24 - Layout animations, `AnimatePresence` for mount/unmount transitions

**UI Components (Radix):**
- `@radix-ui/react-dialog` ^1.1.15
- `@radix-ui/react-dropdown-menu` ^2.1.16
- `@radix-ui/react-popover` ^1.1.15
- `@radix-ui/react-scroll-area` ^1.2.10
- `@radix-ui/react-select` ^2.2.6
- `@radix-ui/react-separator` ^1.1.8
- `@radix-ui/react-slider` ^1.3.6
- `@radix-ui/react-slot` ^1.2.4
- `@radix-ui/react-switch` ^1.2.6
- `@radix-ui/react-tabs` ^1.1.13
- `@radix-ui/react-toggle` ^1.1.10
- `@radix-ui/react-toggle-group` ^1.1.11
- `@radix-ui/react-tooltip` ^1.2.8

**Styling Utilities:**
- `class-variance-authority` ^0.7.1 - Variant-based component styling (shadcn pattern)
- `clsx` ^2.1.1 - Conditional className joining
- `tailwind-merge` ^3.4.0 - Intelligent Tailwind class merging
- `tw-animate-css` ^1.4.0 - Tailwind animation presets

**Icons:**
- `lucide-react` ^0.487.0 - Icon library

## Configuration

**TypeScript:**
- `tsconfig.json` - Project references root (references `tsconfig.app.json` + `tsconfig.node.json`)
- `tsconfig.app.json` - App code: target ES2022, strict mode, bundler moduleResolution, path alias `@/*` -> `src/*`
- `tsconfig.node.json` - Node scripts: target ES2023, bundler moduleResolution

**Build:**
- `vite.config.ts` - Base `./` for GitHub Pages, React plugin, Tailwind plugin, `@` path alias
- `vitest.config.ts` - jsdom environment, globals enabled, setup file `src/test/setup.ts`, v8 coverage with thresholds (statements 65%, branches 55%, functions 70%, lines 65%)

**Linting:**
- `eslint.config.js` - Flat config, TypeScript-ESLint recommended, react-hooks, react-refresh plugins. Ignores `dist/`, `coverage/`, `prototype/`

**Styling:**
- `src/styles/index.css` - Import chain: `fonts.css` -> `tailwind.css` -> `theme.css`
- `src/styles/tailwind.css` - Tailwind v4 with `@import 'tailwindcss' source(none)` and `tw-animate-css`
- `src/styles/theme.css` - Comprehensive CSS custom properties design system (colors, typography, spacing, shadows, motion tokens)
- `src/styles/fonts.css` - Google Fonts imports (Inter, Cormorant Garamond, Source Sans 3, IBM Plex Mono)

**Scripts:**
- `npm run dev` - Vite dev server
- `npm run build` - `tsc -b && vite build` (prebuild runs `npm run validate`)
- `npm run lint` - ESLint
- `npm run test` - Vitest watch mode
- `npm run test:run` - Vitest single run
- `npm run test:coverage` - Vitest with v8 coverage
- `npm run build:data` - `tsx scripts/build-data.ts` (raw JSON -> compiled JSON)
- `npm run validate` - `tsx scripts/validate-data.ts` (schema validation + relationship integrity check, runs as prebuild)

## Platform Requirements

**Development:**
- Node.js 22+
- npm (lockfile v3)
- No `.nvmrc` or `.node-version` file present

**Production:**
- Static site (SPA) - deployed to GitHub Pages
- Output directory: `dist/`
- Base path: `./` (relative, for GitHub Pages project sites)

---

*Stack analysis: 2026-02-17*
