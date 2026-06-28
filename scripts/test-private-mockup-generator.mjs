#!/usr/bin/env node
import assert from 'node:assert/strict';
import { extractStructuredLinks, labelForResourceUrl, normalizeDisplayCopy } from './generate-private-mockup.mjs';

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

console.log('✓ private mockup generator regressions');
