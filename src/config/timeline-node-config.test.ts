import { describe, it, expect } from 'vitest';
import type { EntityType } from '../data/timeline-data';
import {
  getNodeMetrics,
  getMaxNodeHeight,
} from './timeline-node-config';

describe('timeline-node-config', () => {
  describe('getNodeMetrics', () => {
    const entityTypes: EntityType[] = ['person', 'event', 'book'];

    describe('zoom tier boundaries', () => {
      // Tests at exact tier boundary (exclusive check: zoomLevel < maxZoom)
      it.each([
        // Person tiers: 0.4, 0.65, 0.75, 1.0, Infinity
        ['person', 0.39, 4, true, false],    // just below 0.4
        ['person', 0.4, 8, true, false],     // at 0.4 -> moves to next tier
        ['person', 0.64, 8, true, false],    // just below 0.65
        ['person', 0.65, 16, true, false],   // at 0.65 -> moves to next tier
        ['person', 0.74, 16, true, false],   // just below 0.75
        ['person', 0.75, 16, true, false],   // at 0.75
        ['person', 0.99, 16, true, false],   // just below 1.0
        ['person', 1.0, 24, true, true],     // at 1.0 -> full tier
        ['person', 5.0, 24, true, true],     // high zoom -> max tier

        // Event tiers
        ['event', 0.39, 6, true, false],
        ['event', 0.4, 10, true, false],
        ['event', 0.75, 16, true, false],
        ['event', 1.0, 20, true, true],

        // Book tiers
        ['book', 0.39, 3, true, false],
        ['book', 0.4, 6, true, false],
        ['book', 0.75, 12, true, false],
        ['book', 1.0, 18, true, true],
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
        expect(metrics.showLabel).toBe(true);
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
        // Negative zoom < 0.4 so should hit first tier
        expect(metrics.showLabel).toBe(true);
        expect(metrics.showBadges).toBe(false);
      });
    });

    describe('monotonic height increase with zoom', () => {
      it.each(entityTypes)('%s height never decreases as zoom increases', (entityType) => {
        const zoomLevels = [0, 0.25, 0.4, 0.5, 0.65, 0.75, 0.85, 1.0, 1.5, 2.0, 3.0];
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
        const zoomLevels = [0, 0.25, 0.4, 0.5, 0.65, 0.75, 0.85, 1.0, 1.5, 2.0, 3.0];
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
