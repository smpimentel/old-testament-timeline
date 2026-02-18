import { describe, it, expect } from 'vitest';
import type { EntityType } from '../data/timeline-data';
import {
  getNodeMetrics,
  getMaxNodeHeight,
  ADAPTIVE_NODE_SIZING,
} from './timeline-node-config';

describe('timeline-node-config', () => {
  describe('getNodeMetrics (ADAPTIVE_NODE_SIZING=' + ADAPTIVE_NODE_SIZING + ')', () => {
    const entityTypes: EntityType[] = ['person', 'event', 'book'];

    if (!ADAPTIVE_NODE_SIZING) {
      // Figma-locked: same metrics at all zoom levels
      it.each(entityTypes)('%s returns Figma-locked height at any zoom', (entityType) => {
        const expected = { event: 20, person: 20, book: 40 }[entityType];
        for (const zoom of [0, 0.25, 0.5, 1.0, 2.0, Infinity]) {
          const metrics = getNodeMetrics(entityType, zoom);
          expect(metrics.height).toBe(expected);
          expect(metrics.showLabel).toBe(true);
          expect(metrics.showBadges).toBe(true);
        }
      });
    } else {
      describe('zoom tier boundaries', () => {
        it.each([
          ['person', 0.39, 4, true, false],
          ['person', 0.4, 8, true, false],
          ['person', 0.65, 16, true, false],
          ['person', 1.0, 24, true, true],
          ['person', 5.0, 24, true, true],
          ['event', 0.39, 6, true, false],
          ['event', 0.4, 10, true, false],
          ['event', 1.0, 20, true, true],
          ['book', 0.39, 3, true, false],
          ['book', 0.4, 6, true, false],
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
    }

    describe('monotonic height with zoom', () => {
      it.each(entityTypes)('%s height never decreases as zoom increases', (entityType) => {
        const zoomLevels = [0, 0.25, 0.4, 0.5, 0.65, 0.75, 1.0, 2.0, 3.0];
        let prevHeight = 0;
        for (const zoom of zoomLevels) {
          const metrics = getNodeMetrics(entityType, zoom);
          expect(metrics.height).toBeGreaterThanOrEqual(prevHeight);
          prevHeight = metrics.height;
        }
      });
    });

    describe('label/badge visibility', () => {
      it.each(entityTypes)('%s shows label before badges', (entityType) => {
        const zoomLevels = [0, 0.25, 0.4, 0.5, 0.75, 1.0, 2.0, 3.0];
        let labelSeen = false;
        for (const zoom of zoomLevels) {
          const metrics = getNodeMetrics(entityType, zoom);
          if (metrics.showLabel) labelSeen = true;
          if (metrics.showBadges) expect(labelSeen).toBe(true);
        }
      });
    });
  });

  describe('getMaxNodeHeight', () => {
    it('returns correct max heights', () => {
      expect(getMaxNodeHeight('event')).toBe(ADAPTIVE_NODE_SIZING ? 20 : 20);
      expect(getMaxNodeHeight('person')).toBe(ADAPTIVE_NODE_SIZING ? 24 : 20);
      expect(getMaxNodeHeight('book')).toBe(ADAPTIVE_NODE_SIZING ? 18 : 40);
    });

    it('max height matches highest zoom metrics', () => {
      const entityTypes: EntityType[] = ['person', 'event', 'book'];
      for (const entityType of entityTypes) {
        const maxHeight = getMaxNodeHeight(entityType);
        const maxZoomMetrics = getNodeMetrics(entityType, Infinity);
        expect(maxHeight).toBe(maxZoomMetrics.height);
      }
    });

    it('max height >= any tier height', () => {
      const entityTypes: EntityType[] = ['person', 'event', 'book'];
      for (const entityType of entityTypes) {
        const maxHeight = getMaxNodeHeight(entityType);
        for (const zoom of [0, 0.5, 1.0, 2.0, 10.0]) {
          expect(maxHeight).toBeGreaterThanOrEqual(getNodeMetrics(entityType, zoom).height);
        }
      }
    });
  });
});
