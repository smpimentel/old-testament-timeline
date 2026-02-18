// Dual-scale: log-compressed [4004, 2300] BC + linear 4px/yr [2300, END] BC

export const ERA_START = 4004;        // BC — Creation, leftmost point
export const LOG_BOUNDARY = 2300;     // BC — hard join between log and linear
export const LOG_BAND_PX = 750;       // px budget for pre-2300 BC era (stretched for wider unknown era)
export const LINEAR_PX_PER_YEAR = 4;  // post-2300 BC scale
export const TIMELINE_X_OFFSET = -80; // shift all content left by ~20yr

// Compensation for kingdom background to stay in its original position
const ORIGINAL_LOG_BAND_PX = 600;
export const BG_ANCHOR_COMPENSATION = (LOG_BAND_PX - ORIGINAL_LOG_BAND_PX) + TIMELINE_X_OFFSET;

/**
 * Convert a BC year to world-space x position.
 * Log zone: [ERA_START..LOG_BOUNDARY] → [0..LOG_BAND_PX]
 * Linear zone: [LOG_BOUNDARY..0] → [LOG_BAND_PX..]
 * TIMELINE_X_OFFSET applied as final step to shift all content.
 */
export function yearToX(year: number): number {
  let x: number;
  if (year <= LOG_BOUNDARY) {
    // Linear zone: years at or after 2300 BC
    x = LOG_BAND_PX + (LOG_BOUNDARY - year) * LINEAR_PX_PER_YEAR;
  } else {
    // Log-compressed zone: map [ERA_START, LOG_BOUNDARY] → [0, LOG_BAND_PX]
    const span = ERA_START - LOG_BOUNDARY;
    const logMax = Math.log(span + 1);
    const logVal = Math.log(ERA_START - year + 1);
    x = (logVal / logMax) * LOG_BAND_PX;
  }
  return x + TIMELINE_X_OFFSET;
}

/**
 * Inverse: convert world-space x to BC year.
 */
export function xToYear(x: number): number {
  const adjusted = x - TIMELINE_X_OFFSET;
  if (adjusted >= LOG_BAND_PX) {
    return LOG_BOUNDARY - (adjusted - LOG_BAND_PX) / LINEAR_PX_PER_YEAR;
  }
  const span = ERA_START - LOG_BOUNDARY;
  const logMax = Math.log(span + 1);
  const ratio = adjusted / LOG_BAND_PX;
  return ERA_START - Math.round(Math.exp(ratio * logMax)) + 1;
}
