#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { validateRaceConfig } from '../src/shared/schema/race-config-schema.mjs';

const root = process.cwd();
const mockupDir = path.resolve(root, 'src/data/private-mockups');

const bannedTerms = [
  /\bHartwell\b/i,
  /\bTown Common\b/i,
  /\bKids['’]? Mile\b/i,
  /\bSame town four ways\b/i,
  /\bSample Distances\b/i
];

const samplePlaceholderPatterns = [
  /\bTBD\b/i,
  /\bTBA\b/i,
  /\bunknown\b/i,
  /\bcoming soon\b/i,
  /\bLorem ipsum\b/i,
  /\bexample\.com\b/i,
  /replace placeholder/i,
  /placeholder race details/i,
  /sample-only/i,
  /demo only/i
];

const sampleImagePatterns = [
  /inline-svg/i,
  /\/samples?\//i,
  /hartwell/i,
  /placeholder/i,
  /illustrated/i
];

const rawVisibleUrlPattern = /\b(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|org|net|io|gov|edu)\b)/i;
const punctuationArtifactPatterns = [
  /\b20\d{2}\s+\./,
  /\b\d+\s+hours?\s+\./i,
  /\b[A-Z]{2}\d{5}[A-Z]{2}\s+\./,
  /\)\s+\./,
  /\b\d+(?:st|nd|rd|th)?\s*-\$/i,
  /\s+[,.!?;:]/
];

const renderedSectionFields = [
  'stats',
  'schedule',
  'volunteer',
  'sponsors',
  'travel',
  'faq',
  'faqs',
  'charity',
  'partners',
  'testimonials',
  'course',
  'pricing',
  'runner_decision_checklist'
];

const runnerChecklistItemIds = new Set([
  'date', 'distance', 'start-time', 'location', 'price', 'packet-pickup', 'course', 'aid-stations', 'refunds-transfers', 'swag', 'awards', 'time-limit'
]);

const files = await privateMockupFiles();
let failed = false;

if (files.length === 0) {
  console.log('✓ No private mockup configs found.');
  process.exit(0);
}

for (const file of files) {
  const relative = path.relative(root, file);
  const errors = [];
  let config;
  let raw = '';

  try {
    raw = await readFile(file, 'utf8');
    config = JSON.parse(raw);
  } catch (error) {
    errors.push(`$: ${error.message}`);
  }

  if (config) {
    const schema = validateRaceConfig(config);
    for (const error of schema.errors) errors.push(`${error.path}: ${error.message}`);

    const privateMockup = config.private_mockup;
    if (!isObject(privateMockup)) {
      errors.push('private_mockup: Private mockup metadata is required.');
    } else {
      requireText(privateMockup.source_url, 'private_mockup.source_url', errors);
      requireIsoDate(privateMockup.captured_at, 'private_mockup.captured_at', errors);
      requireAccessToken(privateMockup.access_token, 'private_mockup.access_token', errors);
      if (privateMockup.noindex !== true) errors.push('private_mockup.noindex: Private mockups must set noindex: true.');

      if (!isObject(privateMockup.provenance)) {
        errors.push('private_mockup.provenance: Source-derived private mockups must include provenance metadata.');
      } else {
        requireText(privateMockup.provenance.source_url, 'private_mockup.provenance.source_url', errors);
        if (privateMockup.provenance.source_url && privateMockup.source_url && privateMockup.provenance.source_url !== privateMockup.source_url) {
          errors.push('private_mockup.provenance.source_url: Must match private_mockup.source_url.');
        }
        if (!Array.isArray(privateMockup.provenance.source_confirmed_sections)) {
          errors.push('private_mockup.provenance.source_confirmed_sections: Must list source-supported rendered sections.');
        }
      }

      if (!isObject(privateMockup.uncertainty)) {
        errors.push('private_mockup.uncertainty: Source-derived private mockups must include uncertainty metadata.');
      } else {
        requireText(privateMockup.uncertainty.summary, 'private_mockup.uncertainty.summary', errors);
        if (!Array.isArray(privateMockup.uncertainty.items)) errors.push('private_mockup.uncertainty.items: Must be an array, even when empty.');
      }

      const confirmedDistanceIds = new Set(asArray(privateMockup.provenance?.source_confirmed_distance_ids));
      const confirmedSections = new Set(asArray(privateMockup.provenance?.source_confirmed_sections));

      validateRenderedSections(config, confirmedSections, errors);
      validateDistances(config, confirmedDistanceIds, errors);
      validateSingleDistanceCopy(config, confirmedDistanceIds, errors);
      validateRunnerDecisionChecklist(config, confirmedSections, confirmedDistanceIds, errors);
    }

    validateBannedText(config, errors);
    validateSampleImages(config, errors);
    validateSourceDerivedPlaceholders(config, errors);
    validateDisplayCopyPolish(config, errors);
    validateFaqLinks(config, errors);
  }

  if (errors.length > 0) {
    failed = true;
    console.error(`✗ ${relative}`);
    for (const error of errors) console.error(`  - ${error}`);
  } else {
    console.log(`✓ ${relative}`);
  }
}

