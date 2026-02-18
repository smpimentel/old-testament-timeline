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
      .filter((entity) => entity.type !== 'book' && entity.startYear > unknownVisualEndYear);

    // Group entities by startYear — all entities at the same year share one x-position
    const yearGroups = new Map<number, typeof unknownEntities>();
    for (const entity of unknownEntities) {
      const group = yearGroups.get(entity.startYear) ?? [];
      group.push(entity);
      yearGroups.set(entity.startYear, group);
    }
    const sortedYears = [...yearGroups.keys()].sort((a, b) => b - a);

    const map = new Map<string, number>();
    const edgeInset = 4;
    const endInset = 28;
    const minX = unknownVisualBand.startX + edgeInset;
    const maxX = unknownVisualBand.startX + Math.max(endInset, unknownVisualBand.width - endInset);
    const span = Math.max(0, maxX - minX);
    const divisor = Math.max(1, sortedYears.length - 1);

    sortedYears.forEach((year, groupIndex) => {
      const ratio = sortedYears.length === 1 ? 0.5 : groupIndex / divisor;
      const x = minX + (ratio * span);
      for (const entity of yearGroups.get(year)!) {
        map.set(entity.id, x);
      }
    });

    return map;
  }, [unknownVisualBand.startX, unknownVisualBand.width, unknownVisualEndYear]);

  return { unknownVisualBand, unknownEntityXById };
}
