import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { timelineData, periods, kingdomLanes, themeById, themeOverlayByTheme, OVERLAY_THEME_IDS, themeColors, type TimelineEntity, type ThemeTag, type Theme } from './data/timeline-data';
import { computeTrackLayout, createConfigFromEntities } from './lib/timeline-track-layout';
import { PeriodSection } from './components/period-section';
import { UnknownEraBand } from './components/unknown-era-band';
import { RelationshipOverlay } from './components/relationship-overlay';
import { TimelineCanvas } from './components/timeline-canvas';
import { TrackLabels } from './components/track-labels';
import { SideNavigator, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from './components/side-navigator';
import { TimelineNode, TimeGrid, MinorGridLines } from './components/timeline-nodes';
import { KingdomBackground } from './components/kingdom-background';
import { KingdomLaneDivider } from './components/kingdom-lane-divider';
import { RightRail, type RightRailContent } from './components/right-rail';
import { ThemeCard } from './components/theme-card';
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

// Section layout: anchored to SVG background rectangles
const PERIOD_H = 170;
const MAIN_TOP = PERIOD_H;
const laneStride = trackLayout.events.laneStride; // 28px

// Non-kingdom events at top
const eventsBaseY = MAIN_TOP + 48;

// Kingdom bands centered in SVG background rectangles
const northBandHeight = kingdomLanes.northLaneCount * laneStride;
const kingdomNorthBaseY = MAIN_TOP + 195 - northBandHeight / 2;

const southBandHeight = kingdomLanes.southLaneCount * laneStride;
const kingdomSouthBaseY = MAIN_TOP + 605 - southBandHeight / 2;

// Non-kingdom people: Solomon (swimlane 2) centered at SVG y=400
const peopleBaseY = MAIN_TOP + 400 - 2 * laneStride - laneStride / 2;

const mainContentBottom = Math.max(
  MAIN_TOP + 800,
  kingdomSouthBaseY + southBandHeight,
  peopleBaseY + trackLayout.people.bandHeight,
) + 36;
const mainSectionHeight = mainContentBottom - MAIN_TOP;
const booksSectionTop = MAIN_TOP + mainSectionHeight + 24;
const booksBaseY = booksSectionTop + 20;
const booksSectionHeight = trackLayout.books.bandHeight + 20 + 24;
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
    kingdomNorth: { baseY: kingdomNorthBaseY, laneStride },
    kingdomSouth: { baseY: kingdomSouthBaseY, laneStride },
  },
};

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const railWidth = isMobile ? 0 : 360;
  const sidebarWidth = isMobile ? 0 : (sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED);

  // Right-rail: unified content (entity or theme)
  const [rightRailContent, setRightRailContent] = useState<RightRailContent | null>(null);

  // Theme card: shows most-recently-toggled theme
  const [themeCardId, setThemeCardId] = useState<ThemeTag | null>(null);
  const [themeCardDismissed, setThemeCardDismissed] = useState(false);

  const { pathMode, breadcrumbs, togglePathMode, addBreadcrumb, handleClearBreadcrumbs, breadcrumbEntities, getBreadcrumbNumber } = usePathTracing();
  const { searchQuery, setSearchQuery, selectedPeriod, setSelectedPeriod, activeThemes, handleThemeToggle: baseHandleThemeToggle, filteredEntities, showSecularContext, handleSecularContextToggle } = useEntityFilter();
  const { hoveredEntity, hoverPosition, handleEntityClick: baseHandleEntityClick, handleEntityHover, handleEntityLeave, closeSelection, setSelectedEntity } = useEntitySelection();
  const { panX, panY, zoomLevel, isDragging, canvasRef, pixelsPerYear, yearToX, panToCenterOnYear, fitYearRangeToView, canvasEventHandlers } = useViewport({ selectedEntityOpen: !!rightRailContent, railWidth });

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
    setRightRailContent({ kind: 'entity', entity });
  };

  const handleViewRelationship = (targetId: string) => {
    const entity = timelineData.find(e => e.id === targetId);
    if (!entity) return;
    if (pathMode) {
      const current = rightRailContent?.kind === 'entity' ? rightRailContent.entity : null;
      if (current) addBreadcrumb(current.id);
      addBreadcrumb(targetId);
    }
    panToCenterOnYear(entity.startYear);
    setSelectedEntity(entity);
    setRightRailContent({ kind: 'entity', entity });
  };

  // From theme detail → click associated entity
  const handleViewEntity = useCallback((entity: TimelineEntity) => {
    panToCenterOnYear(entity.startYear);
    setSelectedEntity(entity);
    setRightRailContent({ kind: 'entity', entity });
  }, [panToCenterOnYear, setSelectedEntity]);

  // From entity detail → click theme pill
  const handleViewTheme = useCallback((theme: Theme) => {
    setRightRailContent({ kind: 'theme', theme });
  }, []);

  const handleCloseRail = () => {
    setRightRailContent(null);
    closeSelection();
  };

  const handleSearchSubmit = () => {
    if (!searchQuery) return;
    const entity = timelineData.find(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (entity) {
      panToCenterOnYear(entity.startYear);
      setTimeout(() => {
        setSelectedEntity(entity);
        setRightRailContent({ kind: 'entity', entity });
      }, 300);
    }
  };

  // Theme toggle: update filter + show card for newly activated theme
  const handleThemeToggle = (theme: ThemeTag) => {
    const wasActive = activeThemes.includes(theme);
    baseHandleThemeToggle(theme);

    if (!wasActive) {
      // Activating a theme → show card
      setThemeCardId(theme);
      setThemeCardDismissed(false);
    } else if (activeThemes.length === 1 && activeThemes[0] === theme) {
      // Deactivating last theme → hide card
      setThemeCardId(null);
    }
    // If deactivating but others remain, keep current card
  };

  // Theme card click → open right-rail theme detail
  const handleThemeCardClick = () => {
    if (!themeCardId) return;
    const theme = themeById.get(themeCardId);
    if (theme) setRightRailContent({ kind: 'theme', theme });
  };

  const themeCardTheme = themeCardId ? themeById.get(themeCardId) : null;
  const showThemeCard = themeCardTheme && !themeCardDismissed && !rightRailContent;

  const { unknownVisualBand, unknownEntityXById } = useUnknownEra({
    yearToX, unknownVisualStartYear: UNKNOWN_VISUAL_START_YEAR, unknownVisualEndYear: UNKNOWN_VISUAL_END_YEAR,
  });

  const { nodePlacements, nodeLabelVisibility } = useNodePlacements({
    filteredEntities, yearToX, pixelsPerYear, tracks: sectionLayout.tracks,
    unknownEntityXById, unknownVisualEndYear: UNKNOWN_VISUAL_END_YEAR,
    unknownBandStartX: unknownVisualBand.startX, zoomLevel,
  });

  // Theme overlay nodes: show when a main theme (Covenant/Kingship/Land/Messiah) is active
  const activeOverlayTheme = activeThemes.find(t => (OVERLAY_THEME_IDS as readonly string[]).includes(t)) as ThemeTag | undefined;
  const allOverlayNodes = useMemo(() => {
    if (!activeOverlayTheme) return [];
    return themeOverlayByTheme[activeOverlayTheme] || [];
  }, [activeOverlayTheme]);

  // Split: linked overlay nodes color their main event; unlinked ones render in overlay band
  const { overlayOnlyNodes, linkedEntityIds } = useMemo(() => {
    const linked = new Set<string>();
    const unlinked = allOverlayNodes.filter(n => {
      if (n.linkedEntityId) { linked.add(n.linkedEntityId); return false; }
      return true;
    });
    return { overlayOnlyNodes: unlinked, linkedEntityIds: linked };
  }, [allOverlayNodes]);

  const OVERLAY_LANE_STRIDE = 28;
  const OVERLAY_BASE_Y = 80; // inside period header area
  const overlayMaxLane = useMemo(() => {
    return overlayOnlyNodes.reduce((m, n) => Math.max(m, (n.swimlane ?? 0) + 1), 0);
  }, [overlayOnlyNodes]);
  const overlayBandHeight = overlayMaxLane * OVERLAY_LANE_STRIDE + 16;
  const overlayColor = activeOverlayTheme ? themeColors[activeOverlayTheme] : '#F4D19B';

  const overlayPlacements = useMemo(() => {
    return overlayOnlyNodes.map(entity => {
      const isUnknownEra = entity.startYear > UNKNOWN_VISUAL_END_YEAR;
      const x = isUnknownEra
        ? (unknownEntityXById.get(entity.id) ?? yearToX(entity.startYear))
        : yearToX(entity.startYear);
      const endX = entity.endYear ? yearToX(entity.endYear) : x;
      const width = entity.endYear ? Math.max(0, endX - x) : 32;
      const isPoint = !entity.endYear;
      return { entity, x, width, isPoint };
    });
  }, [overlayOnlyNodes, yearToX, unknownEntityXById]);

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: '#F5EDD6' }}>
      <SideNavigator
        searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={handleSearchSubmit}
        selectedPeriod={selectedPeriod} onPeriodSelect={handlePeriodSelect}
        activeThemes={activeThemes} onThemeToggle={handleThemeToggle}
        breadcrumbs={breadcrumbs} onClearBreadcrumbs={handleClearBreadcrumbs}
        pathMode={pathMode} onPathModeToggle={togglePathMode}
        isOpen={sidebarOpen} onToggle={() => setSidebarOpen(prev => !prev)}
        showSecularContext={showSecularContext} onSecularContextToggle={handleSecularContextToggle}
      />

      <TimelineCanvas
        canvasRef={canvasRef} canvasEventHandlers={canvasEventHandlers}
        panX={panX} panY={panY} zoomLevel={zoomLevel} isDragging={isDragging}
        sidebarWidth={sidebarWidth} railWidth={railWidth}
        selectedEntityOpen={!!rightRailContent} foundationHeight={sectionLayout.foundationHeight}
      >
        <MinorGridLines startYear={START_YEAR} endYear={END_YEAR} height={sectionLayout.foundationHeight} />
        <div className="absolute pointer-events-none" style={{ left: 0, top: sectionLayout.mainSectionTop, width: TIMELINE_WIDTH, height: 1, background: '#D8CBB7' }} />
        <div className="absolute pointer-events-none" style={{ left: 0, top: sectionLayout.booksSectionTop, width: TIMELINE_WIDTH, height: sectionLayout.booksSectionHeight, background: 'rgba(255, 253, 247, 0.38)', borderTop: '1px solid #D8CBB7' }} />
        <UnknownEraBand startX={unknownVisualBand.startX} width={unknownVisualBand.width} mainSectionTop={sectionLayout.mainSectionTop} mainSectionHeight={sectionLayout.mainSectionHeight} />
        <PeriodSection yearToX={yearToX} pixelsPerYear={pixelsPerYear} totalHeight={sectionLayout.periodSectionHeight} unknownVisualStartYear={UNKNOWN_VISUAL_START_YEAR} unknownVisualEndYear={UNKNOWN_VISUAL_END_YEAR} />
        {/* Theme overlay band */}
        {activeOverlayTheme && overlayPlacements.length > 0 && (
          <>
            <div
              className="absolute pointer-events-none"
              style={{
                left: 0,
                top: OVERLAY_BASE_Y - 8,
                width: TIMELINE_WIDTH,
                height: overlayBandHeight,
                background: `${overlayColor}18`,
                borderTop: `1px solid ${overlayColor}55`,
                borderBottom: `1px solid ${overlayColor}55`,
              }}
            />
            {/* Overlay theme label */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: unknownVisualBand.startX + unknownVisualBand.width + 12,
                top: OVERLAY_BASE_Y - 6,
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: overlayColor,
                opacity: 0.8,
              }}
            >
              {activeOverlayTheme} Theme
            </div>
            {overlayPlacements.map(({ entity, x, width, isPoint }) => {
              const nodeHeight = 20;
              const nodeWidth = isPoint ? nodeHeight : width;
              const swimlaneOffset = (entity.swimlane ?? 0) * OVERLAY_LANE_STRIDE;
              return (
                <TimelineNode
                  key={`overlay-${entity.id}`}
                  entity={entity}
                  x={x}
                  y={OVERLAY_BASE_Y + swimlaneOffset}
                  width={nodeWidth}
                  height={OVERLAY_LANE_STRIDE}
                  laneStride={OVERLAY_LANE_STRIDE}
                  zoomLevel={zoomLevel}
                  isHighlighted={true}
                  isDimmed={false}
                  isInBreadcrumb={false}
                  labelVisible={true}
                  forcePointNode={isPoint}
                  overrideColor={overlayColor}
                  onClick={() => handleEntityClick(entity)}
                  onMouseEnter={(e) => handleEntityHover(entity, e)}
                  onMouseLeave={handleEntityLeave}
                />
              );
            })}
          </>
        )}
        <KingdomBackground yearToX={yearToX} topOffset={sectionLayout.mainSectionTop} showLabels={activeOverlayTheme === 'Land'} />
        <TimeGrid startYear={START_YEAR} endYear={END_YEAR} height={sectionLayout.foundationHeight} axisY={sectionLayout.mainSectionTop + 2} />
        <TrackLabels tracks={sectionLayout.tracks} startX={unknownVisualBand.startX} />
        <KingdomLaneDivider yearToX={yearToX} dividerY={MAIN_TOP + 400} />
        <RelationshipOverlay breadcrumbEntities={breadcrumbEntities} unknownVisualEndYear={UNKNOWN_VISUAL_END_YEAR} unknownEntityXById={unknownEntityXById} yearToX={yearToX} tracks={sectionLayout.tracks} />
        {nodePlacements.map(({ entity, x, width, trackBand, forcePointNode }) => {
          const isHighlighted = activeThemes.length > 0 && entity.themes?.some(t => activeThemes.includes(t));
          const isLinkedToTheme = linkedEntityIds.has(entity.id);
          const isDimmed = activeThemes.length > 0 && !isHighlighted && !isLinkedToTheme;
          const breadcrumbNumber = getBreadcrumbNumber(entity.id);
          const y = entity.id === 'division-of-the-kingdom'
            ? MAIN_TOP + 400 - trackBand.laneStride / 2
            : trackBand.baseY;
          return (
            <TimelineNode
              key={`${entity.type}-${entity.id}`} entity={entity} x={x} y={y} width={width}
              height={trackBand.laneStride} laneStride={trackBand.laneStride} zoomLevel={zoomLevel}
              isHighlighted={isHighlighted || isLinkedToTheme} isDimmed={isDimmed}
              isInBreadcrumb={breadcrumbNumber !== undefined} breadcrumbNumber={breadcrumbNumber}
              labelVisible={nodeLabelVisibility[entity.id]} forcePointNode={forcePointNode}
              overrideColor={isLinkedToTheme ? overlayColor : undefined}
              onClick={() => handleEntityClick(entity)}
              onMouseEnter={(e) => handleEntityHover(entity, e)}
              onMouseLeave={handleEntityLeave}
            />
          );
        })}
      </TimelineCanvas>

      <AnimatePresence>
        {hoveredEntity && !rightRailContent && (
          <HoverTooltip entity={hoveredEntity} x={hoverPosition.x} y={hoverPosition.y} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {rightRailContent && (
          <RightRail
            content={rightRailContent}
            onClose={handleCloseRail}
            onViewRelationship={handleViewRelationship}
            onViewEntity={handleViewEntity}
            onViewTheme={handleViewTheme}
            pathMode={pathMode}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showThemeCard && themeCardTheme && (
          <ThemeCard
            theme={themeCardTheme}
            sidebarWidth={sidebarWidth}
            onDismiss={() => setThemeCardDismissed(true)}
            onClick={handleThemeCardClick}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showWelcome && <WelcomeOverlay onClose={() => setShowWelcome(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default App;
