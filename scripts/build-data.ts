import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Types
// ============================================================================

type EntityType = 'person' | 'event' | 'book' | 'period' | 'theme';
type Certainty = 'exact' | 'approximate' | 'estimated';
type RelationshipType =
    | 'family-parent' | 'family-child' | 'family-spouse' | 'family-sibling'
    | 'event-participant' | 'event-witness'
    | 'prophecy-speaks' | 'prophecy-fulfills'
    | 'book-author' | 'book-subject'
    | 'theme-associated';

interface TimelineEntity {
    id: string;
    type: EntityType;
    name: string;
    startYear: number;
    endYear?: number;
    certainty: Certainty;
    categories: string[];
    swimlane?: number;
    priority?: number;
    description?: string;
    [key: string]: unknown;
}

interface Relationship {
    id: string;
    sourceId: string;
    targetId: string;
    type: RelationshipType;
    confidence?: 'high' | 'medium' | 'low';
}

// Raw data types
interface RawPerson {
    id: string;
    name: string;
    birthYear: number;
    deathYear: number;
    approximate?: boolean;
    role: string;
    priority: number;
    description?: string;
    bio?: string;
    scriptureRefs?: string[];
    relatedEvents?: string[];
    relatedBooks?: string[];
    familyTree?: {
        father?: string | null;
        mother?: string | null;
        spouse?: string | null;
        children?: string[];
    };
    [key: string]: unknown;
}

interface RawEvent {
    id: string;
    name: string;
    year: number;
    approximate?: boolean;
    priority: number;
    description?: string;
    scriptureRefs?: string[];
    relatedPeople?: string[];
    relatedBooks?: string[];
    category?: string;
    [key: string]: unknown;
}

interface RawBook {
    id: string;
    name: string;
    startYear: number;
    endYear: number;
    category: string;
    priority: number;
    author?: string;
    description?: string;
    scriptureRefs?: string[];
    relatedPeople?: string[];
    relatedEvents?: string[];
    [key: string]: unknown;
}

interface RawTheme {
    id: string;
    color: string;
    description?: string;
}

interface RawPeriod {
    id: string;
    name: string;
    startYear: number;
    endYear: number;
    color: string;
    description?: string;
}

// ============================================================================
// Config
// ============================================================================

const RAW_DIR = path.resolve(__dirname, '../src/data/raw');
const COMPILED_DIR = path.resolve(__dirname, '../src/data/compiled');

function normalizeCategory(value: string): string {
    return value.trim().toLowerCase().replace(/[\s_/-]+/g, '-');
}

// ============================================================================
// Adapters - Transform raw data to compiled shape
// ============================================================================

function transformPerson(raw: RawPerson): TimelineEntity {
    return {
        id: raw.id,
        type: 'person',
        name: raw.name,
        startYear: raw.birthYear,
        endYear: raw.deathYear,
        certainty: raw.approximate ? 'approximate' : 'exact',
        categories: [raw.role],
        priority: raw.priority,
        description: raw.description,
        bio: raw.bio,
        scriptureRefs: raw.scriptureRefs,
    };
}

function transformEvent(raw: RawEvent): TimelineEntity {
    const category = raw.category ? normalizeCategory(raw.category) : 'event';

    return {
        id: raw.id,
        type: 'event',
        name: raw.name,
        startYear: raw.year,
        endYear: raw.year, // point event
        certainty: raw.approximate ? 'approximate' : 'exact',
        categories: [category],
        priority: raw.priority,
        description: raw.description,
        scriptureRefs: raw.scriptureRefs,
    };
}

function transformBook(raw: RawBook): TimelineEntity {
    return {
        id: raw.id,
        type: 'book',
        name: raw.name,
        startYear: raw.startYear,
        endYear: raw.endYear,
        certainty: 'approximate', // books generally approximate
        categories: [raw.category],
        priority: raw.priority,
        author: raw.author,
        description: raw.description,
        scriptureRefs: raw.scriptureRefs,
    };
}

function transformPeriod(raw: RawPeriod): TimelineEntity {
    return {
        id: raw.id,
        type: 'period',
        name: raw.name,
        startYear: raw.startYear,
        endYear: raw.endYear,
        certainty: 'approximate',
        categories: ['period'],
        color: raw.color,
        description: raw.description,
    };
}

