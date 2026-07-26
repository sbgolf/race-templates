#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const DEFAULT_PUBLIC_BASE_URL = 'https://mockups.startlinesites.com';
const SEND_STATUSES = new Set(['approved_to_send']);
const SENT_STATUSES = new Set(['sent', 'already_sent']);
const HOLD_STATUSES = new Set(['hold', 'held']);
const EMAIL_CONTACT_TYPES = new Set(['email', 'direct_email', 'official_routing_email', 'routing_email']);
const ELIGIBLE_CONTACT_STATUSES = new Set([
  'public_direct_org_race_contact',
  'public_named_race_contact',
  'public_routing_org_contact',
  'public_org_contact',
  'eligible_direct_org_inbox_verified_in_batch',
  'official_routing_email_on_file',
  'direct_email_on_file'
]);
const FORBIDDEN_VISIBLE_TERMS = [
  /private startline concept preview/i,
  /private startline concept/i,
  /startline private concept/i,
  /noindex concept/i,
  /source-listed/i,
  /public images/i,
  /source-backed concept/i,
  /source-confirmed concept/i,
  /source config/i,
  /race source/i,
  /internal metadata/i,
  /uncertainties/i
];

const args = new Set(process.argv.slice(2));
const live = args.has('--live');

if (import.meta.url === `file://${process.argv[1]}`) {
  run({ live }).catch((error) => {
    console.error(error?.stack || error?.message || String(error));
    process.exit(1);
  });
}

export async function run({ rootDir = root, quiet = false, configs: providedConfigs = null, live = false, publicBaseUrl = DEFAULT_PUBLIC_BASE_URL, fetchImpl = globalThis.fetch } = {}) {
  const configs = providedConfigs
    ? providedConfigs.map((config, index) => ({ file: path.resolve(rootDir, `inline-private-mockup-${index + 1}.json`), config }))
    : await privateMockupConfigs(path.resolve(rootDir, 'src/data/private-mockups'));
  const errors = [];
  const warnings = [];
  const mockups = [];

  for (const { file, config } of configs) {
    const record = await validateMockup({ config, file, rootDir, live, publicBaseUrl, fetchImpl, errors, warnings });
    mockups.push(record);
  }

  const manifest = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    public_base_url: publicBaseUrl,
    live_smoke_enabled: live,
    summary: {
      mockups: mockups.length,
      approved_to_send: mockups.filter((mockup) => mockup.send_status === 'approved_to_send').length,
      sent: mockups.filter((mockup) => SENT_STATUSES.has(mockup.send_status)).length,
      held: mockups.filter((mockup) => mockup.is_held).length,
      live_smoked: mockups.filter((mockup) => mockup.production_smoke?.checked).length,
      errors: errors.length,
      warnings: warnings.length
    },
    mockups,
    errors,
    warnings
  };

  const outputPath = path.resolve(rootDir, 'dist/private/mockup-presend-outreach-gate.json');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);

  if (!quiet) {
    console.log(`✓ Wrote ${path.relative(rootDir, outputPath)}`);
    console.log(`  Mockups: ${manifest.summary.mockups}`);
    console.log(`  Approved to send: ${manifest.summary.approved_to_send}`);
    console.log(`  Sent: ${manifest.summary.sent}`);
    console.log(`  Held: ${manifest.summary.held}`);
    if (live) console.log(`  Production smoked: ${manifest.summary.live_smoked}`);
  }

  if (errors.length) {
    if (!quiet) for (const error of errors) console.error(`✗ ${error}`);
    throw new Error('Private mockup pre-send outreach gate failed.');
  }
  if (!quiet) console.log('✓ Private mockup pre-send outreach gate passed.');
  return { manifest, outPath: outputPath, errors, warnings };
}

async function validateMockup({ config, file, rootDir, live, publicBaseUrl, fetchImpl, errors, warnings }) {
  const privateMockup = config.private_mockup || {};
  const outreach = privateMockup.outreach || {};
  const sendStatus = outreach.send_status || (outreach.hold === true ? 'hold' : 'not_requested');
  const isHeld = HOLD_STATUSES.has(sendStatus) || outreach.hold === true;
  const isSent = SENT_STATUSES.has(sendStatus);
  const sendRequested = SEND_STATUSES.has(sendStatus);
  const displayFile = path.relative(rootDir, file);
  const productionUrl = outreach.production_url || buildProductionUrl(publicBaseUrl, privateMockup.route);
  const contact = outreach.contact || firstContact(privateMockup.contact_sources);
  const sentRecords = sentHistory(outreach);
  const record = {
    file: displayFile,
    route: privateMockup.route || '',
    production_url: productionUrl,
    race_name: config.identity?.name || '',
    send_status: sendStatus,
    is_held: isHeld,
    steve_approval_status: outreach.steve_approval?.status || '',
    contact: summarizeContact(contact),
    duplicate_outreach_record_count: sentRecords.length,
    production_smoke: { checked: false }
  };

  if (isHeld) {
    if (!outreach.hold_reason && !outreach.steve_approval?.note) {
      errors.push(`${displayFile}: held mockup must record hold_reason or Steve hold note.`);
    }
    if (sendRequested) {
      errors.push(`${displayFile}: held mockup cannot also be approved/sent for outreach.`);
    }
  }

  if (sentRecords.length > 1) {
    errors.push(`${displayFile}: duplicate outreach send records detected (${sentRecords.length}); verify no duplicate outreach rows before sending.`);
  }

  if (isSent && sentRecords.length === 0) {
    errors.push(`${displayFile}: sent outreach status must include sent_at or a sent history record.`);
  }

  if (sendRequested) {
    validateSendApproval({ outreach, displayFile, errors });
    validateContact({ contact, displayFile, errors });
    if (!productionUrl) errors.push(`${displayFile}: approved outreach must have a production_url or private_mockup.route.`);
    if (live) record.production_smoke = await smokeProductionUrl({ url: productionUrl, displayFile, fetchImpl, errors });
    else warnings.push(`${displayFile}: approved/sent outreach has not run live production smoke in this gate; rerun with --live immediately before sending.`);
  }

  return record;
}

