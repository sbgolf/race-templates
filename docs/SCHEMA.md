# Schema

The schema is the shared data contract for all customer race sites.

Current top-level groups expected by templates include: `identity`, `event`, `distances`, `registration`, `qualifying`, `schedule`, `travel`, `proof`, `course`, `records`, `entry_tiers`, `sponsors`, `faqs`, `charity`, `seo`, `analytics`, `email_capture`, `volunteer`, and `contact`.

## Shared optional fields

- `identity.hero_image` (optional): image object for hero art/photography. Template implementations may use a real image URL or a local placeholder object while awaiting customer assets.

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
