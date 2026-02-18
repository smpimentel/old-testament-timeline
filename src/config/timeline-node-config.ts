/**
 * Centralized configuration for timeline node visual properties.
 * Single source of truth for zoom tiers and node metrics.
 */

import type { EntityType } from '../data/timeline-data';

/** false = Figma-locked sizes, true = adaptive zoom tiers */
export const ADAPTIVE_NODE_SIZING = false;

export interface NodeMetrics {
  height: number;
  minHeight: number;
  showLabel: boolean;
  showBadges: boolean;
}

const FIGMA_SIZES: Record<EntityType, NodeMetrics> = {
  event:  { height: 20, minHeight: 20, showLabel: true, showBadges: true },
  person: { height: 20, minHeight: 20, showLabel: true, showBadges: true },
  book:   { height: 40, minHeight: 40, showLabel: true, showBadges: true },
};

export interface ZoomTier {
  maxZoom: number; // Upper bound (exclusive) for this tier
  metrics: NodeMetrics;
}

// Zoom tier configs per entity type
// Tiers are checked in order; first match where zoomLevel < maxZoom wins
const personZoomTiers: ZoomTier[] = [
  { maxZoom: 0.4, metrics: { height: 4, minHeight: 8, showLabel: true, showBadges: false } },
  { maxZoom: 0.65, metrics: { height: 8, minHeight: 8, showLabel: true, showBadges: false } },
  { maxZoom: 0.75, metrics: { height: 16, minHeight: 16, showLabel: true, showBadges: false } },
  { maxZoom: 1.0, metrics: { height: 16, minHeight: 16, showLabel: true, showBadges: false } },
  { maxZoom: Infinity, metrics: { height: 24, minHeight: 24, showLabel: true, showBadges: true } },
];

const eventZoomTiers: ZoomTier[] = [
  { maxZoom: 0.4, metrics: { height: 6, minHeight: 10, showLabel: true, showBadges: false } },
  { maxZoom: 0.65, metrics: { height: 10, minHeight: 10, showLabel: true, showBadges: false } },
  { maxZoom: 0.75, metrics: { height: 16, minHeight: 16, showLabel: true, showBadges: false } },
  { maxZoom: 1.0, metrics: { height: 16, minHeight: 16, showLabel: true, showBadges: false } },
  { maxZoom: Infinity, metrics: { height: 20, minHeight: 20, showLabel: true, showBadges: true } },
];

const bookZoomTiers: ZoomTier[] = [
  { maxZoom: 0.4, metrics: { height: 3, minHeight: 6, showLabel: true, showBadges: false } },
  { maxZoom: 0.65, metrics: { height: 6, minHeight: 6, showLabel: true, showBadges: false } },
  { maxZoom: 0.75, metrics: { height: 12, minHeight: 12, showLabel: true, showBadges: false } },
  { maxZoom: 1.0, metrics: { height: 12, minHeight: 12, showLabel: true, showBadges: false } },
  { maxZoom: Infinity, metrics: { height: 18, minHeight: 18, showLabel: true, showBadges: true } },
];

const zoomTiersByType: Record<EntityType, ZoomTier[]> = {
  person: personZoomTiers,
  event: eventZoomTiers,
  book: bookZoomTiers,
};

/**
 * Get node metrics for an entity type at a given zoom level.
 */
export function getNodeMetrics(entityType: EntityType, zoomLevel: number): NodeMetrics {
  if (!ADAPTIVE_NODE_SIZING) return FIGMA_SIZES[entityType];
  const tiers = zoomTiersByType[entityType];
  for (const tier of tiers) {
    if (zoomLevel < tier.maxZoom) {
      return tier.metrics;
    }
  }
  // Fallback to last tier (should never reach due to Infinity)
  return tiers[tiers.length - 1].metrics;
}

/**
 * Get max node height for an entity type (highest zoom tier).
 */
export function getMaxNodeHeight(entityType: EntityType): number {
  if (!ADAPTIVE_NODE_SIZING) return FIGMA_SIZES[entityType].height;
  const tiers = zoomTiersByType[entityType];
  return tiers[tiers.length - 1].metrics.height;
}

/**
 * Theme highlight color map for entity outlines.
 */
export const themeHighlightColors: Record<string, string> = {
  'Covenant': '#F4D19B',
  'Kingship': '#D4B5D4',
  'Land': '#C8D4B8',
  'Messiah': '#A8D5E2',
  'Judgment': '#B22222',
  'Deliverance': '#228B22',
  'Restoration': '#2E8B57',
  'Origins': '#8B4513',
  'Patriarchs': '#DAA520',
  'Conquest': '#556B2F',
  'Monarchy': '#9932CC',
  'Temple': '#CD853F',
};

/**
 * Breadcrumb accent color (Egyptian Amber).
 */
export const breadcrumbAccentColor = '#F4D19B';
