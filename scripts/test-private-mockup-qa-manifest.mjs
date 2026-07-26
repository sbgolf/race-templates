#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { generatePrivateMockupQaManifest } from './private-mockup-qa-manifest.mjs';

const root = await mkdtemp(path.join(os.tmpdir(), 'race-template-private-qa-'));
try {
  const token = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  await mkdir(path.join(root, 'dist/private/mockups', token), { recursive: true });
  await mkdir(path.join(root, 'dist/mockups', token), { recursive: true });
  await mkdir(path.join(root, 'dist/private/mockup-qa-screenshots', token), { recursive: true });
  await mkdir(path.join(root, 'src/data/private-mockups'), { recursive: true });
  await writeFile(path.join(root, 'src/data/private-mockups/ready-race.json'), JSON.stringify({
    identity: { name: 'Ready Race' },
    private_mockup: { access_token: token, owner_approved_for_generation: true }
  }, null, 2));
  await writeFile(path.join(root, 'dist/mockups', token, 'hero-runners.jpg'), Buffer.alloc(2048, 1));
  await writeFile(path.join(root, 'dist/private/mockup-qa-screenshots', token, 'mobile.png'), Buffer.alloc(16_000, 2));
  await writeFile(path.join(root, 'dist/private/mockup-qa-screenshots', token, 'desktop.png'), Buffer.alloc(26_000, 3));
  await writeFile(path.join(root, 'dist/private/mockups', token, 'index.html'), `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
  <title>Ready Race Private Mockup</title>
</head>
<body>
  <main>
    <section class="hero" style="background-image:url('/mockups/${token}/hero-runners.jpg')">
      <h1>Ready Race</h1>
      <img src="/mockups/${token}/hero-runners.jpg" alt="Ready Race runners on race day">
      <p>Race day photo coverage and course details are visible for runner review.</p>
    </section>
  </main>
</body>
</html>`);

  const passing = await generatePrivateMockupQaManifest({ root, capture: 'never', quiet: true });
  assert.equal(passing.errors.length, 0);
  assert.equal(passing.manifest.summary.total, 1);
  assert.equal(passing.manifest.summary.screenshot_records, 2);
  assert.equal(passing.manifest.mockups[0].ready, true);
  const manifestJson = JSON.parse(await readFile(path.join(root, 'dist/private/mockup-qa-manifest.json'), 'utf8'));
  assert.equal(manifestJson.mockups[0].image_references.length, 2);

  await writeFile(path.join(root, 'dist/private/mockups', token, 'index.html'), `<!doctype html>
<html>
<head><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"></head>
<body><img src="/mockups/${token}/placeholder.jpg" alt="placeholder"><p>Photo placeholder TBD.</p></body>
</html>`);
  const failing = await generatePrivateMockupQaManifest({ root, capture: 'never', quiet: true });
  assert(failing.errors.some((error) => /missing from dist/.test(error)));
  assert(failing.errors.some((error) => /placeholder-like/.test(error)));
  assert.equal(failing.manifest.mockups[0].ready, false);

  console.log('✓ private mockup QA manifest regressions');
} finally {
  await rm(root, { recursive: true, force: true });
}
