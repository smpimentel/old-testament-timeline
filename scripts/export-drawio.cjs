#!/usr/bin/env node

/**
 * Export the current compiled timeline into a draw.io (.drawio) file.
 * The X axis matches app coordinates:
 *   x = (START_YEAR - year) * PIXELS_PER_YEAR
 */

const fs = require('fs');
const path = require('path');

const START_YEAR = 4000;
const END_YEAR = 400;
const PIXELS_PER_YEAR = 2;
const TIMELINE_WIDTH = (START_YEAR - END_YEAR) * PIXELS_PER_YEAR;

const TRACK_LAYOUT = {
  events: { baseY: 100, laneStride: 32, bandHeight: 128, nodeHeight: 20 },
  people: { baseY: 276, laneStride: 36, bandHeight: 216, nodeHeight: 24 },
  books: { baseY: 540, laneStride: 30, bandHeight: 90, nodeHeight: 18 },
  totalHeight: 678,
};

const PERIOD_BAND_HEIGHT = 88;
const OUTPUT_FILE = path.join(process.cwd(), 'Resources', 'old-testament-timeline.drawio');
const COMPILED_DIR = path.join(process.cwd(), 'src', 'data', 'compiled');

const roleColors = {
  king: '#F5D99F',
  prophet: '#C8B8D4',
  judge: '#B8C4A8',
  priest: '#D4C5E0',
  patriarch: '#C8D4B8',
  warrior: '#D9B5A0',
  scribe: '#E6DCC8',
  other: '#D4D9DE',
};

const eventColors = {
  war: '#E6A8A8',
  treaty: '#E0E6E8',
  discovery: '#B8D9E6',
  construction: '#E6D4B8',
  festival: '#F0C8D4',
  succession: '#CFB8D4',
  disaster: '#C8C4BC',
  renaissance: '#F4E0C8',
  event: '#D4D9DE',
};

const genreColors = {
  political: '#A8C4E0',
  cultural: '#F4D4C8',
  religious: '#D4C8E0',
  economic: '#E6D4A8',
  military: '#D9B8A8',
  scientific: '#B8DDE0',
  agricultural: '#C8D9B8',
  maritime: '#B8CFD9',
};

function mapPersonCategory(categories) {
  const category = String(categories?.[0] || 'other').toLowerCase();
  const map = {
    king: 'king',
    prophet: 'prophet',
    judge: 'judge',
    priest: 'priest',
    patriarch: 'patriarch',
    warrior: 'warrior',
    scribe: 'scribe',
  };
  return map[category] || 'other';
}

function mapBookCategory(categories) {
  const category = String(categories?.[0] || 'religious').toLowerCase();
  const map = {
    pentateuch: 'religious',
    history: 'political',
    poetry: 'cultural',
    'major prophets': 'religious',
    'minor prophets': 'religious',
    wisdom: 'cultural',
  };
  return map[category] || 'religious';
}

function loadJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(COMPILED_DIR, filename), 'utf8'));
}

