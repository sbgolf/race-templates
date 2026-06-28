#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildRunnerDecisionChecklist, extractStructuredLinks, labelForResourceUrl, normalizeDisplayCopy } from './generate-private-mockup.mjs';

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

console.log('✓ private mockup generator regressions');
