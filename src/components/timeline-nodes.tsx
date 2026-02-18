import { type TimelineEntity, type Period, roleColors, eventColors, genreColors } from '../data/timeline-data';
import { getNodeMetrics, themeHighlightColors, breadcrumbAccentColor } from '../config/timeline-node-config';

// ===== PERIOD BAND =====
interface PeriodBandProps {
  period: Period;
  x: number;
  width: number;
  totalHeight: number;
  labelLane?: number;
}

export function PeriodBand({ period, x, width, totalHeight, labelLane = 0 }: PeriodBandProps) {
  const labelTop = 8 + (labelLane * 30);
  const showDate = width >= 140 && period.id !== 'dates-unknown';

  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left: x,
        width,
        height: totalHeight,
        background: 'transparent',
        borderRight: '1px solid rgba(111, 98, 84, 0.22)',
      }}
    >
      <div
        className="absolute left-4"
        style={{ top: labelTop }}
      >
        <div
          className="whitespace-nowrap overflow-hidden text-ellipsis"
          style={{
            maxWidth: Math.max(20, width - 10),
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'var(--font-timeline)',
            color: '#3A3F44',
          }}
        >
          {period.name}
        </div>
        {showDate && (
          <div
            className="whitespace-nowrap overflow-hidden text-ellipsis"
            style={{
              maxWidth: Math.max(20, width - 10),
              fontSize: '11px',
              fontWeight: 400,
              fontFamily: 'var(--font-timeline)',
              color: '#666666',
            }}
          >
            {period.startYear}–{period.endYear} BC
          </div>
        )}
      </div>
    </div>
  );
}

// ===== TIME GRID =====
interface TimeGridProps {
  startYear: number;
  endYear: number;
  pixelsPerYear: number;
  height: number;
  axisY?: number;
  unscaledUntilYear?: number;
}

export function TimeGrid({
  startYear,
  endYear,
  pixelsPerYear,
  height,
  axisY: axisYOverride,
  unscaledUntilYear,
}: TimeGridProps) {
  const gridLines = [];

  // Determine grid interval based on zoom (adjusted for 4px/yr)
  let majorInterval = 500;
  let minorInterval = 100;

  if (pixelsPerYear >= 6) {
    majorInterval = 100;
    minorInterval = 20;
  } else if (pixelsPerYear >= 2) {
    majorInterval = 200;
    minorInterval = 50;
  }

  // Major grid lines
  for (let year = Math.ceil(endYear / majorInterval) * majorInterval; year <= startYear; year += majorInterval) {
    if (unscaledUntilYear !== undefined && year > unscaledUntilYear) continue;
    const x = (startYear - year) * pixelsPerYear;
    gridLines.push(
      <div
        key={`major-${year}`}
        className="absolute top-0"
        style={{
          left: x,
          height,
          width: '1px',
          background: '#C7B8A2',
        }}
      >
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{
            fontSize: 'var(--type-label-xs-size)',
            color: '#6F6254',
            fontWeight: 600,
            fontFamily: 'var(--font-timeline)',
          }}
        >
          {year} BC
        </div>
      </div>
    );
  }

  // Minor grid lines
  if (pixelsPerYear >= 1) {
    for (let year = Math.ceil(endYear / minorInterval) * minorInterval; year <= startYear; year += minorInterval) {
      if (year % majorInterval !== 0) {
        if (unscaledUntilYear !== undefined && year > unscaledUntilYear) continue;
        const x = (startYear - year) * pixelsPerYear;
        gridLines.push(
          <div
            key={`minor-${year}`}
            className="absolute top-0"
            style={{
              left: x,
              height,
              width: '1px',
              background: '#E3D7C4',
            }}
          />
        );
      }
    }
  }

  // Timeline axis in the vertical center, matching the concept layout foundation.
  const axisY = axisYOverride ?? Math.round(height / 2);
  const axisTicks = [];
  for (let year = Math.ceil(endYear / 100) * 100; year <= startYear; year += 100) {
    if (unscaledUntilYear !== undefined && year > unscaledUntilYear) continue;
    const x = (startYear - year) * pixelsPerYear;
    axisTicks.push(
      <svg
        key={`axis-tick-${year}`}
        className="absolute"
        style={{ left: x - 3.5, top: axisY - 7.5 }}
        width="7"
        height="15"
        viewBox="0 0 7 15"
      >
        <polygon points="3.5,0 6.5,5 0.5,5" fill="#F5EDD6" />
        <polygon points="3.5,15 6.5,10 0.5,10" fill="#F5EDD6" />
      </svg>
    );
  }

  // Axis line
  const axisLine = (
    <div
      key="axis-line"
      className="absolute"
      style={{
        left: 0,
        top: axisY - 2.5,
        width: (startYear - endYear) * pixelsPerYear,
        height: '5px',
        background: '#F5EDD6',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
      }}
    />
  );

  return (
    <>
      {gridLines}
      {axisLine}
      {axisTicks}
    </>
  );
}

