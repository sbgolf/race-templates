import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const css = readFileSync(join(repoRoot, 'src/templates/performance/styles/tokens.css'), 'utf8');
const nav = readFileSync(join(repoRoot, 'src/templates/performance/components/Nav.astro'), 'utf8');
const template = readFileSync(join(repoRoot, 'src/templates/performance/components/PerformanceTemplate.astro'), 'utf8');

const checks = [
  ['html/body horizontal overflow guard', /html\{[^}]*overflow-x:hidden/.test(css) && /body\{[^}]*overflow-x:hidden/.test(css)],
  ['desktop nav collision breakpoint', /@media\(max-width:1120px\) and \(min-width:901px\)/.test(css) && /\.nav-links a\.nav-optional\{display:none\}/.test(css)],
  ['nav CTA clamps long labels', /\.nav-cta\{[^}]*max-width:clamp/.test(css) && /text-overflow:ellipsis/.test(css)],
  ['mobile nav CTA resets to full width', /@media\(max-width:900px\)[\s\S]*\.nav-links \.btn\{[^}]*max-width:100%/.test(css)],
  ['mobile hero CTA stacks full width', /@media\(max-width:560px\)[\s\S]*\.hero-cta\{[^}]*flex-direction:column/.test(css) && /\.hero-cta \.btn\{width:100%\}/.test(css)],
  ['pace table scrolls instead of overflowing viewport', /\.pace-table\{[^}]*overflow-x:auto/.test(css) && /\.pace-row\{[^}]*min-width:360px/.test(css)],
  ['hamburger exposes expanded state', /aria-expanded="false"/.test(nav) && /setAttribute\('aria-expanded',String\(isOpen\)\)/.test(template)],
];

const failures = checks.filter(([, pass]) => !pass).map(([name]) => name);

if (failures.length) {
  console.error('Performance layout guard checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Performance layout guard checks passed (${checks.length}/${checks.length}).`);
