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

## Template-specific exceptions

### Community

The Community template intentionally uses a map placeholder plus a simple elevation-gain note for each distance rather than the interactive elevation profile used by Destination Major. This preserves the small-town/community positioning and keeps the distance picker focused on distance, elevation gain, start time, aid stations, course profile, map label, and schedule filtering.

## Launch gate

Every template preview must pass before review:

- Lighthouse Performance ≥95
- Lighthouse Accessibility =100
- Lighthouse SEO =100
- Lighthouse Best Practices ≥95
- Register CTA visible and wired
- No external placeholder image dependencies for demo reliability
