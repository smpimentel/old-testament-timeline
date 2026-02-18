import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { timelineData, periods, type TimelineEntity } from './data/timeline-data';
import { computeTrackLayout, createConfigFromEntities } from './lib/timeline-track-layout';
import { PeriodSection } from './components/period-section';
import { UnknownEraBand } from './components/unknown-era-band';
import { RelationshipOverlay } from './components/relationship-overlay';
import { TimelineCanvas } from './components/timeline-canvas';
import { TrackLabels } from './components/track-labels';
import { SideNavigator, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from './components/side-navigator';
import { TimelineNode, TimeGrid } from './components/timeline-nodes';
import { KingdomBackground } from './components/kingdom-background';
import { KingdomLaneDivider } from './components/kingdom-lane-divider';
import { RightRail } from './components/right-rail';
import { HoverTooltip } from './components/hover-tooltip';
import { WelcomeOverlay } from './components/welcome-overlay';
import {
  useViewport, useEntitySelection, useEntityFilter, usePathTracing,
  useIsMobile, useNodePlacements, useUnknownEra,
  START_YEAR, END_YEAR, TIMELINE_WIDTH,
} from './hooks';

const trackLayout = computeTrackLayout(createConfigFromEntities(timelineData));
const UNKNOWN_VISUAL_START_YEAR = 4004;
const UNKNOWN_VISUAL_END_YEAR = 2300;

// Section layout computed once from module-level constants ([] deps)
const PERIOD_H = 170;
const MAIN_TOP = PERIOD_H;
const eventsBaseY = MAIN_TOP + 48;
const peopleBaseY = eventsBaseY + trackLayout.events.bandHeight + 20;
const mainContentBottom = peopleBaseY + trackLayout.people.bandHeight + 36;
const mainSectionHeight = Math.max(800, mainContentBottom - MAIN_TOP);
const booksSectionTop = MAIN_TOP + mainSectionHeight + 24;
const booksBaseY = booksSectionTop + 20;
const booksSectionHeight = trackLayout.books.bandHeight + 20 + 24;
// Kingdom bands aligned with SVG background Rectangle 3 (north) and Rectangle 4 (south)
const kingdomLaneStride = trackLayout.events.laneStride; // 28px, same for events & people
const sectionLayout = {
  periodSectionHeight: PERIOD_H,
  mainSectionTop: MAIN_TOP,
  mainSectionHeight,
  booksSectionTop,
  booksSectionHeight,
  foundationHeight: booksSectionTop + booksSectionHeight,
  tracks: {
    events: { ...trackLayout.events, baseY: eventsBaseY },
    people: { ...trackLayout.people, baseY: peopleBaseY },
    books: { ...trackLayout.books, baseY: booksBaseY },
    kingdomNorth: { baseY: MAIN_TOP + 30, laneStride: kingdomLaneStride },
    kingdomSouth: { baseY: MAIN_TOP + 420, laneStride: kingdomLaneStride },
  },
};

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const railWidth = isMobile ? 0 : 360;
  const sidebarWidth = isMobile ? 0 : (sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED);

  const { pathMode, breadcrumbs, togglePathMode, addBreadcrumb, handleClearBreadcrumbs, breadcrumbEntities, getBreadcrumbNumber } = usePathTracing();
  const { searchQuery, setSearchQuery, selectedPeriod, setSelectedPeriod, activeThemes, handleThemeToggle, filteredEntities } = useEntityFilter();
  const { selectedEntity, hoveredEntity, hoverPosition, handleEntityClick: baseHandleEntityClick, handleEntityHover, handleEntityLeave, closeSelection, setSelectedEntity } = useEntitySelection();
  const { panX, panY, zoomLevel, isDragging, canvasRef, pixelsPerYear, yearToX, panToCenterOnYear, fitYearRangeToView, canvasEventHandlers } = useViewport({ selectedEntityOpen: !!selectedEntity, railWidth });

  const handlePeriodSelect = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (period) {
      setSelectedPeriod(periodId);
      fitYearRangeToView(period.startYear, period.endYear, sectionLayout.foundationHeight);
    }
  };

  const handleEntityClick = (entity: TimelineEntity) => {
    if (pathMode) addBreadcrumb(entity.id);
    baseHandleEntityClick(entity);
  };

  const handleViewRelationship = (targetId: string) => {
    const entity = timelineData.find(e => e.id === targetId);
    if (!entity) return;
    if (pathMode) {
      if (selectedEntity) addBreadcrumb(selectedEntity.id);
      addBreadcrumb(targetId);
    }
    panToCenterOnYear(entity.startYear);
    setSelectedEntity(entity);
  };

  const handleSearchSubmit = () => {
    if (!searchQuery) return;
    const entity = timelineData.find(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (entity) {
      panToCenterOnYear(entity.startYear);
      setTimeout(() => setSelectedEntity(entity), 300);
    }
  };

  const { unknownVisualBand, unknownEntityXById } = useUnknownEra({
    yearToX, unknownVisualStartYear: UNKNOWN_VISUAL_START_YEAR, unknownVisualEndYear: UNKNOWN_VISUAL_END_YEAR,
  });

  const { nodePlacements, nodeLabelVisibility } = useNodePlacements({
    filteredEntities, yearToX, pixelsPerYear, tracks: sectionLayout.tracks,
    unknownEntityXById, unknownVisualEndYear: UNKNOWN_VISUAL_END_YEAR, zoomLevel,
  });

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: '#F5EDD6' }}>
      <SideNavigator
        searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={handleSearchSubmit}
        selectedPeriod={selectedPeriod} onPeriodSelect={handlePeriodSelect}
        activeThemes={activeThemes} onThemeToggle={handleThemeToggle}
        breadcrumbs={breadcrumbs} onClearBreadcrumbs={handleClearBreadcrumbs}
        pathMode={pathMode} onPathModeToggle={togglePathMode}
        isOpen={sidebarOpen} onToggle={() => setSidebarOpen(prev => !prev)}
      />

      <TimelineCanvas
        canvasRef={canvasRef} canvasEventHandlers={canvasEventHandlers}
        panX={panX} panY={panY} zoomLevel={zoomLevel} isDragging={isDragging}
        sidebarWidth={sidebarWidth} railWidth={railWidth}
        selectedEntityOpen={!!selectedEntity} foundationHeight={sectionLayout.foundationHeight}
      >
        <div className="absolute pointer-events-none" style={{ left: 0, top: sectionLayout.mainSectionTop, width: TIMELINE_WIDTH, height: 1, background: '#D8CBB7' }} />
        <div className="absolute pointer-events-none" style={{ left: 0, top: sectionLayout.booksSectionTop, width: TIMELINE_WIDTH, height: sectionLayout.booksSectionHeight, background: 'rgba(255, 253, 247, 0.38)', borderTop: '1px solid #D8CBB7' }} />
        <UnknownEraBand startX={unknownVisualBand.startX} width={unknownVisualBand.width} mainSectionTop={sectionLayout.mainSectionTop} mainSectionHeight={sectionLayout.mainSectionHeight} />
        <PeriodSection yearToX={yearToX} pixelsPerYear={pixelsPerYear} totalHeight={sectionLayout.periodSectionHeight} unknownVisualStartYear={UNKNOWN_VISUAL_START_YEAR} unknownVisualEndYear={UNKNOWN_VISUAL_END_YEAR} />
        <KingdomBackground yearToX={yearToX} topOffset={sectionLayout.mainSectionTop} />
        <TimeGrid startYear={START_YEAR} endYear={END_YEAR} height={sectionLayout.foundationHeight} axisY={sectionLayout.mainSectionTop + 2} />
        <TrackLabels tracks={sectionLayout.tracks} />
        <KingdomLaneDivider yearToX={yearToX} mainSectionTop={sectionLayout.mainSectionTop} />
        <RelationshipOverlay breadcrumbEntities={breadcrumbEntities} unknownVisualEndYear={UNKNOWN_VISUAL_END_YEAR} unknownEntityXById={unknownEntityXById} yearToX={yearToX} tracks={sectionLayout.tracks} />
        {nodePlacements.map(({ entity, x, width, trackBand, forcePointNode }) => {
          const isHighlighted = activeThemes.length > 0 && entity.themes?.some(t => activeThemes.includes(t));
          const isDimmed = activeThemes.length > 0 && !isHighlighted;
          const breadcrumbNumber = getBreadcrumbNumber(entity.id);
          return (
            <TimelineNode
              key={`${entity.type}-${entity.id}`} entity={entity} x={x} y={trackBand.baseY} width={width}
              height={trackBand.laneStride} laneStride={trackBand.laneStride} zoomLevel={zoomLevel}
              isHighlighted={isHighlighted || false} isDimmed={isDimmed}
              isInBreadcrumb={breadcrumbNumber !== undefined} breadcrumbNumber={breadcrumbNumber}
              labelVisible={nodeLabelVisibility[entity.id]} forcePointNode={forcePointNode}
              onClick={() => handleEntityClick(entity)}
              onMouseEnter={(e) => handleEntityHover(entity, e)}
              onMouseLeave={handleEntityLeave}
            />
          );
        })}
      </TimelineCanvas>

      <AnimatePresence>
        {hoveredEntity && !selectedEntity && (
          <HoverTooltip entity={hoveredEntity} x={hoverPosition.x} y={hoverPosition.y} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedEntity && (
          <RightRail entity={selectedEntity} onClose={closeSelection} onViewRelationship={handleViewRelationship} pathMode={pathMode} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showWelcome && <WelcomeOverlay onClose={() => setShowWelcome(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default App;
