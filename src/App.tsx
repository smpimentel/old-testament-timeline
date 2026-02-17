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
import { KingdomBackground } from './components/kingdom-background';
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
const PERIOD_SECTION_HEIGHT = 170;
const MAIN_SECTION_TOP = PERIOD_SECTION_HEIGHT;
const MAIN_SECTION_PADDING_TOP = 48;
const EVENT_PEOPLE_GAP = 20;
const MAIN_SECTION_PADDING_BOTTOM = 36;
const MIN_MAIN_SECTION_HEIGHT = 420;
const BOOKS_SECTION_GAP = 24;
const BOOKS_SECTION_PADDING_TOP = 20;
const BOOKS_SECTION_PADDING_BOTTOM = 24;
const UNKNOWN_VISUAL_START_YEAR = 2660;
const UNKNOWN_VISUAL_END_YEAR = 2100;

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
    const unknownStartX = yearToX(UNKNOWN_VISUAL_START_YEAR);
    const unknownEndX = yearToX(UNKNOWN_VISUAL_END_YEAR);
    const unknownVisualWidth = Math.max(0, unknownEndX - unknownStartX);

    return periods.map((period) => ({
      period,
      x: period.id === 'dates-unknown' ? unknownStartX : yearToX(period.startYear),
      width: period.id === 'dates-unknown'
        ? unknownVisualWidth
        : (period.startYear - period.endYear) * pixelsPerYear,
    }));
  }, [yearToX, pixelsPerYear]);

  const unknownVisualBand = useMemo(() => {
    const startX = yearToX(UNKNOWN_VISUAL_START_YEAR);
    const endX = yearToX(UNKNOWN_VISUAL_END_YEAR);
    return {
      startX,
      width: Math.max(0, endX - startX),
    };
  }, [yearToX]);

  const unknownEntityXById = useMemo(() => {
    const unknownEntities = timelineData
      .filter((entity) => entity.type !== 'book' && entity.startYear > UNKNOWN_VISUAL_END_YEAR)
      .sort((a, b) => {
        if (a.startYear !== b.startYear) return b.startYear - a.startYear;
        const typeOrder = { event: 0, person: 1, book: 2 } as const;
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        return a.id.localeCompare(b.id);
      });

    const map = new Map<string, number>();
    const inset = 28;
    const minX = unknownVisualBand.startX + inset;
    const maxX = unknownVisualBand.startX + Math.max(inset, unknownVisualBand.width - inset);
    const span = Math.max(0, maxX - minX);
    const divisor = Math.max(1, unknownEntities.length - 1);

    unknownEntities.forEach((entity, index) => {
      const ratio = unknownEntities.length === 1 ? 0.5 : index / divisor;
      map.set(entity.id, minX + (ratio * span));
    });

    return map;
  }, [unknownVisualBand.startX, unknownVisualBand.width]);

  const sectionLayout = useMemo(() => {
    const eventsBaseY = MAIN_SECTION_TOP + MAIN_SECTION_PADDING_TOP;
    const peopleBaseY = eventsBaseY + trackLayout.events.bandHeight + EVENT_PEOPLE_GAP;
    const mainContentBottom = peopleBaseY + trackLayout.people.bandHeight + MAIN_SECTION_PADDING_BOTTOM;
    const mainSectionHeight = Math.max(MIN_MAIN_SECTION_HEIGHT, mainContentBottom - MAIN_SECTION_TOP);
    const booksSectionTop = MAIN_SECTION_TOP + mainSectionHeight + BOOKS_SECTION_GAP;
    const booksBaseY = booksSectionTop + BOOKS_SECTION_PADDING_TOP;
    const booksSectionHeight = trackLayout.books.bandHeight + BOOKS_SECTION_PADDING_TOP + BOOKS_SECTION_PADDING_BOTTOM;
    const foundationHeight = booksSectionTop + booksSectionHeight;

    return {
      periodSectionHeight: PERIOD_SECTION_HEIGHT,
      mainSectionTop: MAIN_SECTION_TOP,
      mainSectionHeight,
      booksSectionTop,
      booksSectionHeight,
      foundationHeight,
      tracks: {
        events: { ...trackLayout.events, baseY: eventsBaseY },
        people: { ...trackLayout.people, baseY: peopleBaseY },
        books: { ...trackLayout.books, baseY: booksBaseY },
      },
    };
  }, []);

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
      const isUnknownEraEntity = entity.startYear > UNKNOWN_VISUAL_END_YEAR;
      const shouldCompressUnknownX = entity.type !== 'book' && isUnknownEraEntity;
      const x = shouldCompressUnknownX
        ? (unknownEntityXById.get(entity.id) ?? yearToX(entity.startYear))
        : yearToX(entity.startYear);
      const width = entity.endYear
        ? (entity.startYear - entity.endYear) * pixelsPerYear
        : 32;

      let trackBand = sectionLayout.tracks.events;
      if (entity.type === 'person') trackBand = sectionLayout.tracks.people;
      else if (entity.type === 'book') trackBand = sectionLayout.tracks.books;

      return {
        entity,
        x,
        width,
        trackBand,
        forcePointNode: entity.type === 'person' && isUnknownEraEntity,
      };
    });
  }, [filteredEntities, yearToX, pixelsPerYear, sectionLayout, unknownEntityXById]);

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
    <div className="h-screen w-screen overflow-hidden" style={{ background: '#F5EDD6' }}>
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
          background: '#F5EDD6',
          right: selectedEntity ? `${railWidth}px` : '0',
        }}
        {...canvasEventHandlers}
      >
        <div
          style={{
            position: 'relative',
            width: TIMELINE_WIDTH,
            height: sectionLayout.foundationHeight,
            transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {/* Section boundaries */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: sectionLayout.mainSectionTop,
              width: TIMELINE_WIDTH,
              height: 1,
              background: '#D8CBB7',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: sectionLayout.booksSectionTop,
              width: TIMELINE_WIDTH,
              height: sectionLayout.booksSectionHeight,
              background: 'rgba(255, 253, 247, 0.38)',
              borderTop: '1px solid #D8CBB7',
            }}
          />

          {/* Unknown era (intentionally not-to-scale visual span) */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: unknownVisualBand.startX,
              top: sectionLayout.mainSectionTop,
              width: unknownVisualBand.width,
              height: sectionLayout.mainSectionHeight,
              background: 'rgba(245, 237, 214, 0.34)',
              borderRight: '1px solid rgba(111, 98, 84, 0.18)',
            }}
          />

          {/* Period Bands (behind kingdom shapes) */}
          {periodBands.map(({ period, x, width }) => {
            const labelPlacement = periodLabelLayout[period.id];
            return (
              <PeriodBand
                key={period.id}
                period={period}
                x={x}
                width={width}
                totalHeight={sectionLayout.periodSectionHeight}
                labelLane={labelPlacement?.lane}
              />
            );
          })}

          {/* Kingdom Background Shape (on top of period bands) */}
          <KingdomBackground
            yearToX={yearToX}
            pixelsPerYear={pixelsPerYear}
            trackHeight={sectionLayout.mainSectionHeight}
            topOffset={sectionLayout.mainSectionTop}
          />

          {/* Time Grid */}
          <TimeGrid
            startYear={START_YEAR}
            endYear={END_YEAR}
            pixelsPerYear={pixelsPerYear}
            height={sectionLayout.foundationHeight}
            axisY={sectionLayout.mainSectionTop + 2}
            unscaledUntilYear={UNKNOWN_VISUAL_END_YEAR}
          />

          {/* Track Labels */}
          <div className="absolute left-4 pointer-events-none">
            {/* Events Label */}
            <div
              className="absolute px-3 py-1.5 rounded-md shadow-sm"
              style={{
                top: sectionLayout.tracks.events.baseY - 28,
                background: 'var(--color-base-surface-elevated)',
                border: '1px solid #E3D7C4',
              }}
            >
              <div
                className="text-xs uppercase tracking-wide"
                style={{
                  color: '#6F6254',
                  fontSize: 'var(--type-label-xs-size)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-timeline)',
                }}
              >
                Events
              </div>
            </div>
            {/* People Label */}
            <div
              className="absolute px-3 py-1.5 rounded-md shadow-sm"
              style={{
                top: sectionLayout.tracks.people.baseY - 28,
                background: 'var(--color-base-surface-elevated)',
                border: '1px solid #E3D7C4',
              }}
            >
              <div
                className="text-xs uppercase tracking-wide"
                style={{
                  color: '#6F6254',
                  fontSize: 'var(--type-label-xs-size)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-timeline)',
                }}
              >
                People
              </div>
            </div>
            {/* Books Label */}
            <div
              className="absolute px-3 py-1.5 rounded-md shadow-sm"
              style={{
                top: sectionLayout.tracks.books.baseY - 28,
                background: 'var(--color-base-surface-elevated)',
                border: '1px solid #E3D7C4',
              }}
            >
              <div
                className="text-xs uppercase tracking-wide"
                style={{
                  color: '#6F6254',
                  fontSize: 'var(--type-label-xs-size)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-timeline)',
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

                const getEntityX = (item: TimelineEntity) => {
                  const inUnknownZone = item.type !== 'book' && item.startYear > UNKNOWN_VISUAL_END_YEAR;
                  if (inUnknownZone) {
                    return unknownEntityXById.get(item.id) ?? yearToX(item.startYear);
                  }
                  return yearToX(item.startYear);
                };

                const startX = getEntityX(entity);
                const endX = getEntityX(nextEntity);

                // Compute Y from track layout: baseY + (swimlane * laneStride) + node center
                const getEntityCenterY = (e: TimelineEntity) => {
                  let track = sectionLayout.tracks.events;
                  if (e.type === 'person') track = sectionLayout.tracks.people;
                  else if (e.type === 'book') track = sectionLayout.tracks.books;
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
          {nodePlacements.map(({ entity, x, width, trackBand, forcePointNode }) => {
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
                forcePointNode={forcePointNode}
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
        startYear={START_YEAR}
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
