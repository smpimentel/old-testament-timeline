import { describe, expect, it } from 'vitest';
import rawEvents from './raw/events.json';
import compiledEvents from './compiled/events.json';
import {
  periods,
  themeTags,
  timelineData,
  timelineDomain,
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

    expect(maxStartYear).toBeLessThanOrEqual(START_YEAR);
    expect(minEndYear).toBeGreaterThanOrEqual(END_YEAR);
    expect(START_YEAR).toBe(timelineDomain.startYear);
    expect(END_YEAR).toBe(timelineDomain.endYear);
  });

  it('emits one period per date range after canonicalization', () => {
    const rangeKeys = periods.map((period) => `${period.startYear}-${period.endYear}`);
    expect(new Set(rangeKeys).size).toBe(periods.length);
    expect(periods.some((period) => period.name === 'Israel in Egypt')).toBe(false);
    expect(periods.some((period) => period.name === 'Wandering')).toBe(false);
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
});
