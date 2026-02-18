import { useState, useMemo, useCallback } from 'react';
import {
  timelineData,
  type TimelineEntity,
  type ThemeTag,
} from '../data/timeline-data';

export interface UseEntityFilterReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPeriod: string | null;
  setSelectedPeriod: (period: string | null) => void;
  activeThemes: ThemeTag[];
  handleThemeToggle: (theme: ThemeTag) => void;
  filteredEntities: TimelineEntity[];
  showSecularContext: boolean;
  handleSecularContextToggle: () => void;
}

export function useEntityFilter(): UseEntityFilterReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [activeThemes, setActiveThemes] = useState<ThemeTag[]>([]);
  const [showSecularContext, setShowSecularContext] = useState(true);

  const handleThemeToggle = useCallback((theme: ThemeTag) => {
    setActiveThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  }, []);

  const handleSecularContextToggle = useCallback(() => {
    setShowSecularContext(prev => !prev);
  }, []);

  const filteredEntities = useMemo(() => {
    return timelineData.filter(entity => {
      // Filter secular-context events
      if (!showSecularContext && entity.type === 'event' && entity.category === 'secular-context') {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!entity.name.toLowerCase().includes(query) &&
            !entity.description?.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, showSecularContext]);

  return {
    searchQuery,
    setSearchQuery,
    selectedPeriod,
    setSelectedPeriod,
    activeThemes,
    handleThemeToggle,
    filteredEntities,
    showSecularContext,
    handleSecularContextToggle,
  };
}
