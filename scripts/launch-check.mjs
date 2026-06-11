#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { launchGateChecks } from '../src/shared/schema/race-config-schema.mjs';

const target = process.argv[2] || 'src/data/samples/cascade-marathon.json';
const absolute = path.resolve(process.cwd(), target);
const config = JSON.parse(await readFile(absolute, 'utf8'));
const result = launchGateChecks(config);

console.log(`Launch gate: ${target}`);
for (const check of result.checks) {
  console.log(`${check.pass ? '✓' : '✗'} ${check.id}: ${check.label}`);
  for (const detail of check.details || []) console.log(`  - ${detail}`);
}
for (const warning of result.warnings) console.warn(`⚠ ${warning.path}: ${warning.message}`);

if (!result.ok) {
  console.error('Launch gate failed. Fix the failed checks before customer review or production launch.');
  process.exit(1);
}

console.log('Launch gate passed.');