if (failed) {
  console.error('Private mockup validation failed. Remove sample leakage, add provenance/uncertainty, and only render source-supported sections.');
  process.exit(1);
}

function validateBannedText(config, errors) {
  for (const { path: jsonPath, value } of walkStrings(config)) {
    for (const pattern of bannedTerms) {
      if (pattern.test(value)) errors.push(`${jsonPath}: Contains banned sample term "${pattern.source}".`);
    }
  }
}

function validateSourceDerivedPlaceholders(config, errors) {
  if (!config.private_mockup?.source_url) return;
  for (const { path: jsonPath, value } of walkStrings(config)) {
    for (const pattern of samplePlaceholderPatterns) {
      if (pattern.test(value)) errors.push(`${jsonPath}: Source-derived private mockup still contains sample/placeholder copy.`);
    }
  }
}

function validateDisplayCopyPolish(config, errors) {
  for (const { path: jsonPath, value } of walkStrings(config)) {
    if (!isDisplayCopyPath(jsonPath)) continue;
    if (rawVisibleUrlPattern.test(value)) errors.push(`${jsonPath}: Display copy must not expose raw URLs or bare domains; use a labeled link field instead.`);
    for (const pattern of punctuationArtifactPatterns) {
      if (pattern.test(value)) errors.push(`${jsonPath}: Display copy contains punctuation/spacing artifact "${pattern.source}".`);
    }
  }
}

