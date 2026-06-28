# Private Race Mockup Loop

Use this loop when an audit record needs a Steve-only StartLine concept URL generated from a public race director website.

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

The page also shows a visible private-concept banner: internal/Steve review only, not prospect-ready until approved.

Community private mockups also render a private StartLine value narrative marked with `data-private-value-narrative`, when configured a private runner decision checklist marked with `data-runner-decision-checklist`, and a private registration decision card marked with `data-registration-decision-card`. Public sample previews must not render these private blocks. Frame outcomes around a clearer registration path, registration click-throughs, registration intent, and measurement-ready tracking. Do not use guaranteed growth claims such as guaranteed registrations, double signups, increased registrations, boosted registrations, or conversion lift.

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
