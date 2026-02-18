// Timeline Data Types and Exports
// Bridges compiled JSON data with component requirements

import peopleData from './compiled/people.json';
import eventsData from './compiled/events.json';
import booksData from './compiled/books.json';
import periodsData from './compiled/periods.json';
import themesData from './compiled/themes.json';
import relationshipsData from './compiled/relationships.json';

// ===== TYPES =====
export type EntityType = 'person' | 'event' | 'book';
export type PersonRole = 'king' | 'prophet' | 'judge' | 'priest' | 'patriarch' | 'warrior' | 'scribe' | 'other';
export type BookGenre = 'pentateuch' | 'historical' | 'prophets';
export type DateCertainty = 'exact' | 'approximate' | 'estimated';

export const THEME_TAGS = [
  'Covenant',
  'Kingship',
  'Land',
  'Messiah',
  'Judgment',
  'Deliverance',
  'Restoration',
  'Origins',
  'Temple',
  'Patriarchs',
  'Conquest',
  'Monarchy',
] as const;

export type ThemeTag = (typeof THEME_TAGS)[number];

export const EVENT_CATEGORIES = [
  'judgment',
  'covenant',
  'deliverance',
  'temple',
  'origins',
  'patriarchs',
  'conquest',
  'monarchy',
  'restoration',
  'event',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export interface TimelineEntity {
  id: string;
  type: EntityType;
  name: string;
  startYear: number;
  endYear?: number;
  certainty: DateCertainty;
  priority: 1 | 2 | 3 | 4;
  description: string;
  themes?: ThemeTag[];
  role?: PersonRole;
  category?: EventCategory;
  genre?: BookGenre;
  relationships?: string[];
  scripture?: string;
  notes?: string;
  swimlane?: number;
  details?: string;
}

export interface Period {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  color: string;
}

export interface Theme {
  id: ThemeTag;
  color: string;
  description: string;
}

// Relationship type literals
// Includes both semantic types (used by UI) and build-data types (from JSON)
export type RelationshipType =
  // Semantic types
  | 'parent-child'
  | 'married-to'
  | 'sibling'
  | 'mentor'
  | 'successor'
  | 'contemporary'
  | 'allied-with'
  | 'opposed-to'
  | 'authored'
  | 'prophesied'
  | 'led'
  // Build-data types (from scripts/build-data.ts)
  | 'family-parent'
  | 'family-child'
  | 'family-spouse'
  | 'family-sibling'
  | 'event-participant'
  | 'event-witness'
  | 'prophecy-speaks'
  | 'prophecy-fulfills'
  | 'book-author'
  | 'book-subject'
  | 'theme-associated';

export type Confidence = 'high' | 'medium' | 'low';

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  confidence: Confidence;
}

interface ThemeLike {
  id: string;
  color: string;
  description?: string;
}

const eventCategorySet = new Set<string>(EVENT_CATEGORIES);

const themeTagLookup = new Map<string, ThemeTag>(
  THEME_TAGS.map(t => [normalizeToken(t), t])
);

// ===== THEME COLOR MAPPING =====
const defaultThemeColors: Record<ThemeTag, string> = {
  Covenant: '#F4D19B',
  Kingship: '#D4B5D4',
  Land: '#C8D4B8',
  Messiah: '#A8D5E2',
  Judgment: '#B22222',
  Deliverance: '#228B22',
  Restoration: '#2E8B57',
  Origins: '#8B4513',
  Temple: '#CD853F',
  Patriarchs: '#DAA520',
  Conquest: '#556B2F',
  Monarchy: '#9932CC',
};

function buildThemeColors(themeList: Theme[]): Record<ThemeTag, string> {
  const merged = { ...defaultThemeColors };
  for (const theme of themeList) {
    merged[theme.id] = theme.color;
  }
  return merged;
}

export const themeColors: Record<ThemeTag, string> = buildThemeColors(
  (themesData as ThemeLike[])
    .map((theme) => {
      const tag = normalizeThemeTag(theme.id);
      if (!tag) return null;
      return {
        id: tag,
        color: theme.color,
        description: theme.description || '',
      };
    })
    .filter((theme): theme is Theme => theme !== null),
);

// ===== ROLE COLOR MAPPING =====
export const roleColors: Record<PersonRole, string> = {
  king: '#F5D99F',
  prophet: '#C8B8D4',
  judge: '#B8C4A8',
  priest: '#D4C5E0',
  patriarch: '#C8D4B8',
  warrior: '#D9B5A0',
  scribe: '#E6DCC8',
  other: '#D4D9DE',
};

