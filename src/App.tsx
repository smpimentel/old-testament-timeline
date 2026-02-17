import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  timelineData,
  periods,
  type TimelineEntity,
} from './data/timeline-data';
import { computeTrackLayout, createConfigFromEntities } from './lib/timeline-track-layout';
import { computeNodeLabelVisibility, computePeriodLabelLayout } from './lib/timeline-label-layout';
import { SideNavigator, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from './components/side-navigator';
import { TimelineNode, TimeGrid, PeriodBand } from './components/timeline-nodes';
import { RightRail } from './components/right-rail';
import { Minimap } from './components/minimap';
import { HoverTooltip } from './components/hover-tooltip';
import { RelationshipLine } from './components/relationship-lines';
import { WelcomeOverlay } from './components/welcome-overlay';
import {
  useViewport,
  useEntitySelection,
  useEntityFilter,
  usePathTracing,
  useIsMobile,
  START_YEAR,
  END_YEAR,
  TIMELINE_WIDTH,
} from './hooks';

// Side navigator state managed in App

// Compute dynamic track layout
const trackLayout = computeTrackLayout(createConfigFromEntities(timelineData));

function App() {
  // UI State
  const [showWelcome, setShowWelcome] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const railWidth = isMobile ? 0 : 360; // On mobile, rail overlays fully
  const sidebarWidth = isMobile ? 0 : (sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED);

  // Path tracing hook
  const {
    pathMode,
    breadcrumbs,
    togglePathMode,
    addBreadcrumb,
    handleClearBreadcrumbs,
    breadcrumbEntities,
    getBreadcrumbNumber,
  } = usePathTracing();

  // Entity filter hook
  const {
    searchQuery,
    setSearchQuery,
    selectedPeriod,
    setSelectedPeriod,
    activeThemes,
    handleThemeToggle,
    filteredEntities,
  } = useEntityFilter();

  // Entity selection hook
  const {
    selectedEntity,
    hoveredEntity,
    hoverPosition,
    handleEntityClick: baseHandleEntityClick,
    handleEntityHover,
    handleEntityLeave,
    closeSelection,
    setSelectedEntity,
  } = useEntitySelection();

  // Viewport hook
  const {
    panX,
    panY,
    zoomLevel,
    isDragging,
    canvasRef,
    pixelsPerYear,
    viewportWidth,
    yearToX,
    handleZoomIn,
    handleZoomOut,
    handleFitView,
    panToYear,
    panToCenterOnYear,
    setPanX,
    canvasEventHandlers,
  } = useViewport({ selectedEntityOpen: !!selectedEntity, railWidth });

  const handlePeriodSelect = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (period) {
      setSelectedPeriod(periodId);
      panToYear(period.startYear, 120);
    }
  };

  const handleEntityClick = (entity: TimelineEntity) => {
    if (pathMode) {
      addBreadcrumb(entity.id);
    }
    baseHandleEntityClick(entity);
  };

  const handleViewRelationship = (targetId: string) => {
    const entity = timelineData.find(e => e.id === targetId);
    if (!entity) return;

    // Add current entity to breadcrumb path before navigating (if path mode on)
    if (pathMode) {
      if (selectedEntity) {
        addBreadcrumb(selectedEntity.id);
      }
      addBreadcrumb(targetId);
    }

    // Pan to new entity
    panToCenterOnYear(entity.startYear);

    // Update selection
    setSelectedEntity(entity);
  };

  const handleSearchSubmit = () => {
    if (!searchQuery) return;

    const entity = timelineData.find(e =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (entity) {
      panToCenterOnYear(entity.startYear);

      // Auto-select entity after 300ms delay
      setTimeout(() => {
        setSelectedEntity(entity);
      }, 300);
    }
  };

  const periodBands = useMemo(() => {
    return periods.map((period) => ({
      period,
      x: yearToX(period.startYear),
      width: (period.startYear - period.endYear) * pixelsPerYear,
    }));
  }, [yearToX, pixelsPerYear]);

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

  const nodePlacements = useMemo(() => {
    return filteredEntities.map((entity) => {
      const x = yearToX(entity.startYear);
      const width = entity.endYear
        ? (entity.startYear - entity.endYear) * pixelsPerYear
        : 32;

      let trackBand = trackLayout.events;
      if (entity.type === 'person') trackBand = trackLayout.people;
      else if (entity.type === 'book') trackBand = trackLayout.books;

      return { entity, x, width, trackBand };
    });
  }, [filteredEntities, yearToX, pixelsPerYear]);

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

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FDFBF7]">
      {/* Side Navigator */}
      <SideNavigator
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        selectedPeriod={selectedPeriod}
        onPeriodSelect={handlePeriodSelect}
        activeThemes={activeThemes}
        onThemeToggle={handleThemeToggle}
        breadcrumbs={breadcrumbs}
        onClearBreadcrumbs={handleClearBreadcrumbs}
        pathMode={pathMode}
        onPathModeToggle={togglePathMode}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
      />

      {/* Main Timeline Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{
          top: 0,
          left: sidebarWidth,
          transition: 'left var(--motion-expressive) var(--motion-easing)',
          background: 'var(--color-base-parchment)',
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D241C' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
          `,
          right: selectedEntity ? `${railWidth}px` : '0',
        }}
        {...canvasEventHandlers}
      >
        <div
          style={{
            position: 'relative',
            width: TIMELINE_WIDTH,
            height: trackLayout.totalHeight,
            transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {/* Period Bands */}
          {periodBands.map(({ period, x, width }) => {
            const labelPlacement = periodLabelLayout[period.id];
            return (
              <PeriodBand
                key={period.id}
                period={period}
                x={x}
                width={width}
                labelLane={labelPlacement?.lane}
                hideLabel={labelPlacement?.hidden}
              />
            );
          })}

          {/* Time Grid */}
          <TimeGrid
            startYear={START_YEAR}
            endYear={END_YEAR}
            pixelsPerYear={pixelsPerYear}
            height={trackLayout.totalHeight}
          />

          {/* Track Labels */}
          <div className="absolute left-4 pointer-events-none">
            {/* Events Label */}
            <div
              className="absolute px-3 py-1.5 rounded-md shadow-sm"
              style={{
                top: trackLayout.events.baseY,
                background: 'var(--color-base-surface-elevated)',
                border: '1px solid var(--color-base-grid-major)',
              }}
            >
              <div
                className="text-xs uppercase tracking-wide"
                style={{
                  color: 'var(--color-base-text-secondary)',
                  fontSize: 'var(--type-label-xs-size)',
                  fontWeight: 600,
                }}
              >
                Events
              </div>
            </div>
            {/* People Label */}
            <div
              className="absolute px-3 py-1.5 rounded-md shadow-sm"
              style={{
                top: trackLayout.people.baseY,
                background: 'var(--color-base-surface-elevated)',
                border: '1px solid var(--color-base-grid-major)',
              }}
            >
              <div
                className="text-xs uppercase tracking-wide"
                style={{
                  color: 'var(--color-base-text-secondary)',
                  fontSize: 'var(--type-label-xs-size)',
                  fontWeight: 600,
                }}
              >
                People
              </div>
            </div>
            {/* Books Label */}
            <div
              className="absolute px-3 py-1.5 rounded-md shadow-sm"
              style={{
                top: trackLayout.books.baseY,
                background: 'var(--color-base-surface-elevated)',
                border: '1px solid var(--color-base-grid-major)',
              }}
            >
              <div
                className="text-xs uppercase tracking-wide"
                style={{
                  color: 'var(--color-base-text-secondary)',
                  fontSize: 'var(--type-label-xs-size)',
                  fontWeight: 600,
                }}
              >
                Books
              </div>
            </div>
          </div>

          {/* Relationship Lines (breadcrumb path) */}
          {breadcrumbEntities.length > 1 && (
            <>
              {breadcrumbEntities.slice(0, -1).map((entity, idx) => {
                const nextEntity = breadcrumbEntities[idx + 1];
                if (!entity || !nextEntity) return null;

                const startX = yearToX(entity.startYear);
                const endX = yearToX(nextEntity.startYear);

                // Compute Y from track layout: baseY + (swimlane * laneStride) + node center
                const getEntityCenterY = (e: TimelineEntity) => {
                  let track = trackLayout.events;
                  if (e.type === 'person') track = trackLayout.people;
                  else if (e.type === 'book') track = trackLayout.books;
                  const swimlane = e.swimlane ?? 0;
                  return track.baseY + (swimlane * track.laneStride) + (track.laneStride / 2);
                };

                const startY = getEntityCenterY(entity);
                const endY = getEntityCenterY(nextEntity);

                return (
                  <RelationshipLine
                    key={`${entity.id}-${nextEntity.id}`}
                    startX={startX}
                    startY={startY}
                    endX={endX}
                    endY={endY}
                    type="breadcrumb"
                    isAnimated
                  />
                );
              })}
            </>
          )}

          {/* Timeline Nodes */}
          {nodePlacements.map(({ entity, x, width, trackBand }) => {
            const isHighlighted = activeThemes.length > 0 &&
              entity.themes?.some(t => activeThemes.includes(t));
            const isDimmed = activeThemes.length > 0 && !isHighlighted;
            const breadcrumbNumber = getBreadcrumbNumber(entity.id);
            const isInBreadcrumb = breadcrumbNumber !== undefined;

            return (
              <TimelineNode
                key={entity.id}
                entity={entity}
                x={x}
                y={trackBand.baseY}
                width={width}
                height={trackBand.laneStride}
                laneStride={trackBand.laneStride}
                zoomLevel={zoomLevel}
                isHighlighted={isHighlighted || false}
                isDimmed={isDimmed}
                isInBreadcrumb={isInBreadcrumb}
                breadcrumbNumber={breadcrumbNumber}
                labelVisible={nodeLabelVisibility[entity.id]}
                onClick={() => handleEntityClick(entity)}
                onMouseEnter={(e) => handleEntityHover(entity, e)}
                onMouseLeave={handleEntityLeave}
              />
            );
          })}
        </div>
      </div>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredEntity && !selectedEntity && (
          <HoverTooltip
            entity={hoveredEntity}
            x={hoverPosition.x}
            y={hoverPosition.y}
          />
        )}
      </AnimatePresence>

      {/* Right Rail */}
      <AnimatePresence>
        {selectedEntity && (
          <RightRail
            entity={selectedEntity}
            onClose={closeSelection}
            onViewRelationship={handleViewRelationship}
            pathMode={pathMode}
          />
        )}
      </AnimatePresence>

      {/* Minimap */}
      <Minimap
        entities={timelineData}
        viewportX={-panX}
        viewportWidth={viewportWidth - (selectedEntity ? railWidth : 0)}
        totalWidth={TIMELINE_WIDTH}
        onViewportChange={(x) => setPanX(-x)}
        zoomLevel={zoomLevel}
        pixelsPerYear={pixelsPerYear}
      />

      {/* Welcome Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <WelcomeOverlay onClose={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
