# Architecture

## Locked three-layer repo structure

1. `sbgolf/marketing-site` — venture storefront, already deployed. This is the public marketing/sales site for the race-director website venture.
2. `sbgolf/race-templates` — template library repo. This repo owns the reusable race templates, shared schema validators, intake transforms, shared utilities, sample data, preview routes, and venture governance docs.
3. `sbgolf/[customer-slug]` — per-customer thin repos, created at intake. Each customer repo imports `race-templates` as a dependency and contains only customer config, assets, and deployment wiring.

## Current library layout

```text
race-templates/
├── src/
│   ├── templates/
│   │   └── destination-major/
│   │       ├── components/
│   │       ├── styles/
│   │       └── pages/
│   ├── shared/
│   │   ├── schema/
│   │   ├── transforms/
│   │   └── utils/
│   ├── data/
│   │   └── samples/
│   │       └── cascade-marathon.json
│   └── pages/
│       └── preview/
│           └── destination-major.astro
├── docs/
├── astro.config.mjs
└── package.json
```

## Template lineup

- `src/templates/destination-major/` — Cascade-derived destination race template.
- `src/templates/community/` — Hartwell Community template will be added here next.
- Future archetypes live as parallel directories under `src/templates/`.

No archetype gets its own standalone repo. No customer-specific logic belongs in template components.
