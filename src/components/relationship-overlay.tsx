import type { TimelineEntity } from '@/data/timeline-data';
import { RelationshipLine } from './relationship-lines';

interface TrackBand {
  baseY: number;
  laneStride: number;
}

interface RelationshipOverlayProps {
  breadcrumbEntities: TimelineEntity[];
  unknownVisualEndYear: number;
  unknownEntityXById: Map<string, number>;
  yearToX: (year: number) => number;
  tracks: {
    events: TrackBand;
    people: TrackBand;
    books: TrackBand;
  };
}

export function RelationshipOverlay({
  breadcrumbEntities,
  unknownVisualEndYear,
  unknownEntityXById,
  yearToX,
  tracks,
}: RelationshipOverlayProps) {
  if (breadcrumbEntities.length <= 1) return null;

  const getEntityX = (item: TimelineEntity) => {
    const inUnknownZone = item.type !== 'book' && item.startYear > unknownVisualEndYear;
    if (inUnknownZone) {
      return unknownEntityXById.get(item.id) ?? yearToX(item.startYear);
    }
    return yearToX(item.startYear);
  };

  const getEntityCenterY = (e: TimelineEntity) => {
    let track = tracks.events;
    if (e.type === 'person') track = tracks.people;
    else if (e.type === 'book') track = tracks.books;
    const swimlane = e.swimlane ?? 0;
    return track.baseY + (swimlane * track.laneStride) + (track.laneStride / 2);
  };

  return (
    <>
      {breadcrumbEntities.slice(0, -1).map((entity, idx) => {
        const nextEntity = breadcrumbEntities[idx + 1];
        if (!entity || !nextEntity) return null;

        return (
          <RelationshipLine
            key={`${entity.id}-${nextEntity.id}`}
            startX={getEntityX(entity)}
            startY={getEntityCenterY(entity)}
            endX={getEntityX(nextEntity)}
            endY={getEntityCenterY(nextEntity)}
            type="breadcrumb"
            isAnimated
          />
        );
      })}
    </>
  );
}
