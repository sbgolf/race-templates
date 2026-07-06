import { registrationPlatformLabel } from './registration-platform-label.mjs';

const TRUST_SIGNAL_LABELS = {
  course: 'Certified-course proof',
  'aid-stations': 'Race-day support',
  'packet-pickup': 'Packet pickup clarity',
  'refunds-transfers': 'Policy clarity',
  swag: 'Runner value',
  awards: 'Awards / recognition',
  'time-limit': 'Cutoff clarity',
  'start-time': 'Schedule clarity',
  price: 'Price clarity'
};

const TRUST_CHECKLIST_IDS = new Set(Object.keys(TRUST_SIGNAL_LABELS));
const GENERIC_SUPPLEMENTAL_TRUST_SIGNAL_IDS = new Set([
  'official-registration-platform',
  'organizer'
]);
const SUBSTANTIVE_TRUST_SIGNAL_ID_PATTERNS = [
  /^certification-/,
  /^profile-/,
  /^aid-count-/
];
const PLACEHOLDER_PATTERN = /\b(?:TBD|TBA|unknown|coming soon|to be announced)\b/i;
const MIN_SUBSTANTIVE_TRUST_SIGNALS = 3;

export function trustSignalsForRace(race) {
  if (!race?.private_mockup) return [];

  const signals = [];
  const seen = new Set();

  const add = (id, label, value, detail = '') => {
    const cleanValue = cleanTrustValue(value);
    const cleanDetail = cleanTrustValue(detail);
    if (!id || !label || !cleanValue) return;
    if (seen.has(id)) return;
    seen.add(id);
    signals.push({ id, label, value: cleanValue, detail: cleanDetail });
  };

  for (const distance of asArray(race.distances)) {
    const suffix = distance?.name ? ` (${distance.name})` : '';
    add(`certification-${distance?.id || signals.length}`, 'Certification', distance?.certification, suffix ? `Listed for ${distance.name}` : 'Listed race certification');
    add(`profile-${distance?.id || signals.length}`, 'Course profile', distance?.profile, distance?.name ? `Listed for ${distance.name}` : 'Listed course detail');
    if (distance?.aid_stations !== undefined && distance?.aid_stations !== null) {
      add(`aid-count-${distance?.id || signals.length}`, 'On-course support', `${distance.aid_stations} aid stations listed`, distance?.name || '');
    }
  }

  const platformLabel = registrationPlatformLabel(race.registration?.platform);
  if (race.registration?.url) {
    add('official-registration-platform', 'Official registration', platformLabel, `Entry and confirmation happen on ${platformLabel}.`);
  }

  if (race.organization?.name) {
    add('organizer', 'Organizer', race.organization.name, 'Race organization');
  }

  for (const item of asArray(race.runner_decision_checklist?.items)) {
    if (!TRUST_CHECKLIST_IDS.has(item?.id)) continue;
    add(item.id, TRUST_SIGNAL_LABELS[item.id], item.value, item.detail);
  }

  return signals.slice(0, 8);
}

export function substantiveTrustSignalsForRace(race) {
  return trustSignalsForRace(race).filter((signal) => isSubstantiveTrustSignal(signal));
}

export function shouldRenderTrustSignalsBand(race) {
  return substantiveTrustSignalsForRace(race).length >= MIN_SUBSTANTIVE_TRUST_SIGNALS;
}

function isSubstantiveTrustSignal(signal) {
  const id = String(signal?.id || '');
  if (!id || GENERIC_SUPPLEMENTAL_TRUST_SIGNAL_IDS.has(id)) return false;
  return TRUST_CHECKLIST_IDS.has(id) || SUBSTANTIVE_TRUST_SIGNAL_ID_PATTERNS.some((pattern) => pattern.test(id));
}

function cleanTrustValue(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text || PLACEHOLDER_PATTERN.test(text)) return '';
  return text;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}
