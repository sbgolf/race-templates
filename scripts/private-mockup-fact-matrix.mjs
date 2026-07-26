#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const configDir = path.resolve(root, 'src/data/private-mockups');
const REQUIRED_FACTS = [
  { id: 'race_name', path: 'identity.name', label: 'Race name' },
  { id: 'event_date', path: 'event.date', label: 'Race date' },
  { id: 'event_location', path: 'event.location', label: 'Location' },
  { id: 'distances', path: 'distances', label: 'Distances' },
  { id: 'registration_url', path: 'registration.url', label: 'Registration URL' }
];

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error?.stack || error?.message || String(error));
    process.exit(1);
  });
}

export async function run({ rootDir = root, quiet = false, configs: providedConfigs = null } = {}) {
  const configs = providedConfigs
    ? providedConfigs.map((config, index) => ({ file: path.resolve(rootDir, `inline-private-mockup-${index + 1}.json`), config }))
    : await privateMockupConfigs(path.resolve(rootDir, 'src/data/private-mockups'));
  const errors = [];
  const warnings = [];
  const mockups = [];

  for (const { file, config } of configs) {
    const privateMockup = config.private_mockup || {};
    const fullQaRequired = privateMockup.owner_approved_for_generation === true;
    const matrix = buildFactMatrix(config, file);
    const required = REQUIRED_FACTS.map((fact) => validateRequiredFact({ fact, config, matrix, fullQaRequired, errors, warnings, file }));
    const sourceUrls = new Set(matrix.map((item) => item.source_url).filter(Boolean));

    mockups.push({
      file: path.relative(rootDir, file),
      route: privateMockup.route || '',
      race_name: config.identity?.name || '',
      full_qa_required: fullQaRequired,
      required_facts: required,
      fact_count: matrix.length,
      source_url_count: sourceUrls.size,
      facts: matrix
    });
  }

  const manifest = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    required_fact_contract: REQUIRED_FACTS,
    summary: {
      mockups: mockups.length,
      full_qa_required: mockups.filter((mockup) => mockup.full_qa_required).length,
      fact_records: mockups.reduce((sum, mockup) => sum + mockup.fact_count, 0),
      errors: errors.length,
      warnings: warnings.length
    },
    mockups,
    errors,
    warnings
  };

  const outputPath = path.resolve(rootDir, 'dist/private/mockup-fact-matrix.json');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  if (!quiet) {
    console.log(`✓ Wrote ${path.relative(rootDir, outputPath)}`);
    console.log(`  Mockups: ${manifest.summary.mockups}`);
    console.log(`  Fact records: ${manifest.summary.fact_records}`);
  }
  if (errors.length) {
    if (!quiet) {
      for (const error of errors) console.error(`✗ ${error}`);
    }
    throw new Error('Private mockup source fact matrix gate failed.');
  }
  if (!quiet) console.log('✓ Private mockup source fact matrix gate passed.');
  return { manifest, outPath: outputPath, errors, warnings };
}

