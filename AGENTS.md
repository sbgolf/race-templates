# AGENTS.md — StartLine Race Templates

This repo is the reusable **StartLine Sites race-template library** (`sbgolf/race-templates`). It owns Astro templates, shared schema/config validation, sample race data, preview routes, and template standards for customer race sites.

## Required Skill

Before doing dev work in this repo, load and follow the Hermes skill:

- `race-templates`

Also load these when relevant:

- `tbd-race-websites-venture` for venture-wide template standards, production pipeline, and schema principles.
- `github-pr-workflow` for branch/PR/check/merge work.
- `requesting-code-review` for review-heavy changes.

## Core Principle

Build reusable, schema-driven template capability. Customer repos should stay thin and contain only config, assets, and deployment wiring. If a customer needs something new, extend the schema/template system for all relevant customers instead of forking one customer site.

## Non-Negotiables

- Branch + PR only. Do not merge to `main` without Steve's explicit approval.
- Schema-first: new template fields must be reflected in schema/docs, validator, sample data, and rendering.
- No customer-specific forks or hardcoded customer logic.
- Keep template archetypes parallel; do not force one archetype's visual system into another.
- Optional fields must hide gracefully when blank. No stray `TBD`, placeholder boxes, or awkward gaps unless intentionally configured.
- Every full-width section/wrapper must declare an explicit background.
- Meet the accessibility floor: WCAG 2.1 AA, labels, focus states, contrast, keyboard behavior, and mobile tap targets.
- Public demos/mockups use fictional/generic examples unless Steve approves real race/customer names or assets.
- No production/customer launch without Steve's explicit staging approval.

## Standard Commands

Use npm; this repo has `package-lock.json`.

```bash
npm run validate:config
npm run build
npm run launch:check
npm run preview
```

Run the commands that match the touched area. At minimum, template/schema changes should run `npm run validate:config` and `npm run build`. If `launch:check` needs a specific route, env, or deployment context, run the applicable variant or report the exact blocker.

## Canonical Repo Shape

Expected ownership boundaries:

- `src/templates/` — template archetypes such as destination-major, community, performance, trail, charity.
- `src/shared/schema/` — config schema and validators.
- `src/shared/transforms/` — shared data transforms.
- `src/shared/utils/` — reusable utilities.
- `src/data/samples/` — fictional/sample race configs.
- `src/pages/preview/` — preview routes for archetypes and private/internal mockups.
- `docs/` — schema, template standards, and governance docs.

## Template Standards

Applicable templates should include the relevant standard sections and behavior:

- Sticky nav with persistent Register CTA.
- Hero with race name, date, location, primary CTA, and countdown when relevant.
- Trust/stat bar when proof fields exist.
- Course visualization suited to the archetype.
- Distance details and pricing tiers.
- BQ/qualifying info when configured.
- Registration section with measurable CTA behavior.
- Race-day/logistics cards when data exists.
- Schedule, travel, sponsors, FAQ, final CTA, email capture, and footer when configured.
- schema.org `SportsEvent` structured data.
- SEO/OpenGraph metadata derived from config.

## Archetype Notes

- **Destination Major:** cinematic, scenic, premium, dark hero + editorial sections. Do not dilute it with Community/Performance tokens.
- **Community/Hometown:** warm, human, multi-distance, photo-forward, distance-picker oriented, volunteer-friendly.
- **Performance/BQ-coded:** cool digital race-clock energy, pace/split tooling, BQ/PR/records/field-cap proof.
- **Trail/Ultra/Adventure and Charity:** confirm current docs/specs/prototypes before implementation; add missing schema support before UI depends on it.

## Private Mockups

For existing-race previews or outreach mockups:

- Use an isolated branch/worktree unless Steve asks for committed work.
- Use public race data/assets only when appropriate and label uncertainties.
- Add `noindex,nofollow` for private mockups.
- Do not send local `127.0.0.1` URLs to prospects; use screenshots or a private/noindex staging URL.
- Never shame the current race site or imply guaranteed registration growth.

## Visual QA

For template work, check mobile and desktop behavior at practical widths: 375, 414, 768, 1024, and desktop. Confirm no horizontal overflow, explicit section backgrounds, CTA behavior, keyboard/focus states, and graceful handling of missing optional data.

## Definition of Done

A race-template task is done when:

1. The change is isolated on a branch and PR, or clearly staged locally for review.
2. Schema/docs/validator/sample data are aligned for any new field.
3. Templates render from config, not hardcoded customer logic.
4. Optional fields hide gracefully.
5. `npm run validate:config` and `npm run build` pass for template/schema changes, or exact blockers are reported.
6. Preview routes/sample data are updated when relevant.
7. The PR/report includes: what changed, why it matters for reusable StartLine delivery, verification output, what is next, and links.
8. Steve approval is still required before merge or customer launch.
