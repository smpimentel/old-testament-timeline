import { getNodeMetrics } from '../config/timeline-node-config';
import type { EntityType } from '../data/timeline-data';

const LABEL_CHAR_WIDTH = 7;
const MIN_LABEL_WIDTH = 56;
const MAX_PERIOD_LABEL_WIDTH = 220;
const MAX_NODE_LABEL_WIDTH = 200;
const LABEL_GAP = 8;
const PERIOD_LABEL_INSET = 4;
export interface PeriodLabelInput {
  id: string;
  x: number;
  width: number;
  name: string;
}

export interface PeriodLabelPlacement {
  lane: number;
}

export interface NodeLabelInput {
  id: string;
  type: EntityType;
  swimlane: number;
  x: number;
  width: number;
  name: string;
  priority: number;
  kingdom?: string;
}

function estimateLabelWidth(label: string, maxWidth: number): number {
  const estimated = (label.length * LABEL_CHAR_WIDTH) + 12;
  return Math.max(MIN_LABEL_WIDTH, Math.min(maxWidth, estimated));
}

function intervalsOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

export function computePeriodLabelLayout(periods: PeriodLabelInput[]): Record<string, PeriodLabelPlacement> {
  const placements: Record<string, PeriodLabelPlacement> = {};
  const laneEnds: number[] = [];

  const ordered = [...periods].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    if (a.width !== b.width) return a.width - b.width;
    return a.id.localeCompare(b.id);
  });

  for (const period of ordered) {
    const labelStart = period.x + PERIOD_LABEL_INSET;
    const availableWidth = Math.max(24, period.width - (PERIOD_LABEL_INSET * 2));
    const labelWidth = Math.min(
      availableWidth,
      estimateLabelWidth(period.name, MAX_PERIOD_LABEL_WIDTH),
    );
    const labelEnd = labelStart + labelWidth;

    let laneIndex = laneEnds.findIndex((laneEnd) => labelStart >= laneEnd + LABEL_GAP);

    if (laneIndex === -1) {
      laneIndex = laneEnds.length;
      laneEnds.push(labelEnd);
    } else {
      laneEnds[laneIndex] = labelEnd;
    }

    placements[period.id] = { lane: laneIndex };
  }

  return placements;
}

export function computeNodeLabelVisibility(
  nodes: NodeLabelInput[],
  zoomLevel: number,
): Record<string, boolean> {
  const visibility: Record<string, boolean> = {};
  const placedByLane = new Map<string, Array<{ start: number; end: number }>>();

  const ordered = [...nodes].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.x !== b.x) return a.x - b.x;
    return a.id.localeCompare(b.id);
  });

  for (const node of ordered) {
    const metrics = getNodeMetrics(node.type, zoomLevel);
    if (!metrics.showLabel) {
      visibility[node.id] = false;
      continue;
    }

    const laneKey = `${node.type}:${node.kingdom ?? ''}:${node.swimlane}`;
    const labelWidthEstimate = estimateLabelWidth(node.name, MAX_NODE_LABEL_WIDTH);
    const isPointNode = node.width <= 32;
    const labelWidth = isPointNode
      ? labelWidthEstimate
      : Math.min(labelWidthEstimate, Math.max(node.width, MIN_LABEL_WIDTH));
    const start = node.x;
    const end = node.x + labelWidth;
    const laneIntervals = placedByLane.get(laneKey) ?? [];

    const collides = laneIntervals.some((interval) =>
      intervalsOverlap(start - LABEL_GAP, end + LABEL_GAP, interval.start, interval.end),
    );

    if (collides) {
      visibility[node.id] = false;
      continue;
    }

    laneIntervals.push({ start, end });
    placedByLane.set(laneKey, laneIntervals);
    visibility[node.id] = true;
  }

  return visibility;
}
