# Schema

The schema is the shared data contract for all customer race sites.

Current top-level groups expected by templates include: `identity`, `event`, `distances`, `registration`, `qualifying`, `schedule`, `travel`, `proof`, `sponsors`, `faqs`, `charity`, `seo`, `analytics`, `email_capture`, `volunteer`, and `contact`.

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
