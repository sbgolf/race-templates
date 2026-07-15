# Schema

The schema is the shared data contract for all customer race sites.

Current top-level groups expected by templates include: `identity`, `event`, `distances`, `registration`, `photo_galleries`, `qualifying`, `schedule`, `travel`, `travel_logistics`, `proof`, `course`, `records`, `entry_tiers`, `sponsors`, `faqs`, `charity`, `seo`, `analytics`, `email_capture`, `volunteer`, `contacts`, and `social`.

## Sponsors

`sponsors` may remain a simple array of sponsor names for flat displays:

```json
["Hartwell Bank", "Tory's Diner"]
```

When a public source or approved intake clearly supports hierarchy, entries may also be objects with reusable tier metadata:

```json
[
  { "name": "Example Engineering", "tier": "Title Sponsor" },
  { "name": "Local Timing Club", "tier": "Timing Support" }
]
```

- `name` (required): visible sponsor name.
- `tier` (optional): visible grouping label, such as `Title Sponsor`, `Sponsors`, or `Timing Support`. Only use tier labels backed by source material or approved customer intake.
- `url` (optional): absolute sponsor URL for future renderers; current community sponsor display does not require links.

Templates must continue supporting flat string arrays so existing sample configs do not need migration.

## Shared optional fields

- `identity.hero_image` (optional): image object for hero art/photography. For private mockups, prefer official source-backed race photography or race-page banner imagery before local placeholder art. Inspect browser-rendered source pages for RunSignup carousel/banner/background-image assets as well as normal `<img>` tags; when a usable source image exists, store a local copy under `public/mockups/<token>/`, set `src` to `/mockups/<token>/...`, include descriptive `alt`, and record provenance in `private_mockup.provenance.items[]`. Placeholder objects are acceptable only when source image capture is unavailable, blocked, unsupported, or explicitly deferred and that uncertainty is recorded.

## Social/contact links

`social` is an optional top-level object for a compact, reusable row of circular social/contact icons. Community, Destination Major, and Performance currently render this row in their footer brand area when at least one configured link is present. If `social` is omitted or all fields are blank, templates render nothing and leave no placeholder gap.

```json
{
  "social": {
    "facebook": "https://www.facebook.com/example-race",
    "x": "https://x.com/example_race",
    "instagram": "https://www.instagram.com/example_race/",
    "email": "hello@example.com"
  }
}
```

- `facebook` (optional): absolute Facebook URL.
- `instagram` (optional): absolute Instagram URL.
- `x` (optional): absolute X URL. Preferred for new intake.
- `twitter` (optional): legacy alias for X/Twitter. Renderers use `x` when both are present.
- `email` (optional): plain email address; renderers convert it to `mailto:`.

Use approved customer links only. Public demos must use fictional/generic example links such as `example.com` pages or platform example handles; do not hardcode customer-specific social data in templates.

## Past race photo galleries

`photo_galleries` is an optional top-level array for outbound previous-race photo gallery links. Community, Destination Major, and Performance render a low-hierarchy “Past Race Photos” section only when at least one valid gallery is configured. If omitted or empty, templates render nothing and leave no placeholder gap.

```json
{
  "photo_galleries": [
    {
      "label": "View 2025 race photos",
      "url": "https://example.com/race/photos-2025",
      "provider": "RunSignup",
      "year": "2025"
    }
  ]
}
```

- `label` (required): runner-facing CTA text for the outbound gallery link.
- `url` (required): absolute `http://` or `https://` URL to the external gallery provider.
- `provider` (optional): non-empty display label such as `RunSignup`, `Race Roster`, `Facebook`, `Google Photos`, `SmugMug`, or a photographer/studio name.
- `year` (optional): non-empty display year or edition label.

Use approved customer links only. Public demos must use fictional/generic URLs. Templates link out to the configured provider; StartLine does not host photos or create a dedicated gallery page from this field.

## Registration status

`registration.status` is an optional shared status contract currently rendered by the Destination Major template. When omitted, templates keep existing CTA language and do not show a status badge/card.

