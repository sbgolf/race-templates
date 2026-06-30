import { registrationPlatformLabel } from './registration-platform-label.mjs';

export const PRIVATE_VALUE_SUPPORTED_TEMPLATES = ['community', 'destination-major', 'performance'];

export const PRIVATE_VALUE_CONTRACT_MARKERS = Object.freeze({
  valueNarrative: 'data-private-value-narrative',
  runnerDecisionChecklist: 'data-runner-decision-checklist',
  registrationDecisionCard: 'data-registration-decision-card',
  trustSignalsBand: 'data-trust-signals-band',
  measurementReadyPanel: 'data-measurement-ready-panel'
});

export const PRIVATE_VALUE_REQUIRED_MARKERS = Object.freeze([
  PRIVATE_VALUE_CONTRACT_MARKERS.valueNarrative,
  PRIVATE_VALUE_CONTRACT_MARKERS.runnerDecisionChecklist,
  PRIVATE_VALUE_CONTRACT_MARKERS.registrationDecisionCard,
  PRIVATE_VALUE_CONTRACT_MARKERS.measurementReadyPanel
]);

export const PRIVATE_VALUE_PUBLIC_FORBIDDEN_MARKERS = Object.freeze(Object.values(PRIVATE_VALUE_CONTRACT_MARKERS));

const BASE_VALUE_COPY = Object.freeze({
  headline: 'A race website concept built around registration intent — not just a prettier homepage.',
  intro: 'StartLine Sites reorganizes the information runners need before they register: date, location, distance, course details, schedule, policies, and the official registration link. The goal is to reduce friction, surface trust signals, and make the next click easier to find on mobile and desktop.',
  improved: [
    'Reduced runner friction by placing key race facts and the official registration path in predictable sections.',
    'Surfaced trust signals such as event details, distances, schedule items, and FAQs when available.',
    'Made registration CTAs easier to find across mobile and desktop, with measurement-ready registration-click tracking attributes.'
  ],
  paid_includes: [
    'A mobile-first StartLine build shaped around the registration path, not a generic brochure page.',
    'SEO-ready metadata and structured event content so runners can understand the race before leaving to register.',
    'Registration-click tracking setup for measuring runner intent and next-click behavior after launch.',
    'No registration-growth guarantees — just a clearer, faster, more measurable path from runner interest to registration click-through.'
  ]
});

export function templateForPrivateMockup(race = {}) {
  return race.private_mockup?.template || race.identity?.template || 'community';
}

export function supportsPrivateValueContract(template) {
  return PRIVATE_VALUE_SUPPORTED_TEMPLATES.includes(template);
}

export function privateValueNarrativeForRace(race = {}, archetypeDefaults = {}) {
  const configured = isObject(race.startline_value) ? race.startline_value : {};
  return {
    headline: firstText(configured.headline, archetypeDefaults.headline, BASE_VALUE_COPY.headline),
    intro: firstText(configured.intro, archetypeDefaults.intro, BASE_VALUE_COPY.intro),
    improved: firstArray(configured.improved, archetypeDefaults.improved, BASE_VALUE_COPY.improved),
    paid_includes: firstArray(configured.paid_includes, archetypeDefaults.paid_includes, BASE_VALUE_COPY.paid_includes)
  };
}

export function registrationDecisionCopyForRace(race = {}, defaults = {}) {
  const platform = registrationPlatformLabel(race.registration?.platform);
  const ctaLabel = race.registration?.cta_label || defaults.ctaLabel || 'Continue to official registration';
  return {
    platform,
    ctaLabel,
    headline: defaults.headline || 'Ready to register?',
    kicker: defaults.kicker || 'Registration handoff',
    body: defaults.body || `StartLine sends runners to the configured registration platform. Availability, payment, and confirmation happen on ${platform}; this page measures the click-through to help the race team understand registration interest.`
  };
}

export function measurementReadyCopyForRace(race = {}, defaults = {}) {
  const platform = registrationPlatformLabel(race.registration?.platform);
  return {
    platform,
    kicker: defaults.kicker || 'Measurement-ready handoff',
    headline: defaults.headline || 'Registration intent can be separated from platform results.',
    intro: defaults.intro || 'StartLine prepares a `register_click` event for each outbound official-registration CTA, including its placement, platform, and link destination.',
    reportLabel: defaults.reportLabel || 'What this page can report',
    reportBody: defaults.reportBody || `Outbound handoff intent: which registration CTA a visitor used, where it appeared, and that it sent them toward ${platform}.`,
    separateLabel: defaults.separateLabel || 'What remains separate',
    separateBody: defaults.separateBody || 'Completed registrations, payment, and confirmation happen inside the official registration platform unless that platform later provides reporting or an approved integration.'
  };
}

export function privateValueContractMarkerState(html = '') {
  const source = String(html || '');
  return Object.fromEntries(Object.entries(PRIVATE_VALUE_CONTRACT_MARKERS).map(([key, marker]) => [key, source.includes(marker)]));
}

export function privateValuePublicMarkerLeaks(html = '') {
  const source = String(html || '');
  return PRIVATE_VALUE_PUBLIC_FORBIDDEN_MARKERS.filter((marker) => source.includes(marker));
}

function firstText(...values) {
  return values.find((value) => typeof value === 'string' && value.trim()) || '';
}

function firstArray(...values) {
  return values.find((value) => Array.isArray(value) && value.length) || [];
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