// ===== ROLE BADGE =====
interface RoleBadgeProps {
  role: string;
  size?: 'small' | 'medium';
}

export function RoleBadge({ role, size = 'medium' }: RoleBadgeProps) {
  const color = roleColors[role as keyof typeof roleColors] || roleColors.other;
  const isSmall = size === 'small';
  
  return (
    <div
      className="flex items-center justify-center rounded-full font-mono uppercase"
      style={{
        background: color,
        border: '1.5px solid var(--color-base-text-primary)',
        color: 'var(--color-base-text-primary)',
        fontSize: isSmall ? '9px' : 'var(--type-label-xs-size)',
        fontWeight: 600,
        width: isSmall ? '20px' : '24px',
        height: isSmall ? '20px' : '24px',
        letterSpacing: '0.02em',
      }}
      title={role.charAt(0).toUpperCase() + role.slice(1)}
    >
      {role.charAt(0).toUpperCase()}
    </div>
  );
}

// ===== DATE BADGE =====
interface DateBadgeProps {
  startYear: number;
  endYear?: number;
  certainty: TimelineEntity['certainty'];
}

function DateBadge({ startYear, endYear, certainty }: DateBadgeProps) {
  const isApproximate = certainty === 'approximate';
  const label = endYear 
    ? `${isApproximate ? 'c. ' : ''}${startYear}-${endYear} BC`
    : `${isApproximate ? 'c. ' : ''}${startYear} BC`;

  return (
    <div
      className="px-2 py-0.5 rounded font-mono"
      style={{
        background: 'var(--color-base-surface-elevated)',
        border: isApproximate 
          ? '1.5px dashed var(--color-base-text-secondary)'
          : '1.5px solid var(--color-base-text-primary)',
        color: 'var(--color-base-text-primary)',
        fontSize: '10px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  );
}

// ===== TIMELINE NODE =====
interface TimelineNodeProps {
  entity: TimelineEntity;
  x: number;
  y: number;
  width: number;
  height: number;
  zoomLevel: number;
  laneStride: number;
  isHighlighted: boolean;
  isDimmed: boolean;
  isInBreadcrumb: boolean;
  breadcrumbNumber?: number;
  labelVisible?: boolean;
  forcePointNode?: boolean;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export function TimelineNode({
  entity,
  x,
  y,
  width,
  height,
  zoomLevel,
  laneStride,
  isHighlighted,
  isDimmed,
  isInBreadcrumb,
  breadcrumbNumber,
  labelVisible,
  forcePointNode = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: TimelineNodeProps) {
  // Node sizing from centralized config (height prop kept for interface compat)
  void height;
  const metrics = getNodeMetrics(entity.type, zoomLevel);
  const nodeHeight = Math.max(metrics.minHeight, metrics.height);
  const showLabel = labelVisible !== undefined ? labelVisible : metrics.showLabel;
  const showBadges = metrics.showBadges;

  // Apply swimlane offset using layout-driven stride
  const swimlaneOffset = (entity.swimlane || 0) * laneStride;
  const adjustedY = y + swimlaneOffset;

  // Get color based on type (default per entity type)
  let backgroundColor = entity.type === 'person' ? 'var(--person-fill)' : '#D4D9DE';
  if (entity.type === 'person' && entity.role) {
    backgroundColor = roleColors[entity.role];
  } else if (entity.type === 'event' && entity.category) {
    backgroundColor = eventColors[entity.category];
  } else if (entity.type === 'book' && entity.genre) {
    backgroundColor = genreColors[entity.genre];
  }

  // Highlight/dim logic — per-type stroke colors
  let opacity = 1;
  let borderColor = entity.type === 'person' ? 'var(--person-stroke)' : 'var(--stroke-event)';
  let borderWidth = '1px';
  
  if (isDimmed) {
    opacity = 0.25;
  }
  
  if (isHighlighted && entity.themes) {
    // Apply theme accent outline
    const theme = entity.themes[0];
    borderColor = themeHighlightColors[theme] || borderColor;
    borderWidth = '2.5px';
    opacity = 1;
  }

  if (isInBreadcrumb) {
    borderColor = breadcrumbAccentColor;
    borderWidth = '3px';
    opacity = 1;
  }

  // Point node vs span (events are points; unknown-era people can be forced to points)
  const isPointNode = forcePointNode || (entity.type === 'event' && !entity.endYear);
  const nodeWidth = isPointNode ? nodeHeight : width;

  // Accessibility: year range label
  const yearRange = entity.endYear
    ? `${entity.startYear} to ${entity.endYear} BC`
    : `${entity.startYear} BC`;

  // Keyboard handler for Enter/Space
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      data-timeline-node
      className="absolute cursor-pointer transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={{
        left: x,
        top: adjustedY,
        width: nodeWidth,
        height: nodeHeight,
        opacity,
        transform: isInBreadcrumb ? 'scale(1.05)' : 'scale(1)',
        zIndex: isInBreadcrumb ? 20 : isHighlighted ? 15 : 10,
        pointerEvents: 'auto',
        background: 'none',
        border: 'none',
        padding: 0,
      }}
      aria-label={`${entity.name}, ${entity.type}, ${yearRange}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Main node shape */}
      <div
        className="w-full h-full transition-all"
        style={{
          background: backgroundColor,
          border: `${borderWidth} solid ${borderColor}`,
          borderRadius: isPointNode ? '50%' : '5px',
          boxShadow: isInBreadcrumb || isHighlighted
            ? '0 2px 8px rgba(45, 36, 28, 0.15)'
            : 'var(--shadow-standard)',
        }}
      />

      {/* Breadcrumb number badge */}
      {isInBreadcrumb && breadcrumbNumber && showBadges && (
        <div
          className="absolute -top-2 -right-2 flex items-center justify-center rounded-full font-mono"
          style={{
            width: '20px',
            height: '20px',
            background: '#F4D19B',
            border: '2px solid var(--color-base-text-primary)',
            color: 'var(--color-base-text-primary)',
            fontSize: '11px',
            fontWeight: 700,
            zIndex: 25,
          }}
        >
          {breadcrumbNumber}
        </div>
      )}

      {/* Label */}
      {showLabel && (() => {
        const isInsidePerson = entity.type === 'person' && nodeHeight >= 16;
        const isInsideBook = entity.type === 'book' && nodeHeight >= 14;
        const isInside = isInsidePerson || isInsideBook;
        const isEvent = entity.type === 'event';
        const usePointLabel = isEvent || forcePointNode;

        if (usePointLabel) {
          // Event labels: right of circle, vertically centered
          return (
            <div
              className="absolute whitespace-nowrap pointer-events-none"
              style={{
                left: isPointNode ? nodeHeight + 6 : nodeWidth + 6,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px',
                fontWeight: 400,
                fontFamily: 'var(--font-timeline)',
                color: 'var(--text-label)',
              }}
            >
              {entity.name}
            </div>
          );
        }

        if (isInside) {
          // Inside bar labels
          return (
            <div
              className="absolute whitespace-nowrap pointer-events-none overflow-hidden text-ellipsis"
              style={{
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                maxWidth: nodeWidth - 16,
                fontSize: isInsideBook ? '20px' : '14px',
                fontWeight: 400,
                fontFamily: 'var(--font-timeline-serif)',
                color: isInsideBook ? 'var(--text-book)' : 'var(--text-dark)',
                textShadow: 'var(--shadow-text)',
              }}
            >
              {entity.name}
            </div>
          );
        }

        // Below bar labels (low zoom)
        return (
          <div
            className="absolute left-0 whitespace-nowrap pointer-events-none"
            style={{
              top: nodeHeight + 4,
              fontSize: '11px',
              fontWeight: 400,
              fontFamily: 'var(--font-timeline)',
              color: 'var(--text-label)',
              maxWidth: width,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {entity.name}
          </div>
        );
      })()}

      {/* Date badge on hover for higher zoom */}
      {showBadges && (
        <div className="absolute left-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ bottom: nodeHeight + 4 }}>
          <DateBadge
            startYear={entity.startYear}
            endYear={entity.endYear}
            certainty={entity.certainty}
          />
        </div>
      )}
    </button>
  );
}
