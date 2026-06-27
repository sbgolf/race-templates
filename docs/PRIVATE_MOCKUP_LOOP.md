# Private Race Mockup Loop

Use this loop when an audit record needs a Steve-only StartLine concept URL generated from a public race director website.

## Generate a private mockup

```bash
npm run mockup:private -- --url https://example-race-site.org --slug example-race
npm run validate:config
npm run build
```

Output:

- Config: `src/data/private-mockups/<slug>.json`
- Captured public images: `public/mockups/<slug>/`
- Static preview route after build/deploy: `/private/mockups/<slug>/`

## What the generator does

- Fetches the public race website HTML using credential-free `fetch`.
- Extracts public metadata (`title`, `description`, JSON-LD event fields when present) and up to two public JPG/PNG/WebP images from `og:image`, `twitter:image`, and page `<img>` tags.
- Builds a small Community-template config by default, because Community is the safest generic fit unless the audit workflow identifies an obvious Destination Major or Performance fit.
- Stores source/capture metadata under `private_mockup` in the JSON config.
- Leaves generated race logistics as placeholders where the public source did not expose structured details; customer-specific production should replace those before launch.

## Privacy/indexing guardrails

The generated route is intentionally under `/private/mockups/<slug>/` and emits:

```html
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
<meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet">
```

The page also shows a visible private-concept banner: internal/Steve review only, not prospect-ready until approved.

## Fallback behavior

If image capture fails, is blocked, or finds only unsupported/low-size files, the preview still builds with the Community template's illustrated placeholders. This keeps the audit workflow moving without adding private assets or secrets.

## Deployment handoff

After a branch deploy/preview is available, combine the deployment origin with the generated route, e.g.:

`https://<deploy-preview-host>/private/mockups/example-race/`

Do not send localhost URLs to prospects. Do not merge the branch until Steve approves.
