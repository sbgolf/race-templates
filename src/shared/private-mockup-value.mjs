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
  headline: 'A race page built around runner decisions.',
  intro: 'This page organizes the information runners need before they register: date, location, distance, course details, schedule, policies, and the official registration link. The goal is to reduce friction, surface useful race facts, and make the next click easier to find on mobile and desktop.',
  improved: [
    'Reduced runner friction by placing key race facts and the official registration path in predictable sections.',
    'Surfaced helpful details such as event logistics, distances, schedule items, and FAQs when available.',
    'Made official registration buttons easier to find across mobile and desktop.'
  ],
  paid_includes: [
    'A mobile-first race page shaped around the registration path, not a generic brochure page.',
    'SEO-ready metadata and structured event content so runners can understand the race before leaving to register.',
    'Clear official-registration buttons placed where runners are most likely to decide.',
    'No registration-growth guarantees — just a clearer, faster path from runner interest to official registration.'
  ]
});

const PRIVATE_COPY_REPLACEMENTS = Object.freeze([
  [/StartLine Sites/gi, 'This race website'],
  [/StartLine/gi, 'this page'],
  [/\brace website preview\b/gi, 'race website'],
  [/\bwebsite preview\b/gi, 'website'],
  [/\bprivate\s+concept\b/gi, 'race page'],
  [/\bconcept\b/gi, 'race page']
]);

export function templateForPrivateMockup(race = {}) {
  return race.private_mockup?.template || race.identity?.template || 'community';
}

export function supportsPrivateValueContract(template) {
  return PRIVATE_VALUE_SUPPORTED_TEMPLATES.includes(template);
}

export function privateValueNarrativeForRace(race = {}, archetypeDefaults = {}) {
  const configured = isObject(race.startline_value) ? race.startline_value : {};
  return {
    headline: cleanPrivateDisplayCopy(firstText(configured.headline, archetypeDefaults.headline, BASE_VALUE_COPY.headline)),
    intro: cleanPrivateDisplayCopy(firstText(configured.intro, archetypeDefaults.intro, BASE_VALUE_COPY.intro)),
    improved: firstArray(configured.improved, archetypeDefaults.improved, BASE_VALUE_COPY.improved).map(cleanPrivateDisplayCopy),
    paid_includes: firstArray(configured.paid_includes, archetypeDefaults.paid_includes, BASE_VALUE_COPY.paid_includes).map(cleanPrivateDisplayCopy)
  };
}

export function registrationDecisionCopyForRace(race = {}, defaults = {}) {
  const platform = registrationPlatformLabel(race.registration?.platform);
  const ctaLabel = race.registration?.cta_label || defaults.ctaLabel || 'Continue to official registration';
  return {
    platform,
    ctaLabel,
    headline: defaults.headline || 'Ready to register?',
    kicker: defaults.kicker || 'Official registration',
    body: defaults.body || `This page helps runners review the key race details before continuing to ${platform}. Availability, payment, and confirmation happen on the official registration platform.`
  };
}

export function measurementReadyCopyForRace(race = {}, defaults = {}) {
  const platform = registrationPlatformLabel(race.registration?.platform);
  return {
    platform,
    kicker: defaults.kicker || 'Registration details',
    headline: defaults.headline || 'The official registration path stays clear.',
    intro: defaults.intro || 'Each registration button gives runners a clear next step to the official registration page.',
    reportLabel: defaults.reportLabel || 'What runners see first',
    reportBody: defaults.reportBody || `Race details, pricing, schedule, and the official ${platform} path are grouped before the final click.`,
    separateLabel: defaults.separateLabel || 'What happens on the provider',
    separateBody: defaults.separateBody || 'Entry forms, payment, confirmation, transfers, and refunds happen inside the official registration platform.'
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

export function cleanPrivateDisplayCopy(value = '') {
  return PRIVATE_COPY_REPLACEMENTS.reduce(
    (copy, [pattern, replacement]) => copy.replace(pattern, replacement),
    String(value || '')
  );
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
