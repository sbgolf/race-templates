# Private Mockup Value Roadmap

## Purpose

Private mockups must prove StartLine value, not just show a prettier version of a race website. Every current template and every future template should help race directors understand how StartLine creates a clearer path from runner interest to official registration click-through.

This roadmap is intentionally template-agnostic. Visual systems can differ by archetype, but the value contract does not.

## Foundational principles

These principles apply to all current and future race templates:

1. **Registration click-through is the north star.** Every private mockup should explain how the structure reduces runner friction and makes the official registration path easier to reach.
2. **Do not replace the registration platform.** StartLine deep-links to RunSignup, Race Roster, Active, Haku, or the customer’s existing platform.
3. **Explain the business value.** The mockup must show what changed, why it matters to runners, and how it supports measurable registration intent.
4. **Surface trust before the decision point.** Certification, aid stations, awards, policies, organizer credibility, sponsor support, course profile, and logistics should be easy to find when source-backed.
5. **Answer runner objections before CTA clicks.** Date, distance, location, start time, pricing, packet pickup, refund/transfer policy, course details, swag, and aid stations should be structured for fast scanning.
6. **Keep claims honest.** Never promise guaranteed registrations, traffic, rankings, revenue, or conversion lift. Use language like registration path, registration click-through, registration intent, and measurement-ready.
7. **Measure the handoff.** Paid builds should be prepared to track `register_click` events so directors can see how many visitors move from the race site toward the official registration platform.
8. **Make value private-only until approved.** Sales/value narrative belongs on private mockups and proposal/audit pages, not public sample previews unless intentionally adapted as public marketing copy.
9. **Use source-backed race facts only.** Do not invent race details. Omit unknown facts or mark them for confirmation before launch.
10. **Build reusable capability.** If a feature is useful for one race, implement it as schema/template/generator capability for every applicable template rather than a one-off customer fork.

## Universal private mockup requirements

Every private mockup, regardless of template archetype, should eventually include:

- A private StartLine value wrapper.
- A “What StartLine improved” section.
- A “What a paid StartLine build includes” section.
- A source/configured-facts note explaining that final details are confirmed before launch.
- Clear official registration CTAs.
- Measurement-ready registration-click tracking.
- No overclaiming or guaranteed-growth language.
- Mobile-first layout with no horizontal overflow at 320, 375, 414, 768, and desktop widths.
- `noindex,nofollow,noarchive,nosnippet` on tokenized private routes.

## Current implementation status

### Implemented in PR #14

- Community private mockups render a private-only StartLine value narrative.
- Generator defaults add conservative `startline_value` copy for newly generated private mockups.
- Launch checks require private value narrative on private Community mockups and require it to be absent from public Community previews.
- Launch checks guard against forbidden registration-growth claims.
- Mobile overflow from Community route SVG/course map is fixed at 320px.

### Still to generalize

PR #14 establishes the pattern in the Community template. Future work should extract or mirror the pattern so every archetype uses the same value contract:

- Destination Major
- Performance / BQ-coded
- Trail / Ultra / Adventure
- Charity / Cause-Driven
- Any future template archetype

Preferred direction: move reusable private-value helpers/copy into shared code, then let each template render it in its own visual language.

## Prioritized development roadmap

### Sprint 1 — Private value narrative foundation

Status: in progress / PR #14.

Goal: make private mockups clearly explain StartLine value.

Deliverables:

- Private-only value narrative.
- “What StartLine improved.”
- “What paid build includes.”
- Source/configured-facts note.
- No guaranteed-growth claim guard.
- Public-preview absence guard.

Acceptance criteria:

- Private routes include the value narrative.
- Public preview routes do not leak private sales narrative.
- Copy ties value to runner friction, trust signals, official registration CTA clarity, mobile/SEO readiness, and registration-click measurement.
- No unsupported race facts or placeholder content.

### Sprint 2 — Source content transformation polish

Status: implemented in this PR.

Goal: make generated mockups feel professionally transformed, not scraped.

Implemented behavior:

- Generator extracts `http(s)` and `www.` URLs from source prose into labeled resource links instead of leaving them in paragraph copy.
- RunSignup and common registration-platform links receive prospect-facing CTA labels, with RunSignup registration URLs labeled as `Register on RunSignup`.
- Display-copy normalization removes visible raw URLs/domains, dangling separators, duplicate spacing, trailing truncation ellipses, and scraped punctuation artifacts.
- Long source prose is split into shorter display-ready story paragraphs without inventing unsupported facts.
- Private mockup config and rendered validators fail visible raw URLs/domains and punctuation artifacts in customer-facing display copy while still allowing URL metadata fields.
- Generator regressions cover rich and sparse source prose with raw URLs, RunSignup domains, broken punctuation, truncated ellipses, labeled links, and paragraph splitting.

Deliverables:

