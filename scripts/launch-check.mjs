#!/usr/bin/env node
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { launchGateChecks } from '../src/shared/schema/race-config-schema.mjs';

const target = process.argv[2] || 'src/data/samples/hartwell-half.json';
const absolute = path.resolve(process.cwd(), target);
const config = JSON.parse(await readFile(absolute, 'utf8'));
const result = launchGateChecks(config);

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function renderedOutputChecks() {
  if (config.identity?.template !== 'community') return [];

  const renderedPath = config.private_mockup?.route
    ? path.resolve(process.cwd(), 'dist', config.private_mockup.route.replace(/^\//, ''), 'index.html')
    : path.resolve(process.cwd(), 'dist', 'preview', 'community', 'index.html');
  let html = '';
  try {
    html = await readFile(renderedPath, 'utf8');
  } catch {
    return [{
      id: 'community-rendered-output',
      label: 'Community rendered output checked',
      pass: false,
      details: [`Build first so ${path.relative(process.cwd(), renderedPath)} exists.`]
    }];
  }

  const registrationUrl = config.registration?.url || '';
  const checks = [
    {
      id: 'community-registration-links',
      label: 'Community CTAs link to configured registration URL',
      pass: html.includes(`href="${registrationUrl}"`),
      details: html.includes(`href="${registrationUrl}"`) ? [] : [`Missing rendered href for ${registrationUrl}`]
    },
    {
      id: 'community-register-analytics',
      label: 'Community CTAs include register-click analytics attributes',
      pass: html.includes('data-analytics-event="register_click"') && html.includes('data-analytics-placement='),
      details: []
    },
    {
      id: 'community-json-ld',
      label: 'Community page renders SportsEvent JSON-LD',
      pass: html.includes('application/ld+json') && html.includes('"@type":"SportsEvent"'),
      details: []
    },
    {
      id: 'community-no-demo-registration',
      label: 'Community registration path has no demo-only registration buttons',
      pass: !/registration started — demo only|Donation info shown — demo only/.test(html),
      details: []
    }
  ];

  if (config.private_mockup?.route) {
    const privateRootIndex = path.resolve(process.cwd(), 'dist', 'private', 'mockups', 'index.html');
    const slugOnlyIndex = config.private_mockup.race_slug
      ? path.resolve(process.cwd(), 'dist', 'private', 'mockups', config.private_mockup.race_slug, 'index.html')
      : null;
    const privateRoutePattern = /^\/private\/mockups\/[a-f0-9]{32,}\/$/i;
    const privateRootExists = await fileExists(privateRootIndex);
    const slugOnlyExists = slugOnlyIndex ? await fileExists(slugOnlyIndex) : false;

    checks.push({
      id: 'private-mockup-tokenized-route',
      label: 'Private mockup route requires an unguessable token',
      pass: privateRoutePattern.test(config.private_mockup.route || ''),
      details: privateRoutePattern.test(config.private_mockup.route || '') ? [] : [`Route is not token-gated: ${config.private_mockup.route || '(missing)'}`]
    });
    checks.push({
      id: 'private-mockup-noindex',
      label: 'Private mockup route emits noindex,nofollow robots metadata',
      pass: html.includes('name="robots"') && html.includes('noindex,nofollow'),
      details: html.includes('name="robots"') && html.includes('noindex,nofollow') ? [] : ['Missing private noindex,nofollow robots tag.']
    });
    checks.push({
      id: 'private-mockup-no-listing',
      label: '/private/mockups/ does not render a mockup listing',
      pass: !privateRootExists,
      details: privateRootExists ? [`Unexpected listing file exists at ${path.relative(process.cwd(), privateRootIndex)}.`] : []
    });
    checks.push({
      id: 'private-mockup-slug-only-404',
      label: 'Slug-only private mockup URLs fall back to 404/not found',
      pass: !slugOnlyExists,
      details: slugOnlyExists && slugOnlyIndex ? [`Unexpected slug-only file exists at ${path.relative(process.cwd(), slugOnlyIndex)}.`] : []
    });
  }

  return checks;
}

const renderedChecks = await renderedOutputChecks();

console.log(`Launch gate: ${target}`);
for (const check of result.checks) {
  console.log(`${check.pass ? '✓' : '✗'} ${check.id}: ${check.label}`);
  for (const detail of check.details || []) console.log(`  - ${detail}`);
}
for (const check of renderedChecks) {
  console.log(`${check.pass ? '✓' : '✗'} ${check.id}: ${check.label}`);
  for (const detail of check.details || []) console.log(`  - ${detail}`);
}
for (const warning of result.warnings) console.warn(`⚠ ${warning.path}: ${warning.message}`);

if (!result.ok || renderedChecks.some((check) => !check.pass)) {
  console.error('Launch gate failed. Fix the failed checks before customer review or production launch.');
  process.exit(1);
}

console.log('Launch gate passed.');
