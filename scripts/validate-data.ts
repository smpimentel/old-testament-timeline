#!/usr/bin/env tsx
/**
 * Migration gate script - validates build before app runs
 * 1. Runs build:data
 * 2. Validates raw data against raw schemas
 * 3. Validates compiled data against compiled schemas
 * 4. Checks relationship ID integrity
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'src/data/raw');
const COMPILED_DIR = path.join(ROOT, 'src/data/compiled');
const RAW_SCHEMA_DIR = path.join(ROOT, 'src/data/schemas/raw');
const COMPILED_SCHEMA_DIR = path.join(ROOT, 'src/data/schemas/compiled');

// Types
interface ValidationError {
  file: string;
  message: string;
  path?: string;
}

interface SchemaDefinitions {
  definitions?: Record<string, unknown>;
}

// ============================================================================
// Schema Validation (lightweight, no external deps)
// ============================================================================

function loadJson(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    throw new Error(`Failed to parse ${filePath}: ${e}`);
  }
}

function loadSchemaWithRefs(schemaPath: string): { schema: unknown; defs: Record<string, unknown> } {
  const schema = loadJson(schemaPath) as SchemaDefinitions;
  const schemaDir = path.dirname(schemaPath);
  const defs: Record<string, unknown> = {};

  // Load common schema for $ref resolution
  const commonFile = schemaPath.includes('compiled')
    ? 'common.compiled.schema.json'
    : 'common.raw.schema.json';
  const commonPath = path.join(schemaDir, commonFile);

  if (fs.existsSync(commonPath)) {
    const common = loadJson(commonPath) as SchemaDefinitions;
    if (common.definitions) {
      Object.assign(defs, common.definitions);
    }
  }

  if (schema.definitions) {
    Object.assign(defs, schema.definitions);
  }

  return { schema, defs };
}

// Simple schema validator (handles our specific schema patterns)
function validateAgainstSchema(
  data: unknown,
  schema: Record<string, unknown>,
  defs: Record<string, unknown>,
  dataPath = ''
): string[] {
  const errors: string[] = [];

  // Handle $ref
  if (schema.$ref && typeof schema.$ref === 'string') {
    const refMatch = schema.$ref.match(/#\/definitions\/(\w+)$/);
    if (refMatch && defs[refMatch[1]]) {
      return validateAgainstSchema(data, defs[refMatch[1]] as Record<string, unknown>, defs, dataPath);
    }
  }

  // Type validation
  const schemaType = schema.type;

  if (schemaType === 'array') {
    if (!Array.isArray(data)) {
      errors.push(`${dataPath || 'root'}: expected array, got ${typeof data}`);
      return errors;
    }
    const itemSchema = schema.items as Record<string, unknown>;
    if (itemSchema) {
      data.forEach((item, i) => {
        errors.push(...validateAgainstSchema(item, itemSchema, defs, `${dataPath}[${i}]`));
      });
    }
    return errors;
  }

  if (schemaType === 'object') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      errors.push(`${dataPath || 'root'}: expected object, got ${typeof data}`);
      return errors;
    }

    const obj = data as Record<string, unknown>;
    const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
    const required = (schema.required || []) as string[];

    // Check required
    for (const req of required) {
      if (!(req in obj)) {
        errors.push(`${dataPath}.${req}: required field missing`);
      }
    }

    // Validate properties
    if (props) {
      for (const [key, value] of Object.entries(obj)) {
        if (props[key]) {
          errors.push(...validateAgainstSchema(value, props[key], defs, `${dataPath}.${key}`));
        } else if (schema.additionalProperties === false) {
          errors.push(`${dataPath}.${key}: unknown property`);
        }
      }
    }

    return errors;
  }

  if (schemaType === 'string') {
    if (typeof data !== 'string') {
      errors.push(`${dataPath}: expected string, got ${typeof data}`);
      return errors;
    }
    if (schema.pattern) {
      const re = new RegExp(schema.pattern as string);
      if (!re.test(data)) {
        errors.push(`${dataPath}: '${data}' does not match pattern ${schema.pattern}`);
      }
    }
    if (schema.enum && !(schema.enum as string[]).includes(data)) {
      errors.push(`${dataPath}: '${data}' not in enum [${(schema.enum as string[]).join(', ')}]`);
    }
    if (schema.const && data !== schema.const) {
      errors.push(`${dataPath}: expected '${schema.const}', got '${data}'`);
    }
    return errors;
  }

  if (schemaType === 'integer' || schemaType === 'number') {
    if (typeof data !== 'number') {
      errors.push(`${dataPath}: expected ${schemaType}, got ${typeof data}`);
      return errors;
    }
    if (schemaType === 'integer' && !Number.isInteger(data)) {
      errors.push(`${dataPath}: expected integer, got float`);
    }
    if (schema.minimum !== undefined && data < (schema.minimum as number)) {
      errors.push(`${dataPath}: ${data} < minimum ${schema.minimum}`);
    }
    if (schema.enum && !(schema.enum as number[]).includes(data)) {
      errors.push(`${dataPath}: ${data} not in enum [${(schema.enum as number[]).join(', ')}]`);
    }
    return errors;
  }

  if (schemaType === 'boolean') {
    if (typeof data !== 'boolean') {
      errors.push(`${dataPath}: expected boolean, got ${typeof data}`);
    }
    return errors;
  }

  // Handle union types like ["string", "null"]
  if (Array.isArray(schemaType)) {
    const types = schemaType as string[];
    const actualType = data === null ? 'null' : typeof data;
    if (!types.includes(actualType)) {
      errors.push(`${dataPath}: expected one of [${types.join(', ')}], got ${actualType}`);
    }
    return errors;
  }

  return errors;
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateRawData(): ValidationError[] {
  console.log('Validating raw data...');
  const errors: ValidationError[] = [];

  const rawFiles = [
    { data: 'people.json', schema: 'people.raw.schema.json' },
    { data: 'events.json', schema: 'events.raw.schema.json' },
    { data: 'books.json', schema: 'books.raw.schema.json' },
    { data: 'periods.json', schema: 'periods.raw.schema.json' },
    { data: 'themes.json', schema: 'themes.raw.schema.json' },
  ];

  for (const { data: dataFile, schema: schemaFile } of rawFiles) {
    const dataPath = path.join(RAW_DIR, dataFile);
    const schemaPath = path.join(RAW_SCHEMA_DIR, schemaFile);

    if (!fs.existsSync(dataPath)) {
      errors.push({ file: dataFile, message: 'File not found' });
      continue;
    }
    if (!fs.existsSync(schemaPath)) {
      errors.push({ file: schemaFile, message: 'Schema not found' });
      continue;
    }

    try {
      const data = loadJson(dataPath);
      const { schema, defs } = loadSchemaWithRefs(schemaPath);
      const schemaErrors = validateAgainstSchema(data, schema as Record<string, unknown>, defs);

      for (const err of schemaErrors) {
        errors.push({ file: dataFile, message: err });
      }

      if (schemaErrors.length === 0) {
        console.log(`  ✓ ${dataFile}`);
      } else {
        console.log(`  ✗ ${dataFile} (${schemaErrors.length} errors)`);
      }
    } catch (e) {
      errors.push({ file: dataFile, message: String(e) });
    }
  }

  return errors;
}

function validateCompiledData(): ValidationError[] {
  console.log('Validating compiled data...');
  const errors: ValidationError[] = [];

  const compiledFiles = [
    { data: 'people.json', schema: 'people.compiled.schema.json' },
    { data: 'events.json', schema: 'events.compiled.schema.json' },
    { data: 'books.json', schema: 'books.compiled.schema.json' },
    { data: 'periods.json', schema: 'periods.compiled.schema.json' },
    { data: 'themes.json', schema: 'themes.compiled.schema.json' },
    { data: 'relationships.json', schema: 'relationships.compiled.schema.json' },
  ];

  for (const { data: dataFile, schema: schemaFile } of compiledFiles) {
    const dataPath = path.join(COMPILED_DIR, dataFile);
    const schemaPath = path.join(COMPILED_SCHEMA_DIR, schemaFile);

    if (!fs.existsSync(dataPath)) {
      errors.push({ file: dataFile, message: 'Compiled file not found (run build:data first)' });
      continue;
    }
    if (!fs.existsSync(schemaPath)) {
      // Some schemas may not exist yet, warn but continue
      console.log(`  ? ${dataFile} (no schema: ${schemaFile})`);
      continue;
    }

    try {
      const data = loadJson(dataPath);
      const { schema, defs } = loadSchemaWithRefs(schemaPath);
      const schemaErrors = validateAgainstSchema(data, schema as Record<string, unknown>, defs);

      for (const err of schemaErrors) {
        errors.push({ file: `compiled/${dataFile}`, message: err });
      }

      if (schemaErrors.length === 0) {
        console.log(`  ✓ ${dataFile}`);
      } else {
        console.log(`  ✗ ${dataFile} (${schemaErrors.length} errors)`);
      }
    } catch (e) {
      errors.push({ file: `compiled/${dataFile}`, message: String(e) });
    }
  }

  return errors;
}

function validateRelationshipIntegrity(): ValidationError[] {
  console.log('Validating relationship ID integrity...');
  const errors: ValidationError[] = [];

  // Collect all valid IDs
  const allIds = new Set<string>();

  const entityFiles = ['people.json', 'events.json', 'books.json', 'periods.json', 'themes.json'];

  for (const file of entityFiles) {
    const filePath = path.join(COMPILED_DIR, file);
    if (!fs.existsSync(filePath)) continue;

    try {
      const data = loadJson(filePath) as Array<{ id: string }>;
      for (const item of data) {
        if (item.id) allIds.add(item.id);
      }
    } catch {
      // Skip if can't parse
    }
  }

  // Check relationships
  const relPath = path.join(COMPILED_DIR, 'relationships.json');
  if (!fs.existsSync(relPath)) {
    errors.push({ file: 'relationships.json', message: 'File not found' });
    return errors;
  }

  try {
    const relationships = loadJson(relPath) as Array<{
      id: string;
      sourceId: string;
      targetId: string;
    }>;

    let invalidCount = 0;
    for (const rel of relationships) {
      if (!allIds.has(rel.sourceId)) {
        errors.push({
          file: 'relationships.json',
          message: `Relationship ${rel.id}: sourceId '${rel.sourceId}' not found`,
        });
        invalidCount++;
      }
      if (!allIds.has(rel.targetId)) {
        errors.push({
          file: 'relationships.json',
          message: `Relationship ${rel.id}: targetId '${rel.targetId}' not found`,
        });
        invalidCount++;
      }
    }

    if (invalidCount === 0) {
      console.log(`  ✓ All ${relationships.length} relationships valid`);
    } else {
      console.log(`  ✗ ${invalidCount} invalid references`);
    }
  } catch (e) {
    errors.push({ file: 'relationships.json', message: String(e) });
  }

  return errors;
}

// ============================================================================
// Main
// ============================================================================

function main() {
  console.log('=== Migration Gate: Data Validation ===\n');

  // Step 1: Run build:data
  console.log('Running build:data...');
  try {
    execSync('npm run build:data', { cwd: ROOT, stdio: 'inherit' });
    console.log('');
  } catch {
    console.error('\n✗ build:data failed');
    process.exit(1);
  }

  // Step 2-4: Validate
  const allErrors: ValidationError[] = [];

  console.log('');
  allErrors.push(...validateRawData());

  console.log('');
  allErrors.push(...validateCompiledData());

  console.log('');
  allErrors.push(...validateRelationshipIntegrity());

  // Summary
  console.log('\n=== Summary ===');
  if (allErrors.length === 0) {
    console.log('✓ All validations passed');
    process.exit(0);
  } else {
    console.log(`✗ ${allErrors.length} validation error(s):\n`);
    for (const err of allErrors) {
      console.log(`  [${err.file}] ${err.message}`);
    }
    process.exit(1);
  }
}

main();
