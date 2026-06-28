#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCapturedImageAsset, buildRunnerDecisionChecklist, extractStructuredLinks, labelForResourceUrl, normalizeDisplayCopy } from './generate-private-mockup.mjs';
import { shouldRenderTrustSignalsBand, substantiveTrustSignalsForRace, trustSignalsForRace } from '../src/shared/private-mockup-trust.mjs';

assert.equal(
  normalizeDisplayCopy('The 6th annual race returns with awards for 1st -$300, 2nd -$200, and 3rd -$100.'),
  'The 6th annual race returns with awards for 1st — $300, 2nd — $200, and 3rd — $100.'
);

assert.equal(
  normalizeDisplayCopy('Race day is June 6th, 2026 for the 6th annual race.'),
  'Race day is June 6, 2026 for the 6th annual race.'
);

const faqLinkResult = extractStructuredLinks('Course map: https://www.strava.com/routes/123 and details at https://runningahead.com/maps/foo.');
assert(!/https?:\/\//i.test(faqLinkResult.text));
assert.deepEqual(faqLinkResult.links, [
  { label: 'View Strava route', url: 'https://www.strava.com/routes/123' },
  { label: 'View RunningAHEAD map', url: 'https://runningahead.com/maps/foo' }
]);

assert.equal(labelForResourceUrl('https://runsignup.com/Race/TN/AshlandCity/AshlandCityHalfMarathon'), 'View RunSignup registration');

assert.deepEqual(
  buildCapturedImageAsset({
    assetNamespace: '35a001229594dde99d184e2ab18b50e9',
    name: '1-a40629fb41.png',
    sourceUrl: 'https://www.baa.org/wp-content/uploads/2025/10/BAALogo-1.png',
    index: 0
  }),
  {
    src: '/mockups/35a001229594dde99d184e2ab18b50e9/1-a40629fb41.png',
    alt: 'Public race-site image captured for concept direction',
    caption: 'Public race-site image used for concept direction.',
    source: 'https://www.baa.org/wp-content/uploads/2025/10/BAALogo-1.png'
  }
);
assert.equal(
  buildCapturedImageAsset({
    assetNamespace: '35a001229594dde99d184e2ab18b50e9',
    name: '2-ca09e38448.png',
    sourceUrl: 'https://www.baa.org/wp-content/uploads/2025/11/BAALogo-1.png',
    index: 1
  }).caption,
  'Additional public race-site visual reference.'
);

const strongChecklist = buildRunnerDecisionChecklist({
  eventDate: { value: '2026-03-07', source: 'date source', confidence: 'high' },
  location: { value: 'Ashland City, TN', source: 'location source', confidence: 'high' },
  startTime: { value: '7:30 AM', source: 'start source', confidence: 'high' },
  distances: [{ id: 'half-marathon', name: 'Half Marathon', distance: '13.1 mi', provenance: { source: 'title', confidence: 'high' } }],
  price: { value: '$60', source: 'price source', confidence: 'medium' },
  certification: { value: 'USATF certified #TN22002MS', source: 'cert source', confidence: 'high' },
  aidStations: { value: 5, source: 'aid source', confidence: 'high' },
  courseProfile: { value: 'Fast, flat · USATF-certified', source: 'course source', confidence: 'medium' },
  sourceSections: { about: { value: 'The course starts and finishes next to the Cumberland River at Riverbluff Park in Ashland City, TN.' } },
  scheduleItems: [{ day: 'Friday, March 6th', name: 'Packet pick-up', time: '11:00 AM – 6:00 PM', location: 'Nashville Running Company' }],
  faqs: [
    { question: 'What is the refund or transfer policy?', answer: 'Refunds will NOT be issued. Bibs may be transferred up to 5pm Wednesday March 4th.' },
    { question: 'What do participants receive?', answer: 'Each participant will receive a Next Level race T-shirt. All finishers will receive a medal.' },
    { question: 'Is there a course time limit?', answer: 'The course is open for 3 hours.' }
  ]
}, { sourceUrl: 'https://nashvilletrackclub.org/ashlandcityhalf/' });
assert(strongChecklist.items.length >= 10);
assert(strongChecklist.items.some((item) => item.id === 'start-time' && item.value === '7:30 AM'));
assert(strongChecklist.items.every((item) => !/https?:\/\/|www\.|\bT(?:BD|BA)\b|unknown|coming soon/i.test(item.value)));

const sparseChecklist = buildRunnerDecisionChecklist({
  eventDate: { value: '2027-04-19', source: 'date source', confidence: 'medium' },
  location: { value: 'Boston, MA', source: 'location source', confidence: 'medium' },
  startTime: null,
  distances: [{ id: 'marathon', name: 'Marathon', distance: '26.2 mi', provenance: { source: 'title', confidence: 'high' } }],
  price: null,
  certification: null,
  aidStations: null,
  courseProfile: null,
  sourceSections: {},
  scheduleItems: [],
  faqs: []
}, { sourceUrl: 'https://www.baa.org/races/boston-marathon' });
assert.deepEqual(sparseChecklist.items.map((item) => item.id), ['date', 'distance', 'location']);
assert.equal(sparseChecklist.items.find((item) => item.id === 'date')?.value, 'Monday, April 19, 2027');
assert(!sparseChecklist.items.some((item) => /TBD|TBA|unknown|coming soon/i.test(item.value)));

const bostonSparseFixture = JSON.parse(await readFile(new URL('../src/data/private-mockups/boston-marathon-private-test.json', import.meta.url), 'utf8'));
assert.equal(shouldRenderTrustSignalsBand(bostonSparseFixture), false);
assert.deepEqual(substantiveTrustSignalsForRace(bostonSparseFixture).map((signal) => signal.id), []);
assert(trustSignalsForRace(bostonSparseFixture).some((signal) => signal.id === 'official-registration-platform'));
assert(trustSignalsForRace(bostonSparseFixture).some((signal) => signal.id === 'organizer'));
assert(trustSignalsForRace(bostonSparseFixture).some((signal) => signal.id === 'source-backed'));

const ashlandRichFixture = JSON.parse(await readFile(new URL('../src/data/private-mockups/ashland-city-half.json', import.meta.url), 'utf8'));
assert.equal(shouldRenderTrustSignalsBand(ashlandRichFixture), true);
assert(substantiveTrustSignalsForRace(ashlandRichFixture).length >= 3);

const genericOnlyFixture = {
  private_mockup: {
    source_url: 'https://example.org/race',
    provenance: {
      items: [
        { confidence: 'high' },
        { confidence: 'high' },
        { confidence: 'high' }
      ],
      source_confirmed_sections: ['runner_decision_checklist']
    }
  },
  organization: { name: 'Example Organizer' },
  registration: { url: 'https://example.org/register', platform: 'runsignup' }
};
assert.equal(trustSignalsForRace(genericOnlyFixture).length, 3);
assert.deepEqual(substantiveTrustSignalsForRace(genericOnlyFixture), []);
assert.equal(shouldRenderTrustSignalsBand(genericOnlyFixture), false);

console.log('✓ private mockup generator regressions');
