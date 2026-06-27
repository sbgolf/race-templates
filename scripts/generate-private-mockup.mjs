#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`Usage: npm run mockup:private -- --url https://race-site.example [--slug race-slug] [--template community] [--token 32-hex-token]

Generates a private/noindex StartLine concept preview config.
Access URLs are always tokenized: /private/mockups/<32+ hex chars>/
If --token is omitted, a cryptographically random 128-bit token is generated.`);
  process.exit(0);
}

if (!args.url) {
  console.error('Usage: npm run mockup:private -- --url https://race-site.example [--slug race-slug] [--template community] [--token 32-hex-token]');
  process.exit(1);
}

const sourceUrl = new URL(args.url).toString();
const template = args.template || 'community';
if (template !== 'community') {
  console.error('Private mockup generation currently supports the community template only.');
  process.exit(1);
}

const userAgent = 'StartLine private mockup generator (+https://startline.example; public preview capture)';
const capturedAt = new Date().toISOString();
const page = await fetchText(sourceUrl);
const facts = extractFacts(page, sourceUrl);
const slug = sanitizeSlug(args.slug || facts.name || new URL(sourceUrl).hostname.replace(/^www\./, ''));
const token = args.token || generateAccessToken();
if (!isValidAccessToken(token)) {
  console.error('Private mockup tokens must be at least 128 bits of entropy encoded as 32+ hex characters. Omit --token to generate one safely.');
  process.exit(1);
}

const samplePath = path.join(root, 'src/data/samples/hartwell-half.json');
const sample = JSON.parse(await readFile(samplePath, 'utf8'));
const assets = await captureImages(facts.images, token);
const config = buildConfig(sample, facts, assets, { sourceUrl, capturedAt, slug, token, template });

const outDir = path.join(root, 'src/data/private-mockups');
await mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, `${slug}.json`);
await writeFile(outPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Private mockup config written: ${path.relative(root, outPath)}`);
console.log(`Private preview route: /private/mockups/${token}/`);
console.log(`Private access token: ${token}`);
console.log(`Captured public images: ${assets.length}`);
assets.forEach((asset) => console.log(`- ${asset.src} (${asset.source})`));

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--url') parsed.url = argv[++i];
    else if (arg === '--slug') parsed.slug = argv[++i];
    else if (arg === '--template') parsed.template = argv[++i];
    else if (arg === '--token') parsed.token = argv[++i];
    else if (arg === '--help' || arg === '-h') parsed.help = true;
  }
  return parsed;
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml' } });
  if (!response.ok) throw new Error(`Unable to fetch ${url}: ${response.status} ${response.statusText}`);
  return response.text();
}

function extractFacts(html, baseUrl) {
  const jsonLd = extractJsonLd(html).find((item) => String(item?.['@type'] || '').toLowerCase().includes('event')) || {};
  const title = decode(meta(html, 'property', 'og:title') || meta(html, 'name', 'twitter:title') || tagText(html, 'title') || 'Race Preview');
  const h1 = decode(tagText(html, 'h1') || '');
  const description = decode(meta(html, 'name', 'description') || meta(html, 'property', 'og:description') || jsonLd.description || 'A private StartLine concept preview generated from public race information.');
  const imageUrls = [
    meta(html, 'property', 'og:image'),
    meta(html, 'name', 'twitter:image'),
    ...Array.from(html.matchAll(/<img\b[^>]*?src=["']([^"']+)["'][^>]*>/gi)).map((match) => match[1])
  ].filter(Boolean).map((src) => safeResolve(src, baseUrl)).filter(Boolean);
  const titleName = cleanTitle(title);
  const name = /\b(race|marathon|half|10k|5k|ultra|trail|run)\b/i.test(h1) ? h1 : titleName;
  const eventDate = normalizeDate(jsonLd.startDate) || nextYearDate();
  const location = normalizeLocation(jsonLd.location) || new URL(baseUrl).hostname.replace(/^www\./, '');
  return { name, title, description, eventDate, location, images: unique(imageUrls).slice(0, 12) };
}

function extractJsonLd(html) {
  return Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).flatMap((match) => {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.['@graph'])) return parsed['@graph'];
      return [parsed];
    } catch {
      return [];
    }
  });
}

function meta(html, attr, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escaped}["'][^>]*>`, 'i');
  const match = html.match(re);
  return match?.[1] || match?.[2] || '';
}

