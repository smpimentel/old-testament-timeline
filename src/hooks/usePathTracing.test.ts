import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePathTracing } from './usePathTracing';

describe('usePathTracing', () => {
  it('starts with path mode off', () => {
    const { result } = renderHook(() => usePathTracing());
    expect(result.current.pathMode).toBe(false);
  });

  it('toggles path mode', () => {
    const { result } = renderHook(() => usePathTracing());
    act(() => {
      result.current.togglePathMode();
    });
    expect(result.current.pathMode).toBe(true);
  });

  it('adds breadcrumb without duplicates', () => {
    const { result } = renderHook(() => usePathTracing());
    act(() => {
      result.current.addBreadcrumb('entity-1');
      result.current.addBreadcrumb('entity-2');
      result.current.addBreadcrumb('entity-1'); // duplicate
    });
    expect(result.current.breadcrumbs).toEqual(['entity-1', 'entity-2']);
  });

  it('clears breadcrumbs', () => {
    const { result } = renderHook(() => usePathTracing());
    act(() => {
      result.current.addBreadcrumb('entity-1');
      result.current.handleClearBreadcrumbs();
    });
    expect(result.current.breadcrumbs).toEqual([]);
  });
});
