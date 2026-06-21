# Starter/Standard operations

This repo includes lightweight operational tooling for Starter and Standard race-site fulfillment. The tools do not require external credentials and can run before a customer provides analytics access or production hosting.

## Validate customer config

Customer sites are driven by JSON config. Validate sample data or a customer config with:

```bash
npm run validate:config
npm run validate:config -- path/to/race-config.json
```

The validator checks required launch-critical fields:

- template id
- race name and event date/location
- at least one distance
- absolute registration URL
- SEO title and description
- optional GA4 id format when provided

Warnings are non-blocking but should be resolved before customer review when practical.

## Community Standard path

Community is the first customer-ready Standard template path. Use `src/data/samples/hartwell-half.json` as the current reference shape for config-driven Community pages: identity, event details, distances/prices/highlights, schedule, registration, optional volunteer URL, SEO, analytics, and organization metadata.

Before customer review, run:

```bash
npm run validate:config -- src/data/samples/hartwell-half.json
npm run build
npm run launch:check -- src/data/samples/hartwell-half.json
```

The Community launch check inspects the rendered preview output for configured registration links, register-click analytics attributes, SportsEvent JSON-LD, and no demo-only registration actions.

## Registration-click analytics pattern

Use `src/shared/analytics/register-click.mjs` for GA4 wiring:

- `ga4Snippet(config)` inserts the GA4 script only when a real measurement id exists.
- `registerClickAttributes(config, placement)` adds standardized `data-*` attributes to registration CTAs.
- `registerClickListenerScript()` sends a `register_click` event with placement, platform, and link URL.

Example Astro usage:

```astro
---
import { ga4Snippet, registerClickAttributes, registerClickListenerScript } from 'race-templates/src/shared/analytics/register-click.mjs';
import config from '../data/race-config.json';
const registerAttrs = registerClickAttributes(config, 'hero');
---
<head>
  <Fragment set:html={ga4Snippet(config)} />
</head>
<a href={config.registration.url} {...registerAttrs}>Register now</a>
<Fragment set:html={registerClickListenerScript()} />
```

## Launch gate

Run a credential-free launch gate before customer review and before production launch:

```bash
npm run launch:check -- path/to/race-config.json
```

The gate currently verifies config validity, registration URL readiness, SEO metadata, event date, configured distances, and analytics readiness/intentional omission.

## Thin customer repo scaffold

Generate a local Starter/Standard thin repo scaffold with:

```bash
npm run scaffold:customer -- river-city-half community
```

Output is written to `customer-scaffolds/<slug>/` and includes:

- placeholder `src/data/race-config.json`
- Astro `src/pages/index.astro` that renders the selected template, including Community's GA4/register-click/SportsEvent JSON-LD wiring
- package scripts for config validation, build, and launch check
- a README with next steps

Customer repos should stay thin: config, assets, and deployment wiring only. Template logic belongs here in `race-templates`.
