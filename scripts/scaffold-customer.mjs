#!/usr/bin/env node
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const slug = process.argv[2];
const template = process.argv[3] || 'community';

if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('Usage: npm run scaffold:customer -- <customer-slug> [template-id]');
  console.error('Slug must be lowercase kebab-case, e.g. river-city-marathon.');
  process.exit(1);
}

const root = path.resolve(process.cwd(), 'customer-scaffolds', slug);
try {
  await access(root);
  console.error(`Refusing to overwrite existing scaffold: ${root}`);
  process.exit(1);
} catch {}

await mkdir(path.join(root, 'src', 'data'), { recursive: true });
await mkdir(path.join(root, 'src', 'pages'), { recursive: true });

const title = slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');

await writeFile(path.join(root, 'package.json'), `${JSON.stringify({
  name: slug,
  private: true,
  type: 'module',
  scripts: {
    dev: 'astro dev',
    build: 'astro build',
    'validate:config': 'node ./node_modules/race-templates/scripts/validate-config.mjs src/data/race-config.json',
    'launch:check': 'node ./node_modules/race-templates/scripts/launch-check.mjs src/data/race-config.json'
  },
  dependencies: {
    astro: 'latest',
    'race-templates': 'github:sbgolf/race-templates'
  }
}, null, 2)}\n`);

await writeFile(path.join(root, 'src', 'data', 'race-config.json'), `${JSON.stringify({
  identity: { template, name: title, tagline: 'Replace with customer-approved positioning.', edition: 'Annual', colors: { primary: '#1F6FEB', secondary: '#0F172A' } },
  event: { date: '2026-01-01', location: 'City, State', venue: 'Start/finish venue' },
  distances: [{ id: 'half', name: 'Half Marathon', distance: '13.1 mi', start_time: '7:00 AM', featured: true, price: '$75', highlights: ['Official timing', 'Finisher medal', 'Post-race celebration'] }],
  registration: { url: 'https://example.com/register', platform: 'other', cta_label: 'Register now' },
  schedule: [{ day: 'Race Day', name: 'Half Marathon Start', time: '7:00 AM', location: 'Start/finish venue', applies_to_distances: ['half'] }],
  seo: { meta_title: `${title} — Official Race Site`, meta_description: `Official race information and registration for ${title}.` },
  analytics: { ga4_measurement_id: 'G-XXXXXXXXXX', register_click_event_name: 'register_click' },
  contacts: { race_director_email: 'director@example.com' }
}, null, 2)}\n`);

await writeFile(path.join(root, 'src', 'pages', 'index.astro'), `---\nimport config from '../data/race-config.json';\nimport CommunityPreview from 'race-templates/src/templates/community/pages/CommunityPreview.astro';\nimport DestinationMajorPreview from 'race-templates/src/templates/destination-major/pages/DestinationMajorPreview.astro';\nimport PerformancePreview from 'race-templates/src/templates/performance/pages/PerformancePreview.astro';\nimport 'race-templates/src/templates/community/styles/community.css';\nimport 'race-templates/src/templates/destination-major/styles/destination-major.css';\nimport 'race-templates/src/templates/performance/styles/tokens.css';\nimport { ga4Snippet, registerClickListenerScript } from 'race-templates/src/shared/analytics/register-click.mjs';\nimport { sportsEventJsonLdScript } from 'race-templates/src/shared/schema/sports-event-jsonld.mjs';\nconst template = config.identity.template;\n---\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width\" />\n    <title>{config.seo.meta_title}</title>\n    <meta name=\"description\" content={config.seo.meta_description} />\n    <Fragment set:html={ga4Snippet(config)} />\n    {template === 'community' ? <Fragment set:html={sportsEventJsonLdScript(config)} /> : null}\n  </head>\n  <body>\n    {template === 'community' ? <CommunityPreview race={config} /> : template === 'performance' ? <PerformancePreview race={config} /> : <DestinationMajorPreview race={config} />}\n    <Fragment set:html={registerClickListenerScript()} />\n  </body>\n</html>\n`);

await writeFile(path.join(root, 'README.md'), `# ${title}\n\nThin customer repo scaffold generated from race-templates.\n\n## Next steps\n\n1. Replace \`src/data/race-config.json\` placeholders with customer-approved intake data.\n2. Add customer assets under \`public/\` as needed.\n3. Run \`npm install\`, \`npm run validate:config\`, \`npm run build\`, and \`npm run launch:check\`.\n4. Deploy staging preview for customer/Steve review before production.\n`);

console.log(`Created customer scaffold at ${root}`);