function yearToX(year) {
  return (START_YEAR - year) * PIXELS_PER_YEAR;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toHexWithFallback(color, fallback) {
  const normalized = String(color || '').trim();
  return /^#[0-9A-Fa-f]{6}$/.test(normalized) ? normalized : fallback;
}

function makeVertexCell({
  id,
  value,
  x,
  y,
  width,
  height,
  style,
  attrs = {},
}) {
  const customAttrs = Object.entries(attrs)
    .map(([key, attrValue]) => `${key}="${escapeXml(attrValue)}"`)
    .join(' ');
  const attrsPrefix = customAttrs ? `${customAttrs} ` : '';

  return [
    `    <mxCell id="${escapeXml(id)}" ${attrsPrefix}value="${escapeXml(value)}" style="${escapeXml(style)}" vertex="1" parent="1">`,
    `      <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/>`,
    '    </mxCell>',
  ].join('\n');
}

function makeLineCell({ id, x, y, width, height, strokeColor }) {
  return makeVertexCell({
    id,
    value: '',
    x,
    y,
    width,
    height,
    style: `shape=rectangle;whiteSpace=wrap;html=1;strokeColor=none;fillColor=${strokeColor};`,
  });
}

function entityColor(entity) {
  if (entity.type === 'person') {
    const role = mapPersonCategory(entity.categories || []);
    return roleColors[role] || roleColors.other;
  }
  if (entity.type === 'event') {
    const category = String(entity.categories?.[0] || 'event').toLowerCase();
    return eventColors[category] || eventColors.event;
  }
  const genre = mapBookCategory(entity.categories || []);
  return genreColors[genre] || genreColors.religious;
}

function formatYearRange(entity) {
  if (!entity.endYear || entity.endYear === entity.startYear) {
    return `${entity.startYear} BC`;
  }
  return `${entity.startYear}-${entity.endYear} BC`;
}

function main() {
  const people = loadJson('people.json');
  const events = loadJson('events.json');
  const books = loadJson('books.json');
  const periods = loadJson('periods.json');
  const entities = [...events, ...people, ...books];

  const cells = [];

  // Header note with coordinate conversion guidance for round-trip edits.
  cells.push(
    makeVertexCell({
      id: 'meta-note',
      x: 10,
      y: 8,
      width: 520,
      height: 64,
      value:
        'Timeline Source: compiled JSON<br>Scale: 2 px/year<br>Convert X->year: year = 4000 - (x / 2)',
      style:
        'shape=rectangle;rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF5D6;strokeColor=#D6B76E;fontSize=11;align=left;verticalAlign=middle;spacing=8;',
    })
  );

  // Period bands (top layer).
  periods.forEach((period) => {
    const x = yearToX(period.startYear);
    const width = (period.startYear - period.endYear) * PIXELS_PER_YEAR;
    const color = toHexWithFallback(period.color, '#E0E0E0');
    cells.push(
      makeVertexCell({
        id: `period-${period.id}`,
        x,
        y: 0,
        width,
        height: PERIOD_BAND_HEIGHT,
        value: `${period.name}<br><font color="#5C534A">${period.startYear}-${period.endYear} BC</font>`,
        style: [
          'shape=rectangle',
          'rounded=0',
          'whiteSpace=wrap',
          'html=1',
          'align=left',
          'verticalAlign=top',
          'spacing=6',
          `fillColor=${color}`,
          'opacity=28',
          `strokeColor=${color}`,
          'strokeWidth=1',
          'fontSize=11',
          'fontStyle=1',
          'fontColor=#3A322A',
        ].join(';') + ';',
        attrs: {
          periodId: period.id,
          periodType: 'period',
        },
      })
    );
  });

  // Grid lines and year labels.
  for (let year = END_YEAR; year <= START_YEAR; year += 50) {
    const x = yearToX(year);
    const isMajor = year % 200 === 0;
    cells.push(
      makeLineCell({
        id: `grid-${year}`,
        x,
        y: PERIOD_BAND_HEIGHT,
        width: 1,
        height: TRACK_LAYOUT.totalHeight - PERIOD_BAND_HEIGHT,
        strokeColor: isMajor ? '#DDD4C7' : '#F1EADD',
      })
    );
    if (isMajor) {
      cells.push(
        makeVertexCell({
          id: `year-${year}`,
          x: x - 20,
          y: 88,
          width: 42,
          height: 14,
          value: `${year}`,
          style:
            'text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;fontFamily=Courier New;fontColor=#6D6257;',
        })
      );
    }
  }

  // Track band backgrounds.
  const trackDefs = [
    {
      id: 'track-events',
      label: 'Events',
      x: 10,
      y: TRACK_LAYOUT.events.baseY - 28,
      bgY: TRACK_LAYOUT.events.baseY,
      bgH: TRACK_LAYOUT.events.bandHeight,
      bgColor: '#F7EFE4',
    },
    {
      id: 'track-people',
      label: 'People',
      x: 10,
      y: TRACK_LAYOUT.people.baseY - 28,
      bgY: TRACK_LAYOUT.people.baseY,
      bgH: TRACK_LAYOUT.people.bandHeight,
      bgColor: '#F4ECE0',
    },
    {
      id: 'track-books',
      label: 'Books',
      x: 10,
      y: TRACK_LAYOUT.books.baseY - 28,
      bgY: TRACK_LAYOUT.books.baseY,
      bgH: TRACK_LAYOUT.books.bandHeight,
      bgColor: '#F8F1E7',
    },
  ];

  trackDefs.forEach((track) => {
    cells.push(
      makeVertexCell({
        id: `${track.id}-bg`,
        x: 0,
        y: track.bgY,
        width: TIMELINE_WIDTH,
        height: track.bgH,
        value: '',
        style: `shape=rectangle;whiteSpace=wrap;html=1;fillColor=${track.bgColor};strokeColor=#DCCFBF;strokeWidth=1;`,
      })
    );
    cells.push(
      makeVertexCell({
        id: `${track.id}-label`,
        x: track.x,
        y: track.y,
        width: 70,
        height: 20,
        value: track.label,
        style:
          'shape=rectangle;rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFDF9;strokeColor=#D0C3B2;fontSize=11;fontStyle=1;align=center;verticalAlign=middle;',
      })
    );
  });

  // Timeline entities.
  entities
    .slice()
    .sort((a, b) => b.startYear - a.startYear)
    .forEach((entity) => {
      const track = entity.type === 'event'
        ? TRACK_LAYOUT.events
        : entity.type === 'person'
          ? TRACK_LAYOUT.people
          : TRACK_LAYOUT.books;

      const x = yearToX(entity.startYear);
      const y = track.baseY + (entity.swimlane || 0) * track.laneStride;
      const nodeHeight = track.nodeHeight;
      const hasDuration = Boolean(entity.endYear && entity.endYear !== entity.startYear);
      const durationWidth = hasDuration ? (entity.startYear - entity.endYear) * PIXELS_PER_YEAR : 32;
      const isEventPoint = entity.type === 'event' && !hasDuration;
      const nodeWidth = isEventPoint ? nodeHeight : Math.max(durationWidth, 16);
      const fill = entityColor(entity);
      const yearText = formatYearRange(entity);

      cells.push(
        makeVertexCell({
          id: `entity-${entity.type}-${entity.id}`,
          x,
          y,
          width: nodeWidth,
          height: nodeHeight,
          value: `${entity.name}<br><font color="#5E564E">${yearText}</font>`,
          style: [
            `shape=${isEventPoint ? 'ellipse' : 'rectangle'}`,
            'rounded=1',
            'whiteSpace=wrap',
            'html=1',
            'align=left',
            'verticalAlign=middle',
            'spacingLeft=6',
            'spacingRight=4',
            `fillColor=${fill}`,
            'strokeColor=#2D241C',
            'strokeWidth=1.5',
            'fontSize=10',
            'fontColor=#2D241C',
          ].join(';') + ';',
          attrs: {
            entityId: entity.id,
            entityType: entity.type,
            startYear: entity.startYear,
            endYear: entity.endYear || '',
            swimlane: entity.swimlane || 0,
            certainty: entity.certainty || '',
          },
        })
      );
    });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<mxfile host="app.diagrams.net" modified="' + new Date().toISOString() + '" agent="Codex" version="26.0.11" compressed="false">',
    '  <diagram id="ot-timeline" name="Old Testament Timeline">',
    '    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="8500" pageHeight="1400" math="0" shadow="0">',
    '      <root>',
    '        <mxCell id="0"/>',
    '        <mxCell id="1" parent="0"/>',
    ...cells,
    '      </root>',
    '    </mxGraphModel>',
    '  </diagram>',
    '</mxfile>',
    '',
  ].join('\n');

  fs.writeFileSync(OUTPUT_FILE, xml, 'utf8');

  console.log(`Wrote ${OUTPUT_FILE}`);
  console.log(`Entities: ${entities.length}, Periods: ${periods.length}`);
}

main();
