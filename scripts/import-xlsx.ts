import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAW_DIR = path.resolve(__dirname, '../src/data/raw');
const XLSX_PATH = path.resolve(__dirname, '../TimelineDB.xlsx');

// ============================================================================
// Helpers
// ============================================================================

function slugify(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s*\(.*?\)\s*/g, '-') // (Israel) -> -
        .replace(/['''\u2018\u2019]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/** Map descriptive Excel roles to schema enum values */
function mapRole(excelRole: string): string {
    const r = excelRole.trim().toLowerCase();
    if (r.includes('king')) return 'King';
    if (r.includes('prophet')) return 'Prophet';
    if (r.includes('judge') || r.includes('military leader')) return 'Judge';
    if (r.includes('patriarch')) return 'Patriarch';
    if (r.includes('priest')) return 'Priest';
    if (r.includes('warrior')) return 'Warrior';
    if (r.includes('scribe')) return 'Scribe';
    // Specific descriptive roles -> Other
    return 'Other';
}

/** Map Excel Kingdom (North/South) to schema values */
function mapKingdom(k: string | undefined): string | undefined {
    if (!k) return undefined;
    const lower = k.trim().toLowerCase();
    if (lower === 'north' || lower === 'israel') return 'Israel';
    if (lower === 'south' || lower === 'judah') return 'Judah';
    return undefined;
}

/** Parse comma-separated string list */
function parseList(val: unknown): string[] | undefined {
    if (!val || typeof val !== 'string') return undefined;
    const items = val.split(',').map(s => s.trim()).filter(Boolean);
    return items.length > 0 ? items : undefined;
}

/** Parse Thiele date range "930–909" -> { start: 930, end: 909 } */
function parseThieleDates(thiele: string | number): { start: number; end: number } | null {
    if (typeof thiele === 'number') return { start: thiele, end: thiele };
    // Handle single year: "885" or "841"
    const cleaned = String(thiele).replace(/[–—-]/g, '–'); // normalize dashes
    const parts = cleaned.split('–').map(s => parseInt(s.trim(), 10));
    if (parts.length === 1 && !isNaN(parts[0])) {
        return { start: parts[0], end: parts[0] };
    }
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { start: parts[0], end: parts[1] };
    }
    return null;
}

function toInt(val: unknown): number | undefined {
    if (val === null || val === undefined || val === '' || val === 'null') return undefined;
    const n = typeof val === 'number' ? val : parseInt(String(val), 10);
    return isNaN(n) ? undefined : n;
}

// ============================================================================
// Parse People Sheet
// ============================================================================

interface ExcelPerson {
    Name: string;
    startYear: number;
    endYear?: unknown;
    'Recorded Age'?: unknown;
    Era?: string;
    'Approximate (bool)'?: boolean;
    'Timeline Story'?: string;
    Role?: string;
    Priority?: number;
    Description?: string;
    ScriptureRefs?: string;
    relatedPeople?: string;
    relatedEvents?: string;
    RelatedBooks?: string;
    Theme?: string;
    Kingdom?: string;
    Source?: string;
}

function parsePeopleSheet(ws: XLSX.WorkSheet): Record<string, unknown>[] {
    const rows = XLSX.utils.sheet_to_json<ExcelPerson>(ws);
    const result: Record<string, unknown>[] = [];

    for (const row of rows) {
        if (!row.Name || !row.startYear) continue;

        const id = slugify(row.Name);
        const birthYear = toInt(row.startYear);
        const deathYear = toInt(row.endYear);
        if (!birthYear) continue;

        const role = mapRole(row.Role || 'Other');
        const kingdom = mapKingdom(row.Kingdom);
        const timelineStory = row['Timeline Story'];

        // Map timelineStory: only 'Active' and 'Life' are valid, treat anything else as 'Active'
        const validTimelineStory = timelineStory === 'Life' ? 'Life' : (timelineStory ? 'Active' : undefined);

        const person: Record<string, unknown> = {
            id,
            name: row.Name.trim(),
            birthYear,
            ...(deathYear && { deathYear }),
            era: 'BC',
            approximate: row['Approximate (bool)'] === true,
            role,
            priority: row.Priority || 2,
            track: 'people',
            ...(row.Description && { description: row.Description }),
            ...(kingdom && { kingdom }),
            ...(validTimelineStory && { timelineStory: validTimelineStory }),
            ...(row.Source && { source: row.Source }),
        };

        // Parse list fields
        const scriptureRefs = parseList(row.ScriptureRefs);
        if (scriptureRefs) person.scriptureRefs = scriptureRefs;

        const relatedPeople = parseList(row.relatedPeople);
        if (relatedPeople) person.relatedPeople = relatedPeople.map(slugify);

        const relatedEvents = parseList(row.relatedEvents);
        if (relatedEvents) person.relatedEvents = relatedEvents.map(slugify);

        const relatedBooks = parseList(row.RelatedBooks);
        if (relatedBooks) person.relatedBooks = relatedBooks.map(s => {
            const slug = slugify(s);
            // Books that collide with person names use -book suffix
            const bookSuffixed = ['exodus', 'joshua', 'ruth', 'esther', 'daniel', 'jonah', 'amos', 'hosea', 'micah', 'joel', 'obadiah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi', 'jeremiah', 'ezekiel'];
            if (bookSuffixed.includes(slug)) return slug + '-book';
            return slug;
        });

        const themes = parseList(row.Theme);
        if (themes) person.themes = themes;

        result.push(person);
    }
    return result;
}

// ============================================================================
// Parse Events Sheet
// ============================================================================

interface ExcelEvent {
    Name: string;
    year: number;
    endYear?: number;
    era?: string;
    approximate?: boolean;
    category?: string;
    priority?: number;
    description?: string;
    scriptureRef?: string;
    relatedPeople?: string;
    relatedBooks?: string;
    Kingdom?: string;
    Source?: string;
}

function parseEventsSheet(ws: XLSX.WorkSheet): Record<string, unknown>[] {
    const rows = XLSX.utils.sheet_to_json<ExcelEvent>(ws);
    const result: Record<string, unknown>[] = [];

    for (const row of rows) {
        if (!row.Name || !row.year) continue;

        const id = slugify(row.Name);
        const year = toInt(row.year);
        if (!year) continue;

        const endYear = toInt(row.endYear);
        const kingdom = mapKingdom(row.Kingdom);

        const event: Record<string, unknown> = {
            id,
            name: row.Name.trim(),
            year,
            ...(endYear && endYear !== year && { endYear }),
            era: row.era || 'BC',
            approximate: row.approximate === true,
            category: row.category || 'event',
            priority: row.priority || 2,
            track: 'events',
            ...(row.description && { description: row.description }),
            ...(kingdom && { kingdom }),
            ...(row.Source && { source: row.Source }),
        };

        const scriptureRefs = parseList(row.scriptureRef);
        if (scriptureRefs) event.scriptureRefs = scriptureRefs;

        const relatedPeople = parseList(row.relatedPeople);
        if (relatedPeople) event.relatedPeople = relatedPeople.map(slugify);

        const relatedBooks = parseList(row.relatedBooks);
        if (relatedBooks) event.relatedBooks = relatedBooks.map(s => {
            const slug = slugify(s);
            const bookSuffixed = ['exodus', 'joshua', 'ruth', 'esther', 'daniel', 'jonah', 'amos', 'hosea', 'micah', 'joel', 'obadiah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi', 'jeremiah', 'ezekiel'];
            if (bookSuffixed.includes(slug)) return slug + '-book';
            return slug;
        });

        const themes = parseList(undefined); // Events don't have Theme column
        if (themes) event.themes = themes;

        result.push(event);
    }
    return result;
}

// ============================================================================
// Parse Kings Sheet
// ============================================================================

interface ExcelKing {
    Israel?: string;
    Judah?: string;
    'Biblical Length of Reign'?: string;
    'Biblical Reference(s)'?: string;
    Thiele?: string;
    Prophets?: string;
    Source?: string;
}

function parseKingsSheet(ws: XLSX.WorkSheet): Record<string, unknown>[] {
    const rows = XLSX.utils.sheet_to_json<ExcelKing>(ws);

    // First pass: detect names that appear in both kingdoms
    const nameKingdoms = new Map<string, Set<string>>();
    for (const row of rows) {
        const name = row.Israel || row.Judah;
        if (!name || !row.Thiele) continue;
        if (name === 'Fall of Samaria' || name === 'Fall of Jerusalem') continue;
        const baseId = slugify(name);
        const kingdom = row.Israel ? 'Israel' : 'Judah';
        if (!nameKingdoms.has(baseId)) nameKingdoms.set(baseId, new Set());
        nameKingdoms.get(baseId)!.add(kingdom);
    }
    const duplicateNames = new Set<string>();
    for (const [id, kingdoms] of nameKingdoms) {
        if (kingdoms.size > 1) duplicateNames.add(id);
    }

    // Second pass: build entities with disambiguated IDs
    const result: Record<string, unknown>[] = [];
    for (const row of rows) {
        const name = row.Israel || row.Judah;
        if (!name || !row.Thiele) continue;
        if (name === 'Fall of Samaria' || name === 'Fall of Jerusalem') continue;

        const dates = parseThieleDates(row.Thiele);
        if (!dates) continue;

        const kingdom = row.Israel ? 'Israel' : 'Judah';
        const baseId = slugify(name);
        // Disambiguate kings that appear in both kingdoms
        let id = duplicateNames.has(baseId) ? `${baseId}-${kingdom.toLowerCase()}` : baseId;
        // Apply king-specific ID overrides
        if (KING_ID_OVERRIDES[id]) id = KING_ID_OVERRIDES[id];

        const king: Record<string, unknown> = {
            id,
            name: name.trim(),
            birthYear: dates.start,
            deathYear: dates.end,
            era: 'BC',
            approximate: false,
            role: 'King',
            kingdom,
            priority: 2,
            track: 'people',
            timelineStory: 'Active',
        };

        const refs = parseList(row['Biblical Reference(s)']);
        if (refs) king.scriptureRefs = refs;

        const prophets = parseList(row.Prophets);
        if (prophets) king.relatedPeople = prophets.map(slugify);

        if (row.Source) king.source = row.Source;

        result.push(king);
    }
    return result;
}

// ============================================================================
// ID Reconciliation - map Excel slugs to existing app IDs
// ============================================================================

/** Known ID mappings: Excel slug -> app ID (for events that already exist in app with different IDs) */
const EVENT_ID_MAP: Record<string, string> = {
    'the-great-flood': 'flood',
    'the-call-of-abraham': 'call-of-abraham',
    'the-exodus': 'exodus',
    'construction-of-the-first-temple': 'temple-built',
    'the-dispersion-of-nations': 'tower-of-babel',
    'the-birth-of-issac': 'birth-of-isaac',
    'the-twelve-tribes-of-israel': 'twelve-tribes-of-israel',
    'the-mosaic-covenant': 'mosaic-covenant',
    'the-conquest-of-canaan': 'conquest-of-canaan',
    'the-selection-of-king-saul': 'selection-of-king-saul',
    'the-reign-of-king-david': 'reign-of-king-david',
    'the-division-of-the-kingdom': 'division-of-the-kingdom',
    'the-fall-of-the-northern-kingdom': 'fall-of-northern-kingdom',
    'the-babylonian-captivity': 'destruction-of-jerusalem',
    'the-return-from-exile': 'return-from-exile',
    'the-dedication-of-the-second-temple': 'dedication-of-second-temple',
    'the-rebuilding-of-jerusalems-walls': 'rebuilding-jerusalems-walls',
    'josephs-exaltation-in-egypt': 'josephs-exaltation-in-egypt',
    'division-of-the-land': 'division-of-the-land',
};

/** Known ID mappings for people */
const PEOPLE_ID_MAP: Record<string, string> = {
    'able': 'abel',       // Excel spells it "Able", app has "Abel"
    'nehum': 'nahum',     // Excel has "Nehum", likely means Nahum
    'jacob-israel': 'jacob', // Excel has "Jacob (Israel)"
};

/** Kings that need special ID treatment to avoid collision with prophets/people */
const KING_ID_OVERRIDES: Record<string, string> = {
    // Zedekiah the king vs. any future prophet Zedekiah
    'zedekiah': 'zedekiah-king',
    // Zechariah the Israel king vs. Zechariah the prophet (already in People sheet)
    'zechariah-israel': 'zechariah-king',
};

function applyIdMap(entities: Record<string, unknown>[], idMap: Record<string, string>): void {
    for (const entity of entities) {
        const id = entity.id as string;
        if (idMap[id]) {
            entity.id = idMap[id];
        }
        // Also fix references in relatedPeople/relatedEvents
        for (const field of ['relatedPeople', 'relatedEvents']) {
            const refs = entity[field] as string[] | undefined;
            if (refs) {
                entity[field] = refs.map(ref => idMap[ref] || ref);
            }
        }
    }
}

// ============================================================================
// Merge Logic
// ============================================================================

function mergeEntities(
    excelEntities: Record<string, unknown>[],
    appEntities: Record<string, unknown>[],
    entityType: string
): { merged: Record<string, unknown>[]; stats: { added: number; updated: number; appOnly: number } } {
    const excelById = new Map<string, Record<string, unknown>>();
    for (const e of excelEntities) {
        const id = e.id as string;
        // Handle duplicate IDs: keep the one with more data
        const existing = excelById.get(id);
        if (existing) {
            // For kings with same slug (e.g., two Jorams), disambiguate
            const existingKingdom = existing.kingdom as string;
            const newKingdom = e.kingdom as string;
            if (existingKingdom && newKingdom && existingKingdom !== newKingdom) {
                // Different kingdoms -> use kingdom suffix
                const suffixedId = id + '-' + newKingdom.toLowerCase();
                e.id = suffixedId;
                excelById.set(suffixedId, e);
                continue;
            }
        }
        excelById.set(id, e);
    }

    const appById = new Map<string, Record<string, unknown>>();
    for (const e of appEntities) {
        appById.set(e.id as string, e);
    }

    const merged: Record<string, unknown>[] = [];
    let added = 0, updated = 0, appOnly = 0;

    // Process Excel entities (they win)
    for (const [id, excelEntity] of excelById) {
        const appEntity = appById.get(id);
        if (appEntity) {
            // Merge: Excel dates win, keep app metadata that Excel doesn't have
            const result = { ...appEntity, ...excelEntity };
            // Preserve app familyTree, bio if Excel doesn't have them
            if ((appEntity as Record<string, unknown>).familyTree && !(excelEntity as Record<string, unknown>).familyTree) {
                result.familyTree = (appEntity as Record<string, unknown>).familyTree;
            }
            if ((appEntity as Record<string, unknown>).bio && !(excelEntity as Record<string, unknown>).bio) {
                result.bio = (appEntity as Record<string, unknown>).bio;
            }
            merged.push(result);
            updated++;
        } else {
            merged.push(excelEntity);
            added++;
        }
    }

    // Process app-only entities
    for (const [id, appEntity] of appById) {
        if (!excelById.has(id)) {
            merged.push(appEntity);
            appOnly++;
        }
    }

    console.log(`  ${entityType}: ${added} added, ${updated} updated, ${appOnly} app-only kept`);
    return { merged, stats: { added, updated, appOnly } };
}

// ============================================================================
// Main
// ============================================================================

function main() {
    console.log('Reading TimelineDB.xlsx...');
    const wb = XLSX.readFile(XLSX_PATH);

    // Parse sheets
    const excelPeople = parsePeopleSheet(wb.Sheets['People']);
    const excelEvents = parseEventsSheet(wb.Sheets['Events']);
    const excelKings = parseKingsSheet(wb.Sheets['Kings']);

    console.log(`Parsed ${excelPeople.length} people, ${excelEvents.length} events, ${excelKings.length} kings from Excel`);

    // Apply ID reconciliation
    applyIdMap(excelPeople, PEOPLE_ID_MAP);
    applyIdMap(excelEvents, EVENT_ID_MAP);
    // Kings also need people ID mapping for their prophet references
    applyIdMap(excelKings, PEOPLE_ID_MAP);

    // Merge kings into people (kings are people with role=King)
    // For David/Solomon that exist in both, king dates win
    const allExcelPeople = [...excelPeople];
    for (const king of excelKings) {
        const id = king.id as string;
        const existingIdx = allExcelPeople.findIndex(p => p.id === id);
        if (existingIdx >= 0) {
            // Merge: king Thiele dates win, keep people sheet description/bio
            const existing = allExcelPeople[existingIdx];
            allExcelPeople[existingIdx] = {
                ...existing,
                ...king,
                // Keep description from People sheet if king doesn't have one
                description: king.description || existing.description,
            };
            console.log(`  Merged king ${id}: Thiele dates ${king.birthYear}-${king.deathYear}`);
        } else {
            allExcelPeople.push(king);
        }
    }

    // Load current app data
    const appPeople: Record<string, unknown>[] = JSON.parse(
        fs.readFileSync(path.join(RAW_DIR, 'people.json'), 'utf-8')
    );
    const appEvents: Record<string, unknown>[] = JSON.parse(
        fs.readFileSync(path.join(RAW_DIR, 'events.json'), 'utf-8')
    );

    console.log(`\nCurrent app data: ${appPeople.length} people, ${appEvents.length} events`);
    console.log('\nMerging...');

    // Merge
    const { merged: mergedPeople } = mergeEntities(allExcelPeople, appPeople, 'People');
    const { merged: mergedEvents } = mergeEntities(excelEvents, appEvents, 'Events');

    // Sort: by startYear descending (earlier BC first)
    mergedPeople.sort((a, b) => (b.birthYear as number) - (a.birthYear as number));
    mergedEvents.sort((a, b) => (b.year as number) - (a.year as number));

    // Write output
    fs.writeFileSync(
        path.join(RAW_DIR, 'people.json'),
        JSON.stringify(mergedPeople, null, 2)
    );
    fs.writeFileSync(
        path.join(RAW_DIR, 'events.json'),
        JSON.stringify(mergedEvents, null, 2)
    );

    console.log(`\nFinal: ${mergedPeople.length} people, ${mergedEvents.length} events`);

    // Print app-only entities for user review
    const excelPeopleIds = new Set(allExcelPeople.map(p => p.id as string));
    const excelEventIds = new Set(excelEvents.map(e => e.id as string));

    const appOnlyPeople = appPeople.filter(p => !excelPeopleIds.has(p.id as string));
    const appOnlyEvents = appEvents.filter(e => !excelEventIds.has(e.id as string));

    if (appOnlyPeople.length > 0) {
        console.log('\n=== App-only people (kept, review needed) ===');
        appOnlyPeople.forEach(p => console.log(`  ${p.id} (${p.name})`));
    }
    if (appOnlyEvents.length > 0) {
        console.log('\n=== App-only events (kept, review needed) ===');
        appOnlyEvents.forEach(e => console.log(`  ${e.id} (${e.name})`));
    }

    console.log('\nDone. Run `npm run build:data && npm run validate` next.');
}

main();