function dedupePeriodsByRange(periods: TimelineEntity[]): TimelineEntity[] {
    const byRange = new Map<string, { period: TimelineEntity; index: number }>();

    periods.forEach((period, index) => {
        const rangeKey = `${period.startYear}-${period.endYear}`;
        const existing = byRange.get(rangeKey);

        if (!existing) {
            byRange.set(rangeKey, { period, index });
            return;
        }

        const existingScore = existing.period.name.length;
        const candidateScore = period.name.length;
        const shouldReplace = candidateScore > existingScore
            || (candidateScore === existingScore && index >= existing.index);

        if (shouldReplace) {
            byRange.set(rangeKey, { period, index });
        }
    });

    return [...byRange.values()]
        .sort((a, b) => {
            if (a.period.startYear !== b.period.startYear) {
                return b.period.startYear - a.period.startYear;
            }
            if ((a.period.endYear ?? 0) !== (b.period.endYear ?? 0)) {
                return (b.period.endYear ?? 0) - (a.period.endYear ?? 0);
            }
            return a.period.name.localeCompare(b.period.name);
        })
        .map((entry) => entry.period);
}

function transformTheme(raw: RawTheme): { id: string; color: string; description?: string } {
    // Themes stay as-is; id is uppercase, no name field
    return {
        id: raw.id,
        color: raw.color,
        description: raw.description,
    };
}

// ============================================================================
// Relationship Extraction
// ============================================================================

function extractRelationships(
    people: RawPerson[],
    events: RawEvent[],
    books: RawBook[]
): Relationship[] {
    const relationships: Relationship[] = [];
    let counter = 0;
    const genId = () => `rel-${++counter}`;

    // People -> family relationships
    for (const person of people) {
        const ft = person.familyTree;
        if (!ft) continue;

        if (ft.father) {
            relationships.push({
                id: genId(),
                sourceId: person.id,
                targetId: ft.father,
                type: 'family-parent',
                confidence: 'high',
            });
        }
        if (ft.mother) {
            relationships.push({
                id: genId(),
                sourceId: person.id,
                targetId: ft.mother,
                type: 'family-parent',
                confidence: 'high',
            });
        }
        if (ft.spouse) {
            relationships.push({
                id: genId(),
                sourceId: person.id,
                targetId: ft.spouse,
                type: 'family-spouse',
                confidence: 'high',
            });
        }
        if (ft.children) {
            for (const child of ft.children) {
                relationships.push({
                    id: genId(),
                    sourceId: person.id,
                    targetId: child,
                    type: 'family-child',
                    confidence: 'high',
                });
            }
        }

        // People -> events
        if (person.relatedEvents) {
            for (const eventId of person.relatedEvents) {
                relationships.push({
                    id: genId(),
                    sourceId: person.id,
                    targetId: eventId,
                    type: 'event-participant',
                    confidence: 'high',
                });
            }
        }

        // People -> books
        if (person.relatedBooks) {
            for (const bookId of person.relatedBooks) {
                relationships.push({
                    id: genId(),
                    sourceId: person.id,
                    targetId: bookId,
                    type: 'book-subject',
                    confidence: 'high',
                });
            }
        }
    }

    // Events -> people, books
    for (const event of events) {
        if (event.relatedPeople) {
            for (const personId of event.relatedPeople) {
                relationships.push({
                    id: genId(),
                    sourceId: event.id,
                    targetId: personId,
                    type: 'event-participant',
                    confidence: 'high',
                });
            }
        }
        if (event.relatedBooks) {
            for (const bookId of event.relatedBooks) {
                relationships.push({
                    id: genId(),
                    sourceId: event.id,
                    targetId: bookId,
                    type: 'book-subject',
                    confidence: 'high',
                });
            }
        }
    }

    // Books -> people, events
    for (const book of books) {
        if (book.relatedPeople) {
            for (const personId of book.relatedPeople) {
                relationships.push({
                    id: genId(),
                    sourceId: book.id,
                    targetId: personId,
                    type: 'book-subject',
                    confidence: 'high',
                });
            }
        }
        if (book.relatedEvents) {
            for (const eventId of book.relatedEvents) {
                relationships.push({
                    id: genId(),
                    sourceId: book.id,
                    targetId: eventId,
                    type: 'event-participant',
                    confidence: 'high',
                });
            }
        }
    }

    return relationships;
}

