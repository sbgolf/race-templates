#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const privateDir = path.resolve(root, 'dist/private/mockups');
const rawVisibleUrlPattern = /\b(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|org|net|io|gov|edu)\b)/i;
const punctuationArtifactPatterns = [
  /\b20\d{2}\s+\./,
  /\b\d+\s+hours?\s+\./i,
  /\b[A-Z]{2}\d{5}[A-Z]{2}\s+\./,
  /\)\s+\./,
  /\b\d+(?:st|nd|rd|th)?\s*-\$/i
];

let failed = false;
const files = await renderedPrivateMockupFiles();

if (!files.length) {
  console.log('✓ No rendered private mockup pages found. Run npm run build first to scan rendered visible text.');
  process.exit(0);
}

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const text = visibleText(html);
  const errors = [];
  if (rawVisibleUrlPattern.test(text)) errors.push('Rendered visible text exposes a raw URL or bare domain.');
  for (const pattern of punctuationArtifactPatterns) {
    if (pattern.test(text)) errors.push(`Rendered visible text contains punctuation/spacing artifact "${pattern.source}".`);
  }

  const relative = path.relative(root, file);
  if (errors.length) {
    failed = true;
    console.error(`✗ ${relative}`);
    errors.forEach((error) => console.error(`  - ${error}`));
  } else {
    console.log(`✓ ${relative}`);
  }
}

if (failed) process.exit(1);

async function renderedPrivateMockupFiles() {
  try {
    const tokens = await readdir(privateDir, { withFileTypes: true });
    return tokens
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(privateDir, entry.name, 'index.html'))
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function visibleText(html) {
  return String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}
