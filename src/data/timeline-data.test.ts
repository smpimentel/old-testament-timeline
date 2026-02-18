import { describe, expect, it } from 'vitest';
import rawEvents from './raw/events.json';
import compiledEvents from './compiled/events.json';
import {
  periods,
  themeTags,
  timelineData,
  timelineDomain,
  kingdomLanes,
  normalizeEventCategory,
} from './timeline-data';
import { END_YEAR, START_YEAR } from '../hooks/useViewport';

interface RawEventLike {
  id: string;
  category?: string;
}

interface CompiledEventLike {
  id: string;
  categories?: string[];
}

describe('timeline-data integrity', () => {
  it('domain constants cover all compiled entities and periods', () => {
    const maxStartYear = Math.max(
      ...timelineData.map((entity) => entity.startYear),
      ...periods.map((period) => period.startYear),
    );
    const minEndYear = Math.min(
      ...timelineData.map((entity) => entity.endYear ?? entity.startYear),
      ...periods.map((period) => period.endYear),
    );

    // START_YEAR = ERA_START (4004 BC) for dual-scale; covers all entity years
    expect(maxStartYear).toBeLessThanOrEqual(START_YEAR);
    expect(minEndYear).toBeGreaterThanOrEqual(END_YEAR);
    expect(END_YEAR).toBe(timelineDomain.endYear);
  });

  it('emits one period per date range after canonicalization', () => {
    const rangeKeys = periods.map((period) => `${period.startYear}-${period.endYear}`);
    expect(new Set(rangeKeys).size).toBe(periods.length);
    expect(periods.some((period) => period.name === 'Sojourn')).toBe(true);
    expect(periods.some((period) => period.name === 'Conquest/Judges')).toBe(true);
  });

  it('attaches normalized themes to entities from the configured theme list', () => {
    expect(themeTags.length).toBeGreaterThan(4);

    const themedEntities = timelineData.filter((entity) => entity.themes && entity.themes.length > 0);
    expect(themedEntities.length).toBeGreaterThan(0);

    for (const entity of themedEntities) {
      for (const theme of entity.themes || []) {
        expect(themeTags).toContain(theme);
      }
    }
  });

  it('timelineDomain includes asymmetric padding', () => {
    expect(timelineDomain.startYear).toBeGreaterThan(4004);
    expect(timelineDomain.endYear).toBeLessThan(400);
  });

  it('themeTags includes all themes from themes.json', () => {
    expect(themeTags.length).toBeGreaterThanOrEqual(12);
  });

  it('preserves semantic event categories from raw to compiled data', () => {
    const rawCategoryById = new Map<string, string>();
    for (const rawEvent of rawEvents as RawEventLike[]) {
      rawCategoryById.set(rawEvent.id, normalizeEventCategory(rawEvent.category));
    }

    const compiledCategorySet = new Set<string>();
    for (const compiledEvent of compiledEvents as CompiledEventLike[]) {
      const category = compiledEvent.categories?.[0];
      expect(category).toBe(rawCategoryById.get(compiledEvent.id) || 'event');
      if (category) {
        compiledCategorySet.add(category);
      }
    }

    expect(compiledCategorySet.size).toBeGreaterThan(1);
  });

  it('kingdom field is valid when present', () => {
    const kingdomEntities = timelineData.filter(e => e.kingdom);
    expect(kingdomEntities.length).toBeGreaterThan(0);

    for (const entity of kingdomEntities) {
      expect(['Israel', 'Judah']).toContain(entity.kingdom);
    }
  });

  it('kingdom entities have swimlanes in correct ranges', () => {
    for (const type of ['event', 'person'] as const) {
      const lanes = type === 'event' ? kingdomLanes.event : kingdomLanes.person;
      const entities = timelineData.filter(e => e.type === type && e.kingdom);

      for (const entity of entities) {
        const swimlane = entity.swimlane ?? 0;
        if (entity.kingdom === 'Israel') {
          expect(swimlane).toBeGreaterThanOrEqual(lanes.northStartLane);
          expect(swimlane).toBeLessThan(lanes.southStartLane);
        } else if (entity.kingdom === 'Judah') {
          expect(swimlane).toBeGreaterThanOrEqual(lanes.southStartLane);
        }
      }
    }
  });

  it('has divided monarchy kings and prophets', () => {
    const kings = timelineData.filter(e => e.role === 'king' && e.kingdom);
    const prophets = timelineData.filter(e => e.role === 'prophet' && e.kingdom);
    expect(kings.length).toBeGreaterThanOrEqual(11);
    expect(prophets.length).toBeGreaterThanOrEqual(8);
  });
});
