#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { shouldRenderTrustSignalsBand } from '../src/shared/private-mockup-trust.mjs';
import { PRIVATE_VALUE_CONTRACT_MARKERS, PRIVATE_VALUE_REQUIRED_MARKERS, PRIVATE_VALUE_SUPPORTED_TEMPLATES, privateValuePublicMarkerLeaks, templateForPrivateMockup } from '../src/shared/private-mockup-value.mjs';

const root = process.cwd();
const privateDir = path.resolve(root, 'dist/private/mockups');
const publicPreviewDir = path.resolve(root, 'dist/preview');
const rawVisibleUrlPattern = /\b(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|org|net|io|gov|edu)\b)/i;
const requiredPrivateRobotsDirectives = ['noindex', 'nofollow', 'noarchive', 'nosnippet'];
const visiblePlaceholderPatterns = [
  /\bTBD\b/i,
  /\bTBA\b/i,
  /\bunknown\b/i,
  /\bcoming soon\b/i
];
const visibleInternalChromePatterns = [
  /\bSource page\b/i,
  /\bsource config\b/i,
  /\brace source\b/i,
  /\bPrimary source\b/i,
  /\bSource-confirmed\b/i,
  /\bsource-backed\b/i,
  /\bprovenance\b/i,
  /\bUncertainty\b/i,
  /\bPrivate concept note\b/i,
  /\bPrivate StartLine concept\b/i,
  /\bStartLine private concept\b/i,
  /\bPrivate StartLine race website concept preview\b/i,
  /\bStartLine value wrapper\b/i,
  /\bshould be reviewed before prospect sharing\b/i
];
const customerFacingInternalChromePatterns = [
  /\bPrivate StartLine concept\b/i,
  /\bStartLine private concept\b/i,
  /\bPrivate StartLine race website concept preview\b/i,
  /\bsource[-\s]?confirmed\b/i,
  /\bsource[-\s]?backed\b/i,
  /\bprovenance\b/i,
  /\buncertainty\b/i,
  /\bsource_url\b/i,
  /\bcaptured_at\b/i,
  /\baccess_token\b/i,
  /\bpublic image URL on source page\b/i,
  /\bshould be reviewed before prospect sharing\b/i
];
const punctuationArtifactPatterns = [
  /(?:…|\.\.\.)\s*$/,
  /\b20\d{2}\s+\./,
  /\b\d+\s+hours?\s+\./i,
  /\b[A-Z]{2}\d{5}[A-Z]{2}\s+\./,
  /\)\s+\./,
  /\b\d+(?:st|nd|rd|th)?\s*-\$/i,
  /[-–—|/]\s*[.!?]/,
  /[-–—|/]\s*$/
];

let failed = false;
const files = await renderedPrivateMockupFiles();
const privateConfigsByToken = await privateConfigsByTokenMap();
const publicFiles = await renderedPublicPreviewFiles();

