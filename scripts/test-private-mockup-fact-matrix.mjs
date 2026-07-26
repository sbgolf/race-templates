#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { run } from './private-mockup-fact-matrix.mjs';

const root = await mkdtemp(path.join(os.tmpdir(), 'private-mockup-fact-matrix-'));

try {
  await assert.rejects(
    () => run({
      rootDir: root,
      quiet: true,
      configs: [mockupConfig({
        ownerApproved: true,
        registrationUrl: '',
        provenanceItems: [
          sourced('identity.name'),
          sourced('event.date'),
          sourced('event.location'),
          sourced('distances')
        ]
      })]
    }),
    /source fact matrix gate failed/,
    'owner-approved mockups must fail when a required fact is missing a value/source'
  );

  const { manifest } = await run({
    rootDir: root,
    quiet: true,
    configs: [mockupConfig({
      ownerApproved: true,
      registrationUrl: 'https://runsignup.com/Race/Register/?raceId=123',
      provenanceItems: [
        sourced('identity.name'),
        sourced('event.date'),
        sourced('event.location'),
        sourced('distances'),
        sourced('registration.url')
      ]
    })]
  });

  assert.equal(manifest.summary.mockups, 1);
  assert.equal(manifest.summary.errors, 0);
  assert.equal(manifest.mockups[0].required_facts.every((fact) => fact.status === 'verified'), true);
  assert.equal(manifest.mockups[0].facts.some((fact) => fact.path === 'registration.url'), true);
  console.log('✓ private mockup source fact matrix regressions');
} finally {
  await rm(root, { recursive: true, force: true });
}

function mockupConfig({ ownerApproved, registrationUrl, provenanceItems }) {
  return {
    identity: {
      name: 'Ready Race',
      hero_image: {
        src: '/mockups/token/hero.jpg',
        source: 'https://example.org/hero.jpg',
        source_label: 'Official race hero image'
      }
    },
    event: {
      date: '2026-10-31',
      location: 'Example, TN'
    },
    distances: [
      {
        id: '5k',
        name: '5K',
        distance: '5K',
        source_url: 'https://example.org/race/events',
        provenance: {
          source: 'Official events page',
          source_url: 'https://example.org/race/events',
          confidence: 'high',
          verified: true
        }
      }
    ],
    registration: {
      url: registrationUrl,
      platform: 'runsignup'
    },
    private_mockup: {
      access_token: 'token',
      route: '/private/mockups/token/',
      owner_approved_for_generation: ownerApproved,
      source_url: 'https://example.org/race',
      source_urls: ['https://example.org/race'],
      provenance: {
        items: provenanceItems
      }
    }
  };
}

function sourced(factPath) {
  return {
    path: factPath,
    source: `Official source for ${factPath}`,
    source_url: 'https://example.org/race',
    confidence: 'high'
  };
}
