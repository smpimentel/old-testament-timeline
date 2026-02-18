interface KingdomLaneDividerProps {
  yearToX: (year: number) => number;
  mainSectionTop: number;
}

const DIVISION_YEAR = 930;
const SOUTH_END_YEAR = 586;

/** Subtle dashed line between north/south kingdom bands */
export function KingdomLaneDivider({ yearToX, mainSectionTop }: KingdomLaneDividerProps) {
  const divisionX = yearToX(DIVISION_YEAR);
  const southEndX = yearToX(SOUTH_END_YEAR);
  // SVG split: Rectangle 3 ends at y=390, Rectangle 4 starts at y=410 → midpoint ~400
  const dividerY = mainSectionTop + 400;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: divisionX,
        top: dividerY,
        width: southEndX - divisionX,
        height: 0,
        borderTop: '1px dashed rgba(184, 160, 128, 0.4)',
      }}
    />
  );
}
