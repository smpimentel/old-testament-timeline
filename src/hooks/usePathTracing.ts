import { useState, useMemo, useCallback } from 'react';
import { timelineData, type TimelineEntity } from '../data/timeline-data';

export function usePathTracing() {
  const [pathMode, setPathMode] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  const togglePathMode = useCallback(() => {
    setPathMode(prev => !prev);
  }, []);

  const addBreadcrumb = useCallback((entityId: string) => {
    setBreadcrumbs(prev => {
      if (prev.includes(entityId)) return prev;
      return [...prev, entityId];
    });
  }, []);

  const handleClearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([]);
  }, []);

  const breadcrumbEntities = useMemo(() =>
    breadcrumbs
      .map(id => timelineData.find(e => e.id === id))
      .filter(Boolean) as TimelineEntity[],
    [breadcrumbs]
  );

  const getBreadcrumbNumber = useCallback((entityId: string): number | undefined => {
    const idx = breadcrumbs.indexOf(entityId);
    return idx >= 0 ? idx + 1 : undefined;
  }, [breadcrumbs]);

  return {
    pathMode,
    breadcrumbs,
    togglePathMode,
    addBreadcrumb,
    handleClearBreadcrumbs,
    breadcrumbEntities,
    getBreadcrumbNumber,
  };
}
