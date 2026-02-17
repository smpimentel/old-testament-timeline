import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntityFilter } from './useEntityFilter';

describe('useEntityFilter', () => {
  it('initializes with empty search and no active themes', () => {
    const { result } = renderHook(() => useEntityFilter());
    expect(result.current.searchQuery).toBe('');
    expect(result.current.activeThemes).toEqual([]);
  });

  it('updates search query', () => {
    const { result } = renderHook(() => useEntityFilter());
    act(() => {
      result.current.setSearchQuery('David');
    });
    expect(result.current.searchQuery).toBe('David');
  });

  it('toggles theme on and off', () => {
    const { result } = renderHook(() => useEntityFilter());
    act(() => {
      result.current.handleThemeToggle('Covenant');
    });
    expect(result.current.activeThemes).toContain('Covenant');

    act(() => {
      result.current.handleThemeToggle('Covenant');
    });
    expect(result.current.activeThemes).not.toContain('Covenant');
  });

  it('filters entities to theme matches when a theme is active', () => {
    const { result } = renderHook(() => useEntityFilter());

    act(() => {
      result.current.handleThemeToggle('Covenant');
    });

    expect(result.current.filteredEntities.length).toBeGreaterThan(0);
    expect(
      result.current.filteredEntities.every((entity) =>
        entity.themes?.includes('Covenant'),
      ),
    ).toBe(true);
  });
});