if (!files.length) {
  console.log('✓ No rendered private mockup pages found. Run npm run build first to scan rendered visible text.');
  process.exit(0);
}

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const text = visibleText(html);
  const customerFacingCopy = customerFacingCopySurface(html);
  const paragraphLikeText = paragraphLikeVisibleText(html);
  const errors = [];
  const registrationUrl = registrationUrlForRenderedFile(file);
  const config = configForRenderedFile(file);
  const template = templateForPrivateMockup(config);
  const shouldRenderTrustSignals = shouldRenderTrustSignalsBand(config);
  validatePrivateRobotsMetadata(html, errors);
  validateMobileOverflowReadiness(html, errors);
  if (rawVisibleUrlPattern.test(paragraphLikeText)) errors.push('Rendered paragraph-like visible copy exposes a raw URL or bare domain; use labeled links/buttons instead.');
  for (const pattern of visiblePlaceholderPatterns) {
    if (pattern.test(text)) errors.push(`Rendered visible text contains placeholder copy "${pattern.source}".`);
  }
  for (const pattern of visibleInternalChromePatterns) {
    if (pattern.test(text)) errors.push(`Rendered visible text contains internal/source chrome "${pattern.source}".`);
  }
  for (const pattern of customerFacingInternalChromePatterns) {
    if (pattern.test(customerFacingCopy)) errors.push(`Rendered customer-facing HTML contains internal/source chrome "${pattern.source}".`);
  }
  for (const pattern of punctuationArtifactPatterns) {
    if (pattern.test(text)) errors.push(`Rendered visible text contains punctuation/spacing artifact "${pattern.source}".`);
  }
  if (!html.includes(PRIVATE_VALUE_CONTRACT_MARKERS.valueNarrative)) errors.push(`Private ${template} mockup is missing the StartLine value narrative.`);
  const checklistItemCount = (html.match(/data-checklist-item-id=/g) || []).length;
  if (!html.includes(PRIVATE_VALUE_CONTRACT_MARKERS.runnerDecisionChecklist)) errors.push(`Private ${template} mockup is missing the runner decision checklist.`);
  if (checklistItemCount < 3) errors.push(`Runner decision checklist renders ${checklistItemCount} items; expected at least 3.`);
  if (!html.includes("scrollToId('runner-checklist')") || !html.includes('Review key race details')) {
    errors.push('Private hero secondary CTA must point to the runner checklist when private_mockup metadata and a checklist are present.');
  }
  if (!html.includes(PRIVATE_VALUE_CONTRACT_MARKERS.registrationDecisionCard)) errors.push(`Private ${template} mockup is missing the registration decision card.`);
  if (!html.includes(PRIVATE_VALUE_CONTRACT_MARKERS.measurementReadyPanel)) errors.push(`Private ${template} mockup is missing the measurement-ready panel.`);
  validatePrivateValueSectionOrder(html, template, errors);
  if (shouldRenderTrustSignals && !html.includes(PRIVATE_VALUE_CONTRACT_MARKERS.trustSignalsBand)) errors.push(`Private ${template} mockup has enough substantive runner-facing trust facts but is missing the trust-signal band.`);
  if (!shouldRenderTrustSignals && html.includes(PRIVATE_VALUE_CONTRACT_MARKERS.trustSignalsBand)) errors.push(`Private ${template} mockup renders the trust-signal band without enough substantive runner-facing trust facts.`);
  for (const marker of PRIVATE_VALUE_REQUIRED_MARKERS) {
    if (!html.includes(marker)) errors.push(`Private ${template} mockup is missing required private value contract marker ${marker}.`);
  }
  if (/happen on (?:runsignup|race_roster|raceroster|haku|letsdothis|lets_do_this|other)\b/.test(text)) {
    errors.push('Registration decision copy exposes a raw registration platform key instead of a prospect-facing label.');
  }
  if (/\b(?:track|tracks|tracked|count|counts|counted|measure|measures|measured)\s+(?:completed\s+)?(?:registrations?|signups?|conversions?)\b/i.test(text)) {
    errors.push('Measurement copy must not say StartLine tracks/counts/measures completed registrations, signups, or conversions.');
  }
  if (!html.includes("document.addEventListener('click', function (event)")) errors.push('Private rendered HTML is missing register-click listener wiring.');

  const anchors = extractAnchors(html);
  const registrationAnchors = anchors.filter((anchor) => anchor.attrs.href === registrationUrl);
  if (!registrationAnchors.length) errors.push(`No rendered anchors point to registration URL ${registrationUrl}.`);
  registrationAnchors.forEach((anchor, index) => {
    if (anchor.attrs['data-analytics-event'] !== 'register_click') errors.push(`Registration anchor #${index + 1} is missing data-analytics-event="register_click".`);
    if (!anchor.attrs['data-analytics-placement']) errors.push(`Registration anchor #${index + 1} is missing data-analytics-placement.`);
    if (!anchor.attrs['data-registration-platform']) errors.push(`Registration anchor #${index + 1} is missing data-registration-platform.`);
  });

  const placements = registrationAnchors.map((anchor) => anchor.attrs['data-analytics-placement']).filter(Boolean);
  const requiredPlacements = ['nav-button', 'hero-primary', 'runner-checklist-footer', 'registration-decision-card', 'finale-primary'];
  const minimumRegistrationCtaCount = requiredPlacements.length + 1;
  if (registrationAnchors.length < minimumRegistrationCtaCount) errors.push(`Only ${registrationAnchors.length} registration CTAs point to the official registration URL; expected at least ${minimumRegistrationCtaCount}.`);
  for (const required of requiredPlacements) {
    if (!placements.includes(required)) errors.push(`Missing required register-click placement "${required}".`);
  }
  if (!placements.some((placement) => placement.startsWith('entry-distance-'))) errors.push('Missing at least one entry-distance-* register-click placement.');
  if (!placements.slice(0, 2).some((placement) => ['nav-button', 'hero-primary'].includes(placement))) errors.push('Early registration CTA hierarchy must include nav-button or hero-primary in the first two registration links.');
  const duplicates = [...new Set(placements.filter((placement, index) => placements.indexOf(placement) !== index))];
  if (duplicates.length) errors.push(`Duplicate major registration CTA placements found: ${duplicates.join(', ')}.`);

  const incorrectlyTracked = anchors.filter((anchor) => anchor.attrs['data-analytics-event'] === 'register_click' && anchor.attrs.href !== registrationUrl);
  incorrectlyTracked.forEach((anchor) => errors.push(`Non-registration anchor is tracked as register_click: ${anchor.attrs.href || '(missing href)'}.`));

  const relative = redactPrivateTokens(path.relative(root, file));
  if (errors.length) {
    failed = true;
    console.error(`✗ ${relative}`);
    errors.forEach((error) => console.error(`  - ${redactPrivateTokens(error)}`));
  } else {
    console.log(`✓ ${relative}`);
  }
}

