# Figma Import Bundle

This folder is a drag-and-import package for Figma.

## Import Order
1. Import `01-components-and-styles.svg`
2. Import artboards:
   - `10-timeline-desktop-zoom-100.svg`
   - `11-timeline-desktop-zoom-150.svg`
   - `12-timeline-desktop-zoom-200.svg`
   - `20-timeline-mobile-zoom-100.svg`
3. Import token data (optional):
   - `tokens.json`
   - `layout-rules.json`
   - `tokens.csv`

## Notes
- All elements are plain editable vectors/text in Figma after import.
- Artboards include visual guides for tracks, lanes, period bands, labels, chips, and right rail.
- Zoom variants intentionally show different label density/collision behavior.

## Suggested Board Review Checklist
- Track spacing and lane capacity feel balanced
- Label hierarchy at 100/150/200 zoom
- Theme chips + selected/dimmed behavior
- Mobile readability and right-rail flow
