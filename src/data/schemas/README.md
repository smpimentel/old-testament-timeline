# Schema Structure

Two-layer validation strategy:

## `/raw/` - Validates authored data
- Matches actual structure in `../raw/*.json`
- Simple flat fields: `birthYear`, `deathYear`, `year`, `startYear`, `endYear`
- Scripture refs as strings: `"Genesis 12:1-3"`
- Theme IDs can be mixed case

## `/compiled/` - Validates UI-ready data
- Normalized date objects: `{ year, era, certainty }`
- Parsed scripture refs: `{ book, chapter, startVerse, endVerse }`
- Theme IDs lowercase: `"covenant"` not `"Covenant"`
- Additional computed fields

## Compilation Mappings

### Books: category -> genre
| Raw category    | Compiled genre |
|-----------------|----------------|
| Pentateuch      | Law            |
| History         | History        |
| Poetry          | Poetry/Wisdom  |
| Major Prophets  | Prophecy       |
| Minor Prophets  | Prophecy       |

### Events: category default
If no category in raw, compiler uses "Historical" as default.

### Relationships
No raw schema needed - relationships derived during compilation from `relatedPeople`, `relatedEvents`, `relatedBooks` fields.
