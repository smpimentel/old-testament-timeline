import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewport, START_YEAR, BASE_PIXELS_PER_YEAR } from './useViewport';

describe('useViewport', () => {
  it('initializes with default zoom level', () => {
    const { result } = renderHook(() => useViewport({ selectedEntityOpen: false, railWidth: 360 }));
    expect(result.current.zoomLevel).toBe(1);
  });

  it('handleZoomIn increases zoom', () => {
    const { result } = renderHook(() => useViewport({ selectedEntityOpen: false, railWidth: 360 }));
    act(() => {
      result.current.handleZoomIn();
    });
    expect(result.current.zoomLevel).toBeGreaterThan(1);
  });

  describe('panToCenterOnYear', () => {
    it('centers correctly with desktop rail width (360) when panel open', () => {
      const { result } = renderHook(() => useViewport({ selectedEntityOpen: true, railWidth: 360 }));
      const testYear = 2000;

      act(() => {
        result.current.panToCenterOnYear(testYear);
      });

      const targetX = (START_YEAR - testYear) * BASE_PIXELS_PER_YEAR;
      const viewportWidth = result.current.viewportWidth;
      const adjustedWidth = viewportWidth - 360;
      const expectedPanX = -(targetX - adjustedWidth / 2);

      expect(result.current.panX).toBe(expectedPanX);
    });

    it('centers correctly with mobile rail width (0) when panel open', () => {
      const { result } = renderHook(() => useViewport({ selectedEntityOpen: true, railWidth: 0 }));
      const testYear = 2000;

      act(() => {
        result.current.panToCenterOnYear(testYear);
      });

      const targetX = (START_YEAR - testYear) * BASE_PIXELS_PER_YEAR;
      const viewportWidth = result.current.viewportWidth;
      // railWidth=0 so no adjustment
      const expectedPanX = -(targetX - viewportWidth / 2);

      expect(result.current.panX).toBe(expectedPanX);
    });

    it('does not subtract rail width when panel closed', () => {
      const { result } = renderHook(() => useViewport({ selectedEntityOpen: false, railWidth: 360 }));
      const testYear = 2000;

      act(() => {
        result.current.panToCenterOnYear(testYear);
      });

      const targetX = (START_YEAR - testYear) * BASE_PIXELS_PER_YEAR;
      const viewportWidth = result.current.viewportWidth;
      // Panel closed so no adjustment regardless of railWidth
      const expectedPanX = -(targetX - viewportWidth / 2);

      expect(result.current.panX).toBe(expectedPanX);
    });
  });
});
