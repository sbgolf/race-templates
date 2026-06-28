#!/usr/bin/env node
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { launchGateChecks } from '../src/shared/schema/race-config-schema.mjs';

const target = process.argv[2] || 'src/data/samples/hartwell-half.json';
const forbiddenGrowthClaimPatterns = [
  /\bguaranteed\s+growth\b/i,
  /\bguaranteed\s+registrations?\b/i,
  /\bguaranteed\s+signups?\b/i,
  /\bdouble\s+(?:signups?|registrations?)\b/i,
  /\bincreas(?:e|es|ed|ing)\s+registrations?\b/i,
  /\bboost(?:s|ed|ing)?\s+registrations?\b/i,
  /\bconversion\s+lift\b/i
];
const allowedNegatedGrowthClaimPhrases = [
  /\bno\s+guaranteed\s+growth\s+claims?\b/gi
];
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
  const anchors = extractAnchors(html);
  const registrationAnchors = anchors.filter((anchor) => anchor.attrs.href === registrationUrl);
  const placements = registrationAnchors.map((anchor) => anchor.attrs['data-analytics-placement']).filter(Boolean);
  const requiredPrivatePlacements = ['nav-button', 'hero-primary', 'runner-checklist-footer', 'registration-decision-card', 'finale-primary'];
  const missingPrivatePlacements = requiredPrivatePlacements.filter((placement) => !placements.includes(placement));
  const duplicatePlacements = [...new Set(placements.filter((placement, index) => placements.indexOf(placement) !== index))];
  const registrationAnchorErrors = registrationAnchors.flatMap((anchor, index) => [
    ...(anchor.attrs['data-analytics-event'] === 'register_click' ? [] : [`Registration anchor #${index + 1} is missing data-analytics-event="register_click".`]),
    ...(anchor.attrs['data-analytics-placement'] ? [] : [`Registration anchor #${index + 1} is missing data-analytics-placement.`]),
    ...(anchor.attrs['data-registration-platform'] ? [] : [`Registration anchor #${index + 1} is missing data-registration-platform.`])
  ]);
  const incorrectlyTrackedRegistrationClicks = anchors.filter((anchor) => anchor.attrs['data-analytics-event'] === 'register_click' && anchor.attrs.href !== registrationUrl);
  const hasPrivateValueNarrative = html.includes('data-private-value-narrative');
  const hasRunnerChecklist = html.includes('data-runner-decision-checklist');
  const hasHeroChecklistSecondary = html.includes("scrollToId('runner-checklist')") && html.includes('Review key race details');
  const hasRegistrationDecisionCard = html.includes('data-registration-decision-card');
  const hasRegisterClickListener = html.includes("document.addEventListener('click', function (event)");
  const visibleText = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  const rawPlatformCopyPattern = /happen on (?:runsignup|race_roster|raceroster|haku|letsdothis|lets_do_this|other)\b/;
  const claimCheckHtml = allowedNegatedGrowthClaimPhrases
    .reduce((content, pattern) => content.replace(pattern, 'no overpromising claims'), html);
  const forbiddenClaims = forbiddenGrowthClaimPatterns
    .filter((pattern) => pattern.test(claimCheckHtml))
    .map((pattern) => pattern.source);
  const checks = [
    {
      id: 'community-registration-links',
      label: 'Community CTAs link to configured registration URL',
      pass: html.includes(`href="${registrationUrl}"`),
      details: html.includes(`href="${registrationUrl}"`) ? [] : [`Missing rendered href for ${registrationUrl}`]
    },
    {
      id: 'community-register-analytics',
      label: 'Community registration CTAs include complete register-click analytics attributes',
      pass: registrationAnchors.length > 0 && registrationAnchorErrors.length === 0 && incorrectlyTrackedRegistrationClicks.length === 0,
      details: [
        ...(registrationAnchors.length ? [] : [`Missing rendered registration anchors for ${registrationUrl}`]),
        ...registrationAnchorErrors,
        ...incorrectlyTrackedRegistrationClicks.map((anchor) => `Non-registration anchor is tracked as register_click: ${anchor.attrs.href || '(missing href)'}.`)
      ]
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
    },
    {
      id: 'community-no-forbidden-growth-claims',
      label: 'Rendered page avoids forbidden registration growth claims',
      pass: forbiddenClaims.length === 0,
      details: forbiddenClaims.map((pattern) => `Matched forbidden phrase pattern: ${pattern}`)
    },
    {
      id: config.private_mockup?.route ? 'private-value-narrative-present' : 'public-value-narrative-absent',
      label: config.private_mockup?.route
        ? 'Private Community page renders the StartLine value narrative'
        : 'Public Community page does not render the private value narrative',
      pass: config.private_mockup?.route ? hasPrivateValueNarrative : !hasPrivateValueNarrative,
      details: config.private_mockup?.route && !hasPrivateValueNarrative
        ? ['Missing data-private-value-narrative in private rendered HTML.']
        : (!config.private_mockup?.route && hasPrivateValueNarrative ? ['Public rendered HTML contains data-private-value-narrative.'] : [])
    },
    {
      id: config.private_mockup?.route ? 'private-runner-checklist-present' : 'public-runner-checklist-absent',
      label: config.private_mockup?.route
        ? 'Private Community page renders runner decision checklist with tracked CTA'
        : 'Public Community page does not render the private runner checklist',
      pass: config.private_mockup?.route
        ? hasRunnerChecklist && (html.match(/data-checklist-item-id=/g) || []).length >= 3 && html.includes('data-analytics-placement="runner-checklist-footer"')
        : !hasRunnerChecklist,
      details: config.private_mockup?.route
        ? [
            ...(hasRunnerChecklist ? [] : ['Missing data-runner-decision-checklist in private rendered HTML.']),
            ...((html.match(/data-checklist-item-id=/g) || []).length >= 3 ? [] : ['Runner checklist has fewer than 3 rendered items.']),
            ...(html.includes('data-analytics-placement="runner-checklist-footer"') ? [] : ['Missing runner-checklist-footer register-click placement.'])
          ]
        : (hasRunnerChecklist ? ['Public rendered HTML contains private runner checklist.'] : [])
    },
    {
      id: config.private_mockup?.route ? 'private-hero-secondary-checklist' : 'public-hero-secondary-course',
      label: config.private_mockup?.route
        ? 'Private Community hero secondary CTA points to runner checklist from private_mockup presence'
        : 'Public Community hero secondary CTA remains course-oriented',
      pass: config.private_mockup?.route ? hasHeroChecklistSecondary : !hasHeroChecklistSecondary,
      details: config.private_mockup?.route && !hasHeroChecklistSecondary
        ? ['Private hero secondary CTA should render “Review key race details” and scroll to runner-checklist.']
        : (!config.private_mockup?.route && hasHeroChecklistSecondary ? ['Public hero secondary CTA unexpectedly points to runner checklist.'] : [])
    },
    {
      id: config.private_mockup?.route ? 'private-registration-decision-card-present' : 'public-registration-decision-card-absent',
      label: config.private_mockup?.route
        ? 'Private Community page renders the registration decision card with tracked CTA'
        : 'Public Community page does not render the private registration decision card',
      pass: config.private_mockup?.route
        ? hasRegistrationDecisionCard && placements.includes('registration-decision-card')
        : !hasRegistrationDecisionCard,
      details: config.private_mockup?.route
        ? [
            ...(hasRegistrationDecisionCard ? [] : ['Missing data-registration-decision-card in private rendered HTML.']),
            ...(placements.includes('registration-decision-card') ? [] : ['Missing registration-decision-card register-click placement.'])
          ]
        : (hasRegistrationDecisionCard ? ['Public rendered HTML contains private registration decision card.'] : [])
    },
    {
      id: 'community-registration-platform-copy',
      label: 'Registration handoff copy uses prospect-facing platform labels',
      pass: !rawPlatformCopyPattern.test(visibleText),
      details: rawPlatformCopyPattern.test(visibleText) ? ['Rendered copy exposes a raw registration.platform key in “happen on …” prose.'] : []
    },
    {
      id: 'community-registration-placement-hierarchy',
      label: 'Community registration CTAs use distinct Sprint 4 measurement placements',
      pass: config.private_mockup?.route
        ? missingPrivatePlacements.length === 0 && placements.some((placement) => placement.startsWith('entry-distance-')) && duplicatePlacements.length === 0
        : duplicatePlacements.length === 0,
      details: config.private_mockup?.route ? [
        ...missingPrivatePlacements.map((placement) => `Missing required placement: ${placement}`),
        ...(placements.some((placement) => placement.startsWith('entry-distance-')) ? [] : ['Missing required entry-distance-* placement.']),
        ...duplicatePlacements.map((placement) => `Duplicate registration CTA placement: ${placement}`)
      ] : duplicatePlacements.map((placement) => `Duplicate registration CTA placement: ${placement}`)
    },
    {
      id: config.private_mockup?.route ? 'private-register-click-listener-present' : 'public-register-click-listener-present',
      label: 'Community page renders register-click listener wiring',
      pass: hasRegisterClickListener,
      details: hasRegisterClickListener ? [] : ['Missing register-click listener script marker.']
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