for (const file of publicFiles) {
  const html = await readFile(file, 'utf8');
  const leaks = privateValuePublicMarkerLeaks(html);
  const relative = path.relative(root, file);
  if (leaks.length) {
    failed = true;
    console.error(`✗ ${relative}`);
    leaks.forEach((marker) => console.error(`  - Public preview leaks private value marker ${marker}.`));
  } else {
    console.log(`✓ ${relative} (no private value markers)`);
  }
}

if (failed) process.exit(1);

async function renderedPrivateMockupFiles() {
  try {
    const tokens = await readdir(privateDir, { withFileTypes: true });
    return tokens
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(privateDir, entry.name, 'index.html'))
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function renderedPublicPreviewFiles() {
  try {
    const entries = await readdir(publicPreviewDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && PRIVATE_VALUE_SUPPORTED_TEMPLATES.includes(entry.name))
      .map((entry) => path.join(publicPreviewDir, entry.name, 'index.html'))
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function registrationUrlForRenderedFile(file) {
  const token = path.basename(path.dirname(file));
  return privateConfigsByToken.get(token)?.registration?.url || '';
}

function configForRenderedFile(file) {
  const token = path.basename(path.dirname(file));
  return privateConfigsByToken.get(token) || null;
}

async function privateConfigsByTokenMap() {
  const dataDir = path.resolve(root, 'src/data/private-mockups');
  const configs = new Map();
  try {
    const entries = await readdir(dataDir, { withFileTypes: true });
    for (const entry of entries.filter((candidate) => candidate.isFile() && candidate.name.endsWith('.json'))) {
      const config = JSON.parse(await readFile(path.join(dataDir, entry.name), 'utf8'));
      if (config.private_mockup?.access_token) {
        configs.set(config.private_mockup.access_token, config);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return configs;
}

function extractAnchors(html) {
  return [...String(html || '').matchAll(/<a\b([^>]*)>/gi)].map((match) => ({ attrs: parseAttrs(match[1] || '') }));
}

function parseAttrs(source) {
  const attrs = {};
  for (const match of String(source || '').matchAll(/([:\w-]+)(?:=("[^"]*"|'[^']*'|[^\s"'>]+))?/g)) {
    const [, key, rawValue = ''] = match;
    attrs[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
  return attrs;
}

function visibleText(html) {
  return String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

function paragraphLikeVisibleText(html) {
  const blocks = [];
  for (const match of String(html || '').matchAll(/<(p|li|figcaption|blockquote|summary|dt|dd|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    blocks.push(visibleText(match[2] || ''));
  }
  return blocks.join(' ');
}

function customerFacingCopySurface(html) {
  return String(html || '')
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/\bdata-private-(?:mockup|value-narrative)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function validatePrivateRobotsMetadata(html, errors) {
  for (const name of ['robots', 'googlebot']) {
    const content = metaContent(html, name);
    if (!content) {
      errors.push(`Private route is missing <meta name="${name}"> robots metadata.`);
      continue;
    }
    const directives = content.split(',').map((directive) => directive.trim().toLowerCase()).filter(Boolean);
    for (const required of requiredPrivateRobotsDirectives) {
      if (!directives.includes(required)) errors.push(`Private ${name} robots metadata is missing "${required}".`);
    }
  }
}

function validatePrivateValueSectionOrder(html, template, errors) {
  const orderedMarkers = template === 'performance'
    ? [
      PRIVATE_VALUE_CONTRACT_MARKERS.runnerDecisionChecklist,
      PRIVATE_VALUE_CONTRACT_MARKERS.registrationDecisionCard,
      PRIVATE_VALUE_CONTRACT_MARKERS.valueNarrative,
      PRIVATE_VALUE_CONTRACT_MARKERS.measurementReadyPanel
    ]
    : [
      PRIVATE_VALUE_CONTRACT_MARKERS.valueNarrative,
      PRIVATE_VALUE_CONTRACT_MARKERS.runnerDecisionChecklist,
      PRIVATE_VALUE_CONTRACT_MARKERS.registrationDecisionCard,
      PRIVATE_VALUE_CONTRACT_MARKERS.measurementReadyPanel
    ];
  const expectedFlow = template === 'performance'
    ? 'runner info hub → registration decision card → StartLine improvement notes → measurement-ready panel'
    : 'value narrative → runner checklist → registration decision card → measurement-ready panel';
  const positions = orderedMarkers.map((marker) => html.indexOf(marker));
  if (positions.some((position) => position < 0)) return;
  for (let index = 1; index < positions.length; index += 1) {
    if (positions[index] <= positions[index - 1]) {
      errors.push(`Private value sections must preserve the ${template === 'performance' ? 'runner-first ' : ''}decision flow: ${expectedFlow}.`);
      return;
    }
  }
}

function validateMobileOverflowReadiness(html, errors) {
  if (!/<meta\b[^>]*name=["']viewport["'][^>]*content=["'][^"']*width=device-width/i.test(html)) {
    errors.push('Rendered page is missing a mobile viewport meta tag with width=device-width.');
  }
  const styles = [...String(html || '').matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1] || '').join('\n');
  const fixedWidthRules = [...styles.matchAll(/(?:^|[;{\s])(width|min-width)\s*:\s*(\d+)px/gi)]
    .filter((match) => Number(match[2]) > 320)
    .map((match) => `${match[1]}:${match[2]}px`);
  const viewportOverflowRules = [...styles.matchAll(/(?:^|[;{\s])(width|min-width)\s*:\s*(\d+(?:\.\d+)?)vw/gi)]
    .filter((match) => Number(match[2]) > 100)
    .map((match) => `${match[1]}:${match[2]}vw`);
  if (fixedWidthRules.length) errors.push(`Mobile overflow readiness failed: fixed width/min-width above 320px found (${fixedWidthRules.slice(0, 5).join(', ')}). Use max-width/min()/clamp()/responsive grids instead.`);
  if (viewportOverflowRules.length) errors.push(`Mobile overflow readiness failed: width/min-width above 100vw found (${viewportOverflowRules.slice(0, 5).join(', ')}).`);
}

function metaContent(html, name) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\bname=["']${escapeRegExp(name)}["'])(?=[^>]*\\bcontent=(["'])([^"']*)\\1)[^>]*>`, 'i');
  return String(html || '').match(pattern)?.[2] || '';
}

function redactPrivateTokens(value) {
  return String(value || '')
    .replace(/(private[\\/]mockups[\\/])[a-f0-9]{32,}(?=[\\/]|$)/gi, '$1[REDACTED]')
    .replace(/(\/private\/mockups\/)[a-f0-9]{32,}(?=\/|$)/gi, '$1[REDACTED]');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
