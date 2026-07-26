#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { run } from './private-mockup-presend-outreach-gate.mjs';

const tmp = await mkdtemp(path.join(os.tmpdir(), 'private-mockup-presend-'));
try {
  const baseConfig = {
    identity: { name: 'Example Race' },
    private_mockup: {
      route: '/private/mockups/token/',
      owner_approved_for_generation: true,
      contact_sources: [
        {
          type: 'email',
          value: 'race@example.org',
          status: 'public_direct_org_race_contact',
          source_url: 'https://example.org/contact'
        }
      ]
    }
  };

  const approved = structuredClone(baseConfig);
  approved.private_mockup.outreach = {
    send_status: 'approved_to_send',
    steve_approval: {
      status: 'approved',
      approved_at: '2026-07-26T12:00:00Z',
      channel: 'telegram',
      note: 'Steve approved send.'
    },
    contact: {
      type: 'official_routing_email',
      value_masked: 'r***@example.org',
      status: 'official_routing_email_on_file',
      source: 'approved prospect record'
    }
  };

  const ok = await run({ rootDir: tmp, quiet: true, configs: [approved] });
  assert.equal(ok.errors.length, 0);
  assert.equal(ok.manifest.summary.approved_to_send, 1);
  assert.equal(ok.manifest.mockups[0].production_url, 'https://mockups.startlinesites.com/private/mockups/token/');

  const held = structuredClone(baseConfig);
  held.private_mockup.outreach = {
    send_status: 'hold',
    hold_reason: 'Steve explicitly held this race.',
    steve_approval: { status: 'hold', channel: 'telegram', note: 'Hold.' }
  };
  const heldResult = await run({ rootDir: tmp, quiet: true, configs: [held] });
  assert.equal(heldResult.errors.length, 0);
  assert.equal(heldResult.manifest.summary.held, 1);

  const formOnly = structuredClone(baseConfig);
  formOnly.private_mockup.contact_sources = [
    { type: 'form', url: 'https://example.org/contact-form', status: 'contact_form_only' }
  ];
  formOnly.private_mockup.outreach = {
    send_status: 'approved_to_send',
    steve_approval: { status: 'approved', approved_at: '2026-07-26T12:00:00Z', channel: 'telegram' }
  };
  await assert.rejects(() => run({ rootDir: tmp, quiet: true, configs: [formOnly] }), /pre-send outreach gate failed/);

  const duplicate = structuredClone(approved);
  duplicate.private_mockup.outreach.sent_at = '2026-07-26T12:10:00Z';
  duplicate.private_mockup.outreach.history = [{ status: 'sent', sent_at: '2026-07-26T12:11:00Z' }];
  await assert.rejects(() => run({ rootDir: tmp, quiet: true, configs: [duplicate] }), /pre-send outreach gate failed/);

  const liveOk = structuredClone(approved);
  const response = {
    status: 200,
    headers: { get: (name) => (name.toLowerCase() === 'x-robots-tag' ? 'noindex, nofollow' : '') },
    text: async () => '<html><head><meta name="robots" content="noindex,nofollow"></head><body><h1>Example Race</h1></body></html>'
  };
  const live = await run({ rootDir: tmp, quiet: true, configs: [liveOk], live: true, fetchImpl: async () => response });
  assert.equal(live.errors.length, 0);
  assert.equal(live.manifest.summary.live_smoked, 1);

  const liveBad = structuredClone(approved);
  const badResponse = {
    status: 200,
    headers: { get: () => '' },
    text: async () => '<html><head></head><body>Private StartLine concept preview</body></html>'
  };
  await assert.rejects(() => run({ rootDir: tmp, quiet: true, configs: [liveBad], live: true, fetchImpl: async () => badResponse }), /pre-send outreach gate failed/);

  console.log('✓ private mockup pre-send outreach gate regressions');
} finally {
  await rm(tmp, { recursive: true, force: true });
}
