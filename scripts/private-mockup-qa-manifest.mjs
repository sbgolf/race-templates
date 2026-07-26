#!/usr/bin/env node
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const DEFAULT_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const REQUIRED_SCREENSHOTS = [
  { id: 'mobile', width: 390, height: 1200, minBytes: 15_000 },
  { id: 'desktop', width: 1440, height: 1200, minBytes: 25_000 }
];
const PLACEHOLDER_VISUAL_PATTERNS = [
  /placeholder/i,
  /sample(?:-|_)?only/i,
  /\/samples?\//i,
  /inline-svg/i,
  /lorem/i,
  /blank(?:-|_)?image/i,
  /todo/i,
  /\bTBD\b/i,
  /\bTBA\b/i
];
const IMAGE_EXTENSIONS = /\.(?:png|jpe?g|webp|gif|svg|avif)(?:[?#].*)?$/i;
const DEFAULT_ROOT = process.cwd();

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().catch((error) => {
    console.error(error?.stack || error?.message || String(error));
    process.exit(1);
  });
}

export async function runCli(argv = process.argv.slice(2), options = {}) {
  const root = options.root || DEFAULT_ROOT;
  const cli = parseArgs(argv);
  const result = await generatePrivateMockupQaManifest({
    root,
    capture: cli.capture,
    chromePath: cli.chromePath || process.env.CHROME_PATH || DEFAULT_CHROME_PATH,
    failOnMissingScreenshots: cli.failOnMissingScreenshots,
    quiet: cli.quiet
  });

  if (!cli.quiet) {
    console.log(`✓ Wrote ${path.relative(root, result.manifestPath)}`);
    console.log(`  Mockups: ${result.manifest.summary.total}`);
    console.log(`  Screenshots: ${result.manifest.summary.screenshot_records}/${result.manifest.summary.required_screenshot_records}`);
  }

  if (result.errors.length) {
    for (const error of result.errors) console.error(`✗ ${error}`);
    throw new Error('Private mockup QA manifest gate failed.');
  }

  if (!cli.quiet) console.log('✓ Private mockup QA manifest gate passed.');
  return result;
}

export async function generatePrivateMockupQaManifest({
  root = DEFAULT_ROOT,
  capture = 'auto',
  chromePath = DEFAULT_CHROME_PATH,
  failOnMissingScreenshots = true,
  quiet = false
} = {}) {
  const distDir = path.resolve(root, 'dist');
  const privateDir = path.join(distDir, 'private/mockups');
  const screenshotRoot = path.join(distDir, 'private/mockup-qa-screenshots');
  const manifestPath = path.join(distDir, 'private/mockup-qa-manifest.json');
  const mockups = await renderedMockups(privateDir);
  const configByToken = await privateMockupConfigByToken(path.resolve(root, 'src/data/private-mockups'), root);
  for (const mockup of mockups) {
    mockup.config = configByToken.get(mockup.token) || null;
    mockup.full_qa_required = mockup.config?.private_mockup?.owner_approved_for_generation === true;
  }
  const errors = [];
  const warnings = [];

  if (!mockups.length) {
    const manifest = buildManifest({ root, mockups: [], errors: [], warnings: [], screenshotRoot, captured: false });
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    return { manifest, manifestPath, errors: [] };
  }

  let server;
  let baseUrl;
  let captured = false;
  const canCapture = capture !== 'never' && existsSync(chromePath);
  if (capture === 'always' && !canCapture) {
    errors.push(`Chrome is required for screenshot capture but was not found at ${chromePath}. Set CHROME_PATH or run with --no-capture after adding screenshot records.`);
  }

  try {
    if (canCapture) {
      ({ server, baseUrl } = await startStaticServer(distDir));
      await mkdir(screenshotRoot, { recursive: true });
      for (const mockup of mockups) {
        await captureRequiredScreenshots({ chromePath, baseUrl, mockup, screenshotRoot, errors, quiet });
      }
      captured = true;
    }

    for (const mockup of mockups) {
      const html = await readFile(mockup.indexPath, 'utf8');
      mockup.title = pageTitle(html);
      mockup.image_references = await validateRenderedImageReferences({ html, distDir, mockup, errors, warnings });
      mockup.visual_readiness = validateVisualReadiness({ html, mockup, imageReferences: mockup.image_references, errors, warnings });
      mockup.screenshots = await screenshotRecords({ root, screenshotRoot, mockup, failOnMissingScreenshots, errors });
    }
  } finally {
    if (server) await closeServer(server);
  }

  const manifest = buildManifest({ root, mockups, errors, warnings, screenshotRoot, captured });
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, manifestPath, errors };
}