- Remove raw URLs from paragraphs.
- Convert URLs into labeled links/buttons.
- Clean punctuation artifacts and spacing.
- Detect RunSignup registration links and label the CTA/platform accordingly.
- Enforce source-polish validation for private mockup display copy so visible raw URLs/domains and scraped punctuation artifacts fail the private mockup gate.
- Break long source paragraphs into cards, bullets, FAQs, and checklist items.
- Preserve factual accuracy and omit unsupported details.
- Add regression fixtures for rich and sparse source pages.

Registration-click value:

- Cleaner information reduces cognitive load and helps runners answer key pre-registration questions faster.

### Sprint 3 — Runner-decision checklist

Status: implemented in PR #16.

Goal: answer the questions runners ask before clicking registration.

Implemented behavior:

- Community private mockups render a private-only “Before you register” runner checklist immediately before the final registration section.
- `runner_decision_checklist` supports display-ready `headline`, `intro`, and `items` with stable ids, labels, values, optional details, source paths/URLs, and distance applicability.
- Generator output builds checklist items only from source-backed facts: date, distance, start time, location, price, packet pickup, aid stations, certification/course profile, and FAQ-derived policies, swag/medals, awards, and time limits when present.
- Sparse races omit missing facts instead of using `TBD`, `TBA`, `unknown`, or “coming soon.”
- Private validation requires checklist provenance/source paths, known item ids, unique ids, non-empty values, no raw URLs/domains in display copy, and `runner_decision_checklist` in `source_confirmed_sections` when rendered.
- Rendered and launch checks require private Community checklist output with at least three items and a `runner-checklist` register-click CTA; public Community previews must not render the private checklist.

Registration-click value:

- Reduces uncertainty immediately before the official registration CTA.

### Sprint 4 — Registration conversion components

Status: implemented in PR #17.

Goal: make registration CTAs obvious at decision points.

Implemented behavior:

- Community private mockups render a private-only registration decision card between the runner checklist and Entry/Register section.
- The card clarifies that StartLine sends runners to official registration, while availability, payment, and confirmation happen on the official platform; tracking measures click-through only.
- Major registration CTA placements are distinct: `nav-link`, `nav-button`, `hero-primary`, `runner-checklist-top`, `runner-checklist-footer`, `registration-decision-card`, `entry-distance-*`, and `finale-primary`.
- Private hero secondary CTA points to the runner checklist when present, keeping the official registration CTA as the primary action and avoiding a competing course CTA at the top of private mockups.
- Private routes include GA4 setup when configured and always include register-click listener wiring; placeholder GA4 IDs intentionally omit the external GA script without breaking pages.
- Rendered and launch checks require complete analytics metadata on every anchor to the configured registration URL, reject non-registration links tracked as `register_click`, require Sprint 4 placements, and ensure public Community previews do not leak private decision/checklist/value sections.

Deferred:

- Mobile sticky registration CTA remains optional and was not added in PR #17 to avoid introducing mobile overlap risk.

Registration-click value:

- Runners should never need to hunt for the next step after deciding the race is a fit.

### Sprint 5 — Trust and measurement modules

Status: implemented in PR #18.

Goal: show directors that StartLine builds credibility and measurable intent.

Implemented behavior:

- Community private mockups render a private-only trust-signal band marked with `data-trust-signals-band` when enough configured/source-backed trust facts exist.
- Trust signals are derived from existing race config/checklist/provenance facts such as certification, course profile, aid stations, packet pickup, refund/transfer policy, awards, swag/medal, time limit, official registration platform, organizer identity, and source-confidence metadata.
- Sparse mockups omit the band unless the available facts meet the threshold; missing facts are not replaced with `TBD`, `TBA`, `unknown`, or “coming soon.”
- Community private mockups render a private-only measurement-ready panel marked with `data-measurement-ready-panel`.
- The measurement panel explains that `register_click` captures outbound official-registration handoff intent by placement/platform/link, while completed registrations, payment, and confirmation remain inside the official registration platform unless reporting or an approved integration exists.
- Rendered validation and launch checks require the measurement panel on private Community mockups, require/forbid the trust-signal band according to available facts, reject public Community leakage, reject completed-registration measurement claims, continue rejecting forbidden growth/lift claims, and continue enforcing distinct registration CTA placements plus no `register_click` tracking on non-registration links.

Deferred:

- Mock monthly report/dashboard example remains later work, once analytics flow and reporting format are ready.

Registration-click value:

- Trust signals reduce hesitation, and tracking proves whether the website is sending runners toward registration.

### Sprint 6 — Cross-template adoption

Status: in progress — Destination Major adopted, and Performance foundation implemented.

Goal: make the value system foundational for every current and future template.

Implemented for Destination Major:

