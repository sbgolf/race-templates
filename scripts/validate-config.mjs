#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { validateRaceConfig } from '../src/shared/schema/race-config-schema.mjs';

const files = process.argv.slice(2);
const targets = files.length ? files : [
  'src/data/samples/cascade-marathon.json',
  'src/data/samples/capital-marathon.json',
  'src/data/samples/hartwell-half.json'
];

let failed = false;

for (const target of targets) {
  const absolute = path.resolve(process.cwd(), target);
  try {
    const config = JSON.parse(await readFile(absolute, 'utf8'));
    const result = validateRaceConfig(config);
    if (result.ok) {
      console.log(`✓ ${target}`);
    } else {
      failed = true;
      console.error(`✗ ${target}`);
      for (const error of result.errors) console.error(`  - ${error.path}: ${error.message}`);
    }
    for (const warning of result.warnings) console.warn(`  ⚠ ${warning.path}: ${warning.message}`);
  } catch (error) {
    failed = true;
    console.error(`✗ ${target}`);
    console.error(`  - ${error.message}`);
  }
}

if (failed) process.exit(1);
