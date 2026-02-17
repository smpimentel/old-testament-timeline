import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { TimelineToolbar } from './components/timeline-toolbar';
import { TimelineNode, PeriodBand, TimeGrid } from './components/timeline-nodes';
import { HoverTooltip } from './components/hover-tooltip';
import { RightRail } from './components/right-rail';
import { Minimap } from './components/minimap';
import { RelationshipLine } from './components/relationship-lines';
import { WelcomeOverlay } from './components/welcome-overlay';
import { timelineData, periods, type TimelineEntity, type ThemeTag } from './data/timeline-data';

export default function App() {
  // Canvas state
  const [panX, setPanX] = useState(-2000);
  const [panY, setPanY] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false); // Track if mouse has actually moved
  const canvasRef = useRef<HTMLDivElement>(null);

  // Touch gestures
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  // Drag threshold to distinguish click from drag (5 pixels)
  const DRAG_THRESHOLD = 5;

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [activeThemes, setActiveThemes] = useState<ThemeTag[]>([]);
  const [showApproximate, setShowApproximate] = useState(true);

  // Interaction state
  const [hoveredEntity, setHoveredEntity] = useState<TimelineEntity | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedEntity, setSelectedEntity] = useState<TimelineEntity | null>(null);
  
  // Path mode and breadcrumbs
  const [pathMode, setPathMode] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [highlightedEntities, setHighlightedEntities] = useState<Set<string>>(new Set());

  // Welcome overlay
  const [showWelcome, setShowWelcome] = useState(true);

  // Timeline constants
  const TIMELINE_START = 4000;
  const TIMELINE_END = 400;
  const TIMELINE_DURATION = TIMELINE_START - TIMELINE_END;
  const BASE_PIXELS_PER_YEAR = 2;
  const pixelsPerYear = BASE_PIXELS_PER_YEAR; // Fixed coordinate system
  const timelineWidth = TIMELINE_DURATION * BASE_PIXELS_PER_YEAR; // Fixed width
  const timelineHeight = 800;

  // Track positions with proper spacing for swimlanes
  const TRACK_BASE_HEIGHT = 60;
  const tracks = {
    events: 196,
    people: 296,
    books: 456,
  };

  // Convert year to X position
  const yearToX = useCallback((year: number) => {
    return (TIMELINE_START - year) * pixelsPerYear;
  }, [pixelsPerYear]);

  // Get visible entities based on zoom level (priority filtering)
  const getVisibleEntities = useCallback(() => {
    let priorityThreshold = 1;
    if (zoomLevel >= 2) priorityThreshold = 4;
    else if (zoomLevel >= 1.5) priorityThreshold = 3;
    else if (zoomLevel >= 1) priorityThreshold = 2;
    
    return timelineData.filter(e => e.priority <= priorityThreshold);
  }, [zoomLevel]);

  // Filter entities based on search, theme, and certainty
  const getFilteredEntities = useCallback(() => {
    let entities = getVisibleEntities();

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entities = entities.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query)
      );
    }

    if (activeThemes.length > 0) {
      entities = entities.filter(e => 
        e.themes?.some(theme => activeThemes.includes(theme))
      );
    }

    if (!showApproximate) {
      entities = entities.filter(e => e.certainty === 'exact');
    }

    return entities;
  }, [getVisibleEntities, searchQuery, activeThemes, showApproximate]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Support left click (0) and middle click (1) for dragging
    if (e.button === 0) {
      // Left click - only drag if clicking on empty space
      const target = e.target as HTMLElement;
      if (target.closest('[data-timeline-node]')) {
        return; // Let child elements handle their own clicks
      }
      
      e.preventDefault(); // Prevent text selection
    } else if (e.button === 1) {
      // Middle mouse button - always allow dragging
      e.preventDefault(); // Prevent default middle-click behavior
    } else {
      return; // Ignore other buttons
    }
    
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPan({ x: panX, y: panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Only start actually dragging if moved beyond threshold
    if (distance > DRAG_THRESHOLD) {
      setHasMoved(true);
      setPanX(lastPan.x + deltaX);
      setPanY(lastPan.y + deltaY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setHasMoved(false);
  };

  // Touch gesture handlers
  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      setLastTouchDistance(getTouchDistance(e.touches));
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setHasMoved(false);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setLastPan({ x: panX, y: panY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && lastTouchDistance) {
      // Pinch zoom
      const newDistance = getTouchDistance(e.touches);
      const scale = newDistance / lastTouchDistance;
      const newZoom = Math.max(0.5, Math.min(3, zoomLevel * scale));
      setZoomLevel(newZoom);
      setLastTouchDistance(newDistance);
    } else if (e.touches.length === 1 && isDragging) {
      // Pan
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > DRAG_THRESHOLD) {
        setHasMoved(true);
        setPanX(lastPan.x + deltaX);
        setPanY(lastPan.y + deltaY);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setHasMoved(false);
    setLastTouchDistance(null);
  };

  // Global mouseup handler to catch mouseup outside the canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setHasMoved(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Zoom handlers
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate zoom factor
    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel * zoomFactor));
    
    // Zoom towards mouse position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scaleChange = newZoom / zoomLevel;
      const newPanX = mouseX - (mouseX - panX) * scaleChange;
      const newPanY = mouseY - (mouseY - panY) * scaleChange;
      
      setPanX(newPanX);
      setPanY(newPanY);
    }
    
    setZoomLevel(newZoom);
  }, [zoomLevel, panX, panY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const handleZoomIn = () => {
    const newZoom = Math.min(3, zoomLevel + 0.25);
    
    // Zoom towards viewport center
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const scaleChange = newZoom / zoomLevel;
      const newPanX = centerX - (centerX - panX) * scaleChange;
      const newPanY = centerY - (centerY - panY) * scaleChange;
      
      setPanX(newPanX);
      setPanY(newPanY);
    }
    
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.5, zoomLevel - 0.25);
    
    // Zoom towards viewport center
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const scaleChange = newZoom / zoomLevel;
      const newPanX = centerX - (centerX - panX) * scaleChange;
      const newPanY = centerY - (centerY - panY) * scaleChange;
      
      setPanX(newPanX);
      setPanY(newPanY);
    }
    
    setZoomLevel(newZoom);
  };

  const handleFitView = () => {
    setZoomLevel(1);
    setPanX(-2000);
    setPanY(0);
  };

  // Search handler
  const handleSearchSubmit = () => {
    if (!searchQuery) return;
    
    const entity = timelineData.find(e => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (entity) {
      const targetX = yearToX(entity.startYear);
      const viewportWidth = window.innerWidth - (selectedEntity ? 360 : 0);
      const worldViewportWidth = viewportWidth / zoomLevel;
      setPanX(-(targetX - worldViewportWidth / 2));
      
      setTimeout(() => {
        setSelectedEntity(entity);
      }, 300);
    }
  };

  // Period jump handler
  const handlePeriodSelect = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (!period) return;

    setSelectedPeriod(periodId);
    
    // Position camera so period start appears at a fixed offset from the left edge
    const targetX = yearToX(period.startYear);
    const offsetFromLeft = 120; // Desired screen space pixels from left edge
    
    // Formula: screenX = (worldX + panX) * zoom
    // We want: offsetFromLeft = (targetX + panX) * zoomLevel
    // Solving: panX = (offsetFromLeft / zoomLevel) - targetX
    setPanX((offsetFromLeft / zoomLevel) - targetX);
  };

  // Theme toggle handler
  const handleThemeToggle = (theme: ThemeTag) => {
    setActiveThemes(prev => 
      prev.includes(theme) 
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  // Path mode toggle
  const handlePathModeToggle = () => {
    setPathMode(prev => !prev);
    if (pathMode) {
      // Turning off path mode clears breadcrumbs
      setBreadcrumbs([]);
      setHighlightedEntities(new Set());
    }
  };

  // Entity interaction handlers
  const handleEntityHover = (entity: TimelineEntity, e: React.MouseEvent) => {
    if (selectedEntity) return; // Don't show tooltip when right rail is open
    setHoveredEntity(entity);
    setTooltipPosition({ 
      x: e.clientX + 12, 
      y: e.clientY + 12 
    });
  };

  const handleEntityLeave = () => {
    setHoveredEntity(null);
  };

  const handleEntityClick = (entity: TimelineEntity) => {
    if (pathMode) {
      // Path mode ON: add to breadcrumbs
      if (!breadcrumbs.includes(entity.id)) {
        setBreadcrumbs(prev => [...prev, entity.id]);
      }
    }
    
    // Always update selection to show right rail
    setSelectedEntity(entity);
    setHoveredEntity(null);
  };

  const handleViewRelationship = (targetId: string) => {
    const entity = timelineData.find(e => e.id === targetId);
    if (!entity) return;

    // Add to breadcrumb path if path mode is on
    if (pathMode) {
      if (selectedEntity && !breadcrumbs.includes(selectedEntity.id)) {
        setBreadcrumbs(prev => [...prev, selectedEntity.id]);
      }
      if (!breadcrumbs.includes(targetId)) {
        setBreadcrumbs(prev => [...prev, targetId]);
      }
    }

    // Pan to new entity
    const targetX = yearToX(entity.startYear);
    const viewportWidth = window.innerWidth - 360; // Account for right rail
    const worldViewportWidth = viewportWidth / zoomLevel;
    setPanX(-(targetX - worldViewportWidth / 2));

    // Update selection
    setSelectedEntity(entity);
  };

  const handleClearBreadcrumbs = () => {
    setBreadcrumbs([]);
    setHighlightedEntities(new Set());
  };

  // Update highlighted entities based on selection and themes
  useEffect(() => {
    const highlighted = new Set<string>();

    // Theme highlighting
    if (activeThemes.length > 0) {
      timelineData
        .filter(e => e.themes?.some(theme => activeThemes.includes(theme)))
        .forEach(e => highlighted.add(e.id));
    }

    // Direct relationship highlighting
    if (selectedEntity && selectedEntity.relationships) {
      selectedEntity.relationships.forEach(id => highlighted.add(id));
    }

    setHighlightedEntities(highlighted);
  }, [activeThemes, selectedEntity]);

  const visibleEntities = getFilteredEntities();

  // Determine dimmed entities
  const dimmedEntities = new Set<string>();
  if (highlightedEntities.size > 0) {
    visibleEntities.forEach(e => {
      if (!highlightedEntities.has(e.id) && e.id !== selectedEntity?.id) {
        dimmedEntities.add(e.id);
      }
    });
  }

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {/* Toolbar */}
      <TimelineToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        selectedPeriod={selectedPeriod}
        onPeriodSelect={handlePeriodSelect}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        activeThemes={activeThemes}
        onThemeToggle={handleThemeToggle}
        breadcrumbs={breadcrumbs}
        onClearBreadcrumbs={handleClearBreadcrumbs}
        pathMode={pathMode}
        onPathModeToggle={handlePathModeToggle}
        showApproximate={showApproximate}
        onToggleApproximate={() => setShowApproximate(prev => !prev)}
      />

      {/* Infinite Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 top-[88px] cursor-grab active:cursor-grabbing"
        style={{
          background: 'var(--color-base-parchment)',
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D241C' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
          `,
          right: selectedEntity ? '360px' : '0',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Canvas content */}
        <div
          style={{
            position: 'relative',
            width: timelineWidth,
            height: timelineHeight,
            transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {/* Period bands (layer 1) */}
          {periods.map((period) => {
            const x = yearToX(period.startYear);
            const width = (period.startYear - period.endYear) * pixelsPerYear;
            return (
              <PeriodBand
                key={period.id}
                period={period}
                x={x}
                width={width}
                height={timelineHeight}
              />
            );
          })}

          {/* Time grid (layer 2) */}
          <TimeGrid
            startYear={TIMELINE_START}
            endYear={TIMELINE_END}
            pixelsPerYear={pixelsPerYear}
            height={timelineHeight}
          />

          {/* Track labels */}
          <div className="absolute left-4 space-y-[140px] pointer-events-none" style={{ top: 180 }}>
            <div 
              className="px-3 py-1.5 rounded-md shadow-sm"
              style={{
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
            <div 
              className="px-3 py-1.5 rounded-md shadow-sm"
              style={{
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
            <div 
              className="px-3 py-1.5 rounded-md shadow-sm"
              style={{
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

          {/* Relationship lines (layer 3) */}
          {breadcrumbs.length > 1 && (
            <>
              {breadcrumbs.slice(0, -1).map((id, idx) => {
                const entity = timelineData.find(e => e.id === id);
                const nextEntity = timelineData.find(e => e.id === breadcrumbs[idx + 1]);
                if (!entity || !nextEntity) return null;

                const startX = yearToX(entity.startYear);
                const endX = yearToX(nextEntity.startYear);
                
                let startY = tracks.events + 30;
                if (entity.type === 'person') startY = tracks.people + 30;
                else if (entity.type === 'book') startY = tracks.books + 30;
                
                let endY = tracks.events + 30;
                if (nextEntity.type === 'person') endY = tracks.people + 30;
                else if (nextEntity.type === 'book') endY = tracks.books + 30;

                return (
                  <RelationshipLine
                    key={`${id}-${breadcrumbs[idx + 1]}`}
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

          {/* Timeline nodes (layer 4) */}
          {visibleEntities.map((entity) => {
            const x = yearToX(entity.startYear);
            const width = entity.endYear 
              ? (entity.startYear - entity.endYear) * pixelsPerYear 
              : 32;
            
            let y: number;
            if (entity.type === 'event') y = tracks.events;
            else if (entity.type === 'person') y = tracks.people;
            else y = tracks.books;

            const isHighlighted = highlightedEntities.has(entity.id);
            const isDimmed = dimmedEntities.has(entity.id);
            const isInBreadcrumb = breadcrumbs.includes(entity.id);
            const breadcrumbNumber = isInBreadcrumb ? breadcrumbs.indexOf(entity.id) + 1 : undefined;

            return (
              <TimelineNode
                key={entity.id}
                entity={entity}
                x={x}
                y={y}
                width={width}
                height={TRACK_BASE_HEIGHT}
                zoomLevel={zoomLevel}
                isHighlighted={isHighlighted}
                isDimmed={isDimmed}
                isInBreadcrumb={isInBreadcrumb}
                breadcrumbNumber={breadcrumbNumber}
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
            x={tooltipPosition.x}
            y={tooltipPosition.y}
          />
        )}
      </AnimatePresence>

      {/* Right Rail */}
      <AnimatePresence>
        {selectedEntity && (
          <RightRail
            entity={selectedEntity}
            onClose={() => setSelectedEntity(null)}
            onViewRelationship={handleViewRelationship}
            pathMode={pathMode}
          />
        )}
      </AnimatePresence>

      {/* Minimap */}
      <Minimap
        entities={timelineData}
        viewportX={-panX}
        viewportWidth={window.innerWidth - (selectedEntity ? 360 : 0)}
        totalWidth={timelineWidth}
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