function buildFactMatrix(config, file) {
  const privateMockup = config.private_mockup || {};
  const provenanceItems = asArray(privateMockup.provenance?.items);
  const primarySourceUrl = firstUrl(privateMockup.source_url, privateMockup.provenance?.source_url, ...asArray(privateMockup.source_urls));
  const records = [];

  for (const item of provenanceItems) {
    const factPath = item.path || item.field;
    if (!factPath) continue;
    records.push(cleanRecord({
      path: factPath,
      label: item.label || item.field || factPath,
      value: valueAtPath(config, factPath),
      source: item.source || item.method || item.note || 'Private mockup provenance item',
      source_url: firstUrl(item.source_url, primarySourceUrl),
      confidence: item.confidence || 'unknown',
      evidence_type: 'provenance_item',
      file
    }));
  }

  const hero = config.identity?.hero_image;
  if (hero?.src) {
    records.push(cleanRecord({
      path: 'identity.hero_image',
      label: 'Hero image',
      value: hero.src,
      source: hero.source_label || hero.caption || hero.alt || 'Configured hero image',
      source_url: firstUrl(hero.source, hero.source_url, primarySourceUrl),
      confidence: hero.generated ? 'approved-generated' : 'high',
      evidence_type: 'visual_asset',
      file
    }));
  }

  asArray(privateMockup.assets).forEach((asset, index) => {
    if (!asset?.src && !asset?.path) return;
    records.push(cleanRecord({
      path: `private_mockup.assets[${index}]`,
      label: asset.type || 'Private mockup asset',
      value: asset.src || asset.path,
      source: asset.alt || asset.type || 'Captured private mockup asset',
      source_url: firstUrl(asset.source_url, asset.source, primarySourceUrl),
      confidence: asset.generated ? 'approved-generated' : 'high',
      evidence_type: 'visual_asset',
      file
    }));
  });

  asArray(config.distances).forEach((distance, index) => {
    records.push(cleanRecord({
      path: `distances[${index}]`,
      label: distance?.name || `Distance ${index + 1}`,
      value: [distance?.name, distance?.distance, distance?.start_time, distance?.price].filter(Boolean).join(' | '),
      source: distance?.provenance?.source || distance?.provenance?.method || distance?.source || 'Configured distance',
      source_url: firstUrl(distance?.provenance?.source_url, distance?.source_url, primarySourceUrl),
      confidence: distance?.provenance?.confidence || (distance?.provenance?.verified ? 'high' : 'unknown'),
      evidence_type: 'distance',
      file
    }));
  });

  asArray(config.runner_decision_checklist?.items).forEach((item) => {
    if (!item?.id) return;
    records.push(cleanRecord({
      path: item.source_path || `runner_decision_checklist.items.${item.id}`,
      label: item.label || item.id,
      value: [item.value, item.detail].filter(Boolean).join(' — '),
      source: 'Runner decision checklist item',
      source_url: firstUrl(item.source_url, primarySourceUrl),
      confidence: 'high',
      evidence_type: 'runner_decision_checklist',
      file
    }));
  });

  const registrationUrl = config.registration?.url;
  if (registrationUrl) {
    records.push(cleanRecord({
      path: 'registration.url',
      label: 'Registration URL',
      value: registrationUrl,
      source: `${config.registration?.platform || 'Official'} registration link`,
      source_url: firstUrl(registrationUrl, primarySourceUrl),
      confidence: 'high',
      evidence_type: 'registration',
      file
    }));
  }

  return uniqueBy(records.filter((record) => record.path), (record) => `${record.path}:${record.value}:${record.source_url}`);
}

function validateRequiredFact({ fact, config, matrix, fullQaRequired, errors, warnings, file }) {
  const value = valueAtPath(config, fact.path);
  const records = matrix.filter((item) => item.path === fact.path || item.path.startsWith(`${fact.path}.`) || item.path.startsWith(`${fact.path}[`));
  const hasValue = hasRenderableValue(value);
  const hasSource = records.some((record) => /^https?:\/\//i.test(String(record.source_url || '')) || record.confidence === 'approved-generated');
  const status = hasValue && hasSource ? 'verified' : hasValue ? 'missing_source' : 'missing_value';
  if (status !== 'verified') {
    const message = `${path.relative(root, file)} ${fact.path}: ${fact.label} is ${status.replace('_', ' ')} in the source fact matrix.`;
    (fullQaRequired ? errors : warnings).push(message);
  }
  return { ...fact, status, record_count: records.length };
}

async function privateMockupConfigs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const configs = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const file = path.join(dir, entry.name);
    configs.push({ file, config: JSON.parse(await readFile(file, 'utf8')) });
  }
  return configs.sort((a, b) => a.file.localeCompare(b.file));
}

function valueAtPath(config, factPath) {
  if (factPath === 'distances') return config.distances;
  const normalized = String(factPath).replace(/\[(\d+)\]/g, '.$1');
  return normalized.split('.').reduce((value, key) => (value == null ? undefined : value[key]), config);
}

function cleanRecord(record) {
  return {
    path: record.path,
    label: String(record.label || record.path),
    value: summarizeValue(record.value),
    source: String(record.source || '').trim(),
    source_url: record.source_url || '',
    confidence: String(record.confidence || 'unknown'),
    evidence_type: record.evidence_type,
    file: path.relative(root, record.file)
  };
}

function summarizeValue(value) {
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (value && typeof value === 'object') return JSON.stringify(value).slice(0, 240);
  return String(value ?? '').slice(0, 240);
}

function firstUrl(...values) {
  return values.flat().find((value) => typeof value === 'string' && /^https?:\/\//i.test(value)) || '';
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasRenderableValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function uniqueBy(items, keyFor) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = keyFor(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}