function validateFaqLinks(config, errors) {
  asArray(config.faqs || config.faq).forEach((faq, index) => {
    const base = `faqs[${index}]`;
    if (rawVisibleUrlPattern.test(String(faq?.answer || ''))) {
      errors.push(`${base}.answer: FAQ answers must remove visible URL text and preserve URLs as labeled links.`);
    }
    asArray(faq?.links).forEach((link, linkIndex) => {
      if (!link?.url || !/^https?:\/\//i.test(link.url)) errors.push(`${base}.links[${linkIndex}].url: FAQ links must include an absolute HTTP(S) URL.`);
      if (!link?.label || rawVisibleUrlPattern.test(String(link.label))) errors.push(`${base}.links[${linkIndex}].label: FAQ links must use a human-readable label, not a raw URL.`);
    });
  });
}

function isDisplayCopyPath(jsonPath) {
  if (/(^|\.)(url|source_url|route|src|href|source|access_token|captured_at)$/.test(jsonPath)) return false;
  if (/\.url$/.test(jsonPath)) return false;
  if (jsonPath.startsWith('private_mockup.assets')) return false;
  if (jsonPath.startsWith('private_mockup.provenance')) return false;
  return /^(identity|event|organization|distances|registration\.cta_label|story|schedule|faqs?|seo|startline_value|runner_decision_checklist)\b/.test(jsonPath);
}

function validateRunnerDecisionChecklist(config, confirmedSections, confirmedDistanceIds, errors) {
  const checklist = config.runner_decision_checklist;
  if (!hasRenderableValue(checklist)) return;
  if (!confirmedSections.has('runner_decision_checklist')) {
    errors.push('runner_decision_checklist: Rendered checklist is present but not listed in private_mockup.provenance.source_confirmed_sections.');
  }
  const provenancePaths = new Set(asArray(config.private_mockup?.provenance?.items).map((item) => item?.path).filter(Boolean));
  const seen = new Set();
  asArray(checklist.items).forEach((item, index) => {
    const base = `runner_decision_checklist.items[${index}]`;
    if (!isObject(item)) {
      errors.push(`${base}: Checklist item must be an object.`);
      return;
    }
    if (!item.id || !runnerChecklistItemIds.has(item.id)) errors.push(`${base}.id: Unknown checklist item id.`);
    if (item.id && seen.has(item.id)) errors.push(`${base}.id: Duplicate checklist item id.`);
    if (item.id) seen.add(item.id);
    if (!item.value || typeof item.value !== 'string' || !item.value.trim()) errors.push(`${base}.value: Checklist item value must be non-empty.`);
    if (!item.source_path || typeof item.source_path !== 'string') errors.push(`${base}.source_path: Private checklist items must include source_path.`);
    if (!item.source_url || !/^https?:\/\//i.test(item.source_url)) errors.push(`${base}.source_url: Private checklist items must include an absolute source_url.`);
    const itemProvenancePath = item.id ? `runner_decision_checklist.items.${item.id}` : '';
    if (itemProvenancePath && !provenancePaths.has(itemProvenancePath)) {
      errors.push(`${base}.source_path: Missing provenance item at ${itemProvenancePath}.`);
    }
    asArray(item.applies_to_distance_ids).forEach((id, idIndex) => {
      if (confirmedDistanceIds.size > 0 && !confirmedDistanceIds.has(id)) errors.push(`${base}.applies_to_distance_ids[${idIndex}]: Distance id is not source-confirmed.`);
    });
  });
}

function validateSampleImages(config, errors) {
  for (const { path: jsonPath, value } of walkObjects(config)) {
    if (!looksLikeImage(value)) continue;
    const combined = [value.src, value.alt, value.placeholder, value.caption, value.source].filter(Boolean).join(' ');
    if (sampleImagePatterns.some((pattern) => pattern.test(combined))) {
      errors.push(`${jsonPath}: Private mockups may not use sample-only or illustrated placeholder images.`);
    }
    if (!value.src || !/^\/mockups\/[a-f0-9]{32,}\//i.test(value.src)) {
      errors.push(`${jsonPath}.src: Private mockup images must be captured assets under /mockups/<access-token>/; omit the image if no public asset was captured.`);
    }
    if (!value.source || !/^https?:\/\//i.test(value.source)) {
      errors.push(`${jsonPath}.source: Captured private mockup images must include their public source URL.`);
    }
  }
}

function validateDistances(config, confirmedDistanceIds, errors) {
  const distances = asArray(config.distances);
  distances.forEach((distance, index) => {
    const base = `distances[${index}]`;
    if (!distance?.provenance || distance.provenance.verified !== true) {
      errors.push(`${base}.provenance.verified: Distances in source-derived private mockups must be explicitly source verified.`);
    }
    if (!distance?.provenance?.source_url || !/^https?:\/\//i.test(distance.provenance.source_url)) {
      errors.push(`${base}.provenance.source_url: Verified distances must include a public source URL.`);
    }
    if (distance?.id && confirmedDistanceIds.size > 0 && !confirmedDistanceIds.has(distance.id)) {
      errors.push(`${base}.id: Distance is not listed in private_mockup.provenance.source_confirmed_distance_ids.`);
    }
  });
}

function validateSingleDistanceCopy(config, confirmedDistanceIds, errors) {
  if (confirmedDistanceIds.size !== 1) return;
  const distanceNames = asArray(config.distances).map((distance) => distance?.name).filter(Boolean);
  const joinedNames = distanceNames.map(escapeRegExp).join('|');
  const multiDistancePattern = joinedNames
    ? new RegExp(`\\b(${joinedNames})\\b[\\s\\S]{0,80}\\b(${joinedNames})\\b`, 'i')
    : /\b(5K|10K|half marathon|marathon|kids['’]? mile|distances?)\b[\s\S]{0,80}\b(5K|10K|half marathon|marathon|kids['’]? mile|distances?)\b/i;

  for (const { path: jsonPath, value } of walkStrings(config)) {
    if (jsonPath.startsWith('private_mockup.')) continue;
    if (/distances?\b/i.test(value) && /\b(2|3|4|multiple|all)\b/i.test(value)) {
      errors.push(`${jsonPath}: References multiple distances but only one source-confirmed distance exists.`);
    }
    if (multiDistancePattern.test(value)) {
      errors.push(`${jsonPath}: Mentions multiple rendered distances but only one source-confirmed distance exists.`);
    }
  }
}

function validateRenderedSections(config, confirmedSections, errors) {
  for (const field of renderedSectionFields) {
    if (!hasRenderableValue(config[field])) continue;
    if (!confirmedSections.has(field)) {
      errors.push(`${field}: Rendered section is present but not listed in private_mockup.provenance.source_confirmed_sections.`);
    }
  }
}

async function privateMockupFiles() {
  try {
    const entries = await readdir(mockupDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => path.join(mockupDir, entry.name))
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function requireText(value, jsonPath, errors) {
  if (typeof value !== 'string' || value.trim() === '') errors.push(`${jsonPath}: Required non-empty string is missing.`);
}

function requireIsoDate(value, jsonPath, errors) {
  requireText(value, jsonPath, errors);
  if (typeof value === 'string' && Number.isNaN(Date.parse(value))) errors.push(`${jsonPath}: Must be an ISO timestamp.`);
}

function requireAccessToken(value, jsonPath, errors) {
  if (!/^[a-f0-9]{32,}$/i.test(String(value || ''))) errors.push(`${jsonPath}: Must be 32+ hex characters from at least 128 bits of entropy.`);
}

function looksLikeImage(value) {
  return isObject(value) && ('src' in value || 'placeholder' in value) && ('alt' in value || 'source' in value || 'caption' in value);
}

function hasRenderableValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (isObject(value)) return Object.keys(value).length > 0;
  return value !== undefined && value !== null && value !== '';
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function* walkStrings(value, currentPath = '$') {
  if (typeof value === 'string') {
    yield { path: currentPath, value };
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) yield* walkStrings(value[i], `${currentPath}[${i}]`);
    return;
  }
  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) yield* walkStrings(child, currentPath === '$' ? key : `${currentPath}.${key}`);
  }
}

function* walkObjects(value, currentPath = '$') {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) yield* walkObjects(value[i], `${currentPath}[${i}]`);
    return;
  }
  if (isObject(value)) {
    yield { path: currentPath, value };
    for (const [key, child] of Object.entries(value)) yield* walkObjects(child, currentPath === '$' ? key : `${currentPath}.${key}`);
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
