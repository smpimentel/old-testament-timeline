import { useState, useCallback } from 'react';
import type { TimelineEntity } from '../data/timeline-data';

interface HoverPosition {
  x: number;
  y: number;
}

interface UseEntitySelectionOptions {
  onSelect?: (entity: TimelineEntity) => void;
}

export function useEntitySelection({ onSelect }: UseEntitySelectionOptions = {}) {
  const [selectedEntity, setSelectedEntity] = useState<TimelineEntity | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<TimelineEntity | null>(null);
  const [hoverPosition, setHoverPosition] = useState<HoverPosition>({ x: 0, y: 0 });

  const handleEntityClick = useCallback((entity: TimelineEntity) => {
    setSelectedEntity(entity);
    onSelect?.(entity);
  }, [onSelect]);

  const handleEntityHover = useCallback((entity: TimelineEntity, e: React.MouseEvent) => {
    setHoveredEntity(entity);
    setHoverPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleEntityLeave = useCallback(() => {
    setHoveredEntity(null);
  }, []);

  const closeSelection = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  return {
    // State
    selectedEntity,
    hoveredEntity,
    hoverPosition,

    // Handlers
    handleEntityClick,
    handleEntityHover,
    handleEntityLeave,
    closeSelection,

    // Setter for external updates (e.g., search, navigation)
    setSelectedEntity,
  };
}
