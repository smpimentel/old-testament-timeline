const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'Resources', 'figma-export', 'period-sections');

const people = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'compiled', 'people.json'), 'utf8'));
const events = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'compiled', 'events.json'), 'utf8'));
const books = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'compiled', 'books.json'), 'utf8'));

const entities = [
  ...events.map((e) => ({ ...e, entityType: 'event' })),
  ...people.map((p) => ({ ...p, entityType: 'person' })),
  ...books.map((b) => ({ ...b, entityType: 'book' })),
];

const periods = [
  { id: 'dates-unknown', name: 'Unknown', startYear: 4004, endYear: 2166, color: '#E0E0E0', description: 'Creation, Fall, Flood, Tower of Babel' },
  { id: 'patriarchs', name: 'Patriarch', startYear: 2166, endYear: 1876, color: '#FFF9C4', description: 'Abraham, Isaac, Jacob' },
  { id: 'egypt', name: 'Sojourn', startYear: 1876, endYear: 1446, color: '#FFCCBC', description: 'Israel enslaved in Egypt' },
  { id: 'wandering', name: 'Wandering', startYear: 1446, endYear: 1406, color: '#D7CCC8', description: 'Wilderness journey to Promised Land' },
  { id: 'judges', name: 'Conquest/Judges', startYear: 1406, endYear: 1050, color: '#C8E6C9', description: 'Conquest of Canaan followed by the era of the judges.' },
  { id: 'united-kingdom', name: 'United Monarchy', startYear: 1050, endYear: 930, color: '#BBDEFB', description: 'Saul, David, and Solomon ruled a united Israel.' },
  { id: 'divided-kingdom', name: 'Divided Monarchy', startYear: 930, endYear: 586, color: '#E1BEE7', description: 'Kingdom split into Israel (north) and Judah (south)' },
  { id: 'exile', name: 'Exile and Restoration', startYear: 586, endYear: 400, color: '#BDBDBD', description: 'Babylonian exile and the return to rebuild temple and covenant life.' },
];

const NODE_COLORS = {
  event: '#E6C7C0',
  person: '#C8D4B8',
  book: '#C9D6E6',
};

const BG = '#F7F1E4';
const PANEL = '#FFFDF7';
const GRID_MAJOR = '#C7B8A2';
const GRID_MINOR = '#E3D7C4';
const TEXT_PRIMARY = '#2D241C';
const TEXT_SECONDARY = '#6F6254';

const HEADER_H = 108;
const PERIOD_BAND_H = 84;
const TRACK_GAP = 44;
const LEFT_PAD = 120;
const TOP_PAD = 26;
const RIGHT_PAD = 80;

const LANE = {
  event: { stride: 30, nodeH: 20 },
  person: { stride: 34, nodeH: 24 },
  book: { stride: 28, nodeH: 18 },
};

function escapeXml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function byStartThenType(a, b) {
  if (a.startYear !== b.startYear) return b.startYear - a.startYear;
  const order = { event: 0, person: 1, book: 2 };
  if (order[a.entityType] !== order[b.entityType]) return order[a.entityType] - order[b.entityType];
  return a.id.localeCompare(b.id);
}

function inPeriodByOverlap(entity, period) {
  const effectivePeriodStart = period.id === 'dates-unknown'
    ? Math.max(period.startYear, 4004)
    : period.startYear;
  const entityEnd = entity.endYear || entity.startYear;
  return entity.startYear >= period.endYear && entityEnd <= effectivePeriodStart;
}

function getLabel(entity) {
  const tagSource = Array.isArray(entity.categories) && entity.categories.length > 0
    ? entity.categories[0]
    : entity.entityType;
  return `${entity.name} (${tagSource})`;
}