// ============================================================================
// Swimlane Assignment
// ============================================================================

function assignSwimlanes(entities: TimelineEntity[]): TimelineEntity[] {
    const byType: Record<string, TimelineEntity[]> = {};

    for (const e of entities) {
        if (!byType[e.type]) byType[e.type] = [];
        byType[e.type].push(e);
    }

    for (const group of Object.values(byType)) {
        // Sort by startYear descending (BC: larger = earlier)
        const sorted = group.sort((a, b) => b.startYear - a.startYear);
        const lanes: Array<{ end: number }> = [];

        for (const entity of sorted) {
            const entityEnd = entity.endYear ?? entity.startYear;

            // Find lane where end > startYear (lane freed before entity starts)
            let laneIndex = lanes.findIndex(lane => lane.end > entity.startYear);

            if (laneIndex === -1) {
                laneIndex = lanes.length;
                lanes.push({ end: entityEnd });
            } else {
                lanes[laneIndex].end = Math.min(lanes[laneIndex].end, entityEnd);
            }

            entity.swimlane = laneIndex;
        }
    }

    return entities;
}

// ============================================================================
// Main Build
// ============================================================================

function build() {
    console.log('Building data...');

    // Ensure compiled dir exists
    if (!fs.existsSync(COMPILED_DIR)) {
        fs.mkdirSync(COMPILED_DIR, { recursive: true });
    }

    // Read raw files
    const rawPeople: RawPerson[] = JSON.parse(
        fs.readFileSync(path.join(RAW_DIR, 'people.json'), 'utf-8')
    );
    const rawEvents: RawEvent[] = JSON.parse(
        fs.readFileSync(path.join(RAW_DIR, 'events.json'), 'utf-8')
    );
    const rawBooks: RawBook[] = JSON.parse(
        fs.readFileSync(path.join(RAW_DIR, 'books.json'), 'utf-8')
    );
    const rawPeriods: RawPeriod[] = JSON.parse(
        fs.readFileSync(path.join(RAW_DIR, 'periods.json'), 'utf-8')
    );
    const rawThemes: RawTheme[] = JSON.parse(
        fs.readFileSync(path.join(RAW_DIR, 'themes.json'), 'utf-8')
    );

    // Transform
    const people = rawPeople.map(transformPerson);
    const events = rawEvents.map(transformEvent);
    const books = rawBooks.map(transformBook);
    const periods = dedupePeriodsByRange(rawPeriods.map(transformPeriod));
    const themes = rawThemes.map(transformTheme);

    // Assign swimlanes
    assignSwimlanes(people);
    assignSwimlanes(events);
    assignSwimlanes(books);

    // Extract relationships
    const relationships = extractRelationships(rawPeople, rawEvents, rawBooks);

    // Write compiled files
    fs.writeFileSync(
        path.join(COMPILED_DIR, 'people.json'),
        JSON.stringify(people, null, 2)
    );
    fs.writeFileSync(
        path.join(COMPILED_DIR, 'events.json'),
        JSON.stringify(events, null, 2)
    );
    fs.writeFileSync(
        path.join(COMPILED_DIR, 'books.json'),
        JSON.stringify(books, null, 2)
    );
    fs.writeFileSync(
        path.join(COMPILED_DIR, 'periods.json'),
        JSON.stringify(periods, null, 2)
    );
    fs.writeFileSync(
        path.join(COMPILED_DIR, 'themes.json'),
        JSON.stringify(themes, null, 2)
    );
    fs.writeFileSync(
        path.join(COMPILED_DIR, 'relationships.json'),
        JSON.stringify(relationships, null, 2)
    );

    console.log(`Compiled ${people.length} people`);
    console.log(`Compiled ${events.length} events`);
    console.log(`Compiled ${books.length} books`);
    console.log(`Compiled ${periods.length} periods`);
    console.log(`Compiled ${themes.length} themes`);
    console.log(`Extracted ${relationships.length} relationships`);
    console.log('Done.');
}

build();
