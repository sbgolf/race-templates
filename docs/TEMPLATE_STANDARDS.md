# Template Standards

## Explicit background rule

Every section and major band must declare its own explicit `background`/`background-color`. Never rely on inherited page background for visible sections.

Reason: inherited backgrounds can produce dark-text-on-dark or light-text-on-light rendering in iOS preview, browser dark-mode contexts, email/link previews, and embedded previews.

This applies universally across all race templates, including:

- Hero
- Course
- Race Day/gallery sections
- Entry/pricing
- Sponsors
- FAQ
- Travel/logistics
- Footer/final CTA

## Launch gate

Every template preview must pass before review:

- Lighthouse Performance ≥95
- Lighthouse Accessibility =100
- Lighthouse SEO =100
- Lighthouse Best Practices ≥95
- Register CTA visible and wired
- No external placeholder image dependencies for demo reliability