function parseArgs(argv) {
  let capture = 'auto';
  let failOnMissingScreenshots = true;
  let chromePath = '';
  let quiet = false;
  for (const arg of argv) {
    if (arg === '--capture' || arg === '--capture=always') capture = 'always';
    else if (arg === '--capture=auto') capture = 'auto';
    else if (arg === '--no-capture' || arg === '--capture=never') capture = 'never';
    else if (arg === '--allow-missing-screenshots') failOnMissingScreenshots = false;
    else if (arg === '--quiet') quiet = true;
    else if (arg.startsWith('--chrome=')) chromePath = arg.slice('--chrome='.length);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return { capture, failOnMissingScreenshots, chromePath, quiet };
}

async function renderedMockups(privateDir) {
  try {
    const entries = await readdir(privateDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({ token: entry.name, route: `/private/mockups/${entry.name}/`, indexPath: path.join(privateDir, entry.name, 'index.html') }))
      .filter((mockup) => existsSync(mockup.indexPath))
      .sort((a, b) => a.token.localeCompare(b.token));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function privateMockupConfigByToken(configDir, root = DEFAULT_ROOT) {
  const configs = new Map();
  try {
    const entries = await readdir(configDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      try {
        const filePath = path.join(configDir, entry.name);
        const config = JSON.parse(await readFile(filePath, 'utf8'));
        const token = config?.private_mockup?.access_token;
        if (token) configs.set(token, { ...config, _file: path.relative(root, filePath) });
      } catch {
        // Config syntax errors are handled by validate:private-mockups.
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return configs;
}

async function validateRenderedImageReferences({ html, distDir, mockup, errors, warnings }) {
  const issue = mockup.full_qa_required ? errors : warnings;
  const refs = extractImageReferences(html);
  if (!refs.length) {
    issue.push(`${mockup.route}: no rendered image references found; customer-ready private mockups must have at least one visual.`);
  }

  const records = [];
  for (const ref of refs) {
    const record = { ...ref, status: 'unchecked' };
    const source = ref.url;
    if (/^(?:https?:)?\/\//i.test(source) || /^data:/i.test(source)) {
      record.status = 'external';
    } else {
      const filePath = resolveDistAsset(source, distDir, mockup.indexPath);
      record.dist_path = path.relative(distDir, filePath);
      try {
        const fileStat = await stat(filePath);
        record.status = 'ok';
        record.bytes = fileStat.size;
        if (fileStat.size < 1000) {
          issue.push(`${mockup.route}: image reference ${source} resolves to a very small file (${fileStat.size} bytes).`);
        }
      } catch {
        record.status = 'missing';
        issue.push(`${mockup.route}: rendered image reference is missing from dist: ${source}`);
      }
    }

    if (PLACEHOLDER_VISUAL_PATTERNS.some((pattern) => pattern.test(`${source} ${ref.alt || ''}`))) {
      record.placeholder_like = true;
      issue.push(`${mockup.route}: rendered visual looks placeholder-like: ${source}`);
    }
    records.push(record);
  }
  return records;
}

function validateVisualReadiness({ html, mockup, imageReferences, errors, warnings }) {
  const issue = mockup.full_qa_required ? errors : warnings;
  const text = visibleText(html);
  const markers = {
    has_viewport_meta: /<meta\b[^>]*name=["']viewport["'][^>]*width=device-width/i.test(html),
    has_noindex: /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html),
    has_customer_visual: imageReferences.some((ref) => ref.status === 'ok' || ref.status === 'external'),
    has_hero_or_visual_copy: /\b(?:hero|photo|gallery|course|map|race day|runners?|visual)\b/i.test(`${html} ${text}`),
    has_placeholder_copy: PLACEHOLDER_VISUAL_PATTERNS.some((pattern) => pattern.test(text))
  };
  if (!markers.has_viewport_meta) issue.push(`${mockup.route}: missing mobile viewport meta for visual QA.`);
  if (!markers.has_noindex) issue.push(`${mockup.route}: missing noindex robots meta.`);
  if (!markers.has_customer_visual) issue.push(`${mockup.route}: missing a resolvable rendered visual asset.`);
  if (!markers.has_hero_or_visual_copy) issue.push(`${mockup.route}: missing obvious visual/course/gallery/hero section cues.`);
  if (markers.has_placeholder_copy) issue.push(`${mockup.route}: visible copy includes placeholder-like visual readiness language.`);
  return markers;
}

async function screenshotRecords({ root, screenshotRoot, mockup, failOnMissingScreenshots, errors }) {
  const records = [];
  for (const spec of REQUIRED_SCREENSHOTS) {
    const screenshotPath = screenshotPathFor(screenshotRoot, mockup.token, spec.id);
    const record = {
      id: spec.id,
      viewport: { width: spec.width, height: spec.height },
      path: path.relative(root, screenshotPath),
      min_bytes: spec.minBytes
    };
    try {
      const fileStat = await stat(screenshotPath);
      record.bytes = fileStat.size;
      record.status = fileStat.size >= spec.minBytes ? 'ok' : 'too_small';
      if (fileStat.size < spec.minBytes) {
        errors.push(`${mockup.route}: ${spec.id} screenshot is too small (${fileStat.size} bytes; expected at least ${spec.minBytes}).`);
      }
    } catch {
      record.status = 'missing';
      if (failOnMissingScreenshots) errors.push(`${mockup.route}: missing required ${spec.id} screenshot record at ${record.path}.`);
    }
    records.push(record);
  }
  return records;
}

async function captureRequiredScreenshots({ chromePath, baseUrl, mockup, screenshotRoot, errors, quiet }) {
  await mkdir(path.join(screenshotRoot, mockup.token), { recursive: true });
  for (const spec of REQUIRED_SCREENSHOTS) {
    const outPath = screenshotPathFor(screenshotRoot, mockup.token, spec.id);
    const url = new URL(mockup.route, baseUrl).toString();
    if (!quiet) console.log(`  Capturing ${mockup.route} ${spec.id} (${spec.width}x${spec.height})`);
    try {
      await runChromeScreenshot({ chromePath, url, outPath, width: spec.width, height: spec.height });
    } catch (error) {
      errors.push(`${mockup.route}: Chrome failed to capture ${spec.id} screenshot: ${error.message}`);
    }
  }
}

function runChromeScreenshot({ chromePath, url, outPath, width, height }) {
  const userDataDir = path.join(os.tmpdir(), `race-template-chrome-${process.pid}-${Math.random().toString(16).slice(2)}`);
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    `--window-size=${width},${height}`,
    `--screenshot=${outPath}`,
    url
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(chromePath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    let settled = false;
    let pollTimer;
    let timeoutTimer;

    const cleanup = async () => {
      clearInterval(pollTimer);
      clearTimeout(timeoutTimer);
      if (!child.killed) child.kill('SIGKILL');
      await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    };

    const finish = async (error) => {
      if (settled) return;
      settled = true;
      await cleanup();
      if (error) reject(error);
      else resolve();
    };

    pollTimer = setInterval(async () => {
      try {
        const fileStat = await stat(outPath);
        if (fileStat.size > 0) await finish();
      } catch {
        // Keep waiting for Chrome to write the screenshot.
      }
    }, 500);

    timeoutTimer = setTimeout(() => {
      finish(new Error(`Chrome did not produce a screenshot within 15s${stderr ? `: ${stderr.trim().slice(0, 300)}` : ''}`));
    }, 15_000);

    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', finish);
    child.on('close', async (code) => {
      if (settled) return;
      try {
        const fileStat = await stat(outPath);
        if (fileStat.size > 0) return finish();
      } catch {
        // Fall through to the error below.
      }
      finish(new Error((stderr || `Chrome exited with code ${code}`).trim()));
    });
  });
}

function extractImageReferences(html) {
  const refs = [];
  for (const match of String(html || '').matchAll(/<img\b([^>]*)>/gi)) {
    const attrs = parseAttrs(match[1] || '');
    if (attrs.src) refs.push({ type: 'img', url: decodeHtml(attrs.src), alt: decodeHtml(attrs.alt || '') });
    for (const source of srcsetUrls(attrs.srcset)) refs.push({ type: 'img-srcset', url: source, alt: decodeHtml(attrs.alt || '') });
  }
  for (const match of String(html || '').matchAll(/<source\b([^>]*)>/gi)) {
    const attrs = parseAttrs(match[1] || '');
    for (const source of srcsetUrls(attrs.srcset)) refs.push({ type: 'source-srcset', url: source, alt: '' });
  }
  for (const match of String(html || '').matchAll(/url\((['"]?)([^'"()]+)\1\)/gi)) {
    const url = decodeHtml(match[2].trim());
    if (IMAGE_EXTENSIONS.test(url)) refs.push({ type: 'css-url', url, alt: '' });
  }
  return uniqueBy(refs, (ref) => `${ref.type}:${ref.url}`);
}

function srcsetUrls(srcset = '') {
  return String(srcset || '')
    .split(',')
    .map((part) => decodeHtml(part.trim().split(/\s+/)[0] || ''))
    .filter(Boolean);
}

function resolveDistAsset(source, distDir, htmlPath) {
  const clean = decodeURI(source.split(/[?#]/)[0]);
  if (clean.startsWith('/')) return path.join(distDir, clean.slice(1));
  return path.resolve(path.dirname(htmlPath), clean);
}

function buildManifest({ root, mockups, errors, warnings = [], screenshotRoot, captured }) {
  const screenshotRecords = mockups.flatMap((mockup) => mockup.screenshots || []);
  const okScreenshots = screenshotRecords.filter((record) => record.status === 'ok').length;
  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    source: 'dist/private/mockups',
    screenshot_root: path.relative(root, screenshotRoot),
    capture_attempted: captured,
    required_screenshots: REQUIRED_SCREENSHOTS.map((spec) => ({ id: spec.id, viewport: { width: spec.width, height: spec.height }, min_bytes: spec.minBytes })),
    summary: {
      total: mockups.length,
      passing: mockups.filter((mockup) => mockupIsPassing(mockup)).length,
      failing: mockups.filter((mockup) => !mockupIsPassing(mockup)).length,
      image_references: mockups.reduce((sum, mockup) => sum + (mockup.image_references?.length || 0), 0),
      screenshot_records: okScreenshots,
      required_screenshot_records: mockups.length * REQUIRED_SCREENSHOTS.length,
      errors: errors.length,
      warnings: warnings.length
    },
    mockups: mockups.map((mockup) => ({
      route: mockup.route,
      title: mockup.title || '',
      config_file: mockup.config?._file || '',
      full_qa_required: mockup.full_qa_required === true,
      image_references: mockup.image_references || [],
      visual_readiness: mockup.visual_readiness || {},
      screenshots: mockup.screenshots || [],
      ready: mockupIsPassing(mockup)
    })),
    errors,
    warnings
  };
}

function mockupIsPassing(mockup) {
  const refs = mockup.image_references || [];
  const screenshots = mockup.screenshots || [];
  const visual = mockup.visual_readiness || {};
  return refs.length > 0
    && refs.every((ref) => !['missing'].includes(ref.status) && !ref.placeholder_like)
    && screenshots.length === REQUIRED_SCREENSHOTS.length
    && screenshots.every((record) => record.status === 'ok')
    && visual.has_viewport_meta === true
    && visual.has_noindex === true
    && visual.has_customer_visual === true
    && visual.has_placeholder_copy === false;
}

function screenshotPathFor(root, token, id) {
  return path.join(root, token, `${id}.png`);
}

async function startStaticServer(distDir) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      let filePath = path.join(distDir, pathname.replace(/^\/+/, ''));
      if (pathname.endsWith('/')) filePath = path.join(filePath, 'index.html');
      const relative = path.relative(distDir, filePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        res.writeHead(403); res.end('Forbidden'); return;
      }
      const body = await readFile(filePath);
      res.writeHead(200, { 'content-type': contentType(filePath) });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('Not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}/` };
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

function parseAttrs(source) {
  const attrs = {};
  for (const match of String(source || '').matchAll(/([:\w-]+)(?:=("[^"]*"|'[^']*'|[^\s"'>]+))?/g)) {
    const [, key, rawValue = ''] = match;
    attrs[key] = decodeHtml(rawValue.replace(/^['"]|['"]$/g, ''));
  }
  return attrs;
}

function pageTitle(html) {
  return decodeHtml(String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
}

function visibleText(html) {
  return decodeHtml(String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function uniqueBy(items, keyFor) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = keyFor(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}
