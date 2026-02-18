import { useMemo } from 'react';
import { timelineData } from '@/data/timeline-data';

export function useUnknownEra({
  yearToX,
  unknownVisualStartYear,
  unknownVisualEndYear,
}: {
  yearToX: (year: number) => number;
  unknownVisualStartYear: number;
  unknownVisualEndYear: number;
}) {
  const unknownVisualBand = useMemo(() => {
    const startX = yearToX(unknownVisualStartYear);
    const endX = yearToX(unknownVisualEndYear);
    return { startX, width: Math.max(0, endX - startX) };
  }, [yearToX, unknownVisualStartYear, unknownVisualEndYear]);

  const unknownEntityXById = useMemo(() => {
    const unknownEntities = timelineData
      .filter((entity) => entity.type !== 'book' && entity.startYear > unknownVisualEndYear)
      .sort((a, b) => {
        if (a.startYear !== b.startYear) return b.startYear - a.startYear;
        const typeOrder = { event: 0, person: 1, book: 2 } as const;
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        return a.id.localeCompare(b.id);
      });

    const map = new Map<string, number>();
    const edgeInset = 4;
    const endInset = 28;
    const minX = unknownVisualBand.startX + edgeInset;
    const maxX = unknownVisualBand.startX + Math.max(endInset, unknownVisualBand.width - endInset);
    const span = Math.max(0, maxX - minX);
    const divisor = Math.max(1, unknownEntities.length - 1);

    unknownEntities.forEach((entity, index) => {
      const ratio = unknownEntities.length === 1 ? 0.5 : index / divisor;
      map.set(entity.id, minX + (ratio * span));
    });

    return map;
  }, [unknownVisualBand.startX, unknownVisualBand.width, unknownVisualEndYear]);

  return { unknownVisualBand, unknownEntityXById };
}
