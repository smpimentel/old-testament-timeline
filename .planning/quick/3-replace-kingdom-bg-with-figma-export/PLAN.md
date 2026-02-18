# Quick Task 3: Replace Kingdom Background with Updated Figma Export

## Goal
Replace inline SVG in `kingdom-background.tsx` with updated Figma export. Anchor using Rectangle 9 left edge = Exile period start (586 BC).

## Changes

### `src/components/kingdom-background.tsx`
1. Update `FIGMA_VIEWBOX_WIDTH`: 9072 → 8962
2. Update `FIGMA_EXILE_VIEWBOX_X`: 8300 → 8190
3. Replace all SVG paths, filters, gradients with new Figma geometry
4. Convert HTML SVG attrs → React camelCase
5. Replace `var(--fill-0, #color)` → plain hex
6. Labels (ISRAEL/JUDAH) removed (not in new Figma export)

## Verification
- App renders without errors
- Kingdom background aligns correctly (Rectangle 9 left edge at Exile start)
