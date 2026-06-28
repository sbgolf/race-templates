const PLATFORM_LABELS = {
  runsignup: 'RunSignup',
  race_roster: 'Race Roster',
  raceroster: 'Race Roster',
  active: 'ACTIVE',
  haku: 'Haku',
  letsdothis: "Let's Do This",
  lets_do_this: "Let's Do This",
  'lets-do-this': "Let's Do This",
  other: 'the official registration platform'
};

export function registrationPlatformLabel(platform, fallback = 'the official registration platform') {
  if (!platform) return fallback;

  const key = String(platform).trim().toLowerCase();
  if (!key) return fallback;
  if (PLATFORM_LABELS[key]) return PLATFORM_LABELS[key];

  return key
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
