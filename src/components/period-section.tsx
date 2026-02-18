import { useMemo } from 'react';
import { periods } from '@/data/timeline-data';
import { computePeriodLabelLayout } from '@/lib/timeline-label-layout';
import { PeriodBand } from './timeline-nodes';

interface PeriodSectionProps {
  yearToX: (year: number) => number;
  pixelsPerYear: number;
  totalHeight: number;
  unknownVisualStartYear: number;
  unknownVisualEndYear: number;
}

export function PeriodSection({
  yearToX,
  pixelsPerYear,
  totalHeight,
  unknownVisualStartYear,
  unknownVisualEndYear,
}: PeriodSectionProps) {
  const periodBands = useMemo(() => {
    const unknownStartX = yearToX(unknownVisualStartYear);
    const unknownEndX = yearToX(unknownVisualEndYear);
    const unknownVisualWidth = Math.max(0, unknownEndX - unknownStartX);

    return periods.map((period) => ({
      period,
      x: period.id === 'dates-unknown' ? unknownStartX : yearToX(period.startYear),
      width: period.id === 'dates-unknown'
        ? unknownVisualWidth
        : (period.startYear - period.endYear) * pixelsPerYear,
    }));
  }, [yearToX, pixelsPerYear, unknownVisualStartYear, unknownVisualEndYear]);

  const periodLabelLayout = useMemo(() => {
    return computePeriodLabelLayout(
      periodBands.map(({ period, x, width }) => ({
        id: period.id,
        name: period.name,
        x,
        width,
      })),
    );
  }, [periodBands]);

  return (
    <>
      {periodBands.map(({ period, x, width }) => {
        const labelPlacement = periodLabelLayout[period.id];
        return (
          <PeriodBand
            key={period.id}
            period={period}
            x={x}
            width={width}
            totalHeight={totalHeight}
            labelLane={labelPlacement?.lane}
          />
        );
      })}
    </>
  );
}
