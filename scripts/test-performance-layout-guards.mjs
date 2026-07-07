import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const css = readFileSync(join(repoRoot, 'src/templates/performance/styles/tokens.css'), 'utf8');
const nav = readFileSync(join(repoRoot, 'src/templates/performance/components/Nav.astro'), 'utf8');
const template = readFileSync(join(repoRoot, 'src/templates/performance/components/PerformanceTemplate.astro'), 'utf8');
const checklist = readFileSync(join(repoRoot, 'src/templates/performance/components/RunnerDecisionChecklist.astro'), 'utf8');
const trustBand = readFileSync(join(repoRoot, 'src/templates/performance/components/TrustSignalsBand.astro'), 'utf8');
const registrationDecision = readFileSync(join(repoRoot, 'src/templates/performance/components/RegistrationDecisionCard.astro'), 'utf8');
const gallery = readFileSync(join(repoRoot, 'src/templates/performance/components/Gallery.astro'), 'utf8');

const checks = [
  ['html/body horizontal overflow guard', /html\{[^}]*overflow-x:hidden/.test(css) && /body\{[^}]*overflow-x:hidden/.test(css)],
  ['hero decorative overflow is clipped from layout QA', /\.hero\{[\s\S]*overflow:hidden;contain:paint/.test(css) && /\.hero::before\{[\s\S]*right:0/.test(css)],
  ['desktop nav collision breakpoint', /@media\(max-width:1120px\) and \(min-width:901px\)/.test(css) && /\.nav-links a\.nav-optional\{display:none\}/.test(css)],
  ['nav CTA clamps long labels', /\.nav-cta\{[^}]*max-width:clamp/.test(css) && /text-overflow:ellipsis/.test(css)],
  ['mobile nav CTA resets to full width', /@media\(max-width:900px\)[\s\S]*\.nav-links \.btn\{[^}]*max-width:100%/.test(css)],
  ['mobile hero CTA stacks full width', /@media\(max-width:560px\)[\s\S]*\.hero-cta\{[^}]*flex-direction:column/.test(css) && /\.hero-cta \.btn\{width:100%\}/.test(css)],
  ['pace table scrolls instead of overflowing viewport', /\.pace-table\{[^}]*overflow-x:auto/.test(css) && /\.pace-row\{[^}]*min-width:360px/.test(css)],
  ['hamburger exposes expanded state', /aria-expanded="false"/.test(nav) && /setAttribute\('aria-expanded',String\(isOpen\)\)/.test(template)],
  ['performance private modules use runner-facing labels', !/Runner trust signals|Registration decision/.test(`${trustBand}\n${registrationDecision}`) && /Why runners trust this race faster/.test(trustBand) && /Clear path to registration/.test(registrationDecision)],
  ['performance checklist keeps one natural CTA handoff', !/runner-checklist-top/.test(checklist) && /runner-checklist-footer/.test(checklist)],
  ['performance registration decision follows trust proof before course content', template.indexOf('<TrustSignalsBand race={race} />') < template.indexOf('<RegistrationDecisionCard race={race} />') && template.indexOf('<RegistrationDecisionCard race={race} />') < template.indexOf('<Course race={race} />')],
  ['performance race day section renders proof cards instead of abstract placeholders only', /data-performance-race-day-proof/.test(gallery) && /proofItems/.test(gallery) && /Course certification/.test(gallery) && /On-course support/.test(gallery) && /Race-morning flow/.test(gallery)],
  ['performance race day proof grid has mobile-safe card layout', /\.race-day-proof\{[\s\S]*overflow:hidden/.test(css) && /@media\(max-width:560px\)[\s\S]*\.proof1,\.proof2,\.proof3,\.proof4\{grid-column:1\}/.test(css)],
];

const failures = checks.filter(([, pass]) => !pass).map(([name]) => name);

if (failures.length) {
  console.error('Performance layout guard checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Performance layout guard checks passed (${checks.length}/${checks.length}).`);
