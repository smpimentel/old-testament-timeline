interface KingdomLaneDividerProps {
  yearToX: (year: number) => number;
  dividerY: number;
}

const DIVISION_YEAR = 930;
const SOUTH_END_YEAR = 586;

/** Subtle dashed line between north/south kingdom bands */
export function KingdomLaneDivider({ yearToX, dividerY }: KingdomLaneDividerProps) {
  const divisionX = yearToX(DIVISION_YEAR);
  const southEndX = yearToX(SOUTH_END_YEAR);

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
