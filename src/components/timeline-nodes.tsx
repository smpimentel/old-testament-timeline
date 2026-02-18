import { type TimelineEntity, type Period, roleColors, eventColors, genreColors } from '../data/timeline-data';
import { getNodeMetrics, themeHighlightColors, breadcrumbAccentColor } from '../config/timeline-node-config';
import { yearToX as scaleYearToX, LOG_BOUNDARY } from '../lib/scale';

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
  height: number;
  axisY?: number;
}

export function TimeGrid({
  startYear,
  endYear,
  height,
  axisY: axisYOverride,
}: TimeGridProps) {
  const gridLines = [];
  const majorInterval = 100;
  const minorInterval = 20;

  // Major grid lines (100-year intervals)
  for (let year = Math.ceil(endYear / majorInterval) * majorInterval; year <= startYear; year += majorInterval) {
    const x = scaleYearToX(year);
    gridLines.push(
      <div
        key={`major-${year}`}
        className="absolute top-0"
        style={{
          left: x,
          height,
          width: '1px',
          background: 'var(--color-base-grid-major)',
        }}
      >
        {year <= LOG_BOUNDARY && (
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
            style={{
              fontSize: 'var(--type-label-xs-size)',
              color: 'var(--color-base-text-secondary)',
              fontWeight: 400,
              fontFamily: 'var(--font-timeline)',
            }}
          >
            {year} BC
          </div>
        )}
      </div>
    );
  }

  // Minor grid lines (20-year intervals)
  for (let year = Math.ceil(endYear / minorInterval) * minorInterval; year <= startYear; year += minorInterval) {
    if (year % majorInterval !== 0) {
      const x = scaleYearToX(year);
      gridLines.push(
        <div
          key={`minor-${year}`}
          className="absolute top-0"
          style={{
            left: x,
            height,
            width: '1px',
            background: 'var(--color-base-grid-minor)',
          }}
        />
      );
    }
  }

  // Timeline axis
  const axisY = axisYOverride ?? Math.round(height / 2);
  const totalWidth = scaleYearToX(endYear);
  const axisTicks = [];

  // Diamond ticks at 100-year intervals
  for (let year = Math.ceil(endYear / 100) * 100; year <= startYear; year += 100) {
    const x = scaleYearToX(year);
    axisTicks.push(
      <svg
        key={`axis-tick-${year}`}
        className="absolute"
        style={{ left: x - 3, top: axisY - 3 }}
        width="6"
        height="6"
      >
        <polygon points="3,0 6,3 3,6 0,3" fill="#6F6254" />
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
        top: axisY - 1,
        width: totalWidth,
        height: '2px',
        background: 'var(--color-base-grid-major)',
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

  // Secular-context events render as diamonds (rotated squares)
  const isSecularContext = entity.type === 'event' && entity.category === 'secular-context';

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
          borderRadius: isSecularContext && isPointNode ? '2px' : isPointNode ? '50%' : '5px',
          transform: isSecularContext && isPointNode ? 'rotate(45deg)' : undefined,
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
          // All point event labels: right of node, vertically centered
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

    </button>
  );
}
