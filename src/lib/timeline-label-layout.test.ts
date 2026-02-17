import { describe, expect, it } from 'vitest';
import { computeNodeLabelVisibility, computePeriodLabelLayout } from './timeline-label-layout';

describe('timeline-label-layout', () => {
  describe('computePeriodLabelLayout', () => {
    it('stacks overlapping period labels into unlimited lanes', () => {
      const layout = computePeriodLabelLayout([
        { id: 'p1', x: 0, width: 240, name: 'Primeval History' },
        { id: 'p2', x: 8, width: 240, name: 'Patriarchal Period' },
        { id: 'p3', x: 16, width: 240, name: 'Egyptian Sojourn' },
        { id: 'p4', x: 24, width: 240, name: 'Wilderness Wanderings' },
        { id: 'p5', x: 32, width: 240, name: 'Conquest and Settlement' },
      ]);

      expect(new Set([layout.p1.lane, layout.p2.lane, layout.p3.lane, layout.p4.lane, layout.p5.lane]).size).toBe(5);
      expect(layout.p5.lane).toBe(4);
    });

    it('reuses the same lane for non-overlapping labels', () => {
      const layout = computePeriodLabelLayout([
        { id: 'early', x: 0, width: 120, name: 'Early Period' },
        { id: 'late', x: 260, width: 120, name: 'Late Period' },
      ]);

      expect(layout.early.lane).toBe(layout.late.lane);
    });
  });

  describe('computeNodeLabelVisibility', () => {
    it('keeps only non-overlapping labels per lane by deterministic priority order', () => {
      const visibility = computeNodeLabelVisibility(
        [
          { id: 'high-priority', type: 'event', swimlane: 0, x: 100, width: 32, name: 'Exodus', priority: 1 },
          { id: 'low-priority', type: 'event', swimlane: 0, x: 104, width: 32, name: 'Passover', priority: 3 },
        ],
        1.6,
      );

      expect(visibility['high-priority']).toBe(true);
      expect(visibility['low-priority']).toBe(false);
    });

    it('allows labels in separate swimlanes', () => {
      const visibility = computeNodeLabelVisibility(
        [
          { id: 'lane-0', type: 'person', swimlane: 0, x: 120, width: 80, name: 'Moses', priority: 1 },
          { id: 'lane-1', type: 'person', swimlane: 1, x: 120, width: 80, name: 'Aaron', priority: 1 },
        ],
        1.6,
      );

      expect(visibility['lane-0']).toBe(true);
      expect(visibility['lane-1']).toBe(true);
    });

    it('hides labels when the zoom tier has labels disabled', () => {
      const visibility = computeNodeLabelVisibility(
        [
          { id: 'zoom-hidden', type: 'book', swimlane: 0, x: 100, width: 120, name: 'Genesis', priority: 1 },
        ],
        0.5,
      );

      expect(visibility['zoom-hidden']).toBe(false);
    });
  });
});
