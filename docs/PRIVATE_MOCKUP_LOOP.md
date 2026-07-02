# Private Race Mockup Loop

Use this loop when an audit record needs a Steve-only StartLine concept URL generated from a public race director website. Private mockups are proactive sales assets for qualified leads; they are not the default first touch for every cold contact. Apply the gate below before generating, emailing, or asking Steve to review a private mockup.

## StartLine private-mockup generation gate

Generate and include a private mockup when the lead is qualified enough that a visual concept will improve the conversation. If the gate fails, send a lightweight audit first: 2-4 respectful screenshots/observations, one clear registration-path recommendation, and an invitation to review a private concept if useful.

### 1. Minimum fit gate

All items must be true before scoring:

- The race fits the StartLine model: an organized running event or race series with a public-facing runner information/registration need.
- There is an existing registration path StartLine can preserve and deep-link to, such as RunSignup, Race Roster, Active, Haku, a race-owned registration page, or another official platform.
- Public sources provide enough facts to create a credible concept without inventing details.
- No disqualifier is present:
  - inactive/cancelled race or no credible future date/season
  - past event with no next edition signal
  - current site is already excellent and StartLine has no obvious registration-path, mobile, speed, SEO, or trust-signal improvement angle
  - outside the StartLine model, such as a non-race directory-only property, ticketed non-running event, or unrelated local business
  - requires unsupported custom functionality as the sales hook, such as complex account systems, merchandise checkout, team fundraising, custom timing integrations, live results, or membership portals

If any minimum-fit item fails, do not generate a private mockup. Send an audit/note only, or ask Steve whether the lead should be handled as a custom opportunity.

### 2. Opportunity score (0-20)

Score only after the minimum fit gate passes.

- ICP fit (0-5):
  - 0-1: weak/non-core race, tiny or unclear event, poor model fit
  - 2-3: plausible local/community race or small series
  - 4-5: strong StartLine ICP, repeat event, race director likely values registration flow and credibility
- Website improvement opportunity (0-5):
  - 0-1: already strong, modern, mobile-friendly, obvious registration path
  - 2-3: some friction, dated content, weak trust signals, or registration path takes effort to find
  - 4-5: high-friction site, poor mobile experience, scattered race details, weak CTA hierarchy, or missing SEO/trust basics
- Commercial potential (0-4):
  - 0-1: very small budget signal or one-off low-value event
  - 2-3: standard race/site opportunity, sponsor/community value, repeat annual event
  - 4: high-value race, series, multiple events, destination/BQ/commercial signals, or likely upsell path
- Timing urgency (0-3):
  - 0: too far out/unclear timing or event already passed
  - 1: registration/site update timing is relevant but not urgent
  - 2: registration is open or season planning is active
  - 3: launch/registration/race date timing makes a clearer site immediately useful
- Relationship/warmth (0-3):
  - 0: pure cold contact with no connection or engagement
  - 1: light engagement, known name, prior touch, or strong public signal
  - 2: warm reply, inbound audit request, BMQR context, referral path, or known director
  - 3: Steve relationship, referral, active conversation, or explicit interest

### 3. Decision thresholds

- 16-20: proactively generate the private mockup if template and source checks pass.
- 12-15: generate if the template fit is strong and source material is sufficient; otherwise send a lightweight audit first and ask for details/assets.
- 10-11: generate only for warm leads, BMQR Tier A targets, Steve-requested targets, or clear referrals; otherwise send audit only.
- Under 10: do not generate by default. Send a lightweight audit or keep the lead in research/nurture.
- Any score with insufficient source material: do not force a weak mockup. Send an audit plus a short request for missing details/assets.

This means qualified leads do not need to ask for a mockup before we create one, but low-fit cold leads should not consume mockup production time.

### 4. Template readiness check

Before generation, confirm the matching template is ready enough for the lead. A bad mockup hurts more than no mockup.

