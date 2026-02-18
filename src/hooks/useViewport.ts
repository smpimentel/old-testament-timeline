import { useState, useRef, useEffect, useCallback } from 'react';
import { timelineDomain } from '../data/timeline-data';
import { yearToX as scaleYearToX, ERA_START, LINEAR_PX_PER_YEAR } from '../lib/scale';

// Timeline constants
export const START_YEAR = ERA_START;
export const END_YEAR = timelineDomain.endYear;
export const BASE_PIXELS_PER_YEAR = LINEAR_PX_PER_YEAR;
export const TIMELINE_WIDTH = scaleYearToX(END_YEAR);
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;
export const DRAG_THRESHOLD = 5;

export function computeFitView(timelineWidth: number, viewportWidth: number) {
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewportWidth / timelineWidth));
  return { zoom, panX: 0 };
}

interface UseViewportOptions {
  selectedEntityOpen: boolean;
  railWidth: number;
}

export function useViewport({ selectedEntityOpen, railWidth }: UseViewportOptions) {
  // Canvas/Viewport State
  const [panX, setPanX] = useState(() => computeFitView(TIMELINE_WIDTH, typeof window !== 'undefined' ? window.innerWidth : 1200).panX);
  const [panY, setPanY] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(() => computeFitView(TIMELINE_WIDTH, typeof window !== 'undefined' ? window.innerWidth : 1200).zoom);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });

  // Touch gesture state
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fixed coordinate system
  const pixelsPerYear = BASE_PIXELS_PER_YEAR;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

  // Convert year to X position (dual-scale world coordinates)
  const yearToX = useCallback((year: number) => {
    return scaleYearToX(year);
  }, []);

  // Zoom handlers with focal point calculation
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(MAX_ZOOM, zoomLevel + 0.25);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const scaleChange = newZoom / zoomLevel;
      setPanX(centerX - (centerX - panX) * scaleChange);
      setPanY(centerY - (centerY - panY) * scaleChange);
    }
    setZoomLevel(newZoom);
  }, [zoomLevel, panX, panY]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(MIN_ZOOM, zoomLevel - 0.25);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const scaleChange = newZoom / zoomLevel;
      setPanX(centerX - (centerX - panX) * scaleChange);
      setPanY(centerY - (centerY - panY) * scaleChange);
    }
    setZoomLevel(newZoom);
  }, [zoomLevel, panX, panY]);

  const handleFitView = useCallback(() => {
    const { zoom, panX: fitPanX } = computeFitView(TIMELINE_WIDTH, viewportWidth);
    setZoomLevel(zoom);
    setPanX(fitPanX);
    setPanY(0);
  }, [viewportWidth]);

  // Pan to specific year (for navigation)
  // Screen position = worldX * zoomLevel + panX
  const panToYear = useCallback((year: number, offsetFromLeft = 120) => {
    const targetX = yearToX(year);
    setPanX(offsetFromLeft - targetX * zoomLevel);
  }, [yearToX, zoomLevel]);

  // Pan to center on year (accounting for right rail)
  const panToCenterOnYear = useCallback((year: number) => {
    const targetX = yearToX(year);
    const adjustedViewportWidth = viewportWidth - (selectedEntityOpen ? railWidth : 0);
    setPanX(adjustedViewportWidth / 2 - targetX * zoomLevel);
  }, [yearToX, viewportWidth, selectedEntityOpen, railWidth, zoomLevel]);

  // Fit a year range to the viewport — adjusts zoom and pan to show full width + height
  const fitYearRangeToView = useCallback((startYear: number, endYear: number, contentHeight?: number) => {
    const startX = yearToX(startYear);
    const endX = yearToX(endYear);
    const worldWidth = Math.abs(endX - startX);

    const rect = canvasRef.current?.getBoundingClientRect();
    const availableWidth = rect ? rect.width : viewportWidth;
    const availableHeight = rect ? rect.height : window.innerHeight;

    const pad = 60;
    const hZoom = (availableWidth - pad * 2) / worldWidth;
    const vZoom = contentHeight ? (availableHeight - pad * 2) / contentHeight : Infinity;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(hZoom, vZoom)));

    const centerWorldX = (startX + endX) / 2;
    setPanX(availableWidth / 2 - centerWorldX * newZoom);
    // Center vertically if content height provided
    if (contentHeight) {
      setPanY((availableHeight - contentHeight * newZoom) / 2);
    } else {
      setPanY(0);
    }
    setZoomLevel(newZoom);
  }, [yearToX, viewportWidth]);

  // Mouse handlers for panning (X and Y axis)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      const target = e.target as HTMLElement;
      if (target.closest('[data-timeline-node]')) {
        return;
      }
      e.preventDefault();
    } else if (e.button === 1) {
      e.preventDefault();
    } else {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPan({ x: panX, y: panY });
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > DRAG_THRESHOLD) {
      setPanX(lastPan.x + deltaX);
      setPanY(lastPan.y + deltaY);
    }
  }, [isDragging, dragStart, lastPan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch gesture handlers
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      setLastTouchDistance(getTouchDistance(e.touches));
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setLastPan({ x: panX, y: panY });
    }
  }, [panX, panY]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && lastTouchDistance) {
      // Pinch zoom
      const newDistance = getTouchDistance(e.touches);
      const scale = newDistance / lastTouchDistance;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * scale));
      setZoomLevel(newZoom);
      setLastTouchDistance(newDistance);
    } else if (e.touches.length === 1 && isDragging) {
      // Pan
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > DRAG_THRESHOLD) {
        setPanX(lastPan.x + deltaX);
        setPanY(lastPan.y + deltaY);
      }
    }
  }, [lastTouchDistance, zoomLevel, isDragging, dragStart, lastPan]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setLastTouchDistance(null);
  }, []);

  // Global mouseup handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Wheel zoom with focal point toward mouse cursor
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * zoomFactor));

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
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Canvas event handlers object for easy spreading
  const canvasEventHandlers = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    // State
    panX,
    panY,
    zoomLevel,
    isDragging,
    dragStart,
    lastPan,
    lastTouchDistance,

    // Refs
    canvasRef,

    // Constants
    pixelsPerYear,
    viewportWidth,

    // Utility
    yearToX,

    // Handlers
    handleZoomIn,
    handleZoomOut,
    handleFitView,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,

    // Navigation helpers
    panToYear,
    panToCenterOnYear,
    fitYearRangeToView,
    setPanX,

    // Bundled event handlers
    canvasEventHandlers,
  };
}