function renderPeriod(period) {
  const periodEntities = entities
    .filter((entity) => inPeriodByOverlap(entity, period))
    .sort(byStartThenType);

  const maxLane = {
    event: Math.max(0, ...periodEntities.filter((e) => e.entityType === 'event').map((e) => e.swimlane || 0)),
    person: Math.max(0, ...periodEntities.filter((e) => e.entityType === 'person').map((e) => e.swimlane || 0)),
    book: Math.max(0, ...periodEntities.filter((e) => e.entityType === 'book').map((e) => e.swimlane || 0)),
  };

  const laneCount = {
    event: maxLane.event + 1,
    person: maxLane.person + 1,
    book: maxLane.book + 1,
  };

  const years = period.startYear - period.endYear;
  const pixelsPerYear = years >= 1000 ? 1.8 : years >= 300 ? 2.4 : 4.2;
  const timelineW = Math.round(years * pixelsPerYear);

  const eventH = laneCount.event * LANE.event.stride;
  const peopleH = laneCount.person * LANE.person.stride;
  const booksH = laneCount.book * LANE.book.stride;

  const eventsY = HEADER_H + PERIOD_BAND_H + TOP_PAD;
  const peopleY = eventsY + eventH + TRACK_GAP;
  const booksY = peopleY + peopleH + TRACK_GAP;
  const canvasH = booksY + booksH + 90;
  const canvasW = LEFT_PAD + timelineW + RIGHT_PAD;

  const yearToX = (year) => LEFT_PAD + ((period.startYear - year) * pixelsPerYear);

  const parts = [];
  parts.push(`<svg width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}" xmlns="http://www.w3.org/2000/svg">`);
  parts.push(`<rect width="${canvasW}" height="${canvasH}" fill="${BG}"/>`);

  parts.push(`<text x="20" y="34" font-family="Cormorant Garamond, serif" font-size="30" font-weight="700" fill="${TEXT_PRIMARY}">${escapeXml(period.name)}</text>`);
  parts.push(`<text x="20" y="58" font-family="Source Sans 3, sans-serif" font-size="13" fill="${TEXT_SECONDARY}">${period.startYear}-${period.endYear} BC - ${escapeXml(period.description)}</text>`);
  parts.push(`<text x="20" y="78" font-family="Source Sans 3, sans-serif" font-size="12" fill="${TEXT_SECONDARY}">Nodes included by start year in this period. Move nodes in Figma, then share updated coordinates.</text>`);

  parts.push(`<rect x="10" y="${HEADER_H - 8}" width="${canvasW - 20}" height="${canvasH - HEADER_H - 10}" rx="10" fill="${PANEL}" stroke="${GRID_MAJOR}"/>`);
  parts.push(`<rect x="${LEFT_PAD}" y="${HEADER_H + 8}" width="${timelineW}" height="${PERIOD_BAND_H}" fill="${period.color}44" stroke="${period.color}"/>`);
  parts.push(`<text x="${LEFT_PAD + 12}" y="${HEADER_H + 34}" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="${TEXT_SECONDARY}">${escapeXml(period.id).toUpperCase()}</text>`);

  const majorStep = years > 600 ? 200 : years > 240 ? 100 : years > 100 ? 50 : 20;
  const firstMajor = Math.ceil(period.endYear / majorStep) * majorStep;
  for (let y = firstMajor; y <= period.startYear; y += majorStep) {
    const x = yearToX(y);
    parts.push(`<line x1="${x}" y1="${HEADER_H + PERIOD_BAND_H + 8}" x2="${x}" y2="${canvasH - 26}" stroke="${GRID_MAJOR}" stroke-width="1"/>`);
    parts.push(`<text x="${x - 20}" y="${HEADER_H + PERIOD_BAND_H + 2}" font-family="IBM Plex Mono, monospace" font-size="10" fill="${TEXT_SECONDARY}">${y}</text>`);
  }

  const minorStep = Math.max(10, Math.floor(majorStep / 2));
  const firstMinor = Math.ceil(period.endYear / minorStep) * minorStep;
  for (let y = firstMinor; y <= period.startYear; y += minorStep) {
    if (y % majorStep === 0) continue;
    const x = yearToX(y);
    parts.push(`<line x1="${x}" y1="${HEADER_H + PERIOD_BAND_H + 8}" x2="${x}" y2="${canvasH - 26}" stroke="${GRID_MINOR}" stroke-width="1"/>`);
  }

  parts.push(`<rect x="20" y="${eventsY}" width="74" height="22" rx="6" fill="${PANEL}" stroke="${GRID_MAJOR}"/>`);
  parts.push(`<text x="36" y="${eventsY + 15}" font-family="Source Sans 3, sans-serif" font-size="11" font-weight="700" fill="${TEXT_SECONDARY}">EVENTS</text>`);

  parts.push(`<rect x="20" y="${peopleY}" width="74" height="22" rx="6" fill="${PANEL}" stroke="${GRID_MAJOR}"/>`);
  parts.push(`<text x="36" y="${peopleY + 15}" font-family="Source Sans 3, sans-serif" font-size="11" font-weight="700" fill="${TEXT_SECONDARY}">PEOPLE</text>`);

  parts.push(`<rect x="20" y="${booksY}" width="74" height="22" rx="6" fill="${PANEL}" stroke="${GRID_MAJOR}"/>`);
  parts.push(`<text x="41" y="${booksY + 15}" font-family="Source Sans 3, sans-serif" font-size="11" font-weight="700" fill="${TEXT_SECONDARY}">BOOKS</text>`);

  parts.push(`<line x1="${LEFT_PAD}" y1="${peopleY - Math.round(TRACK_GAP / 2)}" x2="${LEFT_PAD + timelineW}" y2="${peopleY - Math.round(TRACK_GAP / 2)}" stroke="${GRID_MINOR}"/>`);
  parts.push(`<line x1="${LEFT_PAD}" y1="${booksY - Math.round(TRACK_GAP / 2)}" x2="${LEFT_PAD + timelineW}" y2="${booksY - Math.round(TRACK_GAP / 2)}" stroke="${GRID_MINOR}"/>`);

  let counts = { event: 0, person: 0, book: 0 };

  for (const entity of periodEntities) {
    const lane = entity.swimlane || 0;
    const baseY = entity.entityType === 'event' ? eventsY : entity.entityType === 'person' ? peopleY : booksY;
    const stride = LANE[entity.entityType].stride;
    const nodeH = LANE[entity.entityType].nodeH;

    const y = baseY + lane * stride + 30;
    const x = yearToX(entity.startYear);
    const label = getLabel(entity);
    const idSafe = `${entity.entityType}-${entity.id}`.replace(/[^a-zA-Z0-9_-]/g, '-');

    if (entity.entityType === 'event') {
      parts.push(`<g id="${idSafe}">`);
      parts.push(`<circle cx="${x}" cy="${y + Math.round(nodeH / 2)}" r="${Math.round(nodeH / 2)}" fill="${NODE_COLORS.event}" stroke="#2D241C" stroke-width="1.5"/>`);
      parts.push(`<text x="${x + 14}" y="${y + Math.round(nodeH / 2) + 4}" font-family="Source Sans 3, sans-serif" font-size="12" font-weight="600" fill="${TEXT_PRIMARY}">${escapeXml(label)}</text>`);
      parts.push(`</g>`);
    } else {
      const endYear = entity.endYear && entity.endYear !== entity.startYear ? entity.endYear : entity.startYear;
      const w = Math.max(nodeH, Math.round((entity.startYear - endYear) * pixelsPerYear));
      parts.push(`<g id="${idSafe}">`);
      parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${nodeH}" rx="6" fill="${NODE_COLORS[entity.entityType]}" stroke="#2D241C" stroke-width="1.5"/>`);
      parts.push(`<text x="${x + 6}" y="${y + nodeH + 14}" font-family="Source Sans 3, sans-serif" font-size="12" font-weight="600" fill="${TEXT_PRIMARY}">${escapeXml(label)}</text>`);
      parts.push(`</g>`);
    }

    counts[entity.entityType] += 1;
  }

  parts.push(`<text x="20" y="${canvasH - 14}" font-family="IBM Plex Mono, monospace" font-size="11" fill="${TEXT_SECONDARY}">Counts: events ${counts.event}, people ${counts.person}, books ${counts.book}, total ${periodEntities.length}</text>`);

  parts.push(`</svg>`);

  const filename = `${String(period.id).replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.svg`;
  fs.writeFileSync(path.join(OUT_DIR, filename), parts.join('\n'));

  return {
    ...period,
    filename,
    counts,
    total: periodEntities.length,
    width: canvasW,
    height: canvasH,
  };
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const summary = periods.map(renderPeriod);

const readme = [
  '# Period Section SVG Exports',
  '',
  'Each SVG is Figma-import ready and includes all nodes that overlap that period range.',
  '',
  '## Import',
  '1. Drag one or more SVG files into Figma.',
  '2. Move nodes where you want them.',
  '3. Share back the edited coordinates (or export JSON from Figma plugin), and implementation can be updated.',
  '',
  '## Files',
  ...summary.map((s) => `- ${s.filename} (${s.total} nodes; ${s.width}x${s.height})`),
  '',
  '## Node totals by period',
  ...summary.map((s) => `- ${s.id}: events ${s.counts.event}, people ${s.counts.person}, books ${s.counts.book}, total ${s.total}`),
  '',
].join('\n');

fs.writeFileSync(path.join(OUT_DIR, 'README.md'), readme);
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(summary, null, 2));

console.log(`Exported ${summary.length} period SVG files to ${OUT_DIR}`);
