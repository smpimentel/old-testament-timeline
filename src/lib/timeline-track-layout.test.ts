import { describe, it, expect } from 'vitest';
import {
  computeTrackLayout,
  validateTrackLayout,
  getEntityY,
  getTrackForType,
  computeRequiredLanes,
  createConfigFromEntities,
  DEFAULT_TRACK_CONFIG,
  type TrackLayoutConfig,
  type TrackLayout,
} from './timeline-track-layout';
import { timelineData } from '../data/timeline-data';
import { getNodeMetrics } from '../config/timeline-node-config';

describe('timeline-track-layout', () => {
  describe('DEFAULT_TRACK_CONFIG', () => {
    it('has positive max node heights', () => {
      expect(DEFAULT_TRACK_CONFIG.maxNodeHeight.event).toBeGreaterThan(0);
      expect(DEFAULT_TRACK_CONFIG.maxNodeHeight.person).toBeGreaterThan(0);
      expect(DEFAULT_TRACK_CONFIG.maxNodeHeight.book).toBeGreaterThan(0);
    });

    it('has positive lane counts', () => {
      expect(DEFAULT_TRACK_CONFIG.laneCount.event).toBeGreaterThan(0);
      expect(DEFAULT_TRACK_CONFIG.laneCount.person).toBeGreaterThan(0);
      expect(DEFAULT_TRACK_CONFIG.laneCount.book).toBeGreaterThan(0);
    });

    it('has positive gaps', () => {
      expect(DEFAULT_TRACK_CONFIG.laneGap).toBeGreaterThan(0);
      expect(DEFAULT_TRACK_CONFIG.trackGap).toBeGreaterThan(0);
    });
  });

  describe('computeTrackLayout', () => {
    it('returns valid layout with default config', () => {
      const layout = computeTrackLayout();
      expect(validateTrackLayout(layout)).toBe(true);
    });

    it('computes correct lane stride', () => {
      const layout = computeTrackLayout();
      const { maxNodeHeight, laneGap } = DEFAULT_TRACK_CONFIG;

      expect(layout.events.laneStride).toBe(maxNodeHeight.event + laneGap);
      expect(layout.people.laneStride).toBe(maxNodeHeight.person + laneGap);
      expect(layout.books.laneStride).toBe(maxNodeHeight.book + laneGap);
    });

    it('computes correct band heights', () => {
      const layout = computeTrackLayout();
      const { laneCount } = DEFAULT_TRACK_CONFIG;

      expect(layout.events.bandHeight).toBe(layout.events.laneStride * laneCount.event);
      expect(layout.people.bandHeight).toBe(layout.people.laneStride * laneCount.person);
      expect(layout.books.bandHeight).toBe(layout.books.laneStride * laneCount.book);
    });

    it('stacks tracks vertically in order: events -> people -> books', () => {
      const layout = computeTrackLayout();

      expect(layout.events.baseY).toBeLessThan(layout.people.baseY);
      expect(layout.people.baseY).toBeLessThan(layout.books.baseY);
    });

    it('includes track gap between bands', () => {
      const layout = computeTrackLayout();
      const { trackGap } = DEFAULT_TRACK_CONFIG;

      const eventsEnd = layout.events.baseY + layout.events.bandHeight;
      const peopleEnd = layout.people.baseY + layout.people.bandHeight;

      expect(layout.people.baseY - eventsEnd).toBe(trackGap);
      expect(layout.books.baseY - peopleEnd).toBe(trackGap);
    });

    it('sets correct entity types on bands', () => {
      const layout = computeTrackLayout();

      expect(layout.events.type).toBe('event');
      expect(layout.people.type).toBe('person');
      expect(layout.books.type).toBe('book');
    });

    it('is deterministic - same config yields same layout', () => {
      const layout1 = computeTrackLayout();
      const layout2 = computeTrackLayout();

      expect(layout1).toEqual(layout2);
    });
  });

  describe('validateTrackLayout', () => {
    it('returns true for default layout', () => {
      const layout = computeTrackLayout();
      expect(validateTrackLayout(layout)).toBe(true);
    });

    it('detects events overlapping people', () => {
      const layout = computeTrackLayout();
      const badLayout: TrackLayout = {
        ...layout,
        events: { ...layout.events, bandHeight: layout.people.baseY + 100 },
      };
      expect(validateTrackLayout(badLayout)).toBe(false);
    });

    it('detects people overlapping books', () => {
      const layout = computeTrackLayout();
      const badLayout: TrackLayout = {
        ...layout,
        people: { ...layout.people, bandHeight: layout.books.baseY + 100 },
      };
      expect(validateTrackLayout(badLayout)).toBe(false);
    });

    it('detects books exceeding total height', () => {
      const layout = computeTrackLayout();
      const badLayout: TrackLayout = {
        ...layout,
        books: { ...layout.books, bandHeight: layout.totalHeight + 100 },
      };
      expect(validateTrackLayout(badLayout)).toBe(false);
    });
  });

  describe('no-overlap invariant with custom configs', () => {
    it('handles extreme lane counts', () => {
      const extremeConfig: TrackLayoutConfig = {
        ...DEFAULT_TRACK_CONFIG,
        laneCount: { event: 20, person: 30, book: 15 },
      };
      const layout = computeTrackLayout(extremeConfig);
      expect(validateTrackLayout(layout)).toBe(true);
    });

    it('handles extreme node heights', () => {
      const extremeConfig: TrackLayoutConfig = {
        ...DEFAULT_TRACK_CONFIG,
        maxNodeHeight: { event: 100, person: 150, book: 80 },
      };
      const layout = computeTrackLayout(extremeConfig);
      expect(validateTrackLayout(layout)).toBe(true);
    });

    it('handles zero lane gap', () => {
      const zeroGapConfig: TrackLayoutConfig = {
        ...DEFAULT_TRACK_CONFIG,
        laneGap: 0,
      };
      const layout = computeTrackLayout(zeroGapConfig);
      expect(validateTrackLayout(layout)).toBe(true);
    });

    it('handles zero track gap', () => {
      const zeroTrackGapConfig: TrackLayoutConfig = {
        ...DEFAULT_TRACK_CONFIG,
        trackGap: 0,
      };
      const layout = computeTrackLayout(zeroTrackGapConfig);
      expect(validateTrackLayout(layout)).toBe(true);
    });

    it('handles minimal config (1 lane each, small heights)', () => {
      const minimalConfig: TrackLayoutConfig = {
        maxNodeHeight: { event: 1, person: 1, book: 1 },
        laneGap: 1,
        trackGap: 1,
        headerOffset: 0,
        laneCount: { event: 1, person: 1, book: 1 },
      };
      const layout = computeTrackLayout(minimalConfig);
      expect(validateTrackLayout(layout)).toBe(true);
    });

    it('handles worst-case: max lanes + max heights', () => {
      const worstCase: TrackLayoutConfig = {
        maxNodeHeight: { event: 200, person: 200, book: 200 },
        laneGap: 50,
        trackGap: 100,
        headerOffset: 200,
        laneCount: { event: 50, person: 50, book: 50 },
      };
      const layout = computeTrackLayout(worstCase);
      expect(validateTrackLayout(layout)).toBe(true);
    });
  });

  describe('config changes preserve invariant', () => {
    const configVariations: [string, Partial<TrackLayoutConfig>][] = [
      ['double node heights', { maxNodeHeight: { event: 48, person: 56, book: 44 } }],
      ['triple lane counts', { laneCount: { event: 12, person: 18, book: 9 } }],
      ['larger gaps', { laneGap: 24, trackGap: 96 }],
      ['smaller header', { headerOffset: 50 }],
      ['larger header', { headerOffset: 200 }],
    ];

    it.each(configVariations)('%s still produces valid layout', (_, changes) => {
      const customConfig: TrackLayoutConfig = { ...DEFAULT_TRACK_CONFIG, ...changes };
      const layout = computeTrackLayout(customConfig);
      expect(validateTrackLayout(layout)).toBe(true);
    });
  });

  describe('getEntityY', () => {
    it('returns baseY for swimlane 0', () => {
      const layout = computeTrackLayout();

      expect(getEntityY(layout, 'event', 0)).toBe(layout.events.baseY);
      expect(getEntityY(layout, 'person', 0)).toBe(layout.people.baseY);
      expect(getEntityY(layout, 'book', 0)).toBe(layout.books.baseY);
    });

    it('increments by laneStride per swimlane', () => {
      const layout = computeTrackLayout();

      expect(getEntityY(layout, 'event', 1)).toBe(layout.events.baseY + layout.events.laneStride);
      expect(getEntityY(layout, 'person', 2)).toBe(layout.people.baseY + 2 * layout.people.laneStride);
      expect(getEntityY(layout, 'book', 3)).toBe(layout.books.baseY + 3 * layout.books.laneStride);
    });

    it('stays within band for configured lane counts', () => {
      const layout = computeTrackLayout();
      const { laneCount } = DEFAULT_TRACK_CONFIG;

      // Check last valid lane for each type
      const lastEventY = getEntityY(layout, 'event', laneCount.event - 1);
      const lastPersonY = getEntityY(layout, 'person', laneCount.person - 1);
      const lastBookY = getEntityY(layout, 'book', laneCount.book - 1);

      expect(lastEventY).toBeLessThan(layout.people.baseY);
      expect(lastPersonY).toBeLessThan(layout.books.baseY);
      expect(lastBookY).toBeLessThan(layout.totalHeight);
    });
  });

  describe('getTrackForType', () => {
    it('returns correct track for each type', () => {
      const layout = computeTrackLayout();

      expect(getTrackForType(layout, 'event')).toBe(layout.events);
      expect(getTrackForType(layout, 'person')).toBe(layout.people);
      expect(getTrackForType(layout, 'book')).toBe(layout.books);
    });

    it('returns events for unknown type (fallback)', () => {
      const layout = computeTrackLayout();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getTrackForType(layout, 'unknown' as any)).toBe(layout.events);
    });
  });

  describe('computeRequiredLanes', () => {
    it('returns zeros for empty array', () => {
      const result = computeRequiredLanes([]);
      expect(result).toEqual({ event: 0, person: 0, book: 0 });
    });

    it('computes max swimlane +1 for each type', () => {
      const entities = [
        { type: 'event' as const, swimlane: 2 },
        { type: 'event' as const, swimlane: 5 },
        { type: 'person' as const, swimlane: 3 },
        { type: 'book' as const, swimlane: 1 },
      ];
      const result = computeRequiredLanes(entities);
      expect(result).toEqual({ event: 6, person: 4, book: 2 });
    });

    it('handles entities without swimlane (defaults to 0)', () => {
      const entities = [
        { type: 'event' as const },
        { type: 'person' as const },
      ];
      const result = computeRequiredLanes(entities);
      expect(result).toEqual({ event: 1, person: 1, book: 0 });
    });
  });

  describe('createConfigFromEntities', () => {
    it('preserves base config properties', () => {
      const entities = [{ type: 'event' as const, swimlane: 2 }];
      const config = createConfigFromEntities(entities);

      expect(config.maxNodeHeight).toEqual(DEFAULT_TRACK_CONFIG.maxNodeHeight);
      expect(config.laneGap).toBe(DEFAULT_TRACK_CONFIG.laneGap);
      expect(config.trackGap).toBe(DEFAULT_TRACK_CONFIG.trackGap);
      expect(config.headerOffset).toBe(DEFAULT_TRACK_CONFIG.headerOffset);
    });

    it('sets lane counts from entity swimlanes', () => {
      const entities = [
        { type: 'event' as const, swimlane: 5 },
        { type: 'person' as const, swimlane: 10 },
        { type: 'book' as const, swimlane: 2 },
      ];
      const config = createConfigFromEntities(entities);

      expect(config.laneCount.event).toBe(6);
      expect(config.laneCount.person).toBe(11);
      expect(config.laneCount.book).toBe(3);
    });

    it('ensures minimum of 1 lane per type', () => {
      const entities: Array<{ type: 'event' | 'person' | 'book'; swimlane?: number }> = [];
      const config = createConfigFromEntities(entities);

      expect(config.laneCount.event).toBe(DEFAULT_TRACK_CONFIG.laneCount.event);
      expect(config.laneCount.person).toBe(DEFAULT_TRACK_CONFIG.laneCount.person);
      expect(config.laneCount.book).toBe(DEFAULT_TRACK_CONFIG.laneCount.book);
    });

    it('produces valid layout from entity-derived config', () => {
      const entities = [
        { type: 'event' as const, swimlane: 10 },
        { type: 'person' as const, swimlane: 20 },
        { type: 'book' as const, swimlane: 5 },
      ];
      const config = createConfigFromEntities(entities);
      const layout = computeTrackLayout(config);

      expect(validateTrackLayout(layout)).toBe(true);
    });
  });

  describe('layout regression guards', () => {
    it('default layout values match expected snapshot', () => {
      const layout = computeTrackLayout();

      // Snapshot of expected values - test fails if layout algorithm changes unexpectedly
      expect(layout.events.baseY).toBe(100); // headerOffset
      expect(layout.events.laneStride).toBe(32); // 24 + 8
      expect(layout.events.bandHeight).toBe(128); // 32 * 4

      expect(layout.people.laneStride).toBe(36); // 28 + 8
      expect(layout.people.bandHeight).toBe(216); // 36 * 6

      expect(layout.books.laneStride).toBe(30); // 22 + 8
      expect(layout.books.bandHeight).toBe(90); // 30 * 3
    });

    it('track stacking follows expected formula', () => {
      const layout = computeTrackLayout();
      const { trackGap, headerOffset } = DEFAULT_TRACK_CONFIG;

      // Verify formula: baseY = previous.baseY + previous.bandHeight + trackGap
      expect(layout.events.baseY).toBe(headerOffset);
      expect(layout.people.baseY).toBe(layout.events.baseY + layout.events.bandHeight + trackGap);
      expect(layout.books.baseY).toBe(layout.people.baseY + layout.people.bandHeight + trackGap);
      expect(layout.totalHeight).toBe(layout.books.baseY + layout.books.bandHeight + trackGap);
    });
  });

  describe('dataset invariants', () => {
    it('entity-derived lane counts cover dataset swimlane maxima', () => {
      const requiredLanes = computeRequiredLanes(timelineData);
      const config = createConfigFromEntities(timelineData);

      expect(config.laneCount.event).toBeGreaterThanOrEqual(requiredLanes.event);
      expect(config.laneCount.person).toBeGreaterThanOrEqual(requiredLanes.person);
      expect(config.laneCount.book).toBeGreaterThanOrEqual(requiredLanes.book);
    });

    it('entities remain inside their track bands across zoom levels', () => {
      const zoomLevels = [0.5, 1.0, 1.5, 2.0, 3.0];
      const layout = computeTrackLayout(createConfigFromEntities(timelineData));

      for (const zoomLevel of zoomLevels) {
        for (const entity of timelineData) {
          const swimlane = entity.swimlane ?? 0;
          const y = getEntityY(layout, entity.type, swimlane);
          const nodeHeight = getNodeMetrics(entity.type, zoomLevel).height;
          const track = getTrackForType(layout, entity.type);
          const trackEnd = track.baseY + track.bandHeight;

          expect(y).toBeGreaterThanOrEqual(track.baseY);
          expect(y + nodeHeight).toBeLessThanOrEqual(trackEnd);
        }
      }
    });
  });
});
