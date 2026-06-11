# Launch checklist

Use this checklist for Starter and Standard race-site delivery. It intentionally avoids requirements that need external credentials.

## Intake/config

- Customer config passes `npm run validate:config -- <config>`.
- Race name, date, location, venue, and distance details are customer-approved.
- Registration URL is final or explicitly approved as a temporary staging URL.
- Registration CTA copy is customer-approved.
- Race director/contact email is present when available.

## SEO and content

- Meta title and meta description are present.
- H1 matches the race name or approved campaign name.
- Event date and location are visible above the fold.
- Registration CTA appears above the fold and in the final conversion section.

## Analytics

- Registration CTAs use `registerClickAttributes(config, '<placement>')`.
- `registerClickListenerScript()` is present once per page/template.
- GA4 id can be omitted for staging; add `PUBLIC_GA4_MEASUREMENT_ID` or `analytics.ga4_measurement_id` when the customer provides it.

## Build/review

- `npm run build` completes successfully.
- `npm run launch:check -- <config>` passes.
- Staging preview has been reviewed by customer/Steve before production launch.

## Production handoff

- Customer repo contains only config, assets, and deployment wiring.
- No customer-specific logic was forked into template components.
- Any deferred items are listed in the handoff notes.