function validateSendApproval({ outreach, displayFile, errors }) {
  const approval = outreach.steve_approval || {};
  if (approval.status !== 'approved') {
    errors.push(`${displayFile}: outreach send requires private_mockup.outreach.steve_approval.status = "approved".`);
  }
  if (!approval.approved_at) {
    errors.push(`${displayFile}: outreach send requires Steve approval timestamp in private_mockup.outreach.steve_approval.approved_at.`);
  }
  if (!approval.channel) {
    errors.push(`${displayFile}: outreach send requires approval channel evidence in private_mockup.outreach.steve_approval.channel.`);
  }
}

function validateContact({ contact, displayFile, errors }) {
  if (!contact) {
    errors.push(`${displayFile}: outreach send requires an official routing/direct email contact.`);
    return;
  }
  const type = contact.type || '';
  const status = contact.status || '';
  const value = contact.value || contact.email || contact.value_masked || '';
  if (!EMAIL_CONTACT_TYPES.has(type)) {
    errors.push(`${displayFile}: outreach contact must be direct/routing email, not ${type || 'missing contact type'}.`);
  }
  if (!ELIGIBLE_CONTACT_STATUSES.has(status)) {
    errors.push(`${displayFile}: outreach contact status is not eligible for send (${status || 'missing status'}).`);
  }
  if (!value) errors.push(`${displayFile}: outreach contact must include email value or masked on-file value.`);
  if (!contact.source_url && !contact.url && !contact.source) {
    errors.push(`${displayFile}: outreach contact must include source_url/url/source evidence.`);
  }
}

async function smokeProductionUrl({ url, displayFile, fetchImpl, errors }) {
  const smoke = { checked: true, url, status: null, noindex_meta: false, x_robots_noindex: false, forbidden_visible_terms: [] };
  if (!fetchImpl) {
    errors.push(`${displayFile}: live smoke requested but fetch is unavailable.`);
    return smoke;
  }
  try {
    const response = await fetchImpl(url, { redirect: 'follow' });
    smoke.status = response.status;
    const html = await response.text();
    const header = response.headers?.get?.('x-robots-tag') || '';
    smoke.noindex_meta = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
    smoke.x_robots_noindex = /noindex/i.test(header);
    const visible = visibleText(html);
    smoke.forbidden_visible_terms = FORBIDDEN_VISIBLE_TERMS.filter((pattern) => pattern.test(visible)).map((pattern) => pattern.source);
    if (response.status !== 200) errors.push(`${displayFile}: production URL returned HTTP ${response.status}.`);
    if (!smoke.noindex_meta) errors.push(`${displayFile}: production URL is missing robots noindex meta.`);
    if (!smoke.x_robots_noindex) errors.push(`${displayFile}: production URL is missing X-Robots-Tag noindex header.`);
    for (const term of smoke.forbidden_visible_terms) {
      errors.push(`${displayFile}: production visible text contains forbidden internal/provenance term /${term}/.`);
    }
  } catch (error) {
    smoke.error = error?.message || String(error);
    errors.push(`${displayFile}: production URL smoke failed: ${smoke.error}`);
  }
  return smoke;
}

async function privateMockupConfigs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const configs = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const file = path.join(dir, entry.name);
    configs.push({ file, config: JSON.parse(await readFile(file, 'utf8')) });
  }
  return configs.sort((a, b) => a.file.localeCompare(b.file));
}

function buildProductionUrl(publicBaseUrl, route) {
  if (!route) return '';
  return new URL(route, publicBaseUrl).toString();
}

function firstContact(contacts) {
  if (!Array.isArray(contacts)) return null;
  return contacts.find((contact) => EMAIL_CONTACT_TYPES.has(contact?.type) && ELIGIBLE_CONTACT_STATUSES.has(contact?.status)) || contacts[0] || null;
}

function sentHistory(outreach) {
  const records = [];
  if (outreach.sent_at) records.push({ sent_at: outreach.sent_at });
  if (Array.isArray(outreach.history)) {
    records.push(...outreach.history.filter((entry) => entry?.status === 'sent' || (!entry?.status && entry?.sent_at)));
  }
  const seen = new Set();
  return records.filter((entry) => {
    const key = entry?.sent_at || entry?.provider_id || JSON.stringify(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarizeContact(contact) {
  if (!contact) return null;
  return {
    type: contact.type || '',
    status: contact.status || '',
    value_present: Boolean(contact.value || contact.email || contact.value_masked),
    source_present: Boolean(contact.source_url || contact.url || contact.source)
  };
}

function visibleText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}
