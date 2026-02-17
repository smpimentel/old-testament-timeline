import { describe, it, expect } from 'vitest';
import {
  getNodeMetrics,
  getMaxNodeHeight,
  type EntityType,
} from './timeline-node-config';

describe('timeline-node-config', () => {
  describe('getNodeMetrics', () => {
    const entityTypes: EntityType[] = ['person', 'event', 'book'];

    describe('zoom tier boundaries', () => {
      // Tests at exact tier boundary (exclusive check: zoomLevel < maxZoom)
      it.each([
        // Person tiers: 0.75, 1.25, 1.5, 1.75, Infinity
        ['person', 0.74, 4, false, false],   // just below 0.75
        ['person', 0.75, 8, false, false],   // at 0.75 -> moves to next tier
        ['person', 1.24, 8, false, false],   // just below 1.25
        ['person', 1.25, 16, false, false],  // at 1.25 -> moves to next tier
        ['person', 1.49, 16, false, false],  // just below 1.5
        ['person', 1.5, 16, true, false],    // at 1.5 -> label tier
        ['person', 1.74, 16, true, false],   // just below 1.75
        ['person', 1.75, 24, true, true],    // at 1.75 -> full tier
        ['person', 5.0, 24, true, true],     // high zoom -> max tier

        // Event tiers
        ['event', 0.74, 6, false, false],
        ['event', 0.75, 10, false, false],
        ['event', 1.5, 16, true, false],
        ['event', 1.75, 20, true, true],

        // Book tiers
        ['book', 0.74, 3, false, false],
        ['book', 0.75, 6, false, false],
        ['book', 1.5, 12, true, false],
        ['book', 1.75, 18, true, true],
      ] as const)(
        '%s at zoom %s returns height=%s, showLabel=%s, showBadges=%s',
        (entityType, zoomLevel, height, showLabel, showBadges) => {
          const metrics = getNodeMetrics(entityType, zoomLevel);
          expect(metrics.height).toBe(height);
          expect(metrics.showLabel).toBe(showLabel);
          expect(metrics.showBadges).toBe(showBadges);
        }
      );
    });

    describe('zoom level 0 (minimum)', () => {
      it.each(entityTypes)('%s returns smallest metrics at zoom 0', (entityType) => {
        const metrics = getNodeMetrics(entityType, 0);
        expect(metrics.showLabel).toBe(false);
        expect(metrics.showBadges).toBe(false);
        expect(metrics.height).toBeLessThan(10);
      });
    });

    describe('zoom level Infinity (maximum)', () => {
      it.each(entityTypes)('%s returns max metrics at Infinity', (entityType) => {
        const metrics = getNodeMetrics(entityType, Infinity);
        expect(metrics.showLabel).toBe(true);
        expect(metrics.showBadges).toBe(true);
      });
    });

    describe('negative zoom handling', () => {
      it.each(entityTypes)('%s handles negative zoom gracefully', (entityType) => {
        const metrics = getNodeMetrics(entityType, -1);
        // Negative zoom < 0.75 so should hit first tier
        expect(metrics.showLabel).toBe(false);
        expect(metrics.showBadges).toBe(false);
      });
    });

    describe('monotonic height increase with zoom', () => {
      it.each(entityTypes)('%s height never decreases as zoom increases', (entityType) => {
        const zoomLevels = [0, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 3.0];
        let prevHeight = 0;

        for (const zoom of zoomLevels) {
          const metrics = getNodeMetrics(entityType, zoom);
          expect(metrics.height).toBeGreaterThanOrEqual(prevHeight);
          prevHeight = metrics.height;
        }
      });
    });

    describe('label/badge visibility progression', () => {
      it.each(entityTypes)('%s shows label before badges', (entityType) => {
        const zoomLevels = [0, 0.5, 1.0, 1.25, 1.5, 1.6, 1.75, 2.0, 3.0];
        let labelSeen = false;

        for (const zoom of zoomLevels) {
          const metrics = getNodeMetrics(entityType, zoom);
          if (metrics.showBadges) {
            expect(labelSeen).toBe(true); // badges require label first
          }
          if (metrics.showLabel) {
            labelSeen = true;
          }
        }
      });
    });
  });

  describe('getMaxNodeHeight', () => {
    it('returns correct max height for person', () => {
      expect(getMaxNodeHeight('person')).toBe(24);
    });

    it('returns correct max height for event', () => {
      expect(getMaxNodeHeight('event')).toBe(20);
    });

    it('returns correct max height for book', () => {
      expect(getMaxNodeHeight('book')).toBe(18);
    });

    it('max height matches highest zoom tier metrics', () => {
      const entityTypes: EntityType[] = ['person', 'event', 'book'];
      for (const entityType of entityTypes) {
        const maxHeight = getMaxNodeHeight(entityType);
        const maxZoomMetrics = getNodeMetrics(entityType, Infinity);
        expect(maxHeight).toBe(maxZoomMetrics.height);
      }
    });

    it('max height >= any tier height', () => {
      const entityTypes: EntityType[] = ['person', 'event', 'book'];
      const zoomLevels = [0, 0.5, 1.0, 1.5, 2.0, 3.0, 10.0];

      for (const entityType of entityTypes) {
        const maxHeight = getMaxNodeHeight(entityType);
        for (const zoom of zoomLevels) {
          const metrics = getNodeMetrics(entityType, zoom);
          expect(maxHeight).toBeGreaterThanOrEqual(metrics.height);
        }
      }
    });
  });
});