- Choose the closest archetype: Community/Hometown for most local multi-distance races, Destination Major for scenic/premium destination races, Performance/BQ-coded for BQ/PR/competitive races, or another Steve-approved archetype when available.
- The selected template must support the private value contract for that archetype: noindex route, source-backed facts, registration CTAs, runner decision content, trust signals when available, measurement-ready language, no guaranteed-growth claims, and no public-preview leakage.
- If the obvious archetype is not implemented or would make the race look generic/incorrect, do not generate yet. Send an audit and note the template gap internally.

### 5. Source material check

A private mockup needs enough source-backed content to feel credible. Minimum material:

- race name
- event date or credible season/year signal
- city/state or location
- distances or event formats
- official registration URL/platform
- current site and/or official registration page
- enough runner decision information to structure the page, such as start area, course/highlights, pricing, schedule, packet pickup, aid, awards, charity, organizer, or policies
- image/logo source, or an acceptable realistic stock/AI direction when public images are unavailable and Steve is comfortable with that framing

If these are missing, send a lightweight audit and ask for the missing details/assets instead of publishing a thin concept.

### 6. Lead-source defaults

- Inbound audit request: default to generating a private mockup when the minimum fit, source, and template checks pass. If source material is thin, reply with the audit plus a concise request for missing details/assets.
- BMQR Tier A target: generate for the best targets when the score is 10+ and the template/source checks pass, especially if Performance/BQ or Destination Major fit is strong. Keep throughput disciplined.
- Cold outbound: do not generate on the first touch by default. Send 2-4 strong screenshots/observations first. Generate after engagement, or immediately only for high-value Tier A targets that clear the threshold and have excellent source material.
- Referral or known director: generate when source material is sufficient and the score is 10+; if details are missing, ask the referrer/director for assets before creating a weak mockup.

For Tier A warm outbound, cap proactive mockup production at 3-5 mockups per week unless Steve explicitly changes capacity. Prioritize the highest opportunity scores, strongest template fits, and best-timed registration windows.

### 7. Email/handoff framing

When sending a generated private mockup, include:

- a short respectful audit summary, not a takedown of the current site
- 2-4 screenshots or callouts that show the registration-path/content improvements
- the private `noindex` URL, never a localhost URL
- concept framing: “a private StartLine concept based on public race info,” with final details confirmed before launch
- clear next step for Steve/prospect, such as “want me to turn this into a production-ready StartLine build?”

Avoid guarantees and disparaging language. Do not promise registration growth, conversion lift, SEO rankings, revenue, or completed-registration measurement. Frame value around clearer runner information, easier official-registration click-through, source-backed trust, mobile/SEO readiness, and measurement-ready outbound registration intent.

## Generate a private mockup

```bash
npm run mockup:private -- --url https://example-race-site.org --slug example-race
npm run validate:config
npm run validate:private-mockups
npm run build
npm run validate:rendered-private-mockups
```

Output:

- Config: `src/data/private-mockups/<race-slug>.json`
- Captured public images: `public/mockups/<access-token>/`
- Static preview route after build/deploy: `/private/mockups/<access-token>/`

The validation flow has two private-mockup gates: `npm run validate:private-mockups` checks source-backed config data before rendering, and `npm run validate:rendered-private-mockups` checks the built private pages after `npm run build`.

## What the generator does

