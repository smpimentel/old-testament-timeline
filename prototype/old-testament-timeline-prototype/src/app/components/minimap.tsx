import { motion } from 'motion/react';
import type { TimelineEntity } from '../data/timeline-data';
import { periods } from '../data/timeline-data';

interface MinimapProps {
  entities: TimelineEntity[];
  viewportX: number;
  viewportWidth: number;
  totalWidth: number;
  onViewportChange: (x: number) => void;
  zoomLevel: number;
  pixelsPerYear: number;
}

export function Minimap({
  entities,
  viewportX,
  viewportWidth,
  totalWidth,
  onViewportChange,
  zoomLevel,
  pixelsPerYear,
}: MinimapProps) {
  const minimapWidth = 280;
  const minimapHeight = 140;
  const scale = minimapWidth / totalWidth;
  
  // Viewport width in world space (accounting for zoom)
  const worldViewportWidth = viewportWidth / zoomLevel;

  // Calculate viewport rectangle bounds (clamp to minimap)
  const viewportStart = Math.max(0, viewportX);
  const viewportEnd = Math.min(totalWidth, viewportX + worldViewportWidth);
  const clampedViewportX = viewportStart;
  const clampedViewportWidth = viewportEnd - viewportStart;

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timelineX = clickX / scale - worldViewportWidth / 2;
    onViewportChange(Math.max(0, Math.min(totalWidth - worldViewportWidth, timelineX)));
  };

  const handleViewportDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timelineX = clickX / scale - worldViewportWidth / 2;
    onViewportChange(Math.max(0, Math.min(totalWidth - worldViewportWidth, timelineX)));
  };
  
  // Helper to convert year to X position (matches main timeline)
  const yearToX = (year: number) => {
    return (4000 - year) * pixelsPerYear;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-6 right-6 z-30 rounded-lg shadow-xl p-3"
      style={{ 
        width: minimapWidth + 24,
        background: 'var(--color-base-surface-elevated)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--color-base-grid-major)',
      }}
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-2">
        <div 
          className="uppercase tracking-wide"
          style={{
            fontSize: 'var(--type-label-xs-size)',
            fontWeight: 600,
            color: 'var(--color-base-text-secondary)',
          }}
        >
          Navigator
        </div>
        <div 
          className="font-mono"
          style={{
            fontSize: 'var(--type-label-xs-size)',
            color: 'var(--color-base-text-secondary)',
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Minimap Canvas */}
      <div
        className="relative bg-background/50 rounded cursor-pointer overflow-hidden"
        style={{
          width: minimapWidth,
          height: minimapHeight,
        }}
        onClick={handleMinimapClick}
      >
        {/* Period bands */}
        {periods.map((period) => {
          const startX = yearToX(period.startYear) * scale;
          const width = (period.startYear - period.endYear) * pixelsPerYear * scale;
          return (
            <div
              key={period.id}
              style={{
                position: 'absolute',
                left: startX,
                top: 0,
                width: width,
                height: minimapHeight,
                backgroundColor: period.color,
                opacity: 0.2,
              }}
            />
          );
        })}

        {/* Entity markers */}
        {entities.filter(e => e.priority <= 2).map((entity) => {
          const x = yearToX(entity.startYear) * scale;
          const width = entity.endYear 
            ? (entity.startYear - entity.endYear) * pixelsPerYear * scale
            : 2;
          const y = entity.type === 'person' ? 20 : entity.type === 'event' ? 60 : 100;
          
          return (
            <div
              key={entity.id}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: Math.max(width, 2),
                height: 8,
                backgroundColor: entity.type === 'person' ? '#8b6f47' : entity.type === 'event' ? '#a67c52' : '#9d7e5a',
                opacity: 0.6,
                borderRadius: entity.type === 'event' ? '50%' : 2,
              }}
            />
          );
        })}

        {/* Viewport rectangle */}
        <motion.div
          style={{
            position: 'absolute',
            left: clampedViewportX * scale,
            top: 0,
            width: clampedViewportWidth * scale,
            height: minimapHeight,
            border: '2px solid var(--primary)',
            backgroundColor: 'rgba(92, 74, 58, 0.1)',
            cursor: 'grab',
          }}
          className="rounded pointer-events-auto"
          onMouseMove={handleViewportDrag}
          whileHover={{ borderWidth: 3 }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-[#8b6f47] rounded-sm" />
          <span className="text-[10px] text-muted-foreground">People</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-[#a67c52] rounded-full" />
          <span className="text-[10px] text-muted-foreground">Events</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-[#9d7e5a] rounded-sm" />
          <span className="text-[10px] text-muted-foreground">Books</span>
        </div>
      </div>
    </motion.div>
  );
}