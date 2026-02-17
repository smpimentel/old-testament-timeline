import { type TimelineEntity, type Period, roleColors, eventColors, genreColors } from '../data/timeline-data';

// ===== PERIOD BAND =====
interface PeriodBandProps {
  period: Period;
  x: number;
  width: number;
  height: number;
}

export function PeriodBand({ period, x, width, height }: PeriodBandProps) {
  return (
    <div
      className="absolute top-0 pointer-events-none transition-opacity"
      style={{
        left: x,
        width,
        height: 88,
        background: `linear-gradient(180deg, ${period.color}40 0%, ${period.color}10 100%)`,
        borderRight: `1px solid ${period.color}80`,
      }}
    >
      <div
        className="absolute top-4 left-4"
        style={{
          fontSize: 'var(--type-label-xs-size)',
          fontWeight: 600,
          color: 'var(--color-base-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {period.name}
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
}

export function TimeGrid({ startYear, endYear, pixelsPerYear, height }: TimeGridProps) {
  const gridLines = [];
  
  // Determine grid interval based on zoom
  let majorInterval = 500;
  let minorInterval = 100;
  
  if (pixelsPerYear >= 3) {
    majorInterval = 100;
    minorInterval = 20;
  } else if (pixelsPerYear >= 1.5) {
    majorInterval = 200;
    minorInterval = 50;
  }

  // Major grid lines
  for (let year = Math.ceil(endYear / majorInterval) * majorInterval; year <= startYear; year += majorInterval) {
    const x = (startYear - year) * pixelsPerYear;
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
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono"
          style={{
            fontSize: 'var(--type-label-xs-size)',
            color: 'var(--color-base-text-secondary)',
            fontWeight: 600,
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
        const x = (startYear - year) * pixelsPerYear;
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
  }

  return <>{gridLines}</>;
}

// ===== ROLE BADGE =====
interface RoleBadgeProps {
  role: string;
  size?: 'small' | 'medium';
}

function RoleBadge({ role, size = 'medium' }: RoleBadgeProps) {
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
  certainty: 'exact' | 'approximate';
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
  isHighlighted: boolean;
  isDimmed: boolean;
  isInBreadcrumb: boolean;
  breadcrumbNumber?: number;
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
  isHighlighted,
  isDimmed,
  isInBreadcrumb,
  breadcrumbNumber,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: TimelineNodeProps) {
  // Node sizing by zoom tier
  let nodeHeight = height;
  let showLabel = true;
  let showBadges = true;
  
  if (entity.type === 'person') {
    if (zoomLevel < 0.75) {
      nodeHeight = 4;
      showLabel = false;
      showBadges = false;
    } else if (zoomLevel < 1.25) {
      nodeHeight = 8;
      showLabel = false;
      showBadges = false;
    } else if (zoomLevel < 1.75) {
      nodeHeight = 16;
      showLabel = zoomLevel >= 1.5;
      showBadges = false;
    } else if (zoomLevel < 2.5) {
      nodeHeight = 24;
      showBadges = true;
    } else {
      nodeHeight = 24;
      showBadges = true;
    }
  } else if (entity.type === 'event') {
    if (zoomLevel < 0.75) {
      nodeHeight = 6;
      showLabel = false;
      showBadges = false;
    } else if (zoomLevel < 1.25) {
      nodeHeight = 10;
      showLabel = false;
      showBadges = false;
    } else if (zoomLevel < 1.75) {
      nodeHeight = 16;
      showLabel = zoomLevel >= 1.5;
      showBadges = false;
    } else if (zoomLevel < 2.5) {
      nodeHeight = 20;
      showBadges = true;
    } else {
      nodeHeight = 20;
      showBadges = true;
    }
  } else if (entity.type === 'book') {
    if (zoomLevel < 0.75) {
      nodeHeight = 3;
      showLabel = false;
      showBadges = false;
    } else if (zoomLevel < 1.25) {
      nodeHeight = 6;
      showLabel = false;
      showBadges = false;
    } else if (zoomLevel < 1.75) {
      nodeHeight = 12;
      showLabel = zoomLevel >= 1.5;
      showBadges = false;
    } else if (zoomLevel < 2.5) {
      nodeHeight = 18;
      showBadges = true;
    } else {
      nodeHeight = 18;
      showBadges = true;
    }
  }

  // Apply swimlane offset
  const swimlaneOffset = (entity.swimlane || 0) * (nodeHeight + 4);
  const adjustedY = y + swimlaneOffset;

  // Get color based on type
  let backgroundColor = '#D4D9DE';
  if (entity.type === 'person' && entity.role) {
    backgroundColor = roleColors[entity.role];
  } else if (entity.type === 'event' && entity.category) {
    backgroundColor = eventColors[entity.category];
  } else if (entity.type === 'book' && entity.genre) {
    backgroundColor = genreColors[entity.genre];
  }

  // Highlight/dim logic
  let opacity = 1;
  let borderColor = 'var(--color-base-text-primary)';
  let borderWidth = '1.5px';
  
  if (isDimmed) {
    opacity = 0.25;
  }
  
  if (isHighlighted && entity.themes) {
    // Apply theme accent outline
    const theme = entity.themes[0];
    const themeColorMap: Record<string, string> = {
      'Covenant': '#F4D19B',
      'Kingship': '#D4B5D4',
      'Land': '#C8D4B8',
      'Messiah': '#A8D5E2',
    };
    borderColor = themeColorMap[theme] || borderColor;
    borderWidth = '2.5px';
    opacity = 1;
  }

  if (isInBreadcrumb) {
    borderColor = '#F4D19B'; // Egyptian Amber for breadcrumb
    borderWidth = '3px';
    opacity = 1;
  }

  // Event point vs span
  const isEventPoint = entity.type === 'event' && !entity.endYear;
  const nodeWidth = isEventPoint ? nodeHeight : width;

  return (
    <div
      data-timeline-node
      className="absolute cursor-pointer transition-all group"
      style={{
        left: x,
        top: adjustedY,
        width: nodeWidth,
        height: nodeHeight,
        opacity,
        transform: isInBreadcrumb ? 'scale(1.05)' : 'scale(1)',
        zIndex: isInBreadcrumb ? 20 : isHighlighted ? 15 : 10,
        pointerEvents: 'auto',
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Main node shape */}
      <div
        className="w-full h-full transition-all"
        style={{
          background: backgroundColor,
          border: `${borderWidth} solid ${borderColor}`,
          borderRadius: isEventPoint ? '50%' : 'var(--radius-sm)',
          boxShadow: isInBreadcrumb || isHighlighted 
            ? '0 2px 8px rgba(45, 36, 28, 0.15)' 
            : '0 1px 3px rgba(45, 36, 28, 0.1)',
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

      {/* Role badge for people */}
      {entity.type === 'person' && entity.role && showBadges && (
        <div className="absolute -top-1 -left-1">
          <RoleBadge role={entity.role} size={nodeHeight < 20 ? 'small' : 'medium'} />
        </div>
      )}

      {/* Label */}
      {showLabel && (
        <div
          className="absolute left-0 whitespace-nowrap pointer-events-none"
          style={{
            top: nodeHeight + 4,
            fontSize: nodeHeight < 16 ? '11px' : 'var(--type-label-xs-size)',
            fontWeight: 600,
            color: 'var(--color-base-text-primary)',
            maxWidth: isEventPoint ? 'none' : width,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {entity.name}
        </div>
      )}

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
    </div>
  );
}