```json
{
  "registration": {
    "url": "https://example.com/register",
    "platform": "other",
    "cta_label": "Register now",
    "status": "limited",
    "status_label": "Limited spots remaining",
    "status_detail": "Field size is capped; review the official registration provider for current availability.",
    "status_cta_label": "Register while spots remain"
  }
}
```

- `registration.status` (optional): one of `open`, `limited`, `waitlist`, `sold_out`, `transfer_only`, or `closed`.
- `registration.status_label` (optional): runner-facing display label. If omitted, Destination Major uses the default label for the configured status.
- `registration.status_detail` (optional): short runner-facing detail. Use source-backed or approved intake copy only; avoid fake urgency.
- `registration.status_cta_label` (optional): status-specific CTA copy. If omitted, Destination Major uses safe defaults such as `Join the waitlist`, `View transfer options`, or `View race details` for constrained statuses.

## Destination travel logistics

`travel_logistics` is an optional top-level group for Destination Major travel-planning sections. It is designed for runner-facing logistics such as getting there, lodging, arrival timing, packet pickup, start/finish proximity, and official planning links.

If `travel_logistics` is omitted or all usable fields are blank, Destination templates hide the section and any `#travel` navigation/footer links.

```json
{
  "headline": "Getting There / Where to Stay",
  "intro": "Plan the race weekend around ferry timing, lodging, and packet pickup.",
  "items": [
    {
      "id": "ferry",
      "label": "Getting there",
      "title": "Take the Bayfield–La Pointe ferry",
      "text": "Madeline Island is reached by ferry from Bayfield.",
      "source_url": "https://www.example-race.com/race-info"
    }
  ],
  "links_label": "Official planning links",
  "links": [
    { "label": "Ferry schedule", "url": "https://www.example.com/ferry" }
  ]
}
```

- `headline` (optional): visible section heading. Defaults to `Getting There / Where to Stay` when other travel content exists.
- `intro` (optional): short runner-facing overview of the travel-planning decision.
- `items[]` (optional): reusable travel cards. Each item requires `id`, `title`, and `text`; `label`, `icon`, `source_path`, and `source_url` are optional metadata. Source fields are for validation/provenance only and must not render in page body.
- `links_label` (optional): visible label for the official links row.
- `links[]` (optional): labeled absolute URLs for official travel resources. Each link requires `label` and `url`; source metadata may be included when useful for private mockups.
- Use only source-backed or approved customer-intake facts for visible copy and official links.

## Volunteer group

`volunteer` is an optional top-level group for community staffing calls-to-action.

- `volunteer.signup_url` (optional): URL for volunteer registration or interest form.
- `volunteer.description` (optional): summary of volunteer roles, benefits, or shift expectations.
- `volunteer.photo` (optional): image object for volunteer photography/placeholder art.

## Schedule entries

`schedule[]` entries may include `applies_to_distances`, an array of distance IDs used by templates with distance-aware schedule filtering.

- If omitted, default behavior is `all` distances.
- Use `["all"]` for events visible to every distance.
- Use specific IDs (for example `["half", "10k"]`) for distance-specific starts, awards, or briefings.

Validators live under `src/shared/schema/`.

## Performance template additions

The Performance template uses the shared intake schema plus these fields:

- `distances[]`: exactly one entry by design for single-distance performance races. Do not expose a distance picker; include the shared `id`, `name`, `distance`, and `start_time` fields, and optionally `distance_miles` and `cutoff` for performance-specific display.
- `course.certification`: display-ready course certification identifier.
- `course.net_elevation`: net elevation change in feet.
- `course.max_climb`: maximum climb information. Prefer an object with `feet` and optional `mile`; a numeric feet value is also acceptable for legacy intake.
- `course.elevation_profile[]`: mile/feet points for rendering the profile.
- `course.pace_groups[]`: display-ready pace group targets, e.g. `3:00`, `3:15`, `3:30`.
- `records[]`: top-level array of annual course records with `year`, `mens_time`, `womens_time`, and optional winner names.
- `proof.bq_rate`: Boston-qualifier rate percentage used in hero/stat/records proof points.
- `proof.bq_finishers`: number of BQ finishers.
- `proof.field_cap`: race field cap.
- `entry_tiers[]`: performance registration products; `corral_upgrade` flags separate corral/qualification products.