// ===== EVENT CATEGORY COLOR MAPPING =====
export const eventColors: Record<EventCategory, string> = {
  judgment: '#E6A8A8',
  covenant: '#F4D19B',
  deliverance: '#B8D9E6',
  temple: '#D9C4A8',
  origins: '#D9C4A8',
  patriarchs: '#F4D19B',
  conquest: '#C8D4B8',
  monarchy: '#F4D19B',
  restoration: '#C8D4B8',
  event: '#D9C4A8',
};

// ===== BOOK GENRE COLOR MAPPING =====
export const genreColors: Record<BookGenre, string> = {
  pentateuch: '#A07070',
  historical: '#8E8568',
  prophets: '#7B7EA8',
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_/-]+/g, '-');
}

export function normalizeEventCategory(rawCategory?: string): EventCategory {
  if (!rawCategory) return 'event';
  const normalized = normalizeToken(rawCategory);
  if (eventCategorySet.has(normalized)) {
    return normalized as EventCategory;
  }
  return 'event';
}

export function normalizeThemeTag(rawTag?: string): ThemeTag | undefined {
  if (!rawTag) return undefined;
  return themeTagLookup.get(normalizeToken(rawTag));
}

function selectCanonicalPeriod(
  current: { period: Period; index: number },
  candidate: { period: Period; index: number },
): { period: Period; index: number } {
  const currentScore = current.period.name.length;
  const candidateScore = candidate.period.name.length;

  if (candidateScore > currentScore) {
    return candidate;
  }

  if (candidateScore < currentScore) {
    return current;
  }

  return candidate.index >= current.index ? candidate : current;
}

// ===== MAP CATEGORY TO ROLE/GENRE =====
function mapPersonCategory(categories: string[]): PersonRole {
  const cat = categories[0]?.toLowerCase() || 'other';
  const roleMap: Record<string, PersonRole> = {
    king: 'king',
    prophet: 'prophet',
    judge: 'judge',
    priest: 'priest',
    patriarch: 'patriarch',
    warrior: 'warrior',
    scribe: 'scribe',
  };
  return roleMap[cat] || 'other';
}

function mapBookCategory(categories: string[]): BookGenre {
  const cat = categories[0]?.toLowerCase() || 'historical';
  const genreMap: Record<string, BookGenre> = {
    pentateuch: 'pentateuch',
    history: 'historical',
    poetry: 'prophets',
    'major prophets': 'prophets',
    'minor prophets': 'prophets',
    wisdom: 'prophets',
  };
  return genreMap[cat] || 'historical';
}

// ===== BUILD RELATIONSHIPS MAP =====
const relationshipMap = new Map<string, string[]>();
(relationshipsData as Relationship[]).forEach((rel) => {
  const existing = relationshipMap.get(rel.sourceId);
  if (existing) {
    existing.push(rel.targetId);
  } else {
    relationshipMap.set(rel.sourceId, [rel.targetId]);
  }
});

// ===== TRANSFORM COMPILED DATA =====
function transformPeople(data: typeof peopleData): TimelineEntity[] {
  return data.map((p: (typeof peopleData)[number]) => {
    const categories = p.categories || [];
    const role = mapPersonCategory(categories);

    return {
      id: p.id,
      type: 'person' as EntityType,
      name: p.name,
      startYear: p.startYear,
      endYear: p.endYear,
      certainty: p.certainty as DateCertainty,
      priority: (p.priority || 2) as 1 | 2 | 3 | 4,
      description: p.description || p.bio || '',
      role,
      themes: (p.themes as ThemeTag[]) || undefined,
      relationships: relationshipMap.get(p.id),
      scripture: p.scriptureRefs?.join(', '),
      notes: p.bio,
      swimlane: p.swimlane || 0,
    };
  });
}

function transformEvents(data: typeof eventsData): TimelineEntity[] {
  return data.map((e: (typeof eventsData)[number]) => {
    const category = normalizeEventCategory(e.categories?.[0]);

    return {
      id: e.id,
      type: 'event' as EntityType,
      name: e.name,
      startYear: e.startYear,
      endYear: e.endYear !== e.startYear ? e.endYear : undefined,
      certainty: e.certainty as DateCertainty,
      priority: (e.priority || 2) as 1 | 2 | 3 | 4,
      description: e.description || '',
      category,
      themes: (e.themes as ThemeTag[]) || undefined,
      relationships: relationshipMap.get(e.id),
      scripture: e.scriptureRefs?.join(', '),
      swimlane: e.swimlane || 0,
    };
  });
}

