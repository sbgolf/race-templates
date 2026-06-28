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

### Performance

The Performance template intentionally uses a single-distance conversion funnel with pace, records, and BQ proof sections instead of a distance picker. Keep all performance bands high-contrast, explicitly colored, and tuned for fast-scanning race-day proof points.

## Private mockup value contract

Every current and future template must support the StartLine private mockup value contract before it is considered sales-ready. Visual language can vary by archetype, but the value contract does not vary.

Private mockups must explain how StartLine helps turn runner interest into official registration click-throughs by:

- Reducing runner friction with scannable race details.
- Making official registration CTAs easier to find.
- Surfacing trust signals when source-backed/configured.
- Preserving the customer's existing registration platform instead of replacing it.
- Preparing CTAs for `register_click` measurement.
- Explaining what the paid StartLine build includes beyond the free/private concept.

Do not promise guaranteed traffic, rankings, registrations, revenue, signup growth, or conversion lift. Use accurate language such as registration path, registration click-through, registration intent, and measurement-ready.

See `PRIVATE_MOCKUP_VALUE_ROADMAP.md` for the working roadmap and future enhancements.

## Launch gate

Every template preview must pass before review:

- Lighthouse Performance ≥95
- Lighthouse Accessibility =100
- Lighthouse SEO =100
- Lighthouse Best Practices ≥95
- Register CTA visible and wired
- Private mockup route explains StartLine value toward registration click-throughs when applicable
- Public preview routes do not leak private sales narrative
- No external placeholder image dependencies for demo reliability
