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
}

export function useEntityFilter(): UseEntityFilterReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [activeThemes, setActiveThemes] = useState<ThemeTag[]>([]);

  const handleThemeToggle = useCallback((theme: ThemeTag) => {
    setActiveThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  }, []);

  const filteredEntities = useMemo(() => {
    return timelineData.filter(entity => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!entity.name.toLowerCase().includes(query) &&
            !entity.description?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Theme filter
      if (activeThemes.length > 0) {
        if (!entity.themes || !entity.themes.some(t => activeThemes.includes(t))) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, activeThemes]);

  return {
    searchQuery,
    setSearchQuery,
    selectedPeriod,
    setSelectedPeriod,
    activeThemes,
    handleThemeToggle,
    filteredEntities,
  };
}