function tagText(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'));
  return match ? match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function decode(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function cleanTitle(title) {
  return String(title).split(/ [|–-] /)[0].trim() || 'Race Preview';
}

function safeResolve(src, baseUrl) {
  try {
    const resolved = new URL(src, baseUrl);
    if (!/^https?:$/.test(resolved.protocol)) return null;
    return resolved.toString();
  } catch {
    return null;
  }
}

async function captureImages(urls, assetNamespace) {
  const assets = [];
  const assetDir = path.join(root, 'public/mockups', assetNamespace);
  await mkdir(assetDir, { recursive: true });

  for (const url of urls) {
    if (assets.length >= 2) break;
    if (!/\.(jpe?g|png|webp)(\?|#|$)/i.test(url)) continue;
    try {
      const response = await fetch(url, { headers: { 'user-agent': userAgent, accept: 'image/avif,image/webp,image/png,image/jpeg,*/*' } });
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') || '';
      if (!/^image\/(jpeg|png|webp)/i.test(contentType)) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 6000 || bytes.length > 5_000_000) continue;
      const ext = extensionFor(contentType, url);
      const name = `${assets.length + 1}-${createHash('sha1').update(url).digest('hex').slice(0, 10)}.${ext}`;
      await writeFile(path.join(assetDir, name), bytes);
      assets.push({ src: `/mockups/${assetNamespace}/${name}`, alt: `Public image captured from ${new URL(url).hostname}`, caption: assets.length === 0 ? 'Public race-site image used for concept direction.' : 'Additional public race-site visual reference.', source: url });
    } catch {
      // Keep generation resilient; missing/blocked images should fall back to illustrated placeholders.
    }
  }
  return assets;
}

function extensionFor(contentType, url) {
  if (/webp/i.test(contentType)) return 'webp';
  if (/png/i.test(contentType)) return 'png';
  const match = new URL(url).pathname.match(/\.([a-z0-9]+)$/i);
  return match && /jpe?g/i.test(match[1]) ? match[1].toLowerCase() : 'jpg';
}

function buildConfig(sample, facts, assets, metaInfo) {
  const featured = sample.distances[0];
  const description = truncate(facts.description, 165);
  return {
    ...sample,
    identity: {
      ...sample.identity,
      template: metaInfo.template,
      name: facts.name,
      tagline: facts.name,
      edition: 'Private StartLine concept',
      hero_image: assets[0] ? { src: assets[0].src, alt: assets[0].alt, source: assets[0].source } : sample.identity.hero_image
    },
    event: { ...sample.event, date: facts.eventDate, location: facts.location, venue: facts.location },
    organization: { name: facts.name },
    stats: [
      { value: 'Concept', label: 'Private Preview' },
      { value: String(sample.distances.length), label: 'Sample Distances' },
      { value: 'Noindex', label: 'Search Robots' },
      { value: assets.length ? `${assets.length}` : '0', label: 'Public Images' }
    ],
    distances: sample.distances.map((distance) => distance.id === featured.id ? { ...distance, featured: true } : { ...distance, featured: false }),
    registration: { url: metaInfo.sourceUrl, platform: 'other', cta_label: 'Visit current race site', opens: sample.registration.opens },
    seo: { meta_title: `${facts.name} — Private StartLine Concept`, meta_description: description },
    analytics: undefined,
    private_mockup: {
      generated: true,
      noindex: true,
      source_url: metaInfo.sourceUrl,
      captured_at: metaInfo.capturedAt,
      access_token: metaInfo.token,
      race_slug: metaInfo.slug,
      route: `/private/mockups/${metaInfo.token}/`,
      template: metaInfo.template,
      assets,
      notes: 'Generated from public page metadata and public image URLs. Replace placeholder race details during customer-specific production.'
    }
  };
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function normalizeLocation(location) {
  if (typeof location === 'string') return location;
  const address = location?.address;
  if (typeof address === 'string') return address;
  return [address?.addressLocality, address?.addressRegion].filter(Boolean).join(', ') || '';
}

function nextYearDate() {
  const now = new Date();
  return `${now.getUTCFullYear() + 1}-05-18`;
}

function sanitizeSlug(value) {
  return String(value || 'race-preview').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'race-preview';
}

function generateAccessToken() {
  return randomBytes(16).toString('hex');
}

function isValidAccessToken(value) {
  return /^[a-f0-9]{32,}$/i.test(String(value || ''));
}

function unique(values) {
  return [...new Set(values)];
}

function truncate(value, max) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}