- Tokenized private mockups now route by template, rendering Community or Destination Major without exposing private modules on public previews.
- Destination Major private mockups render private-only value narrative, runner decision checklist, registration decision card, trust-signal band when facts meet the threshold, and measurement-ready panel in the premium cinematic visual language.
- Destination Major registration CTAs use distinct `register_click` placements across nav, hero, runner checklist, decision card, entry, and finale.
- Generator accepts `--template destination-major` and writes matching `identity.template` / `private_mockup.template` metadata.
- Rendered private validation and launch checks now apply the private value contract to Destination Major as well as Community.

Implemented for Performance:

- Added a fictional, tokenized Performance private mockup fixture with matching `identity.template` and `private_mockup.template` metadata.
- Tokenized private mockup routing can render the Performance template.
- Performance private rendering includes the private-only StartLine value narrative focused on BQ, PR, field-cap, and registration-click value.
- Performance private mockups now render the runner decision checklist, registration decision card, trust-signal band when enough source-backed runner facts exist, and measurement-ready handoff panel in the Performance visual language.
- Public `/preview/performance` remains clean: the private value narrative and private sales/value modules are not rendered there.
- Performance registration CTAs link to `registration.url` and include distinct `register_click` analytics placements across nav, hero, runner checklist, registration decision card, entry, and finale.
- Rendered/launch validation now applies the full private value contract to Performance as well as Community and Destination Major; public Performance previews must forbid private modules.

Implemented in Sprint 6 cleanup:

- Shared private-value utilities/copy model added in `src/shared/private-mockup-value.mjs`.
- Community, Destination Major, and Performance private modules now consume shared private-value copy/contract helpers where practical while keeping template-specific rendering.
- Rendered validation and launch checks use stable contract markers for value narrative, runner checklist, registration decision card, trust-signal band, and measurement-ready panel.
- Public preview rendered validation forbids private value markers.
- Template standards now require new archetypes to implement the private value contract before merge.

Remaining deliverables:

- Trail implementation when created.
- Charity implementation when created.

Acceptance criteria:

- A new template PR cannot be considered complete unless its private mockup path demonstrates the same value principles.

### Sprint 7 — Mockup readiness QA gate

Status: implemented — rendered private mockup validation is the readiness gate.

Goal: prevent weak mockups from reaching Steve or prospects.

Implemented behavior:

- Rendered private routes require the shared private value contract markers, runner checklist, registration decision card, measurement-ready panel, and trust-signal band when enough source-backed facts exist.
- Public previews for supported templates are scanned to prevent leakage of private value markers.
- Tokenized private routes must emit `noindex,nofollow,noarchive,nosnippet` for both `robots` and `googlebot`.
- Paragraph-like visible copy fails on raw URLs/bare domains, placeholder copy, scrape punctuation artifacts, raw registration platform keys, and completed-registration tracking claims while leaving href/src/meta/JSON-LD data alone.
- Customer-facing rendered HTML is scanned for internal source/provenance/uncertainty chrome that should never reach prospects.
- Official registration CTAs must link to the configured registration URL, include analytics/platform attributes, meet the required placement contract, avoid duplicate placements, and render at least the minimum expected CTA count.
- Static mobile-readiness safeguards require viewport metadata and reject fixed width/min-width CSS rules that would obviously overflow 320px or exceed 100vw without adding browser dependencies.

Registration-click value:

- Keeps every sales preview consistent, polished, credible, and ready for Steve review before a prospect sees it.

### Sprint 8 — Audit → mockup → offer workflow

Status: process gate documented in `docs/PRIVATE_MOCKUP_LOOP.md`; email/handoff copy may still be expanded later.

Goal: connect private mockups to the sales motion.

Deliverables:

- Respectful current-site audit framing.
- A generation gate covering minimum fit, opportunity scoring, thresholds, template readiness, source material, lead-source defaults, and weekly Tier A warm outbound capacity.
- Private mockup handoff page or email copy.
- “What we improved” summary.
- Recommended package language.
- Clear next step for Steve to send after review.

Registration-click value:

- Directors see the chain from current friction to StartLine fix to measurable official-registration click-through.

## Template implementation rule

For any new template or major template refactor, include a private mockup acceptance section in the PR description:

- How does this template reduce runner friction?
- Where are official registration CTAs shown?
- Which trust signals can this template surface?
- How does it support `register_click` tracking?
- Does the private mockup explain paid-build value?
- Does it avoid guaranteed-growth claims?
- Does it pass mobile overflow checks?

If the PR cannot answer these, it is not ready.

## Open questions for later

- Should the private value narrative become a shared component rendered by every template, or a shared data model rendered by template-specific components?
- Should `startline_value` live permanently as top-level config or under `private_mockup`?
- How much of the “What StartLine improved” section should be generator-derived versus template-default copy?
- When should registration-click reporting become visible in the private mockup versus reserved for paid builds/monthly reporting?

## Owner note

This file is the working backlog for the private mockup value system. If work stops mid-roadmap, resume from the highest incomplete sprint and verify current implementation before starting new changes.
