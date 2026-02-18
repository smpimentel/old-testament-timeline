// Dual-scale: log-compressed [4004, 2300] BC + linear 4px/yr [2300, END] BC

export const ERA_START = 4004;        // BC — Creation, leftmost point
export const LOG_BOUNDARY = 2300;     // BC — hard join between log and linear
export const LOG_BAND_PX = 600;       // px budget for pre-2300 BC era (tunable)
export const LINEAR_PX_PER_YEAR = 4;  // post-2300 BC scale

/**
 * Convert a BC year to world-space x position.
 * Log zone: [ERA_START..LOG_BOUNDARY] → [0..LOG_BAND_PX]
 * Linear zone: [LOG_BOUNDARY..0] → [LOG_BAND_PX..]
 */
export function yearToX(year: number): number {
  if (year <= LOG_BOUNDARY) {
    // Linear zone: years at or after 2300 BC
    return LOG_BAND_PX + (LOG_BOUNDARY - year) * LINEAR_PX_PER_YEAR;
  }
  // Log-compressed zone: map [ERA_START, LOG_BOUNDARY] → [0, LOG_BAND_PX]
  const span = ERA_START - LOG_BOUNDARY;
  const logMax = Math.log(span + 1);
  const logVal = Math.log(ERA_START - year + 1);
  return (logVal / logMax) * LOG_BAND_PX;
}

/**
 * Inverse: convert world-space x to BC year.
 */
export function xToYear(x: number): number {
  if (x >= LOG_BAND_PX) {
    return LOG_BOUNDARY - (x - LOG_BAND_PX) / LINEAR_PX_PER_YEAR;
  }
  const span = ERA_START - LOG_BOUNDARY;
  const logMax = Math.log(span + 1);
  const ratio = x / LOG_BAND_PX;
  return ERA_START - Math.round(Math.exp(ratio * logMax)) + 1;
}