function transformBooks(data: typeof booksData): TimelineEntity[] {
  return data.map((b: (typeof booksData)[number]) => {
    const categories = b.categories || [];

    return {
      id: b.id,
      type: 'book' as EntityType,
      name: b.name,
      startYear: b.startYear,
      endYear: b.endYear,
      certainty: b.certainty as DateCertainty,
      priority: (b.priority || 2) as 1 | 2 | 3 | 4,
      description: b.description || '',
      genre: mapBookCategory(categories),
      themes: (b.themes as ThemeTag[]) || undefined,
      relationships: relationshipMap.get(b.id),
      scripture: b.scriptureRefs?.join(', '),
      notes: `Author: ${b.author || 'Unknown'}`,
      swimlane: b.swimlane || 0,
    };
  });
}

function transformPeriods(data: typeof periodsData): Period[] {
  const byRange = new Map<string, { period: Period; index: number }>();

  data.forEach((p: (typeof periodsData)[number], index: number) => {
    const period: Period = {
      id: p.id,
      name: p.name,
      startYear: p.startYear,
      endYear: p.endYear,
      color: p.color,
    };

    const rangeKey = `${period.startYear}-${period.endYear}`;
    const existing = byRange.get(rangeKey);

    if (!existing) {
      byRange.set(rangeKey, { period, index });
      return;
    }

    byRange.set(
      rangeKey,
      selectCanonicalPeriod(existing, { period, index }),
    );
  });

  return [...byRange.values()]
    .sort((a, b) => {
      if (a.period.startYear !== b.period.startYear) {
        return b.period.startYear - a.period.startYear;
      }
      if (a.period.endYear !== b.period.endYear) {
        return b.period.endYear - a.period.endYear;
      }
      return a.period.name.localeCompare(b.period.name);
    })
    .map((entry) => entry.period);
}

function transformThemes(data: typeof themesData): Theme[] {
  const transformed: Theme[] = [];
  const seen = new Set<ThemeTag>();

  for (const theme of data as ThemeLike[]) {
    const normalizedId = normalizeThemeTag(theme.id);
    if (!normalizedId || seen.has(normalizedId)) {
      continue;
    }

    seen.add(normalizedId);
    transformed.push({
      id: normalizedId,
      color: theme.color,
      description: theme.description || '',
    });
  }

  return transformed;
}

// ===== SWIMLANE COLLISION DETECTION =====
export function assignSwimlanes(entities: TimelineEntity[]): TimelineEntity[] {
  const byType = {
    person: entities.filter((e) => e.type === 'person'),
    event: entities.filter((e) => e.type === 'event'),
    book: entities.filter((e) => e.type === 'book'),
  };

  Object.values(byType).forEach((group) => {
    const sorted = group.sort((a, b) => b.startYear - a.startYear);
    const lanes: Array<{ end: number }> = [];

    sorted.forEach((entity) => {
      const end = entity.endYear || entity.startYear;
      let laneIndex = lanes.findIndex((lane) => lane.end > entity.startYear);

      if (laneIndex === -1) {
        laneIndex = lanes.length;
        lanes.push({ end });
      } else {
        lanes[laneIndex].end = Math.min(lanes[laneIndex].end, end);
      }

      entity.swimlane = laneIndex;
    });
  });

  return entities;
}

export interface TimelineDomain {
  startYear: number;
  endYear: number;
}

export function computeTimelineDomain(
  entities: TimelineEntity[],
  periodList: Period[],
  earlyPadding = 100,
  latePadding = 50,
): TimelineDomain {
  const startYearCandidates = [
    ...entities.map((entity) => entity.startYear),
    ...periodList.map((period) => period.startYear),
  ];

  const endYearCandidates = [
    ...entities.map((entity) => entity.endYear ?? entity.startYear),
    ...periodList.map((period) => period.endYear),
  ];

  return {
    startYear: Math.max(...startYearCandidates) + earlyPadding,
    endYear: Math.min(...endYearCandidates) - latePadding,
  };
}

// ===== EXPORT DATA =====
export const periods: Period[] = transformPeriods(periodsData);
export const themes: Theme[] = transformThemes(themesData);
export const themeTags: ThemeTag[] = themes.map((theme) => theme.id);
export const relationships: Relationship[] = relationshipsData as Relationship[];

// Combine all entities
const allEntities: TimelineEntity[] = [
  ...transformPeople(peopleData),
  ...transformEvents(eventsData),
  ...transformBooks(booksData),
];

// Assign swimlanes and export
export const timelineData: TimelineEntity[] = assignSwimlanes(allEntities);

// Derived domain for viewport/data integrity checks.
export const timelineDomain: TimelineDomain = computeTimelineDomain(
  timelineData,
  periods,
);