- Fetches the public race website HTML using credential-free `fetch`.
- Extracts public metadata, event date/location, event distances confirmed from the event name/heading/title, registration links, selected logistics, and up to two public JPG/PNG/WebP images from `og:image`, `twitter:image`, and page `<img>` tags.
- Builds a minimal Community-template config by default, because Community is the safest generic fit unless the audit workflow identifies an obvious Destination Major or Performance fit.
- Never spreads a sample race config into a private mockup. Sample distances, schedules, sponsors, FAQs, charity copy, images, and local boilerplate must not appear unless the source page backs them.
- Stores source/capture metadata, provenance, confidence counts, and `private_mockup.uncertainty` in the JSON config.
- Adds a conservative `startline_value` narrative for Community private mockups. The rendered private page explains how StartLine reduces runner friction, surfaces trust signals, makes registration CTAs easier to find, supports mobile/SEO readiness, and prepares registration-click tracking without promising registration growth.
- Adds a source-backed `runner_decision_checklist` for Community private mockups when enough facts are confirmed. The rendered “Before you register” section appears before the registration cards and uses distinct `runner-checklist-top` / `runner-checklist-footer` tracked CTAs to the official registration URL.
- Renders a private-only registration decision card between the checklist and Entry/Register section. It explains the official-platform handoff, avoids payment/availability/confirmation overclaims, and uses the `registration-decision-card` register-click placement.
- Renders a private-only trust-signal band when enough configured/source-backed trust facts exist, using details such as certification, course profile, aid stations, packet pickup, policies, swag/medals, awards, time limits, official registration platform, organizer identity, and source-confidence metadata. Sparse mockups omit unavailable facts instead of filling placeholders.
- Renders a private-only measurement-ready panel marked with `data-measurement-ready-panel`. The panel explains that `register_click` captures outbound official-registration handoff intent by placement/platform/link; completed registrations, payment, and confirmation remain inside the official registration platform unless platform reporting or an approved integration is added.
- Measures major registration CTAs with stable distinct placements: `nav-link`, `nav-button`, `hero-primary`, `runner-checklist-top`, `runner-checklist-footer`, `registration-decision-card`, `entry-distance-*`, and `finale-primary`. Non-registration external links must not use `register_click` tracking.
- Normalizes generated display copy so source paragraphs do not expose raw URLs/domains or common scrape artifacts; course/map resources are moved into labeled links and RunSignup registration links are labeled with the RunSignup platform/CTA.
- Generates `private_mockup.access_token` with Node crypto randomness (`randomBytes(16).toString('hex')`), producing an unguessable 128-bit token that is not derived from the race name, race slug, hostname, or source URL.
- Fails without writing a config when source-backed required fields (race name, event date, location, at least one event distance) cannot be confirmed. Optional logistics are omitted and recorded as uncertainties instead of filled with placeholders.

## Privacy/indexing guardrails

The generated route is intentionally under `/private/mockups/<access-token>/` and emits:

```html
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
<meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet">
```

Private pages should read like customer-facing website concepts while staying `noindex`: keep provenance, source URLs, confidence, and uncertainty metadata in JSON for validation/auditability, but do not render visible debug chrome such as “Primary source,” “Source-confirmed,” uncertainty summaries, or internal review instructions on the page.

Community private mockups also render a private StartLine value narrative marked with `data-private-value-narrative`, when configured a private runner decision checklist marked with `data-runner-decision-checklist`, a private trust-signal band marked with `data-trust-signals-band` when enough source-backed trust facts exist, a private registration decision card marked with `data-registration-decision-card`, and a private measurement-ready panel marked with `data-measurement-ready-panel`. Public sample previews must not render these private blocks. Frame outcomes around a clearer registration path, registration click-throughs, registration intent, and measurement-ready tracking. `register_click` describes outbound official-registration handoff intent only; completed registrations, payment, and confirmation remain inside the official registration platform unless platform reporting or an approved integration is added. Do not use guaranteed growth claims such as guaranteed registrations, double signups, increased registrations, boosted registrations, or conversion lift.

Token rules:

- Do not use race names, hostnames, dates, or slugs in private mockup URLs.
- Let the generator create the token by default. If a token must be supplied during a migration, pass only a 32+ character hex value created from at least 128 bits of crypto randomness.
- `private_mockup.route` must exactly match `/private/mockups/<private_mockup.access_token>/`.
- The Astro route builds only configured token paths; `/private/mockups/`, slug-only URLs, and unknown or guessed `/private/mockups/.../` paths fall through to the site's normal 404.
- Marketing-site handoff should store only the final tokenized URL, never a race-slug URL.

## Fallback behavior

If image capture fails, is blocked, or finds only unsupported/low-size files, the preview still builds with the Community template's illustrated placeholders. This keeps the audit workflow moving without adding private assets or secrets.

## Deployment handoff

After a branch deploy/preview is available, combine the deployment origin with the generated route, e.g.:

`https://<deploy-preview-host>/private/mockups/35a001229594dde99d184e2ab18b50e9/`

Do not send localhost URLs to prospects. Do not merge the branch until Steve approves.
