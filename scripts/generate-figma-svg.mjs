/**
 * Generates an SVG of the full Old Testament timeline for Figma import.
 * Each entity is a labeled, moveable element with its data-id.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data', 'compiled');

// Load data
const periods = JSON.parse(readFileSync(join(dataDir, 'periods.json'), 'utf-8'));
const events = JSON.parse(readFileSync(join(dataDir, 'events.json'), 'utf-8'));
const people = JSON.parse(readFileSync(join(dataDir, 'people.json'), 'utf-8'));
const books = JSON.parse(readFileSync(join(dataDir, 'books.json'), 'utf-8'));

// ===== LAYOUT CONSTANTS =====
const START_YEAR = 4004; // earliest year (BC)
const END_YEAR = 400;    // latest year (BC)
const PX_PER_YEAR = 2;
const LEFT_MARGIN = 120; // space for track labels
const TOP_MARGIN = 40;
const TIMELINE_WIDTH = (START_YEAR - END_YEAR) * PX_PER_YEAR; // ~7208px
const TOTAL_WIDTH = TIMELINE_WIDTH + LEFT_MARGIN + 60;

// Track layout (matching app)
const HEADER_HEIGHT = 90;
const LANE_GAP = 8;

const NODE_HEIGHT = { event: 20, person: 24, book: 18 };
const LANE_STRIDE = {
  event: NODE_HEIGHT.event + LANE_GAP,
  person: NODE_HEIGHT.person + LANE_GAP,
  book: NODE_HEIGHT.book + LANE_GAP,
};

// Compute required lanes from data
function maxLane(entities) {
  return entities.reduce((max, e) => Math.max(max, (e.swimlane ?? 0) + 1), 1);
}
const LANE_COUNT = {
  event: maxLane(events),
  person: maxLane(people),
  book: maxLane(books),
};

const TRACK_GAP = 48;
const EVENT_BASE_Y = TOP_MARGIN + HEADER_HEIGHT;
const EVENT_BAND_H = LANE_COUNT.event * LANE_STRIDE.event;
const PEOPLE_BASE_Y = EVENT_BASE_Y + EVENT_BAND_H + TRACK_GAP;
const PEOPLE_BAND_H = LANE_COUNT.person * LANE_STRIDE.person;
const BOOK_BASE_Y = PEOPLE_BASE_Y + PEOPLE_BAND_H + TRACK_GAP;
const BOOK_BAND_H = LANE_COUNT.book * LANE_STRIDE.book;
const TOTAL_HEIGHT = BOOK_BASE_Y + BOOK_BAND_H + TRACK_GAP + 40;

// ===== HELPERS =====
function yearToX(year) {
  return LEFT_MARGIN + (START_YEAR - year) * PX_PER_YEAR;
}

function getEntityY(type, swimlane) {
  const lane = swimlane ?? 0;
  switch (type) {
    case 'event': return EVENT_BASE_Y + lane * LANE_STRIDE.event;
    case 'person': return PEOPLE_BASE_Y + lane * LANE_STRIDE.person;
    case 'book': return BOOK_BASE_Y + lane * LANE_STRIDE.book;
  }
}

function escXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Role/category colors
const ROLE_COLORS = {
  King: '#F5D99F', Prophet: '#C8B8D4', Judge: '#B8C4A8', Priest: '#D4C5E0',
  Patriarch: '#C8D4B8', Warrior: '#D9B5A0', Scribe: '#E6DCC8', Other: '#D4D9DE',
};
const EVENT_COLORS = {
  judgment: '#E6A8A8', covenant: '#F4D19B', deliverance: '#B8D9E6', temple: '#E6D4B8',
  origins: '#D9C4A8', patriarchs: '#F4D19B', conquest: '#C8D4B8', monarchy: '#CFB8D4',
  restoration: '#C8E6C9', event: '#D4D9DE',
};
const BOOK_COLORS = {
  Pentateuch: '#E6D4A8', History: '#A8C4E0', Poetry: '#D4C8E0',
  'Major Prophets': '#D9C4A8', 'Minor Prophets': '#C8D4B8',
};

function getColor(entity) {
  const cat = entity.categories?.[0] || '';
  if (entity.type === 'person') return ROLE_COLORS[cat] || ROLE_COLORS.Other;
  if (entity.type === 'event') return EVENT_COLORS[cat] || EVENT_COLORS.event;
  if (entity.type === 'book') return BOOK_COLORS[cat] || '#D4D9DE';
  return '#D4D9DE';
}

// ===== BUILD SVG =====
const parts = [];

parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${TOTAL_WIDTH}" height="${TOTAL_HEIGHT}" viewBox="0 0 ${TOTAL_WIDTH} ${TOTAL_HEIGHT}" font-family="Inter, system-ui, sans-serif">`);

// Background
parts.push(`<rect width="${TOTAL_WIDTH}" height="${TOTAL_HEIGHT}" fill="#FAF6F0" />`);

// Title
parts.push(`<text x="${LEFT_MARGIN}" y="${TOP_MARGIN - 10}" font-size="20" font-weight="700" fill="#3D3929">Old Testament Timeline — Figma Editable Board</text>`);

// ===== PERIOD BANDS =====
// Filter to main periods (skip duplicates like dates-unknown, patriarchs, united-kingdom)
const mainPeriods = periods.filter(p =>
  ['primeval-history', 'patriarchal-period', 'egyptian-sojourn', 'wilderness-wanderings',
   'conquest-and-settlement', 'judges', 'united-monarchy', 'divided-kingdom',
   'babylonian-exile', 'restoration-period'].includes(p.id)
);

for (const p of mainPeriods) {
  const x = yearToX(p.startYear);
  const w = (p.startYear - p.endYear) * PX_PER_YEAR;
  const color = p.color;
  parts.push(`<g id="period-${p.id}">`);
  parts.push(`  <rect x="${x}" y="${TOP_MARGIN}" width="${w}" height="${HEADER_HEIGHT}" fill="${color}" opacity="0.2" stroke="${color}" stroke-opacity="0.5" />`);
  parts.push(`  <text x="${x + 8}" y="${TOP_MARGIN + 16}" font-size="10" font-weight="700" fill="${color}" text-transform="uppercase" letter-spacing="0.5">${escXml(p.name.toUpperCase())}</text>`);
  parts.push(`  <text x="${x + 8}" y="${TOP_MARGIN + 30}" font-size="9" fill="#666">${p.startYear}–${p.endYear} BC</text>`);
  // Vertical extent line
  parts.push(`  <line x1="${x}" y1="${TOP_MARGIN + HEADER_HEIGHT}" x2="${x}" y2="${TOTAL_HEIGHT - 40}" stroke="${color}" stroke-opacity="0.1" stroke-dasharray="4 4" />`);
  parts.push(`</g>`);
}

// ===== GRID LINES (every 200 years) =====
for (let year = START_YEAR; year >= END_YEAR; year -= 200) {
  const x = yearToX(year);
  const isMajor = year % 500 === 0 || year === START_YEAR;
  parts.push(`<line x1="${x}" y1="${TOP_MARGIN + HEADER_HEIGHT}" x2="${x}" y2="${TOTAL_HEIGHT - 40}" stroke="#C4B99A" stroke-opacity="${isMajor ? 0.4 : 0.15}" />`);
  parts.push(`<text x="${x}" y="${TOP_MARGIN + HEADER_HEIGHT - 4}" font-size="9" fill="#999" text-anchor="middle" font-family="monospace">${year} BC</text>`);
}

// ===== TRACK LABELS + SEPARATORS =====
function drawTrackLabel(label, baseY, bandH) {
  const midY = baseY + bandH / 2;
  parts.push(`<rect x="10" y="${midY - 12}" width="80" height="24" rx="4" fill="#E8E0D4" />`);
  parts.push(`<text x="50" y="${midY + 4}" font-size="11" font-weight="700" fill="#6B5D3E" text-anchor="middle">${label}</text>`);
  // Horizontal line at top of track
  parts.push(`<line x1="${LEFT_MARGIN}" y1="${baseY}" x2="${TOTAL_WIDTH - 20}" y2="${baseY}" stroke="#C4B99A" stroke-opacity="0.3" />`);
}

drawTrackLabel('EVENTS', EVENT_BASE_Y, EVENT_BAND_H);
drawTrackLabel('PEOPLE', PEOPLE_BASE_Y, PEOPLE_BAND_H);
drawTrackLabel('BOOKS', BOOK_BASE_Y, BOOK_BAND_H);

// Bottom line
parts.push(`<line x1="${LEFT_MARGIN}" y1="${BOOK_BASE_Y + BOOK_BAND_H}" x2="${TOTAL_WIDTH - 20}" y2="${BOOK_BASE_Y + BOOK_BAND_H}" stroke="#C4B99A" stroke-opacity="0.3" />`);

// ===== EVENT NODES =====
for (const e of events) {
  const x = yearToX(e.startYear);
  const y = getEntityY('event', e.swimlane);
  const color = getColor(e);
  const isPoint = !e.endYear || e.endYear === e.startYear;
  const cat = e.categories?.[0] || '';

  parts.push(`<g id="event-${e.id}" data-type="event" data-id="${e.id}" data-year="${e.startYear}" data-swimlane="${e.swimlane ?? 0}" data-priority="${e.priority}">`);
  if (isPoint) {
    // Diamond/circle for point events
    parts.push(`  <circle cx="${x + 10}" cy="${y + 10}" r="10" fill="${color}" stroke="#6B5D3E" stroke-width="1" />`);
    parts.push(`  <text x="${x + 26}" y="${y + 14}" font-size="11" fill="#3D3929">${escXml(e.name)} (${cat})</text>`);
  } else {
    const w = Math.max((e.startYear - e.endYear) * PX_PER_YEAR, 20);
    parts.push(`  <rect x="${x}" y="${y}" width="${w}" height="${NODE_HEIGHT.event}" rx="3" fill="${color}" stroke="#6B5D3E" stroke-width="0.5" />`);
    parts.push(`  <text x="${x + 4}" y="${y + 14}" font-size="10" fill="#3D3929">${escXml(e.name)}</text>`);
  }
  parts.push(`</g>`);
}

// ===== PERSON NODES =====
for (const p of people) {
  const x = yearToX(p.startYear);
  const y = getEntityY('person', p.swimlane);
  const w = Math.max((p.startYear - (p.endYear || p.startYear)) * PX_PER_YEAR, 20);
  const color = getColor(p);
  const cat = p.categories?.[0] || '';

  parts.push(`<g id="person-${p.id}" data-type="person" data-id="${p.id}" data-start="${p.startYear}" data-end="${p.endYear || ''}" data-swimlane="${p.swimlane ?? 0}" data-priority="${p.priority}">`);
  parts.push(`  <rect x="${x}" y="${y}" width="${w}" height="${NODE_HEIGHT.person}" rx="4" fill="${color}" stroke="#6B5D3E" stroke-width="0.5" />`);
  parts.push(`  <text x="${x + 4}" y="${y + 16}" font-size="10" fill="#3D3929">${escXml(p.name)} (${cat})</text>`);
  parts.push(`</g>`);
}

// ===== BOOK NODES =====
for (const b of books) {
  const x = yearToX(b.startYear);
  const y = getEntityY('book', b.swimlane);
  const w = Math.max((b.startYear - (b.endYear || b.startYear)) * PX_PER_YEAR, 20);
  const color = getColor(b);
  const cat = b.categories?.[0] || '';

  parts.push(`<g id="book-${b.id}" data-type="book" data-id="${b.id}" data-start="${b.startYear}" data-end="${b.endYear || ''}" data-swimlane="${b.swimlane ?? 0}" data-priority="${b.priority}">`);
  parts.push(`  <rect x="${x}" y="${y}" width="${w}" height="${NODE_HEIGHT.book}" rx="3" fill="${color}" stroke="#6B5D3E" stroke-width="0.5" />`);
  parts.push(`  <text x="${x + 4}" y="${y + 13}" font-size="9" fill="#3D3929">${escXml(b.name)} (${cat})</text>`);
  parts.push(`</g>`);
}

parts.push('</svg>');

// Write SVG
const outPath = join(__dirname, '..', 'old-testament-timeline-board.svg');
writeFileSync(outPath, parts.join('\n'), 'utf-8');
console.log(`SVG written to: ${outPath}`);
console.log(`Dimensions: ${TOTAL_WIDTH}px x ${TOTAL_HEIGHT}px`);
console.log(`Entities: ${events.length} events, ${people.length} people, ${books.length} books`);
console.log(`Periods: ${mainPeriods.length}`);
console.log(`Lanes - events: ${LANE_COUNT.event}, people: ${LANE_COUNT.person}, books: ${LANE_COUNT.book}`);
