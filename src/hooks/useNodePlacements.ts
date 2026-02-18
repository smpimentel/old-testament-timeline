import { useMemo } from 'react';
import type { TimelineEntity } from '@/data/timeline-data';
import { computeNodeLabelVisibility } from '@/lib/timeline-label-layout';

interface TrackBand {
  baseY: number;
  laneStride: number;
  bandHeight: number;
}

interface SectionTracks {
  events: TrackBand;
  people: TrackBand;
  books: TrackBand;
}

export interface NodePlacement {
  entity: TimelineEntity;
  x: number;
  width: number;
  trackBand: TrackBand;
  forcePointNode: boolean;
}

export function useNodePlacements({
  filteredEntities,
  yearToX,
  pixelsPerYear,
  tracks,
  unknownEntityXById,
  unknownVisualEndYear,
  zoomLevel,
}: {
  filteredEntities: TimelineEntity[];
  yearToX: (year: number) => number;
  pixelsPerYear: number;
  tracks: SectionTracks;
  unknownEntityXById: Map<string, number>;
  unknownVisualEndYear: number;
  zoomLevel: number;
}) {
  const nodePlacements = useMemo(() => {
    return filteredEntities.map((entity) => {
      const isUnknownEraEntity = entity.startYear > unknownVisualEndYear;
      const shouldCompressUnknownX = entity.type !== 'book' && isUnknownEraEntity;
      const x = shouldCompressUnknownX
        ? (unknownEntityXById.get(entity.id) ?? yearToX(entity.startYear))
        : yearToX(entity.startYear);
      const width = entity.endYear
        ? (entity.startYear - entity.endYear) * pixelsPerYear
        : 32;

      let trackBand = tracks.events;
      if (entity.type === 'person') trackBand = tracks.people;
      else if (entity.type === 'book') trackBand = tracks.books;

      return {
        entity,
        x,
        width,
        trackBand,
        forcePointNode: entity.type === 'person' && isUnknownEraEntity,
      };
    });
  }, [filteredEntities, yearToX, pixelsPerYear, tracks, unknownEntityXById, unknownVisualEndYear]);

  const nodeLabelVisibility = useMemo(() => {
    return computeNodeLabelVisibility(
      nodePlacements.map(({ entity, x, width }) => ({
        id: entity.id,
        type: entity.type,
        swimlane: entity.swimlane ?? 0,
        x,
        width,
        name: entity.name,
        priority: entity.priority,
      })),
      zoomLevel,
    );
  }, [nodePlacements, zoomLevel]);

  return { nodePlacements, nodeLabelVisibility };
}
