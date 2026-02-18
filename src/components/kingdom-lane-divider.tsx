import type { TrackBand } from '../lib/timeline-track-layout';
import type { KingdomLaneInfo } from '../data/timeline-data';

interface KingdomLaneDividerProps {
  yearToX: (year: number) => number;
  tracks: { events: TrackBand; people: TrackBand };
  kingdomLanes: { event: KingdomLaneInfo; person: KingdomLaneInfo };
}

const DIVISION_YEAR = 930;  // Kingdom splits
const NORTH_END_YEAR = 721; // Fall of Israel
const SOUTH_END_YEAR = 586; // Fall of Judah

function TrackDivider({
  yearToX,
  track,
  lanes,
}: {
  yearToX: (year: number) => number;
  track: TrackBand;
  lanes: KingdomLaneInfo;
}) {
  if (lanes.northLaneCount === 0 && lanes.southLaneCount === 0) return null;

  const divisionX = yearToX(DIVISION_YEAR);
  const northEndX = yearToX(NORTH_END_YEAR);
  const southEndX = yearToX(SOUTH_END_YEAR);

  const dividerY = track.baseY + lanes.southStartLane * track.laneStride;
  const northTopY = track.baseY + lanes.northStartLane * track.laneStride;
  const southBottomY = track.baseY + (lanes.southStartLane + lanes.southLaneCount) * track.laneStride;

  return (
    <>
      {/* North kingdom tint */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: divisionX,
          top: northTopY,
          width: northEndX - divisionX,
          height: dividerY - northTopY,
          background: 'rgba(180, 200, 220, 0.08)',
        }}
      />
      {/* South kingdom tint */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: divisionX,
          top: dividerY,
          width: southEndX - divisionX,
          height: southBottomY - dividerY,
          background: 'rgba(220, 190, 160, 0.08)',
        }}
      />
      {/* Divider line */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: divisionX,
          top: dividerY,
          width: southEndX - divisionX,
          height: 0,
          borderTop: '1px dashed rgba(184, 160, 128, 0.6)',
        }}
      />
      {/* North label */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: divisionX + 4,
          top: northTopY + 2,
          fontSize: 10,
          fontFamily: 'Source Sans 3, sans-serif',
          color: 'rgba(107, 123, 141, 0.7)',
          whiteSpace: 'nowrap',
        }}
      >
        Israel (North)
      </div>
      {/* South label */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: divisionX + 4,
          top: dividerY + 2,
          fontSize: 10,
          fontFamily: 'Source Sans 3, sans-serif',
          color: 'rgba(139, 112, 96, 0.7)',
          whiteSpace: 'nowrap',
        }}
      >
        Judah (South)
      </div>
    </>
  );
}

export function KingdomLaneDivider({ yearToX, tracks, kingdomLanes }: KingdomLaneDividerProps) {
  return (
    <>
      <TrackDivider yearToX={yearToX} track={tracks.events} lanes={kingdomLanes.event} />
      <TrackDivider yearToX={yearToX} track={tracks.people} lanes={kingdomLanes.person} />
    </>
  );
}
