import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  timelineData,
  periods,
  type TimelineEntity,
} from './data/timeline-data';
import { computeTrackLayout, createConfigFromEntities } from './lib/timeline-track-layout';
import { PeriodSection } from './components/period-section';
import { UnknownEraBand } from './components/unknown-era-band';
import { RelationshipOverlay } from './components/relationship-overlay';
import { SideNavigator, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from './components/side-navigator';
import { TimelineNode, TimeGrid } from './components/timeline-nodes';
import { KingdomBackground } from './components/kingdom-background';
import { RightRail } from './components/right-rail';
import { Minimap } from './components/minimap';
import { HoverTooltip } from './components/hover-tooltip';
import { WelcomeOverlay } from './components/welcome-overlay';
import {
  useViewport,
  useEntitySelection,
  useEntityFilter,
  usePathTracing,
  useIsMobile,
  useNodePlacements,
  useUnknownEra,
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

  const { unknownVisualBand, unknownEntityXById } = useUnknownEra({
    yearToX,
    unknownVisualStartYear: UNKNOWN_VISUAL_START_YEAR,
    unknownVisualEndYear: UNKNOWN_VISUAL_END_YEAR,
  });

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

  const { nodePlacements, nodeLabelVisibility } = useNodePlacements({
    filteredEntities,
    yearToX,
    pixelsPerYear,
    tracks: sectionLayout.tracks,
    unknownEntityXById,
    unknownVisualEndYear: UNKNOWN_VISUAL_END_YEAR,
    zoomLevel,
  });

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

          <UnknownEraBand
            startX={unknownVisualBand.startX}
            width={unknownVisualBand.width}
            mainSectionTop={sectionLayout.mainSectionTop}
            mainSectionHeight={sectionLayout.mainSectionHeight}
          />

          <PeriodSection
            yearToX={yearToX}
            pixelsPerYear={pixelsPerYear}
            totalHeight={sectionLayout.periodSectionHeight}
            unknownVisualStartYear={UNKNOWN_VISUAL_START_YEAR}
            unknownVisualEndYear={UNKNOWN_VISUAL_END_YEAR}
          />

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

          <RelationshipOverlay
            breadcrumbEntities={breadcrumbEntities}
            unknownVisualEndYear={UNKNOWN_VISUAL_END_YEAR}
            unknownEntityXById={unknownEntityXById}
            yearToX={yearToX}
            tracks={sectionLayout.tracks}
          />

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
