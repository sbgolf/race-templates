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

The shared implementation lives in `src/shared/private-mockup-value.mjs`. Template components should use that shared copy/contract model where practical, while preserving archetype-specific layout and styling. Do not duplicate or weaken the measurement/registration-handoff language in a one-off template component.

Private mockups must explain how StartLine helps turn runner interest into official registration click-throughs by:

- Reducing runner friction with scannable race details.
- Making official registration CTAs easier to find.
- Surfacing trust signals when source-backed/configured.
- Preserving the customer's existing registration platform instead of replacing it.
- Preparing CTAs for `register_click` measurement.
- Explaining what the paid StartLine build includes beyond the free/private concept.

Private mockup rendered output must include these stable contract markers when applicable:

- `data-private-value-narrative`
- `data-runner-decision-checklist`
- `data-registration-decision-card`
- `data-trust-signals-band` when `shouldRenderTrustSignalsBand(config)` allows it
- `data-measurement-ready-panel`

Public preview routes must not render any of those private markers.

Do not promise guaranteed traffic, rankings, registrations, revenue, signup growth, or conversion lift. Use accurate language such as registration path, registration click-through, registration intent, and measurement-ready.

Runner-facing mockup copy must never expose provenance/scrape language. Do not render phrases such as “RunSignup lists…”, “the page says…”, “the source says…”, “listed as…”, or similar audit notes in checklist cards, FAQs, registration cards, story copy, trust signals, or CTAs. Keep source URLs and verification notes in config metadata/provenance fields only; visible text should read as polished race guidance, for example “Course maps and final race details are sent before race day.”

See `PRIVATE_MOCKUP_VALUE_ROADMAP.md` for the working roadmap and future enhancements.

### New archetype acceptance gate

A PR that adds a new archetype (including Trail/Ultra/Adventure, Charity/Cause-Driven, or any future template) is not merge-ready until it:

- Adds a tokenized private mockup path for that archetype.
- Adds the archetype to the shared private value contract template set only after the rendered private path emits the required markers.
- Keeps public `/preview/<template>` output free of private value markers and private sales/value narrative.
- Passes `npm run validate:private-mockups`, `npm run build`, and `npm run validate:rendered-private-mockups`.
- Documents in the PR how the archetype reduces runner friction, surfaces source-backed trust, preserves the official registration platform, and supports `register_click` measurement.

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
