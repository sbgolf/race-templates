# Private Race Mockup Loop

Use this loop when an audit record needs a Steve-only StartLine concept URL generated from a public race director website.

## Generate a private mockup

```bash
npm run mockup:private -- --url https://example-race-site.org --slug example-race
npm run validate:config
npm run build
```

Output:

- Config: `src/data/private-mockups/<race-slug>.json`
- Captured public images: `public/mockups/<access-token>/`
- Static preview route after build/deploy: `/private/mockups/<access-token>/`

## What the generator does

- Fetches the public race website HTML using credential-free `fetch`.
- Extracts public metadata, event date/location, event distances confirmed from the event name/heading/title, registration links, selected logistics, and up to two public JPG/PNG/WebP images from `og:image`, `twitter:image`, and page `<img>` tags.
- Builds a minimal Community-template config by default, because Community is the safest generic fit unless the audit workflow identifies an obvious Destination Major or Performance fit.
- Never spreads a sample race config into a private mockup. Sample distances, schedules, sponsors, FAQs, charity copy, images, and local boilerplate must not appear unless the source page backs them.
- Stores source/capture metadata, provenance, confidence counts, and `private_mockup.uncertainties` in the JSON config.
- Generates `private_mockup.access_token` with Node crypto randomness (`randomBytes(16).toString('hex')`), producing an unguessable 128-bit token that is not derived from the race name, race slug, hostname, or source URL.
- Fails without writing a config when source-backed required fields (race name, event date, location, at least one event distance) cannot be confirmed. Optional logistics are omitted and recorded as uncertainties instead of filled with placeholders.

## Privacy/indexing guardrails

The generated route is intentionally under `/private/mockups/<access-token>/` and emits:

```html
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
<meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet">
```

The page also shows a visible private-concept banner: internal/Steve review only, not prospect-ready until approved.

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
