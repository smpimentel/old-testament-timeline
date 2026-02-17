/**
 * Timeline Track Layout Engine
 * Pure layout calculator for collision-safe vertical track positioning.
 * Independent of zoom/render state.
 */

import type { EntityType } from '../data/timeline-data';

// ===== TYPES =====

export interface TrackLayoutConfig {
  /** Max node height per entity type (at highest zoom) */
  maxNodeHeight: {
    event: number;
    person: number;
    book: number;
  };
  /** Gap between swimlanes within a track */
  laneGap: number;
  /** Gap between track bands */
  trackGap: number;
  /** Header offset from top (for period bands) */
  headerOffset: number;
  /** Number of swimlanes per track type */
  laneCount: {
    event: number;
    person: number;
    book: number;
  };
}

export interface TrackBand {
  /** Entity type for this band */
  type: EntityType;
  /** Y position where track starts */
  baseY: number;
  /** Height per swimlane (maxNodeHeight + laneGap) */
  laneStride: number;
  /** Total height of this track band */
  bandHeight: number;
}

export interface TrackLayout {
  events: TrackBand;
  people: TrackBand;
  books: TrackBand;
  totalHeight: number;
}

// ===== DEFAULT CONFIG =====

export const DEFAULT_TRACK_CONFIG: TrackLayoutConfig = {
  maxNodeHeight: {
    event: 24,   // max event node height at zoom >= 2.5
    person: 28,  // max person node height (24 + role badge overhang)
    book: 22,    // max book node height at zoom >= 2.5
  },
  laneGap: 8,
  trackGap: 48,
  headerOffset: 100, // space for period bands + grid labels
  laneCount: {
    event: 4,
    person: 6,
    book: 3,
  },
};

// ===== CORE LAYOUT CALCULATOR =====

/**
 * Computes collision-safe track layout.
 * Deterministic - same config always yields same layout.
 */
export function computeTrackLayout(
  config: TrackLayoutConfig = DEFAULT_TRACK_CONFIG
): TrackLayout {
  const { maxNodeHeight, laneGap, trackGap, headerOffset, laneCount } = config;

  // Lane stride = max node height + gap between lanes
  const eventLaneStride = maxNodeHeight.event + laneGap;
  const personLaneStride = maxNodeHeight.person + laneGap;
  const bookLaneStride = maxNodeHeight.book + laneGap;

  // Band heights = stride * lane count
  const eventBandHeight = eventLaneStride * laneCount.event;
  const personBandHeight = personLaneStride * laneCount.person;
  const bookBandHeight = bookLaneStride * laneCount.book;

  // Compute base Y positions (stack from top)
  const eventBaseY = headerOffset;
  const peopleBaseY = eventBaseY + eventBandHeight + trackGap;
  const bookBaseY = peopleBaseY + personBandHeight + trackGap;

  // Total height
  const totalHeight = bookBaseY + bookBandHeight + trackGap;

  return {
    events: {
      type: 'event',
      baseY: eventBaseY,
      laneStride: eventLaneStride,
      bandHeight: eventBandHeight,
    },
    people: {
      type: 'person',
      baseY: peopleBaseY,
      laneStride: personLaneStride,
      bandHeight: personBandHeight,
    },
    books: {
      type: 'book',
      baseY: bookBaseY,
      laneStride: bookLaneStride,
      bandHeight: bookBandHeight,
    },
    totalHeight,
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Gets Y position for entity based on type and swimlane.
 */
export function getEntityY(
  layout: TrackLayout,
  entityType: EntityType,
  swimlane: number
): number {
  const track = getTrackForType(layout, entityType);
  return track.baseY + swimlane * track.laneStride;
}

/**
 * Gets track band for entity type.
 */
export function getTrackForType(
  layout: TrackLayout,
  entityType: EntityType
): TrackBand {
  switch (entityType) {
    case 'event':
      return layout.events;
    case 'person':
      return layout.people;
    case 'book':
      return layout.books;
    default:
      return layout.events;
  }
}

/**
 * Validates that tracks don't collide.
 * Returns true if layout is collision-free.
 */
export function validateTrackLayout(layout: TrackLayout): boolean {
  const eventsEnd = layout.events.baseY + layout.events.bandHeight;
  const peopleEnd = layout.people.baseY + layout.people.bandHeight;
  const booksEnd = layout.books.baseY + layout.books.bandHeight;

  // Check events doesn't overlap people
  if (eventsEnd > layout.people.baseY) return false;

  // Check people doesn't overlap books
  if (peopleEnd > layout.books.baseY) return false;

  // Check books fits within total height
  if (booksEnd > layout.totalHeight) return false;

  return true;
}

/**
 * Computes max swimlanes needed based on entity data.
 * Can be used to adjust lane counts dynamically.
 */
export function computeRequiredLanes(
  entities: Array<{ type: EntityType; swimlane?: number }>
): { event: number; person: number; book: number } {
  const result = { event: 0, person: 0, book: 0 };

  for (const entity of entities) {
    const lane = (entity.swimlane ?? 0) + 1;
    switch (entity.type) {
      case 'event':
        result.event = Math.max(result.event, lane);
        break;
      case 'person':
        result.person = Math.max(result.person, lane);
        break;
      case 'book':
        result.book = Math.max(result.book, lane);
        break;
    }
  }

  return result;
}

/**
 * Creates config with lane counts derived from entity data.
 */
export function createConfigFromEntities(
  entities: Array<{ type: EntityType; swimlane?: number }>,
  baseConfig: TrackLayoutConfig = DEFAULT_TRACK_CONFIG
): TrackLayoutConfig {
  const requiredLanes = computeRequiredLanes(entities);

  return {
    ...baseConfig,
    laneCount: {
      event: Math.max(baseConfig.laneCount.event, requiredLanes.event, 1),
      person: Math.max(baseConfig.laneCount.person, requiredLanes.person, 1),
      book: Math.max(baseConfig.laneCount.book, requiredLanes.book, 1),
    },
  };
}
